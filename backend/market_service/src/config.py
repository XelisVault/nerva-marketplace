"""
Market service — configuration.

All values come from environment variables. There are NO hardcoded
secrets in this file. Defaults are intentionally minimal so that
running without an .env file fails loudly rather than silently
exposing insecure defaults.
"""

from typing import List

from pydantic import Field, validator
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # ---- Database (MySQL) ----
    DB_HOST: str = Field("db", env="DB_HOST")
    DB_PORT: int = Field(3306, env="DB_PORT")
    DB_USER: str = Field("nerva_market", env="DB_USER")
    DB_PASS: str = Field(..., env="DB_PASS")  # NO default — must be set
    DB_NAME: str = Field("market", env="DB_NAME")

    # ---- Redis (sessions + rate limiting) ----
    CACHE_HOST: str = Field("redis", env="CACHE_HOST")
    CACHE_PORT: int = Field(6379, env="CACHE_PORT")
    CACHE_PASS: str = Field(..., env="CACHE_PASS")  # NO default

    # ---- Invoice service (internal HTTP) ----
    PAYMENTS_BASE_URL: str = Field(
        "http://payments_rest_microservices:8880",
        env="PAYMENTS_BASE_URL",
    )

    # ---- CORS ----
    CORS_ORIGINS: List[str] = Field(
        default_factory=lambda: ["http://localhost:3000"],
        env="CORS_ORIGINS",
    )

    # ---- Session ----
    SESSION_COOKIE_NAME: str = Field("session_id", env="SESSION_COOKIE_NAME")
    SESSION_TTL_SECONDS: int = Field(7200, env="SESSION_TTL_SECONDS")  # 2h
    SESSION_SECURE: bool = Field(False, env="SESSION_SECURE")  # set True behind HTTPS
    SESSION_SAMESITE: str = Field("lax", env="SESSION_SAMESITE")  # lax | strict | none

    # ---- Rate limiting (per IP, per minute) ----
    RATE_LIMIT_LOGIN_PER_MIN: int = Field(10, env="RATE_LIMIT_LOGIN_PER_MIN")
    RATE_LIMIT_REGISTER_PER_MIN: int = Field(5, env="RATE_LIMIT_REGISTER_PER_MIN")
    RATE_LIMIT_CREATE_LISTING_PER_MIN: int = Field(10, env="RATE_LIMIT_CREATE_LISTING_PER_MIN")

    # ---- Misc ----
    MARKET_SERVICE_BASE_URL: str = Field(
        "http://127.0.0.1:8080", env="MARKET_SERVICE_BASE_URL"
    )

    class Config:
        env_file = ".env"
        case_sensitive = False

    @validator("CORS_ORIGINS", pre=True)
    def split_origins(cls, v):
        if isinstance(v, str):
            return [origin.strip() for origin in v.split(",") if origin.strip()]
        return v

    @validator("SESSION_SAMESITE")
    def validate_samesite(cls, v):
        v = v.lower()
        if v not in {"lax", "strict", "none"}:
            raise ValueError("SESSION_SAMESITE must be lax, strict or none")
        return v


settings = Settings()
