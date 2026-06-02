from sqlalchemy import Integer, String, Boolean, DateTime, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class BonusChannel(Base):
    __tablename__ = "bonus_channels"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    channel_id: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)  # @username или -100xxx
    channel_name: Mapped[str] = mapped_column(String(100), nullable=False)
    channel_url: Mapped[str] = mapped_column(String(255), nullable=False)
    bonus_points: Mapped[int] = mapped_column(Integer, nullable=False, default=100)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)


class UserChannelBonus(Base):
    __tablename__ = "user_channel_bonuses"

    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), primary_key=True)
    channel_id: Mapped[int] = mapped_column(Integer, ForeignKey("bonus_channels.id"), primary_key=True)
    claimed_at: Mapped[DateTime] = mapped_column(DateTime, server_default=func.now())
