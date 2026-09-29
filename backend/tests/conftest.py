"""Pytest bootstrap: pin a throwaway environment BEFORE any app import.

app.database builds its engine from DATABASE_URL the first time any test
module imports app code (test_junk_url_filter does so at collection time).
Without this file the whole suite silently ran against the developer's local
backend/nexora.db, polluted it, and failed on the next run.

Values are forced (not setdefault) so a developer's shell or backend/.env can
never point the suite at a real database, a real LLM, or a live scheduler.

Production runs on Postgres. To run the suite against Postgres instead of a
temporary SQLite file, opt in explicitly:

    NEXORA_TEST_DATABASE_URL=postgresql://user@localhost:5432/nexora_test pytest tests/

That database is WIPED at the start of the session, so its name must contain
"test".
"""

import atexit
import os
import shutil
import sys
import tempfile

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

HARDENING_PG_SCHEMA = "nexora_hardening"


def _reset_postgres_test_database() -> None:
    # Imported only after the environment below is pinned: app.config builds
    # its settings (and the normalized, driver-qualified URL) at import time.
    from sqlalchemy import create_engine, text
    from sqlalchemy.engine import make_url
    from app.config import settings

    parsed = make_url(settings.DATABASE_URL)
    if not parsed.drivername.startswith("postgresql"):
        raise RuntimeError("NEXORA_TEST_DATABASE_URL must be a PostgreSQL URL")
    if "test" not in (parsed.database or "").lower():
        raise RuntimeError(
            f"Refusing to wipe database '{parsed.database}': the name of a "
            "NEXORA_TEST_DATABASE_URL database must contain 'test'."
        )
    engine = create_engine(settings.DATABASE_URL)
    with engine.begin() as conn:
        conn.execute(text("DROP SCHEMA IF EXISTS public CASCADE"))
        conn.execute(text("CREATE SCHEMA public"))
        conn.execute(text(f"DROP SCHEMA IF EXISTS {HARDENING_PG_SCHEMA} CASCADE"))
    engine.dispose()


_PG_TEST_URL = os.environ.get("NEXORA_TEST_DATABASE_URL", "").strip()
if _PG_TEST_URL:
    os.environ["DATABASE_URL"] = _PG_TEST_URL
else:
    _TMP_DIR = tempfile.mkdtemp(prefix="nexora-tests-")
    atexit.register(shutil.rmtree, _TMP_DIR, ignore_errors=True)
    os.environ["DATABASE_URL"] = f"sqlite:///{os.path.join(_TMP_DIR, 'nexora_test.db')}"

os.environ["NEXORA_TEST_DB_PINNED"] = "1"
os.environ["DEBUG"] = "true"
os.environ["USE_MOCK_AI"] = "true"
os.environ["GROQ_API_KEY"] = ""
os.environ["ENABLE_INTERNAL_SCHEDULER"] = "false"
os.environ["MAILER"] = "console"
os.environ["ADMIN_EMAIL"] = ""
os.environ["ADMIN_PASSWORD"] = ""

if _PG_TEST_URL:
    _reset_postgres_test_database()
