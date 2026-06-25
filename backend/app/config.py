import os
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional

class Settings(BaseSettings):
    # App Settings
    APP_NAME: str = "Nexora API"
    DEBUG: bool = True
    PORT: int = 8000
    
    # Database Settings
    # Try using localhost with current user peer auth first (default for Homebrew postgres on Mac)
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL", 
        "postgresql://localhost:5432/nexora_db"
    )
    
    # AI Keys (Gemini & Groq & OpenAI)
    GEMINI_API_KEY: Optional[str] = os.getenv("GEMINI_API_KEY", "")
    GROQ_API_KEY: Optional[str] = os.getenv("GROQ_API_KEY", "")
    OPENAI_API_KEY: Optional[str] = os.getenv("OPENAI_API_KEY", "")

    # Enable fallback mocks if AI keys are empty
    USE_MOCK_AI: bool = True

    # ── Auth / JWT ──
    # SECRET_KEY signs JWTs. MUST be overridden via env in production.
    SECRET_KEY: str = os.getenv(
        "SECRET_KEY",
        "dev-insecure-change-me-7f3c1a9e2b4d6f8a0c2e4b6d8f0a1c3e5b7d9f1a",
    )
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(
        os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "10080")  # 7 days
    )

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()
