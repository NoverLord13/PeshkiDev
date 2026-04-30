from __future__ import annotations

from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Конфигурация приложения, читается из переменных окружения / .env."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )

    DATABASE_URL: str = Field(
        default="postgresql+asyncpg://postgres:postgres@localhost:5432/peshki",
        description=(
            "Строка подключения к PostgreSQL в формате SQLAlchemy. "
            "Поддерживается также классический Prisma-формат "
            "'postgresql://user:pass@host:5432/db' — он будет автоматически "
            "переведён на драйвер asyncpg."
        ),
    )
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    CORS_ORIGIN: str = "*"
    AUTO_CREATE_TABLES: bool = True

    @property
    def async_database_url(self) -> str:
        url = self.DATABASE_URL
        # Поддерживаем строку в стиле Prisma / psycopg.
        if url.startswith("postgresql://"):
            url = "postgresql+asyncpg://" + url[len("postgresql://") :]
        elif url.startswith("postgres://"):
            url = "postgresql+asyncpg://" + url[len("postgres://") :]
        # asyncpg не понимает query-параметр schema=public из Prisma — отрезаем.
        if "?" in url:
            base, _, query = url.partition("?")
            params = [
                part
                for part in query.split("&")
                if part and not part.startswith("schema=")
            ]
            url = base + ("?" + "&".join(params) if params else "")
        return url

    @property
    def cors_origins(self) -> list[str] | str:
        if self.CORS_ORIGIN.strip() == "*":
            return "*"
        return [origin.strip() for origin in self.CORS_ORIGIN.split(",") if origin.strip()]


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings()
