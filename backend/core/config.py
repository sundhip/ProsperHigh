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
    APP_VERSION: str = "3.2.0"
    ENVIRONMENT: str = "development"
    DEBUG: bool = False
    LOG_LEVEL: str = "INFO"

    # Database & Connection Pooling
    DATABASE_URL: str = "sqlite:///./prosperhigh.db"
    DB_POOL_SIZE: int = 10
    DB_MAX_OVERFLOW: int = 20
    DB_POOL_RECYCLE: int = 1800
    DB_POOL_TIMEOUT: int = 30

    # Authentication & Security
    JWT_SECRET_KEY: str = "dev-secret-key-change-this-in-production-to-a-secure-random-32char-token"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440  # 24 hours
    MAX_REQUEST_BODY_SIZE_BYTES: int = 5 * 1024 * 1024  # 5MB
    GOOGLE_CLIENT_ID: str = ""
    GOOGLE_CLIENT_SECRET: str = ""

    # Rate Limiting
    RATE_LIMIT_ENABLED: bool = True
    RATE_LIMIT_AUTH_PER_MINUTE: int = 20
    RATE_LIMIT_AI_PER_MINUTE: int = 30
    RATE_LIMIT_RESEARCH_PER_MINUTE: int = 40
    RATE_LIMIT_GENERAL_PER_MINUTE: int = 120

    # CORS
    ALLOWED_ORIGINS: Union[List[str], str] = ["http://localhost:3000", "http://127.0.0.1:3000"]

    @field_validator("ALLOWED_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str):
            return [i.strip() for i in v.split(",") if i.strip()]
        return v

    # AI Model Providers & Cost Controls
    PRIMARY_LLM_PROVIDER: str = "gemini"
    SECONDARY_LLM_PROVIDER: str = "groq"
    FALLBACK_LLM_PROVIDER: str = "deterministic"

    GEMINI_API_KEY: str = ""
    GROQ_API_KEY: str = ""
    OPENROUTER_API_KEY: str = ""
    OLLAMA_ENDPOINT: str = "http://localhost:11434/api/generate"
    OLLAMA_MODEL: str = "qwen3:8b"

    AI_MAX_CONCURRENT_ANALYSES: int = 8
    AI_ANALYSIS_TIMEOUT_SECONDS: int = 30
    AI_AGENT_TIMEOUT_SECONDS: int = 10

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
