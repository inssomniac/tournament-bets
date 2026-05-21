from sqlalchemy import BigInteger, Integer, String, DateTime, func
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    telegram_id: Mapped[int] = mapped_column(BigInteger, unique=True, nullable=False)
    full_name: Mapped[str] = mapped_column(String(255), nullable=False)
    balance: Mapped[int] = mapped_column(Integer, nullable=False, default=1100)
    registered_at: Mapped[DateTime] = mapped_column(DateTime, server_default=func.now())
