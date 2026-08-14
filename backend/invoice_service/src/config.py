from typing import List

from pydantic import Field, validator
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    DB_HOST: str = Field("db_invoice", env="DB_HOST")
    DB_USER: str = Field("root", env="DB_USER")
    DB_PASS: str = Field("kkfkffspassss", env="DB_PASS")
    DB_NAME: str = Field("invoices_db", env="DB_NAME")
    DB_PORT: int = Field(3306, env="DB_PORT")

    WALLET_RPC_HOST: str = Field("nerva", env="WALLET_RPC_HOST")
    WALLET_RPC_PORT: int = Field(28082, env="WALLET_RPC_PORT")

    RABBITMQ_HOST: str = Field("rabbitmq", env="RABBITMQ_HOST")
    RABBITMQ_PORT: int = Field(5672, env="RABBITMQ_PORT")
    RABBITMQ_USER: str = Field("user", env="RABBITMQ_USER")
    RABBITMQ_PASS: str = Field("passwordkkjhgq", env="RABBITMQ_PASS")

    WEBSOCKET_HOST: str = Field("0.0.0.0", env="WEBSOCKET_HOST")
    WEBSOCKET_PORT: int = Field(2052, env="WEBSOCKET_PORT")

    CORS_ORIGINS: List[str] = Field(
        default_factory=lambda: [
            "http://127.0.0.1:3000",
            "http://localhost:3000",
            "http://192.168.1.167:3000",
        ],
        env="CORS_ORIGINS",
    )

    INVOICE_SERVICE_BASE_URL: str = Field("http://127.0.0.1:8002", env="INVOICE_SERVICE_BASE_URL")

    class Config:
        env_file = ".env"
        case_sensitive = False

    @validator("CORS_ORIGINS", pre=True)
    def split_origins(cls, v):
        if isinstance(v, str):
            return [origin.strip() for origin in v.split(",") if origin.strip()]
        return v


settings = Settings()
