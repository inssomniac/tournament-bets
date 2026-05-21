# Spec 06 — API: Bonuses

## Цель

Реализовать систему бонусных очков за подписку на Telegram-каналы.

## Как работает проверка подписки

Telegram Bot API метод `getChatMember`:
```
GET https://api.telegram.org/bot{BOT_TOKEN}/getChatMember
  ?chat_id={CHANNEL_ID}
  ?user_id={TELEGRAM_USER_ID}
```

Ответ:
```json
{
  "ok": true,
  "result": {
    "status": "member",  // или "administrator", "creator", "left", "kicked"
    "user": { "id": 123456789, ... }
  }
}
```

Пользователь подписан если `status` ∈ `{"member", "administrator", "creator"}`.

**Важно:** Бот должен быть **администратором канала** чтобы видеть подписчиков. Попросить заказчика добавить бота в каналы как администратора.

## Эндпоинты

### `GET /api/bonuses/channels`

Список бонусных каналов с информацией о том, получил ли текущий пользователь бонус.

**Auth:** Bearer JWT

**Response (200):**
```json
[
  {
    "id": 1,
    "channel_name": "СЛАВДА",
    "channel_url": "https://t.me/slavda",
    "bonus_points": 50,
    "is_claimed": false
  },
  {
    "id": 2,
    "channel_name": "Лапта 2026",
    "channel_url": "https://t.me/lapta2026",
    "bonus_points": 100,
    "is_claimed": true
  }
]
```

**Реализация:**
```python
@router.get("/channels", response_model=List[ChannelResponse])
def list_channels(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    channels = db.query(BonusChannel).all()
    claimed_ids = {
        ucb.channel_id for ucb in
        db.query(UserChannelBonus).filter(
            UserChannelBonus.user_id == current_user.id
        ).all()
    }
    return [
        ChannelResponse(
            id=ch.id,
            channel_name=ch.channel_name,
            channel_url=ch.channel_url,
            bonus_points=ch.bonus_points,
            is_claimed=ch.id in claimed_ids,
        )
        for ch in channels
    ]
```

---

### `POST /api/bonuses/claim/{channel_id}`

Проверить подписку и начислить бонус.

**Auth:** Bearer JWT

**Response (200):**
```json
{
  "success": true,
  "bonus_points": 50,
  "new_balance": 1150
}
```

**Ошибки:**

| Код | Условие |
|-----|---------|
| 400 | Пользователь не подписан на канал |
| 409 | Бонус уже получен |
| 404 | Канал не найден |

**Реализация:**

```python
import httpx

async def check_subscription(bot_token: str, channel_id: int, user_tg_id: int) -> bool:
    url = f"https://api.telegram.org/bot{bot_token}/getChatMember"
    async with httpx.AsyncClient() as client:
        resp = await client.get(url, params={
            "chat_id": channel_id,
            "user_id": user_tg_id,
        })
    data = resp.json()
    if not data.get("ok"):
        return False
    status = data["result"]["status"]
    return status in ("member", "administrator", "creator")


@router.post("/claim/{channel_id}", response_model=ClaimResponse)
async def claim_bonus(
    channel_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # 1. Найти канал
    channel = db.query(BonusChannel).filter(BonusChannel.id == channel_id).first()
    if not channel:
        raise HTTPException(404, "Канал не найден")

    # 2. Проверить что бонус ещё не получен
    existing = db.query(UserChannelBonus).filter(
        UserChannelBonus.user_id == current_user.id,
        UserChannelBonus.channel_id == channel_id,
    ).first()
    if existing:
        raise HTTPException(409, "Бонус уже получен")

    # 3. Проверить подписку через Telegram API
    is_subscribed = await check_subscription(
        settings.BOT_TOKEN,
        channel.channel_id,
        current_user.telegram_id,
    )
    if not is_subscribed:
        raise HTTPException(400, "Вы не подписаны на канал")

    # 4. Начислить бонус
    current_user.balance += channel.bonus_points
    db.add(UserChannelBonus(
        user_id=current_user.id,
        channel_id=channel_id,
    ))
    db.commit()
    db.refresh(current_user)

    return ClaimResponse(
        success=True,
        bonus_points=channel.bonus_points,
        new_balance=current_user.balance,
    )
```

**Примечания:**
- Используем `async` endpoint + `httpx.AsyncClient` для неблокирующего запроса к Telegram API.
- В `main.py` FastAPI должен быть запущен с `uvicorn` (поддерживает async).

## Обработка ошибок Telegram API

Telegram API может вернуть ошибку если бот не является администратором канала:
```json
{
  "ok": false,
  "error_code": 400,
  "description": "Bad Request: chat not found"
}
```

В этом случае `check_subscription` вернёт `False`. Логировать такие ошибки.

## Definition of Done

- [ ] `GET /api/bonuses/channels` возвращает каналы с `is_claimed`
- [ ] `POST /api/bonuses/claim/{id}` начисляет очки при наличии подписки
- [ ] Повторный claim → 409
- [ ] Нет подписки → 400
- [ ] Бот является администратором тестового канала (проверить вручную)
