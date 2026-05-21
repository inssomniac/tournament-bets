# Spec 08 — Telegram Bot

## Цель

Telegram-бот выполняет две функции:
1. Точка входа: проверяет подписку на канал, открывает TWA
2. Рассылка уведомлений о результатах ставок (вызывается из FastAPI)

## Стек

- `aiogram 3.x`
- Режим: **polling** локально, **webhook** в продакшне

## Файлы

```
bot/
├── main.py
├── handlers/
│   ├── __init__.py
│   └── start.py
├── services/
│   └── subscription.py
└── requirements.txt
```

## Конфиг

```python
# bot/config.py
from pydantic_settings import BaseSettings

class BotSettings(BaseSettings):
    BOT_TOKEN: str
    LAPTU_CHANNEL_ID: int       # ID канала "Лапта 2026"
    TWA_URL: str                 # URL приложения (ngrok или домен)
    ENVIRONMENT: str = "development"

    class Config:
        env_file = "../.env"     # общий .env с бекендом

settings = BotSettings()
```

## Основной файл

```python
# bot/main.py
import asyncio
import logging
from aiogram import Bot, Dispatcher
from aiogram.client.default import DefaultBotProperties
from aiogram.enums import ParseMode
from handlers.start import router as start_router
from config import settings

logging.basicConfig(level=logging.INFO)

async def main():
    bot = Bot(
        token=settings.BOT_TOKEN,
        default=DefaultBotProperties(parse_mode=ParseMode.HTML),
    )
    dp = Dispatcher()
    dp.include_router(start_router)

    if settings.ENVIRONMENT == "development":
        # Polling для локальной разработки
        await bot.delete_webhook(drop_pending_updates=True)
        await dp.start_polling(bot)
    else:
        # Webhook для продакшна
        await bot.set_webhook(f"https://{settings.DOMAIN}/bot")
        # webhook обрабатывается через aiohttp сервер (см. ниже)

if __name__ == "__main__":
    asyncio.run(main())
```

## Handler: /start

```python
# bot/handlers/start.py
from aiogram import Router, F
from aiogram.filters import CommandStart
from aiogram.types import Message, InlineKeyboardMarkup, InlineKeyboardButton, WebAppInfo
from services.subscription import check_subscription
from config import settings

router = Router()

@router.message(CommandStart())
async def cmd_start(message: Message, bot):
    user_id = message.from_user.id

    # 1. Проверить подписку на основной канал турнира
    is_subscribed = await check_subscription(bot, settings.LAPTU_CHANNEL_ID, user_id)

    if not is_subscribed:
        await message.answer(
            "🏏 Привет! Для участия в турнире нужно подписаться на канал <b>Лапта 2026</b>.\n\n"
            "После подписки нажми /start снова.",
            reply_markup=InlineKeyboardMarkup(inline_keyboard=[[
                InlineKeyboardButton(
                    text="📢 Подписаться на канал",
                    url="https://t.me/lapta2026"  # URL канала
                )
            ]])
        )
        return

    # 2. Подписан → показать кнопку открытия TWA
    keyboard = InlineKeyboardMarkup(inline_keyboard=[[
        InlineKeyboardButton(
            text="🏆 Открыть приложение",
            web_app=WebAppInfo(url=settings.TWA_URL)
        )
    ]])

    await message.answer(
        "🏏 <b>Летний Кубок по лапте 2026!</b>\n\n"
        "Нажми кнопку ниже, чтобы открыть приложение для ставок.",
        reply_markup=keyboard,
    )
```

## Service: проверка подписки

```python
# bot/services/subscription.py
from aiogram import Bot
from aiogram.exceptions import TelegramBadRequest

SUBSCRIBED_STATUSES = {"member", "administrator", "creator"}

async def check_subscription(bot: Bot, channel_id: int, user_id: int) -> bool:
    try:
        member = await bot.get_chat_member(chat_id=channel_id, user_id=user_id)
        return member.status in SUBSCRIBED_STATUSES
    except TelegramBadRequest:
        # Бот не является администратором канала или канал не найден
        return False
```

## Webhook сервер (прод)

В продакшне бот слушает webhook через aiohttp:

```python
# bot/webhook_server.py
from aiohttp import web
from aiogram.webhook.aiohttp_server import SimpleRequestHandler, setup_application

async def on_startup(app):
    bot = app["bot"]
    await bot.set_webhook(f"https://{settings.DOMAIN}/bot")

def create_app(bot, dp):
    app = web.Application()
    app["bot"] = bot
    app.on_startup.append(on_startup)
    SimpleRequestHandler(dispatcher=dp, bot=bot).register(app, path="/bot")
    setup_application(app, dp, bot=bot)
    return app
```

Nginx проксирует `/bot` → `bot:8001`.

## Уведомления из FastAPI

FastAPI вызывает Bot API напрямую через `httpx` (см. spec-07).
Бот-сервис не нужен для уведомлений — FastAPI сам шлёт сообщения через Bot API.

**Альтернатива (если понадобится):** FastAPI делает HTTP запрос к боту:
```
POST http://bot:8001/notify
{ "telegram_id": 123, "text": "..." }
```

В MVP используем прямой вызов Bot API из FastAPI — проще.

## Локальная разработка

```bash
# Запустить бота в polling режиме
cd bot
pip install -r requirements.txt
python main.py

# Убедиться что в .env:
# ENVIRONMENT=development
# TWA_URL=https://xxxx.ngrok.io  (URL от ngrok)
```

**Тестирование TWA через ngrok:**
```bash
# В отдельном терминале
ngrok http 5173

# Скопировать URL вида https://xxxx.ngrok.io
# Вставить в .env: TWA_URL=https://xxxx.ngrok.io
# Перезапустить бота
```

## Definition of Done

- [ ] `/start` без подписки → сообщение со ссылкой на канал
- [ ] `/start` с подпиской → кнопка открытия TWA
- [ ] Кнопка "Открыть приложение" → открывает TWA по правильному URL
- [ ] Уведомления от FastAPI доходят пользователям (проверить после ввода результата матча)
- [ ] Бот не крашится если канал недоступен (graceful error handling)
