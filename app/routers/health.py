from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from ..config import get_settings
from ..database import get_session
from ..schemas import HealthResponse

router = APIRouter()


@router.get("/health", response_model=HealthResponse)
async def healthcheck(session: AsyncSession = Depends(get_session)) -> HealthResponse:
    settings = get_settings()
    database_configured = bool(settings.DATABASE_URL)
    database_ok = False

    if database_configured:
        try:
            await session.execute(text("SELECT 1"))
            database_ok = True
        except Exception:
            database_ok = False

    return HealthResponse(
        status="ok",
        database_configured=database_configured,
        database_ok=database_ok,
    )
