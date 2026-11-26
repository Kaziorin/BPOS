"""Application configuration and environment settings."""
from __future__ import annotations

import os
from pathlib import Path
from typing import List
from urllib.parse import quote_plus
from dotenv import load_dotenv

# 1. Load base .env from backend root
BASE_DIR = Path(__file__).resolve().parent.parent.parent
load_dotenv(BASE_DIR / ".env")

# 2. Load profile-specific .env.<APP_ENV> (default: "local")
APP_ENV = os.getenv("APP_ENV", "local").strip().lower()
profile_env = BASE_DIR / f".env.{APP_ENV}"
if profile_env.exists():
    load_dotenv(profile_env, override=True)


class Settings:
    PROJECT_NAME: str = os.getenv("PROJECT_NAME", "SalePay API")
    VERSION: str = os.getenv("VERSION", "2.0.0-production")
    API_V1_STR: str = os.getenv("API_V1_STR", "/api/v1")
    APP_ENV: str = APP_ENV

    # Database Configuration (loaded from profile .env.<APP_ENV> or base .env)
    DB_HOST: str = os.getenv("DB_HOST", "localhost")
    DB_PORT: int = int(os.getenv("DB_PORT", "3306"))
    DB_USER: str = os.getenv("DB_USER", "root")
    DB_PASSWORD: str = os.getenv("DB_PASSWORD", "korin@145666")
    DB_NAME: str = os.getenv("DB_NAME", "blue_oceans_pos")

    @property
    def DATABASE_URL(self) -> str:
        if raw := os.getenv("DATABASE_URL"):
            return raw
        encoded_pass = quote_plus(self.DB_PASSWORD)
        return f"mysql://{self.DB_USER}:{encoded_pass}@{self.DB_HOST}:{self.DB_PORT}/{self.DB_NAME}?charset=utf8mb4"

    @property
    def ASYNC_DATABASE_URL(self) -> str:
        raw = self.DATABASE_URL
        url = raw.replace("mysql://", "mysql+asyncmy://", 1)
        if "+asyncmy" not in url:
            user_pass, host_db = url.split("@", 1)
            url = user_pass.replace("mysql:", "mysql+asyncmy:", 1) + "@" + host_db
        return url

    @property
    def SYNC_DATABASE_URL(self) -> str:
        return self.ASYNC_DATABASE_URL.replace("+asyncmy", "+pymysql", 1)

    # Security & Auth
    JWT_SECRET: str = os.getenv("JWT_SECRET", "super-secret-pos-jwt-key-change-in-production")
    JWT_ALGORITHM: str = os.getenv("JWT_ALGORITHM", "HS256")
    ACCESS_TOKEN_EXPIRE_HOURS: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_HOURS", str(24 * 7)))

    # CORS
    CORS_ORIGIN: str = os.getenv(
        "CORS_ORIGIN",
        "http://localhost:3000,http://127.0.0.1:3000,http://localhost:3001,http://127.0.0.1:3001,http://localhost:3002,http://127.0.0.1:3002,http://localhost:4000,http://127.0.0.1:4000",
    )

    @property
    def CORS_ORIGINS_LIST(self) -> List[str]:
        return [origin.strip() for origin in self.CORS_ORIGIN.split(",") if origin.strip()]

    # Redis / Cache
    REDIS_URL: str = os.getenv("REDIS_URL", "redis://localhost:6379/0")

    # Storage / Backups
    BACKUP_DIR: Path = BASE_DIR / "backups"


settings = Settings()
