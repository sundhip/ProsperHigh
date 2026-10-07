import os
from typing import List, Union
from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

    # Application
    APP_NAME: str = "ProsperHigh Platform API"
    APP_VERSION: str = "3.1.0"
    ENVIRONMENT: str = "development"
    LOG_LEVEL: str = "INFO"

    # Database
    DATABASE_URL: str = "sqlite:///./prosperhigh.db"

    # Authentication & Security
    JWT_SECRET_KEY: str = "dev-secret-key-change-this-in-production-to-a-secure-random-32char-token"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440  # 24 hours

    # CORS
    ALLOWED_ORIGINS: Union[List[str], str] = ["http://localhost:3000", "http://127.0.0.1:3000"]

    @field_validator("ALLOWED_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str):
            return [i.strip() for i in v.split(",") if i.strip()]
        return v

    # AI Model Providers
    PRIMARY_LLM_PROVIDER: str = "gemini"
    SECONDARY_LLM_PROVIDER: str = "groq"
    FALLBACK_LLM_PROVIDER: str = "local_qwen"

    GEMINI_API_KEY: str = ""
    GROQ_API_KEY: str = ""
    OPENROUTER_API_KEY: str = ""
    OLLAMA_ENDPOINT: str = "http://localhost:11434/api/generate"
    OLLAMA_MODEL: str = "qwen3:8b"

    # Technical Analysis Settings
    RSI_PERIOD: int = 14
    MACD_FAST: int = 12
    MACD_SLOW: int = 26
    MACD_SIGNAL: int = 9
    SMA_SHORT: int = 20
    SMA_MEDIUM: int = 50
    SMA_LONG: int = 200

    # Personalization Concentration Thresholds
    HIGH_CONCENTRATION_THRESHOLD: float = 0.20
    VERY_HIGH_CONCENTRATION_THRESHOLD: float = 0.30

    # Financial Discipline Linter (Banned Phrases)
    BANNED_PHRASES: List[str] = [
        "guaranteed profit",
        "guaranteed return",
        "guaranteed returns",
        "100% safe",
        "zero risk",
        "will definitely increase",
        "certain profit",
        "risk-free investment",
        "sure shot buy"
    ]


settings = Settings()
