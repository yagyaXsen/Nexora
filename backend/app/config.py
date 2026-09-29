import logging
from typing import List
from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

logger = logging.getLogger(__name__)

# Sentinels — these values are safe for local dev and unsafe anywhere else.
DEV_SECRET_KEY = "nexora_jwt_dev_secret_change_me"
DEV_ADMIN_KEY = "nexora_admin_secret_dev_key"


class Settings(BaseSettings):
    APP_NAME: str = "Nexora Discovery Engine"
    DEBUG: bool = True

    # Local dev uses SQLite. Deployed environments MUST use Postgres — free hosts
    # give you an ephemeral filesystem, so a SQLite file is wiped on every
    # redeploy, restart, and idle spin-down. See _assert_production_safe().
    DATABASE_URL: str = "sqlite:///./nexora.db"

    @field_validator("DATABASE_URL", mode="before")
    @classmethod
    def assemble_db_connection(cls, v: str) -> str:
        # Name the installed driver explicitly. SQLAlchemy 2.1 maps a bare
        # postgresql:// URL to psycopg (v3), but requirements.txt installs
        # psycopg2 — so an unpinned rebuild would fail to connect at boot.
        # URLs that already name a driver (postgresql+xyz://) are left alone.
        if isinstance(v, str):
            for bare in ("postgres://", "postgresql://"):
                if v.startswith(bare):
                    return "postgresql+psycopg2://" + v[len(bare):]
        return v

    GROQ_API_KEY: str = ""
    USE_MOCK_AI: bool = True
    # Ceiling on the Groq call. The free tier is an org-wide quota, so search
    # falls back to the mock parser rather than hanging or 500-ing.
    AI_TIMEOUT_SECONDS: float = 8.0
    AI_QUERY_CACHE_TTL_SECONDS: int = 900
    AI_QUERY_CACHE_MAX_ENTRIES: int = 256
    AI_MIN_QUERY_LENGTH_FOR_LLM: int = 5

    ADMIN_SECRET_KEY: str = DEV_ADMIN_KEY
    # Admin login account. Provisioned at boot ONLY when both are set — there
    # is no built-in default account (a public default password in the source
    # would be an admin backdoor on every deployment). The password is kept in
    # sync with this value on every boot, so rotating it = change env + restart.
    ADMIN_EMAIL: str = ""
    ADMIN_PASSWORD: str = ""
    CONFIDENCE_THRESHOLD: float = 0.70
    SECRET_KEY: str = DEV_SECRET_KEY
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440

    # Password reset
    RESET_TOKEN_EXPIRE_MINUTES: int = 30
    PASSWORD_RESET_RATE_LIMIT: int = 3
    PASSWORD_RESET_RATE_WINDOW_SECONDS: int = 600
    MAILER: str = "console"  # console | smtp
    SMTP_HOST: str = ""
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    MAIL_FROM: str = ""  # defaults to SMTP_USER when empty (Gmail requires it)
    MAIL_FROM_NAME: str = "Nexora"

    # Single public support/contact address used everywhere (contact form
    # delivery, site-wide support links). Override via CONTACT_EMAIL env var.
    CONTACT_EMAIL: str = "aarongangwar@gmail.com"

    # Used to build absolute links in outbound email. Must point at the deployed
    # frontend origin, which is NOT the same host as the API once the frontend
    # is on static hosting.
    FRONTEND_URL: str = "http://localhost:5173"

    # Google OAuth
    GOOGLE_CLIENT_ID: str = ""

    # Comma-separated list of allowed browser origins.
    CORS_ORIGINS: str = "http://localhost:5173,http://127.0.0.1:5173,https://nexora-8y5.pages.dev"

    # In-process APScheduler only works while the process is awake. Free hosts
    # spin down after ~15 min idle, so deployed environments drive ingestion from
    # an external cron hitting /api/pipeline/cron/* instead.
    ENABLE_INTERNAL_SCHEDULER: bool = True
    CRON_MAX_SOURCES: int = 10
    CRON_MAX_DEAD_LINK_CHECKS: int = 30

    # ── Automation cadence (hours) ────────────────────────────────────────────
    # The internal scheduler converts these to IntervalTriggers so both the
    # in-process cron and the external GitHub-Actions cron can be tuned from
    # env vars without code changes. Defaults: twice a week (84h), matching
    # the GH Actions Monday + Thursday cadence.
    INGEST_INTERVAL_HOURS: int = 84
    LIFECYCLE_INTERVAL_HOURS: int = 84
    # Kick a full ingest shortly after boot (useful for dev; off by default so
    # frequent redeploys on sleeping hosts don't hammer sources).
    RUN_INGEST_ON_STARTUP: bool = False
    # Delay (seconds) before the first scheduled ingest after boot.
    INGEST_STARTUP_DELAY_SECONDS: int = 120
    # A scheduled batch skips sources scraped more recently than this. Keeps
    # the internal APScheduler and the external GitHub-Actions cron (both may
    # be enabled) from re-scraping the same sources back-to-back, and makes a
    # future multi-worker deployment safe. Manual runs (POST /api/sources/{id}/run)
    # are never throttled.
    MIN_SOURCE_RESCRAPE_HOURS: float = 5.0

    # ── Maintenance policy ────────────────────────────────────────────────────
    # Deadline window that flips active → expiring_soon.
    EXPIRING_SOON_DAYS: int = 7
    # Consecutive transient failures (5xx / timeout / network) before a link
    # check marks an opportunity dead_link. A single failure must NOT kill a
    # record — 404/410 are still treated as permanent immediately.
    DEAD_LINK_FAILURE_THRESHOLD: int = 3

    # ── Publishing layer (frontend active feed) ───────────────────────────────
    # How long the merged published feed caches its live-DB section. The feed
    # is re-read from the DB after this TTL, and the pipeline invalidates the
    # cache after every ingestion run / lifecycle sweep, so expiry, revival,
    # and new records surface within seconds of the pipeline knowing.
    LIVE_FEED_TTL_SECONDS: int = 60
    # Weekly publishing refresh cadence (168h = Sunday-ish weekly). This job
    # records publishing metrics (published/new/removed) as an AuditEvent —
    # visibility itself is computed at read time and never waits a week.
    PUBLISH_REFRESH_INTERVAL_HOURS: int = 168
    # Minimum extraction confidence for a pipeline-verified record to be
    # published (mirrors the static catalog's own >= 75/100 quality gate).
    PUBLISH_MIN_CONFIDENCE: float = 0.75

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

    @property
    def cors_origins(self) -> List[str]:
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()]


