from aiogram import Bot
from aiogram.exceptions import TelegramBadRequest

SUBSCRIBED_STATUSES = {"member", "administrator", "creator"}


async def check_subscription(bot: Bot, channel_id: int, user_id: int) -> bool:
    try:
        member = await bot.get_chat_member(chat_id=channel_id, user_id=user_id)
        return member.status in SUBSCRIBED_STATUSES
    except TelegramBadRequest:
        return False
