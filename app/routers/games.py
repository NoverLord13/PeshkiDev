from __future__ import annotations

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from .. import services
from ..database import get_session
from ..schemas import CreateGameRequest, GameResponse

router = APIRouter(prefix="/games", tags=["games"])


@router.post(
    "",
    response_model=GameResponse,
    status_code=status.HTTP_201_CREATED,
    response_model_by_alias=True,
)
async def submit_game(
    payload: CreateGameRequest,
    session: AsyncSession = Depends(get_session),
) -> GameResponse:
    game = await services.create_game(session, payload)

    return GameResponse(
        id=game.id,
        player_name=game.player.name,
        mode=game.mode,
        total_score=game.total_score,
        average_score=game.average_score,
        total_distance_km=game.total_distance_km,
        played_at=game.played_at,
    )
