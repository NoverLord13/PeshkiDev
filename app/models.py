from __future__ import annotations

import enum
import uuid
from datetime import datetime, timezone
from typing import List

from sqlalchemy import (
    DateTime,
    Enum as SAEnum,
    Float,
    ForeignKey,
    Integer,
    String,
    UniqueConstraint,
    Index,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .database import Base


class GameMode(str, enum.Enum):
    YAKUTSK = "YAKUTSK"
    SAKHA = "SAKHA"


def _new_id() -> str:
    return uuid.uuid4().hex


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


class Player(Base):
    __tablename__ = "players"

    id: Mapped[str] = mapped_column(String(64), primary_key=True, default=_new_id)
    name: Mapped[str] = mapped_column(String(64), nullable=False)
    normalized_name: Mapped[str] = mapped_column(
        String(64), unique=True, index=True, nullable=False
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=_utcnow, nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=_utcnow,
        onupdate=_utcnow,
        nullable=False,
    )

    games: Mapped[List["Game"]] = relationship(
        "Game", back_populates="player", cascade="all, delete-orphan"
    )


class Game(Base):
    __tablename__ = "games"

    id: Mapped[str] = mapped_column(String(64), primary_key=True, default=_new_id)
    player_id: Mapped[str] = mapped_column(
        String(64), ForeignKey("players.id", ondelete="CASCADE"), nullable=False
    )
    mode: Mapped[GameMode] = mapped_column(
        SAEnum(GameMode, name="game_mode"), nullable=False
    )
    total_score: Mapped[int] = mapped_column(Integer, nullable=False)
    average_score: Mapped[int] = mapped_column(Integer, nullable=False)
    total_distance_km: Mapped[float] = mapped_column(Float, nullable=False)
    played_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=_utcnow, nullable=False
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=_utcnow, nullable=False
    )

    player: Mapped[Player] = relationship("Player", back_populates="games")
    rounds: Mapped[List["Round"]] = relationship(
        "Round",
        back_populates="game",
        cascade="all, delete-orphan",
        order_by="Round.round_number",
    )

    __table_args__ = (
        Index("ix_games_mode_total_score_played_at", "mode", "total_score", "played_at"),
        Index("ix_games_player_id_played_at", "player_id", "played_at"),
    )


class Round(Base):
    __tablename__ = "rounds"

    id: Mapped[str] = mapped_column(String(64), primary_key=True, default=_new_id)
    game_id: Mapped[str] = mapped_column(
        String(64), ForeignKey("games.id", ondelete="CASCADE"), nullable=False
    )
    round_number: Mapped[int] = mapped_column(Integer, nullable=False)
    score: Mapped[int] = mapped_column(Integer, nullable=False)
    distance_km: Mapped[float] = mapped_column(Float, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=_utcnow, nullable=False
    )

    game: Mapped[Game] = relationship("Game", back_populates="rounds")

    __table_args__ = (
        UniqueConstraint("game_id", "round_number", name="uq_rounds_game_round"),
    )
