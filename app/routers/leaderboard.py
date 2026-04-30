from __future__ import annotations

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from .. import services
from ..database import get_session
from ..models import GameMode
from ..schemas import LeaderboardEntry, LeaderboardResponse

router = APIRouter(prefix="/leaderboard", tags=["leaderboard"])


@router.get(
    "",
    response_model=LeaderboardResponse,
    response_model_by_alias=True,
)
async def get_leaderboard(
    mode: GameMode | None = Query(default=None),
    limit: int = Query(default=20, ge=1, le=100),
    session: AsyncSession = Depends(get_session),
) -> LeaderboardResponse:
    rows = await services.fetch_leaderboard(session, mode, limit)

    items = [
        LeaderboardEntry(
            id=game.id,
            player_name=player.name,
            mode=game.mode,
            total_score=game.total_score,
            average_score=game.average_score,
            total_distance_km=game.total_distance_km,
            played_at=game.played_at,
        )
        for game, player in rows
    ]
    return LeaderboardResponse(items=items)
