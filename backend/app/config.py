import logging
from typing import List

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

    GROQ_API_KEY: str = ""
    USE_MOCK_AI: bool = True
    # Ceiling on the Groq call. The free tier is an org-wide quota, so search
    # falls back to the mock parser rather than hanging or 500-ing.
    AI_TIMEOUT_SECONDS: float = 8.0

    ADMIN_SECRET_KEY: str = DEV_ADMIN_KEY
    CONFIDENCE_THRESHOLD: float = 0.70
    SECRET_KEY: str = DEV_SECRET_KEY
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440

    # Password reset
    RESET_TOKEN_EXPIRE_MINUTES: int = 30
    MAILER: str = "console"  # console | smtp
    SMTP_HOST: str = ""
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    MAIL_FROM: str = "no-reply@nexora.local"
    MAIL_FROM_NAME: str = "Nexora"

    # Used to build absolute links in outbound email. Must point at the deployed
    # frontend origin, which is NOT the same host as the API once the frontend
    # is on static hosting.
    FRONTEND_URL: str = "http://localhost:5173"

    # Comma-separated list of allowed browser origins.
    CORS_ORIGINS: str = "http://localhost:5173,http://127.0.0.1:5173"

    # In-process APScheduler only works while the process is awake. Free hosts
    # spin down after ~15 min idle, so deployed environments drive ingestion from
    # an external cron hitting /api/pipeline/cron/* instead.
    ENABLE_INTERNAL_SCHEDULER: bool = True

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

    @property
    def cors_origins(self) -> List[str]:
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()]


settings = Settings()


def _assert_production_safe(s: Settings) -> None:
    """Fail closed on configuration that is fine locally but destructive or
    insecure in a deployed environment. Called at import time so the process
    refuses to boot rather than silently losing data or signing tokens with a
    public secret."""
    if s.DEBUG:
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

    if s.SECRET_KEY == DEV_SECRET_KEY:
        problems.append(
            "SECRET_KEY is still the public development default. Anyone could forge a "
            "JWT for any user. Set SECRET_KEY from the environment."
        )

    if s.ADMIN_SECRET_KEY == DEV_ADMIN_KEY:
        problems.append(
            "ADMIN_SECRET_KEY is still the public development default. The pipeline "
            "and cron endpoints would be open to anyone."
        )

    if problems:
        raise RuntimeError(
            "Refusing to start with unsafe production configuration:\n"
            + "\n".join(f"  - {p}" for p in problems)
        )


_assert_production_safe(settings)
