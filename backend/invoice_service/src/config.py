"""
Invoice service — configuration.

All values come from environment variables. No hardcoded secrets.
"""

from typing import List

from pydantic import Field, validator
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # ---- Database (MySQL) ----
    DB_HOST: str = Field("db_invoice", env="DB_HOST")
    DB_PORT: int = Field(3306, env="DB_PORT")
    DB_USER: str = Field("nerva_invoice", env="DB_USER")
    DB_PASS: str = Field(..., env="DB_PASS")  # NO default — must be set
    DB_NAME: str = Field("invoices_db", env="DB_NAME")

    # ---- NERVA wallet RPC ----
    WALLET_RPC_HOST: str = Field("nerva", env="WALLET_RPC_HOST")
    WALLET_RPC_PORT: int = Field(28082, env="WALLET_RPC_PORT")

    # ---- RabbitMQ ----
    RABBITMQ_HOST: str = Field("rabbitmq", env="RABBITMQ_HOST")
    RABBITMQ_PORT: int = Field(5672, env="RABBITMQ_PORT")
    RABBITMQ_USER: str = Field("nerva_market", env="RABBITMQ_USER")
    RABBITMQ_PASS: str = Field(..., env="RABBITMQ_PASS")  # NO default

    # ---- WebSocket ----
    WEBSOCKET_HOST: str = Field("0.0.0.0", env="WEBSOCKET_HOST")
    WEBSOCKET_PORT: int = Field(2052, env="WEBSOCKET_PORT")

    # ---- Confirmations ----
    REQUIRED_CONFIRMATIONS: int = Field(1, env="REQUIRED_CONFIRMATIONS")

    # ---- CORS ----
    CORS_ORIGINS: List[str] = Field(
        default_factory=lambda: ["http://localhost:3000"],
        env="CORS_ORIGINS",
    )

    # ---- Internal ----
    INVOICE_SERVICE_BASE_URL: str = Field(
        "http://127.0.0.1:8880", env="INVOICE_SERVICE_BASE_URL"
    )

    class Config:
        env_file = ".env"
        case_sensitive = False

    @validator("CORS_ORIGINS", pre=True)
    def split_origins(cls, v):
        if isinstance(v, str):
            return [origin.strip() for origin in v.split(",") if origin.strip()]
        return v


settings = Settings()
