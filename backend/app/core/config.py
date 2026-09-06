"""Application configuration and environment settings."""
from __future__ import annotations

import os
from pathlib import Path
from typing import List
from dotenv import load_dotenv

# Load .env file from backend root
BASE_DIR = Path(__file__).resolve().parent.parent.parent
load_dotenv(BASE_DIR / ".env")


class Settings:
    PROJECT_NAME: str = "BlueOceans POS API"
    VERSION: str = "2.0.0-production"
    API_V1_STR: str = "/api/v1"

    # Database
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL",
        "mysql://root:Blue%401234@192.168.181.104:3306/blue_oceans_pos",
    )

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
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_HOURS: int = 24 * 7  # 7 days

    # CORS
    CORS_ORIGIN: str = os.getenv("CORS_ORIGIN", "http://localhost:3000,http://127.0.0.1:3000")

    @property
    def CORS_ORIGINS_LIST(self) -> List[str]:
        return [origin.strip() for origin in self.CORS_ORIGIN.split(",") if origin.strip()]

    # Redis / Cache
    REDIS_URL: str = os.getenv("REDIS_URL", "redis://localhost:6379/0")

    # Storage / Backups
    BACKUP_DIR: Path = BASE_DIR / "backups"


settings = Settings()
