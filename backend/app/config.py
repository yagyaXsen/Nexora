import os
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    APP_NAME: str = "Nexora Discovery Engine"
    DEBUG: bool = True
    DATABASE_URL: str = "sqlite:///./nexora.db"
    GROQ_API_KEY: str = ""
    USE_MOCK_AI: bool = True
    ADMIN_SECRET_KEY: str = "nexora_admin_secret_dev_key"
    CONFIDENCE_THRESHOLD: float = 0.70

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()
