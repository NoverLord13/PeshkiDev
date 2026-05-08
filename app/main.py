from __future__ import annotations

import logging
from contextlib import asynccontextmanager
from typing import AsyncIterator

from fastapi import FastAPI, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from .config import get_settings
from .database import dispose_engine, init_models
from .routers import games, health, leaderboard

logger = logging.getLogger("peshki.backend")
logging.basicConfig(level=logging.INFO)


@asynccontextmanager
async def lifespan(_app: FastAPI) -> AsyncIterator[None]:
    settings = get_settings()
    if settings.AUTO_CREATE_TABLES:
        try:
            await init_models()
        except Exception as exc:  # noqa: BLE001
            logger.warning("Не удалось создать таблицы при старте: %s", exc)
    try:
        yield
    finally:
        await dispose_engine()


def create_app() -> FastAPI:
    settings = get_settings()

    app = FastAPI(
        title="PeshkiDev Backend",
        version="1.0.0",
        description="FastAPI-сервис лидерборда для фронтенда PeshkiDev.",
        lifespan=lifespan,
    )

    origins = settings.cors_origins
    is_wildcard = origins == "*"
    # Спецификация CORS запрещает связку Access-Control-Allow-Origin: *
    # с Access-Control-Allow-Credentials: true. Поэтому при wildcard
    # отключаем credentials, иначе браузер режет запросы как "Failed to fetch".
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"] if is_wildcard else origins,
        allow_credentials=not is_wildcard,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    api_prefix = "/api"
    app.include_router(health.router, prefix=api_prefix)
    app.include_router(games.router, prefix=api_prefix)
    app.include_router(leaderboard.router, prefix=api_prefix)

    @app.exception_handler(RequestValidationError)
    async def validation_exception_handler(
        _request: Request,
        exc: RequestValidationError,
    ) -> JSONResponse:
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content={"message": "Validation error", "issues": exc.errors()},
        )

    @app.exception_handler(Exception)
    async def unhandled_exception_handler(
        _request: Request,
        exc: Exception,
    ) -> JSONResponse:
        logger.exception("Unhandled error", exc_info=exc)
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"message": "Internal server error"},
        )

    return app


app = create_app()