settings = Settings()

# Passwords that must never guard an admin account, whatever the length rule.
_KNOWN_WEAK_ADMIN_PASSWORDS = {"admin123", "password", "changeme", "admin", "nexora"}
MIN_ADMIN_PASSWORD_LENGTH = 12
_LOCAL_DB_HOSTS = {"", "localhost", "127.0.0.1", "::1"}


def is_deployed(s: Settings) -> bool:
    """Is this process (almost certainly) a deployed environment?

    DEBUG defaults to True so a fresh checkout runs with zero config — which
    also means a host that never set DEBUG=false would skip every safety
    check below. A database on a remote host (Neon, Render Postgres, …) is an
    unambiguous deployment signal, so it enables the checks as well.
    """
    if not s.DEBUG:
        return True
    if s.DATABASE_URL.startswith("sqlite"):
        return False
    try:
        from sqlalchemy.engine import make_url
        host = make_url(s.DATABASE_URL).host or ""
    except Exception:
        return True  # unparseable non-SQLite URL: fail closed
    return host.lower() not in _LOCAL_DB_HOSTS


def _assert_production_safe(s: Settings) -> None:
    """Fail closed on configuration that is fine locally but destructive or
    insecure in a deployed environment. Called at import time so the process
    refuses to boot rather than silently losing data or signing tokens with a
    public secret."""
    if not is_deployed(s):
        # Warn but keep going — these are expected during local development.
        if s.DATABASE_URL.startswith("sqlite"):
            logger.info("DEBUG mode: using SQLite. Deployed builds require Postgres.")
        return

    problems = []

    if s.DATABASE_URL.startswith("sqlite"):
        problems.append(
            "DATABASE_URL is SQLite. Deployed hosts have an ephemeral filesystem, so "
            "the database file is destroyed on every redeploy, restart, and idle "
            "spin-down — every account and tracker row would be lost. Point "
            "DATABASE_URL at a managed Postgres instance."
        )

    if not s.SECRET_KEY or s.SECRET_KEY == DEV_SECRET_KEY:
        problems.append(
            "SECRET_KEY is empty or still the public development default. Anyone could "
            "forge a JWT for any user. Set SECRET_KEY from the environment."
        )

    if not s.ADMIN_SECRET_KEY or s.ADMIN_SECRET_KEY == DEV_ADMIN_KEY:
        problems.append(
            "ADMIN_SECRET_KEY is empty or still the public development default. The "
            "admin, pipeline and cron endpoints would be open to anyone."
        )

    if s.ADMIN_PASSWORD and (
        len(s.ADMIN_PASSWORD) < MIN_ADMIN_PASSWORD_LENGTH
        or s.ADMIN_PASSWORD.lower() in _KNOWN_WEAK_ADMIN_PASSWORDS
    ):
        problems.append(
            f"ADMIN_PASSWORD is too weak (use at least {MIN_ADMIN_PASSWORD_LENGTH} "
            "characters, not a common default). It grants full admin access."
        )

    if problems:
        raise RuntimeError(
            "Refusing to start with unsafe production configuration:\n"
            + "\n".join(f"  - {p}" for p in problems)
        )

    if s.DEBUG:
        logger.warning(
            "DEBUG=true on what looks like a deployed environment (remote database). "
            "Set DEBUG=false: DEBUG enables verbose logging."
        )
    if bool(s.ADMIN_EMAIL) != bool(s.ADMIN_PASSWORD):
        logger.warning(
            "Only one of ADMIN_EMAIL / ADMIN_PASSWORD is set — no admin login account "
            "will be provisioned. The X-Admin-Key header still grants admin access."
        )

    # Mock extraction in production is a deliberate demo choice, but it must
    # be an EXPLICIT one: without this notice the automation would silently
    # fill the opportunity database with heuristic (non-LLM) extractions.
    if s.USE_MOCK_AI or not s.GROQ_API_KEY:
        logger.warning(
            "USE_MOCK_AI is active (USE_MOCK_AI=%s, GROQ_API_KEY %s). Pipeline "
            "extraction will use the heuristic parser instead of Groq: fields "
            "the parser cannot find on the page are left empty rather than "
            "invented, but records will be less complete than LLM extractions. "
            "Set USE_MOCK_AI=false with a GROQ_API_KEY for production-grade "
            "extraction.",
            s.USE_MOCK_AI, "present" if s.GROQ_API_KEY else "missing",
        )


_assert_production_safe(settings)
