from sqlalchemy import Integer, SmallInteger, String, DateTime, ForeignKey, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Bet(Base):
    __tablename__ = "bets"
    __table_args__ = (
        UniqueConstraint("user_id", "match_id", name="uq_user_match"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), nullable=False)
    match_id: Mapped[int] = mapped_column(Integer, ForeignKey("matches.id"), nullable=False)
    team_choice: Mapped[int] = mapped_column(SmallInteger, nullable=False)  # 1 | 2
    amount: Mapped[int] = mapped_column(Integer, nullable=False)
    potential_win: Mapped[int] = mapped_column(Integer, nullable=False)
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="pending")
    # pending | won | lost
    created_at: Mapped[DateTime] = mapped_column(DateTime, server_default=func.now())

    user = relationship("User", backref="bets")
    match = relationship("Match", backref="bets")
