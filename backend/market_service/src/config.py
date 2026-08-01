from typing import List

from pydantic import Field, validator
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    DB_HOST: str = Field("db", env="DB_HOST")
    DB_USER: str = Field("root", env="DB_USER")
    DB_PASS: str = Field("kkfkffspassss", env="DB_PASS")
    DB_NAME: str = Field("market", env="DB_NAME")
    DB_PORT: int = Field(3306, env="DB_PORT")

    CACHE_HOST: str = Field("redis", env="CACHE_HOST")
    CACHE_PORT: int = Field(6379, env="CACHE_PORT")
    CACHE_PASS: str = Field("yourpasswordkkfkfa", env="CACHE_PASS")

    PAYMENTS_BASE_URL: str = Field("http://payments_rest_microservices:8002", env="PAYMENTS_BASE_URL")

    CORS_ORIGINS: List[str] = Field(
        default_factory=lambda: [
            "http://127.0.0.1:3000",
            "http://localhost:3000",
            "http://192.168.1.167:3000",
            "http://192.168.1.157:3000",
        ],
        env="CORS_ORIGINS",
    )

    MARKET_SERVICE_BASE_URL: str = Field("http://127.0.0.1:8001", env="MARKET_SERVICE_BASE_URL")

    class Config:
        env_file = ".env"
        case_sensitive = False

    @validator("CORS_ORIGINS", pre=True)
    def split_origins(cls, v):
        if isinstance(v, str):
            return [origin.strip() for origin in v.split(",") if origin.strip()]
        return v


settings = Settings()
