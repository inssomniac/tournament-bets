from aiogram import Router
from aiogram.filters import Command
from aiogram.types import Message
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker

from app.core.config import settings
from app.models.user import User
from app.models.bet import Bet
from app.models.match import Match

router = Router()

# Async engine for bot process (asyncpg driver)
_engine = create_async_engine(
    settings.DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://"),
    pool_pre_ping=True,
)
_session_factory = async_sessionmaker(_engine, expire_on_commit=False)


async def _get_session() -> AsyncSession:
    return _session_factory()


def _status_icon(status: str) -> str:
    return {"pending": "⏳", "won": "✅", "lost": "❌"}.get(status, "❓")


def _bet_line(bet: Bet, match: Match) -> str:
    team = match.team1_name if bet.team_choice == 1 else match.team2_name
    icon = _status_icon(bet.status)
    match_title = f"{match.team1_name} vs {match.team2_name}"
    if bet.status == "pending":
        return f"{icon} <b>{match_title}</b>\n   Ставка: {team} — {bet.amount} очков (возможный выигрыш: {bet.potential_win})"
    elif bet.status == "won":
        return f"{icon} <b>{match_title}</b>\n   Ставка: {team} — выиграл +{bet.potential_win} очков"
    else:
        return f"{icon} <b>{match_title}</b>\n   Ставка: {team} — проиграл -{bet.amount} очков"


@router.message(Command("mybets"))
async def cmd_mybets(message: Message) -> None:
    tg_id = message.from_user.id

    async with _session_factory() as session:
        # Find user
        result = await session.execute(select(User).where(User.telegram_id == tg_id))
        user = result.scalar_one_or_none()

        if not user:
            await message.answer(
                "❗ Вы ещё не зарегистрированы.\n"
                "Откройте /start и войдите в приложение.",
                parse_mode="HTML",
            )
            return

        # Fetch bets with matches
        bets_result = await session.execute(
            select(Bet, Match)
            .join(Match, Bet.match_id == Match.id)
            .where(Bet.user_id == user.id)
            .order_by(Bet.created_at.desc())
        )
        rows = bets_result.all()

    if not rows:
        await message.answer(
            f"📭 У вас пока нет ставок.\n"
            f"Ваш баланс: <b>{user.balance} очков</b>.",
            parse_mode="HTML",
        )
        return

    pending = [(b, m) for b, m in rows if b.status == "pending"]
    finished = [(b, m) for b, m in rows if b.status != "pending"]

    lines = [f"🎯 <b>Ваши ставки</b> | Баланс: {user.balance} очков\n"]

    if pending:
        lines.append("⏳ <b>Активные:</b>")
        lines.extend(_bet_line(b, m) for b, m in pending)

    if finished:
        lines.append("\n📜 <b>Завершённые:</b>")
        lines.extend(_bet_line(b, m) for b, m in finished[:10])  # last 10

    await message.answer("\n".join(lines), parse_mode="HTML")
