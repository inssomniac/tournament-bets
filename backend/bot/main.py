"""
Telegram bot entry point.

Dev + prod: runs polling (sufficient for ≤100 users).
Start: python -m bot.main  (from backend/ directory)

Proxy (нужен в РФ для локальной разработки):
  Добавь в .env:  BOT_PROXY=socks5://user:pass@host:port
  Или:            BOT_PROXY=http://host:port
"""
import asyncio
import logging

from aiogram import Bot, Dispatcher
from aiogram.client.default import DefaultBotProperties
from aiogram.client.session.aiohttp import AiohttpSession
from aiogram.enums import ParseMode

from app.core.config import settings
from bot.handlers.start import router as start_router
from bot.handlers.mybets import router as mybets_router

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)


async def main() -> None:
    session_kwargs = {}
    if settings.BOT_PROXY:
        logger.info(f"Using proxy: {settings.BOT_PROXY}")
        session_kwargs["proxy"] = settings.BOT_PROXY

    session = AiohttpSession(**session_kwargs) if session_kwargs else None

    bot = Bot(
        token=settings.BOT_TOKEN,
        session=session,
        default=DefaultBotProperties(parse_mode=ParseMode.HTML),
    )
    dp = Dispatcher()
    dp.include_router(start_router)
    dp.include_router(mybets_router)

    logger.info("Bot starting (polling)...")
    await bot.delete_webhook(drop_pending_updates=True)
    await dp.start_polling(bot)


if __name__ == "__main__":
    asyncio.run(main())
