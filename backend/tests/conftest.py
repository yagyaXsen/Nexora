"""Pytest bootstrap: pin a throwaway environment BEFORE any app import.

app.database builds its engine from DATABASE_URL the first time any test
module imports app code (test_junk_url_filter does so at collection time).
Without this file the whole suite silently ran against the developer's local
backend/nexora.db, polluted it, and failed on the next run.

Values are forced (not setdefault) so a developer's shell or backend/.env can
never point the suite at a real database, a real LLM, or a live scheduler.
"""

import atexit
import os
import shutil
import tempfile

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
