from __future__ import annotations

from datetime import datetime
from typing import List

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator

from .models import GameMode


def _to_camel(value: str) -> str:
    parts = value.split("_")
    return parts[0] + "".join(word.capitalize() for word in parts[1:])


class CamelModel(BaseModel):
    """Базовая Pydantic-модель: snake_case в Python, camelCase в JSON."""

    model_config = ConfigDict(
        alias_generator=_to_camel,
        populate_by_name=True,
        from_attributes=True,
    )


class RoundSubmission(CamelModel):
    round_number: int = Field(ge=1, le=5)
    score: int = Field(ge=0, le=5000)
    distance_km: float = Field(ge=0)


class CreateGameRequest(CamelModel):
    player_name: str = Field(min_length=2, max_length=24)
    mode: GameMode
    rounds: List[RoundSubmission] = Field(min_length=1, max_length=5)

    @field_validator("player_name")
    @classmethod
    def _validate_player_name(cls, value: str) -> str:
        cleaned = " ".join(value.split())
        if len(cleaned) < 2:
            raise ValueError("Player name is too short")
        if len(cleaned) > 24:
            raise ValueError("Player name is too long")
        return cleaned

    @model_validator(mode="after")
    def _ensure_unique_round_numbers(self) -> "CreateGameRequest":
        seen: set[int] = set()
        for item in self.rounds:
            if item.round_number in seen:
                raise ValueError(f"Round {item.round_number} is duplicated")
            seen.add(item.round_number)
        return self


class GameResponse(CamelModel):
    id: str
    player_name: str
    mode: GameMode
    total_score: int
    average_score: int
    total_distance_km: float
    played_at: datetime


class LeaderboardEntry(CamelModel):
    id: str
    player_name: str
    mode: GameMode
    total_score: int
    average_score: int
    total_distance_km: float
    played_at: datetime


class LeaderboardResponse(CamelModel):
    items: List[LeaderboardEntry]


class HealthResponse(CamelModel):
    status: str
    database_configured: bool
    database_ok: bool
