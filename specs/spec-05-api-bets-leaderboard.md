# Spec 05 — API: Bets & Leaderboard

## Цель

Реализовать логику ставок и лидерборд.

## Bets

### `POST /api/bets`

Создать ставку на матч.

**Auth:** Bearer JWT

**Request:**
```json
{
  "match_id": 1,
  "team_choice": 1,
  "amount": 200
}
```

**Response (201):**
```json
{
  "id": 5,
  "match_id": 1,
  "team_choice": 1,
  "amount": 200,
  "potential_win": 340,
  "status": "pending",
  "created_at": "2026-05-20T10:00:00"
}
```

**Ошибки:**

| Код | Условие |
|-----|---------|
| 400 | amount < 10 или amount > 500 |
| 400 | Недостаточно очков на балансе |
| 400 | bet_deadline уже прошёл |
| 400 | Матч завершён (status=finished) |
| 409 | Пользователь уже делал ставку на этот матч |
| 404 | Матч не найден |

**Реализация:**

```python
# backend/app/api/bets.py
from datetime import datetime, timezone

@router.post("/", response_model=BetResponse, status_code=201)
def place_bet(
    body: BetRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # 1. Найти матч
    match = db.query(Match).filter(Match.id == body.match_id).first()
    if not match:
        raise HTTPException(404, "Матч не найден")

    # 2. Проверить что матч открыт
    if match.status == "finished":
        raise HTTPException(400, "Матч уже завершён")
    
    now = datetime.now(timezone.utc)
    if match.bet_deadline.replace(tzinfo=timezone.utc) < now:
        raise HTTPException(400, "Приём ставок закрыт")

    # 3. Проверить сумму
    if body.amount < 10 or body.amount > 500:
        raise HTTPException(400, "Сумма ставки: от 10 до 500 очков")

    # 4. Проверить баланс
    if current_user.balance < body.amount:
        raise HTTPException(400, "Недостаточно очков")

    # 5. Проверить дубль
    existing = db.query(Bet).filter(
        Bet.user_id == current_user.id,
        Bet.match_id == body.match_id,
    ).first()
    if existing:
        raise HTTPException(409, "Вы уже делали ставку на этот матч")

    # 6. Рассчитать выигрыш
    odds = float(match.odds_team1 if body.team_choice == 1 else match.odds_team2)
    potential_win = int(body.amount * odds)

    # 7. Списать очки и создать ставку — в одной транзакции
    current_user.balance -= body.amount
    bet = Bet(
        user_id=current_user.id,
        match_id=body.match_id,
        team_choice=body.team_choice,
        amount=body.amount,
        potential_win=potential_win,
        status="pending",
    )
    db.add(bet)
    db.commit()
    db.refresh(bet)
    return bet
```

**Важно:** Списание баланса и создание ставки происходят в одной транзакции (`db.commit()` один раз в конце). Если что-то пойдёт не так — транзакция откатится автоматически.

---

### `GET /api/bets/my`

История ставок текущего пользователя.

**Auth:** Bearer JWT

**Response (200):**
```json
[
  {
    "id": 5,
    "match_id": 1,
    "team1_name": "Лаптевцы",
    "team2_name": "Медведи",
    "team_choice": 1,
    "amount": 200,
    "potential_win": 340,
    "status": "won",
    "created_at": "2026-05-20T10:00:00"
  }
]
```

Включает данные матча (названия команд) для удобного отображения на фронте.

---

## Leaderboard

### `GET /api/leaderboard`

Топ пользователей по балансу.

**Auth:** Bearer JWT

**Query params:**
- `limit` — сколько позиций показать (default: 50, max: 100)

**Response (200):**
```json
{
  "leaderboard": [
    {
      "rank": 1,
      "full_name": "Петров Пётр Петрович",
      "balance": 2850,
      "is_current_user": false
    },
    {
      "rank": 2,
      "full_name": "Иванов Иван Иванович",
      "balance": 1950,
      "is_current_user": true
    }
  ],
  "current_user_rank": 2,
  "total_players": 47
}
```

`is_current_user` — подсвечивает позицию текущего пользователя в списке.
`current_user_rank` — позиция текущего пользователя (даже если не попал в топ-50).

**Реализация:**

```python
@router.get("/", response_model=LeaderboardResponse)
def get_leaderboard(
    limit: int = Query(default=50, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # Все пользователи отсортированные по балансу
    all_users = db.query(User).order_by(User.balance.desc()).all()
    total = len(all_users)

    # Найти ранг текущего пользователя
    current_rank = next(
        (i + 1 for i, u in enumerate(all_users) if u.id == current_user.id),
        None
    )

    # Топ N
    top_users = all_users[:limit]
    leaderboard = [
        LeaderboardEntry(
            rank=i + 1,
            full_name=u.full_name,
            balance=u.balance,
            is_current_user=u.id == current_user.id,
        )
        for i, u in enumerate(top_users)
    ]

    return LeaderboardResponse(
        leaderboard=leaderboard,
        current_user_rank=current_rank,
        total_players=total,
    )
```

**Примечание по производительности:** При 100 пользователях загрузка всех в память — нормально. Если бы было 10000+ пользователей, использовали бы оконную функцию `ROW_NUMBER() OVER (ORDER BY balance DESC)` в SQL. Для нашего масштаба не нужно.

## Definition of Done

- [ ] `POST /api/bets` списывает баланс и создаёт ставку атомарно
- [ ] Двойная ставка на один матч → 409
- [ ] Ставка после дедлайна → 400
- [ ] Ставка при нехватке баланса → 400
- [ ] `GET /api/bets/my` возвращает ставки с данными матча
- [ ] `GET /api/leaderboard` возвращает топ с `is_current_user` и `current_user_rank`
