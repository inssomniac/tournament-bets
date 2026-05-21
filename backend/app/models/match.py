from sqlalchemy import Integer, String, Numeric, DateTime, SmallInteger, func
from sqlalchemy.orm import Mapped, mapped_column
from typing import Optional

from app.core.database import Base


class Match(Base):
    __tablename__ = "matches"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    team1_name: Mapped[str] = mapped_column(String(100), nullable=False)
    team2_name: Mapped[str] = mapped_column(String(100), nullable=False)
    odds_team1: Mapped[float] = mapped_column(Numeric(4, 2), nullable=False)
    odds_team2: Mapped[float] = mapped_column(Numeric(4, 2), nullable=False)
    bet_deadline: Mapped[Optional[DateTime]] = mapped_column(DateTime, nullable=True)
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="active")
    # active | live | finished
    winner: Mapped[int | None] = mapped_column(SmallInteger, nullable=True)
    # NULL = нет результата, 1 = победа team1, 2 = победа team2
    created_at: Mapped[DateTime] = mapped_column(DateTime, server_default=func.now())
