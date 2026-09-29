"""Regression tests for admin access control and production-safety checks.

Covers: the legacy admin@nexora.ai / admin123 backdoor is locked on boot,
admin logins come only from ADMIN_EMAIL / ADMIN_PASSWORD, admin role is never
granted by email address, the X-Admin-Key check fails closed, pipeline
internals require the key, and deployed environments refuse unsafe config.

Run:
    PYTHONPATH=. python -m pytest tests/test_security.py
"""

import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

import pytest
from fastapi.testclient import TestClient

from app.auth import hash_password, verify_password
from app.config import (
    DEV_ADMIN_KEY, DEV_SECRET_KEY, Settings, _assert_production_safe, is_deployed, settings,
)
from app.database import Base, SessionLocal, engine
from app.main import app
from app.models import User
from app.startup import LEGACY_ADMIN_EMAIL, LEGACY_ADMIN_PASSWORD, _seed_admin_user

Base.metadata.create_all(bind=engine)
client = TestClient(app)  # no `with` → no lifespan (no seeding, no scheduler)


def _upsert_user(email, password, role="candidate"):
    db = SessionLocal()
    user = db.query(User).filter(User.email == email).first()
    if not user:
        user = User(name="T", email=email, hashed_password=hash_password(password), role=role)
        db.add(user)
    else:
        user.hashed_password = hash_password(password)
        user.role = role
    db.commit()
    db.close()


def _login(email, password):
    return client.post("/api/auth/login", data={"username": email, "password": password})


def _get_user(email):
    db = SessionLocal()
    user = db.query(User).filter(User.email == email).first()
    db.close()
    return user


# ── Legacy default admin ──────────────────────────────────────────────────────

def test_legacy_default_admin_is_locked_and_demoted(monkeypatch):
    monkeypatch.setattr(settings, "ADMIN_EMAIL", "")
    monkeypatch.setattr(settings, "ADMIN_PASSWORD", "")
    _upsert_user(LEGACY_ADMIN_EMAIL, LEGACY_ADMIN_PASSWORD, role="admin")
    assert _login(LEGACY_ADMIN_EMAIL, LEGACY_ADMIN_PASSWORD).status_code == 200  # the old hole

    _seed_admin_user()

    assert _login(LEGACY_ADMIN_EMAIL, LEGACY_ADMIN_PASSWORD).status_code == 401
    legacy = _get_user(LEGACY_ADMIN_EMAIL)
    assert legacy.role == "candidate"
    assert not verify_password(LEGACY_ADMIN_PASSWORD, legacy.hashed_password)


def test_boot_never_recreates_a_default_admin(monkeypatch):
    monkeypatch.setattr(settings, "ADMIN_EMAIL", "")
    monkeypatch.setattr(settings, "ADMIN_PASSWORD", "")
    _seed_admin_user()
    _seed_admin_user()
    assert _login(LEGACY_ADMIN_EMAIL, LEGACY_ADMIN_PASSWORD).status_code == 401


def test_admin_role_is_never_granted_by_email_address():
    """An account that merely has the old admin email is an ordinary user."""
    _upsert_user(LEGACY_ADMIN_EMAIL, "a-different-password-123", role="candidate")
    tok = _login(LEGACY_ADMIN_EMAIL, "a-different-password-123")
    assert tok.status_code == 200
    headers = {"Authorization": f"Bearer {tok.json()['access_token']}"}

    assert client.get("/api/auth/me", headers=headers).json()["role"] == "candidate"
    assert client.get("/api/admin/users", headers=headers).status_code == 403
    assert _get_user(LEGACY_ADMIN_EMAIL).role == "candidate"


# ── Configured admin (ADMIN_EMAIL / ADMIN_PASSWORD) ───────────────────────────

def test_configured_admin_is_provisioned_and_can_use_admin_api(monkeypatch):
    monkeypatch.setattr(settings, "ADMIN_EMAIL", "Ops@Example.org")
    monkeypatch.setattr(settings, "ADMIN_PASSWORD", "first-strong-password-1")
    _seed_admin_user()

    tok = _login("ops@example.org", "first-strong-password-1")
    assert tok.status_code == 200
    headers = {"Authorization": f"Bearer {tok.json()['access_token']}"}
    assert client.get("/api/admin/users", headers=headers).status_code == 200

    # Rotating the env password takes effect on the next boot.
    monkeypatch.setattr(settings, "ADMIN_PASSWORD", "second-strong-password-2")
    _seed_admin_user()
    assert _login("ops@example.org", "first-strong-password-1").status_code == 401
    assert _login("ops@example.org", "second-strong-password-2").status_code == 200


def test_configured_admin_regains_role_if_demoted(monkeypatch):
    monkeypatch.setattr(settings, "ADMIN_EMAIL", "ops2@example.org")
    monkeypatch.setattr(settings, "ADMIN_PASSWORD", "another-strong-password")
    _upsert_user("ops2@example.org", "another-strong-password", role="candidate")
    _seed_admin_user()
    assert _get_user("ops2@example.org").role == "admin"


# ── X-Admin-Key ───────────────────────────────────────────────────────────────

def test_admin_key_required_for_pipeline_internals():
    for path in ("/api/pipeline/status", "/api/pipeline/runs", "/api/pipeline/review"):
        assert client.get(path).status_code == 401, path
        assert client.get(path, headers={"X-Admin-Key": "wrong"}).status_code == 401, path
    ok = client.get("/api/pipeline/runs", headers={"X-Admin-Key": settings.ADMIN_SECRET_KEY})
    assert ok.status_code == 200


