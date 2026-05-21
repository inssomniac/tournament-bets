import logging

import httpx

from app.core.config import settings

logger = logging.getLogger(__name__)


async def send_result_notification(
    telegram_id: int,
    match_title: str,
    team_name: str,
    won: bool,
    amount: int,
    new_balance: int,
) -> None:
    if won:
        text = (
            f"🎉 Матч «{match_title}» завершён!\n"
            f"Ваша ставка на <b>{team_name}</b> выиграла!\n"
            f"Вы получили: <b>{amount} очков</b>.\n"
            f"Ваш баланс: {new_balance} очков."
        )
    else:
        text = (
            f"❌ Матч «{match_title}» завершён.\n"
            f"Ваша ставка на <b>{team_name}</b> проиграла.\n"
            f"Вы потеряли: <b>{amount} очков</b>.\n"
            f"Ваш баланс: {new_balance} очков."
        )

    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            await client.post(
                f"https://api.telegram.org/bot{settings.BOT_TOKEN}/sendMessage",
                json={"chat_id": telegram_id, "text": text, "parse_mode": "HTML"},
            )
    except Exception as e:
        logger.warning(f"Не удалось отправить уведомление {telegram_id}: {e}")
