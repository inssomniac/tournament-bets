from aiogram import Router
from aiogram.filters import CommandStart, Command
from aiogram.types import Message, InlineKeyboardMarkup, InlineKeyboardButton, WebAppInfo

from app.core.config import settings

router = Router()


@router.message(CommandStart())
async def cmd_start(message: Message) -> None:
    keyboard = InlineKeyboardMarkup(inline_keyboard=[[
        InlineKeyboardButton(
            text="🎯 Открыть букмекера",
            web_app=WebAppInfo(url=settings.TWA_URL),
        )
    ]])
    await message.answer(
        "👋 <b>Добро пожаловать в букмекер Летнего Кубка по лапте 2026!</b>\n\n"
        "Делайте ставки на матчи и следите за рейтингом.\n"
        "Каждый участник получает <b>1 100 стартовых очков</b>.\n\n"
        "Нажмите кнопку ниже, чтобы войти в приложение 👇",
        reply_markup=keyboard,
        parse_mode="HTML",
    )


@router.message(Command("help"))
async def cmd_help(message: Message) -> None:
    await message.answer(
        "📋 <b>Доступные команды:</b>\n\n"
        "/start — открыть букмекера\n"
        "/mybets — мои текущие ставки\n"
        "/help — эта справка",
        parse_mode="HTML",
    )