def test_admin_key_check_fails_closed_when_unconfigured(monkeypatch):
    monkeypatch.setattr(settings, "ADMIN_SECRET_KEY", "")
    assert client.post("/api/pipeline/cron/publish").status_code == 401
    assert client.post("/api/pipeline/cron/publish", headers={"X-Admin-Key": ""}).status_code == 401
    assert client.get("/api/admin/users", headers={"X-Admin-Key": ""}).status_code == 403


def test_non_ascii_admin_key_is_rejected_not_crashing():
    resp = client.get("/api/pipeline/runs", headers={"X-Admin-Key": "clé".encode("latin-1")})
    assert resp.status_code == 401


# ── Production-safety checks ──────────────────────────────────────────────────

REMOTE_DB = "postgresql://u:p@ep-cool-name.us-east-2.aws.neon.tech/neondb?sslmode=require"
GOOD = dict(SECRET_KEY="s" * 64, ADMIN_SECRET_KEY="k" * 64)


def test_remote_database_counts_as_deployed_even_with_debug_default():
    assert is_deployed(Settings(DEBUG=True, DATABASE_URL=REMOTE_DB))
    assert not is_deployed(Settings(DEBUG=True, DATABASE_URL="sqlite:///./x.db"))
    assert not is_deployed(Settings(DEBUG=True, DATABASE_URL="postgresql://localhost:5432/nexora_db"))
    assert is_deployed(Settings(DEBUG=False, DATABASE_URL="postgresql://localhost:5432/nexora_db"))


@pytest.mark.parametrize("overrides", [
    dict(SECRET_KEY=DEV_SECRET_KEY),
    dict(SECRET_KEY=""),
    dict(ADMIN_SECRET_KEY=DEV_ADMIN_KEY),
    dict(ADMIN_SECRET_KEY=""),
    dict(ADMIN_EMAIL="ops@example.org", ADMIN_PASSWORD="admin123"),
    dict(ADMIN_EMAIL="ops@example.org", ADMIN_PASSWORD="short"),
])
def test_deployed_environment_refuses_unsafe_config(overrides):
    cfg = Settings(DEBUG=True, DATABASE_URL=REMOTE_DB, **{**GOOD, **overrides})
    with pytest.raises(RuntimeError):
        _assert_production_safe(cfg)


def test_deployed_environment_with_safe_config_boots():
    _assert_production_safe(Settings(
        DEBUG=False, DATABASE_URL=REMOTE_DB, **GOOD,
        ADMIN_EMAIL="ops@example.org", ADMIN_PASSWORD="a-long-unique-passphrase",
    ))


def test_local_development_is_not_blocked():
    _assert_production_safe(Settings(DEBUG=True, DATABASE_URL="sqlite:///./nexora.db"))


# ── Database URL normalization ────────────────────────────────────────────────

@pytest.mark.parametrize("given", [
    "postgres://u:p@ep-x.neon.tech/neondb?sslmode=require",
    "postgresql://u:p@ep-x.neon.tech/neondb?sslmode=require",
])
def test_postgres_urls_use_the_installed_psycopg2_driver(given):
    """SQLAlchemy 2.1 maps a bare postgresql:// URL to psycopg (v3), which is
    not in requirements.txt: an unpinned rebuild crashed at boot with
    ModuleNotFoundError. The URL must name psycopg2 explicitly."""
    from sqlalchemy.engine import make_url
    url = Settings(DATABASE_URL=given).DATABASE_URL
    assert url == "postgresql+psycopg2://u:p@ep-x.neon.tech/neondb?sslmode=require"
    assert make_url(url).get_dialect().driver == "psycopg2"


def test_explicit_database_drivers_are_left_alone():
    for url in ("postgresql+psycopg://u@h/db", "sqlite:///./nexora.db"):
        assert Settings(DATABASE_URL=url).DATABASE_URL == url


# ── Rate limiting ─────────────────────────────────────────────────────────────

def test_rate_limiter_evicts_idle_keys_and_reports_remaining(monkeypatch):
    """Keys are client-influenced; idle ones must not accumulate forever."""
    from app.services import rate_limit
    limiter = rate_limit.InMemoryRateLimiter()
    clock = {"now": 1000.0}
    monkeypatch.setattr(rate_limit.time, "monotonic", lambda: clock["now"])

    assert limiter.hit("a", 2, 60) == (True, 1)
    assert limiter.hit("a", 2, 60) == (True, 0)
    assert limiter.hit("a", 2, 60) == (False, 0)

    for i in range(rate_limit.InMemoryRateLimiter.SWEEP_EVERY):
        limiter.hit(f"spoofed-{i}", 100, 60)
    clock["now"] += 61  # every key is now idle
    for _ in range(rate_limit.InMemoryRateLimiter.SWEEP_EVERY):
        limiter.hit("fresh", 10**6, 60)
    assert len(limiter) == 1, f"{len(limiter)} idle keys kept"


def test_client_ip_uses_a_single_forwarded_address():
    from starlette.requests import Request
    from app.services.rate_limit import client_ip

    def req(headers, peer="10.0.0.9"):
        return Request({"type": "http", "headers": [(k.encode(), v.encode()) for k, v in headers.items()],
                        "client": (peer, 1234)})

    assert client_ip(req({"x-forwarded-for": "203.0.113.7, 10.1.2.3"})) == "203.0.113.7"
    assert client_ip(req({})) == "10.0.0.9"
    assert client_ip(req({"x-forwarded-for": " "})) == "10.0.0.9"
