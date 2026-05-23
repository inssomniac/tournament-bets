# Spec: Додеп (дополнительная ставка)

## Цель
Пользователь, уже сделавший ставку на матч, может добавить ещё одну
ставку на ТУ ЖЕ команду. Ставка на другую команду запрещена.

## Изменения в Backend (`app/api/bets.py`)

### Старая логика (убрать):
```python
existing = db.query(Bet).filter(
    Bet.user_id == current_user.id,
    Bet.match_id == body.match_id,
).first()
if existing:
    raise HTTPException(409, "Вы уже делали ставку на этот матч")
```

### Новая логика:
```python
existing = db.query(Bet).filter(
    Bet.user_id == current_user.id,
    Bet.match_id == body.match_id,
).first()
if existing and existing.team_choice != body.team_choice:
    raise HTTPException(409, "Нельзя ставить на другую команду — вы уже поставили на эту команду")
# existing and same team_choice → разрешаем, создаём новую запись
```

### `GET /api/bets/my` — без изменений
Возвращает все ставки отдельными строками. Фронт агрегирует сам.

### `GET /api/matches/` — изменение `user_bet`
Сейчас: возвращает один `user_bet` (первую найденную ставку).
Новое: возвращать агрегат по всем ставкам пользователя на матч:

```python
# Вместо .first() — .all()
bets = db.query(Bet).filter(
    Bet.user_id == current_user.id,
    Bet.match_id == match.id,
).all()

if bets:
    bet_info = BetInfo(
        team_choice=bets[0].team_choice,           # команда одинакова у всех
        amount=sum(b.amount for b in bets),         # суммарная ставка
        potential_win=sum(b.potential_win for b in bets),  # суммарный потенциал
        status=bets[0].status,                      # pending/won/lost (одинаково)
        bets_count=len(bets),                       # количество ставок
    )
```

### Схема `BetInfo` — добавить поле:
```python
class BetInfo(BaseModel):
    team_choice: int
    amount: int
    potential_win: int
    status: str
    bets_count: int = 1   # новое поле
```

## Frontend

### `Matches.tsx` — `MatchCard`
Если `user_bet` есть и матч `active`:
- Показать: «✅ Команда А — 150 очков (2 ставки)»
- Кнопки команд: команда пользователя остаётся активной (можно додепнуть), кнопка другой команды заблокирована визуально (серая, курсор not-allowed)
- При нажатии на свою команду: открыть BetFlow в режиме додепа

Если матч `live` / `finished` и есть ставки — агрегированный показ без кнопок (как сейчас).

### `BetFlow.tsx`
- Принимает пропс `isTopUp?: boolean` и `existingBet?: { team_choice, amount, potential_win }`
- Если `isTopUp`: заголовок «Додеп», показать текущую ставку сверху серым текстом
- Предупреждение: «Каждый додеп фиксирует текущий коэф»
- Логика отправки: та же `POST /api/bets/` (бэк разберётся)

### `Balance.tsx`
- Если несколько ставок на один матч — группировать в одну карточку:
  «Команда А vs Команда Б — 2 ставки — итого 150 очков»
- Или: показывать каждую строкой, но с пометкой «Додеп»

## Edge cases
- Додеп на матч в статусе `live` → бэк вернёт 400 «Приём ставок закрыт» (без изменений)
- Баланс недостаточен для додепа → 400 как обычно
- Минимум додепа: те же 50 очков
- Если команды нет в state (BetFlow открывается через MatchCard), team_choice берём из `user_bet.team_choice`
