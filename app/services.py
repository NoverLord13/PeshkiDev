from __future__ import annotations

from typing import Iterable

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from . import models, schemas


def normalize_player_name(value: str) -> str:
    """Сводит пробелы и обрезает имя — аналог normalizePlayerName в исходном backend."""

    return " ".join(value.split())


def to_player_key(value: str) -> str:
    return normalize_player_name(value).lower()


def calculate_summary(rounds: Iterable[schemas.RoundSubmission]) -> dict:
    rounds_list = list(rounds)
    total_score = sum(item.score for item in rounds_list)
    total_distance_km = round(sum(item.distance_km for item in rounds_list), 3)
    average_score = round(total_score / len(rounds_list)) if rounds_list else 0
    return {
        "total_score": total_score,
        "total_distance_km": total_distance_km,
        "average_score": average_score,
    }


async def upsert_player(session: AsyncSession, display_name: str) -> models.Player:
    name = normalize_player_name(display_name)
    key = to_player_key(name)

    result = await session.execute(
        select(models.Player).where(models.Player.normalized_name == key)
    )
    player = result.scalar_one_or_none()

    if player is None:
        player = models.Player(name=name, normalized_name=key)
        session.add(player)
        await session.flush()
    elif player.name != name:
        player.name = name
        await session.flush()

    return player


async def create_game(
    session: AsyncSession,
    payload: schemas.CreateGameRequest,
) -> models.Game:
    player = await upsert_player(session, payload.player_name)
    summary = calculate_summary(payload.rounds)

    game = models.Game(
        player_id=player.id,
        mode=payload.mode,
        total_score=summary["total_score"],
        average_score=summary["average_score"],
        total_distance_km=summary["total_distance_km"],
    )
    sorted_rounds = sorted(payload.rounds, key=lambda item: item.round_number)
    game.rounds = [
        models.Round(
            round_number=item.round_number,
            score=item.score,
            distance_km=item.distance_km,
        )
        for item in sorted_rounds
    ]
    session.add(game)
    await session.commit()
    await session.refresh(game, attribute_names=["player", "rounds"])
    return game


async def fetch_leaderboard(
    session: AsyncSession,
    mode: models.GameMode | None,
    limit: int,
) -> list[tuple[models.Game, models.Player]]:
    stmt = (
        select(models.Game, models.Player)
        .join(models.Player, models.Game.player_id == models.Player.id)
        .order_by(
            models.Game.total_score.desc(),
            models.Game.total_distance_km.asc(),
            models.Game.played_at.asc(),
        )
        .limit(limit)
    )
    if mode is not None:
        stmt = stmt.where(models.Game.mode == mode)

    result = await session.execute(stmt)
    return list(result.all())
