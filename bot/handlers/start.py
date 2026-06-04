from aiogram import Router
from aiogram.filters import CommandStart
from aiogram.types import Message, InlineKeyboardMarkup, InlineKeyboardButton, WebAppInfo

from config import settings
from services.subscription import check_subscription

router = Router()


@router.message(CommandStart())
async def cmd_start(message: Message, bot):
    user_id = message.from_user.id

    is_subscribed = await check_subscription(bot, settings.LAPTU_CHANNEL_ID, user_id)

    if not is_subscribed:
        await message.answer(
            "🏏 Привет! Для участия в турнире нужно подписаться на канал <b>Лапта 2026</b>.\n\n"
            "После подписки нажми /start снова.",
            reply_markup=InlineKeyboardMarkup(inline_keyboard=[[
                InlineKeyboardButton(
                    text="📢 Подписаться на канал",
                    url="https://t.me/lapta2026"
                )
            ]])
        )
        return

    keyboard = InlineKeyboardMarkup(inline_keyboard=[[
        InlineKeyboardButton(
            text="🏆 Открыть приложение",
            web_app=WebAppInfo(url=settings.TWA_URL)
        )
    ]])

    # Кнопка для админов
    if user_id in settings.admin_ids_list:
        keyboard.inline_keyboard.append([
            InlineKeyboardButton(
                text="⚙️ Панель организатора",
                web_app=WebAppInfo(url=f"{settings.TWA_URL}/admin")
            )
        ])

    await message.answer(
        "🏏 <b>Летний Кубок по лапте 2026!</b>\n\n"
        "Нажми кнопку ниже, чтобы открыть приложение и сделать предсказания на матчи.",
        reply_markup=keyboard,
    )
