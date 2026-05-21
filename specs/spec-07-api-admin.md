# Spec 07 — API: Admin

## Цель

Эндпоинты для организатора: управление матчами и ввод результатов.
Все роуты защищены — доступ только если `telegram_id` в `ADMIN_IDS`.

## Эндпоинты

### `GET /api/admin/matches`

Все матчи (включая завершённые). Для таблицы в админке.

**Auth:** Bearer JWT + admin check

**Response (200):**
```json
[
  {
    "id": 1,
    "team1_name": "Лаптевцы",
    "team2_name": "Медведи",
    "odds_team1": 1.7,
    "odds_team2": 2.2,
    "bet_deadline": "2026-06-15T14:00:00",
    "status": "active",
    "winner": null,
    "bets_count": 12,
    "total_bet_amount": 1800
  }
]
```

`bets_count` и `total_bet_amount` — агрегаты для информирования организатора.

---

### `POST /api/admin/matches`

Создать новый матч.

**Request:**
```json
{
  "team1_name": "Лаптевцы",
  "team2_name": "Медведи",
  "odds_team1": 1.7,
  "odds_team2": 2.2,
  "bet_deadline": "2026-06-15T14:00:00"
}
```

**Валидация:**
- `odds_team1`, `odds_team2` — от 1.01 до 10.0
- `bet_deadline` — должен быть в будущем
- Названия команд — непустые строки

**Response (201):** созданный матч

---

### `PUT /api/admin/matches/{match_id}`

Редактировать матч. Разрешено только если `status != 'finished'`.

**Request:** те же поля что при создании (все опциональные)

**Response (200):** обновлённый матч

**Response (400):** матч уже завершён, редактирование запрещено

---

### `POST /api/admin/matches/{match_id}/result`

Ввести результат матча. **Ключевой эндпоинт** — запускает пересчёт балансов и уведомления.

**Request:**
```json
{ "winner": 1 }
```

`winner`: `1` = победа team1, `2` = победа team2

**Response (200):**
```json
{
  "match_id": 1,
  "winner": 1,
  "bets_processed": 12,
  "winners_count": 7,
  "losers_count": 5,
  "total_paid_out": 2380
}
```

**Ошибки:**

| Код | Условие |
|-----|---------|
| 400 | Матч уже завершён |
| 400 | winner не 1 и не 2 |
| 404 | Матч не найден |

**Реализация (критическая часть — должна быть атомарной):**

```python
@router.post("/{match_id}/result", response_model=ResultResponse)
async def set_result(
    match_id: int,
    body: ResultRequest,
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    match = db.query(Match).filter(Match.id == match_id).first()
    if not match:
        raise HTTPException(404, "Матч не найден")
    if match.status == "finished":
        raise HTTPException(400, "Матч уже завершён")
    if body.winner not in (1, 2):
        raise HTTPException(400, "winner должен быть 1 или 2")

    # Загрузить все pending ставки на матч
    bets = db.query(Bet).filter(
        Bet.match_id == match_id,
        Bet.status == "pending",
    ).all()

    winners_count = 0
    losers_count = 0
    total_paid_out = 0
    notifications = []  # собрать для отправки после коммита

    # Пересчитать ставки
    for bet in bets:
        if bet.team_choice == body.winner:
            bet.status = "won"
            bet.user.balance += bet.potential_win
            winners_count += 1
            total_paid_out += bet.potential_win
            notifications.append({
                "telegram_id": bet.user.telegram_id,
                "won": True,
                "team_name": match.team1_name if body.winner == 1 else match.team2_name,
                "match_title": f"{match.team1_name} vs {match.team2_name}",
                "amount": bet.potential_win,
                "new_balance": bet.user.balance,
            })
        else:
            bet.status = "lost"
            losers_count += 1
            notifications.append({
                "telegram_id": bet.user.telegram_id,
                "won": False,
                "team_name": match.team1_name if bet.team_choice == 1 else match.team2_name,
                "match_title": f"{match.team1_name} vs {match.team2_name}",
                "amount": bet.amount,
                "new_balance": bet.user.balance,
            })

    # Закрыть матч
    match.status = "finished"
    match.winner = body.winner

    # Один коммит для всего
    db.commit()

    # Отправить уведомления ПОСЛЕ коммита (фоновая задача)
    # Используем BackgroundTasks FastAPI
    # (передаётся как параметр в сигнатуру endpoint)
    for notif in notifications:
        background_tasks.add_task(send_notification, notif)

    return ResultResponse(
        match_id=match_id,
        winner=body.winner,
        bets_processed=len(bets),
        winners_count=winners_count,
        losers_count=losers_count,
        total_paid_out=total_paid_out,
    )
```

**Примечание:** `BackgroundTasks` FastAPI запускает задачи после отправки ответа клиенту. Если уведомление не дойдёт — это не критично (турнир продолжается), поэтому не нужна очередь сообщений.

---

### `GET /api/admin/users`

Список всех пользователей.

**Response:**
```json
[
  {
    "id": 1,
    "telegram_id": 123456789,
    "full_name": "Иванов Иван Иванович",
    "balance": 1950,
    "bets_count": 5,
    "registered_at": "2026-05-20T10:00:00"
  }
]
```

---

### `GET /api/admin/stats`

Сводная статистика для дашборда.

**Response:**
```json
{
  "total_users": 47,
  "total_bets": 183,
  "active_matches": 3,
  "finished_matches": 8
}
```

## Уведомления

```python
# backend/app/services/notifications.py
import httpx

async def send_notification(data: dict):
    """Отправить уведомление пользователю через Bot API"""
    bot_token = settings.BOT_TOKEN
    telegram_id = data["telegram_id"]

    if data["won"]:
        text = (
            f"🎉 Матч «{data['match_title']}» завершён!\n"
            f"Ваша ставка на {data['team_name']} выиграла!\n"
            f"Вы получили: {data['amount']} очков.\n"
            f"Ваш баланс: {data['new_balance']} очков."
        )
    else:
        text = (
            f"❌ Матч «{data['match_title']}» завершён.\n"
            f"Ваша ставка на {data['team_name']} проиграла.\n"
            f"Вы потеряли: {data['amount']} очков.\n"
            f"Ваш баланс: {data['new_balance']} очков."
        )

    async with httpx.AsyncClient() as client:
        await client.post(
            f"https://api.telegram.org/bot{bot_token}/sendMessage",
            json={"chat_id": telegram_id, "text": text},
        )
```

## Definition of Done

- [ ] Создание матча с валидацией → 201
- [ ] Редактирование завершённого матча → 400
- [ ] Ввод результата пересчитывает балансы всех участников ставки атомарно
- [ ] После ввода результата уходят уведомления в Telegram
- [ ] Повторный ввод результата → 400
- [ ] Не-админ на любой `/admin/` роут → 403
