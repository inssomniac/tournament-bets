# Spec 04 — API: Users & Matches

## Цель

Реализовать эндпоинты для регистрации пользователя и работы с матчами.

## Users

### `POST /api/users/register`

Регистрирует пользователя (сохраняет ФИО, начисляет 1100 очков).
Вызывается один раз — если уже зарегистрирован, возвращает ошибку.

**Auth:** Bearer JWT (обязателен)

**Request:**
```json
{ "full_name": "Иванов Иван Иванович" }
```

**Response (201):**
```json
{
  "id": 1,
  "telegram_id": 123456789,
  "full_name": "Иванов Иван Иванович",
  "balance": 1100
}
```

**Response (409):** пользователь уже зарегистрирован
```json
{ "detail": "Пользователь уже зарегистрирован" }
```

**Валидация full_name:**
- Минимум 2 слова (Имя Фамилия)
- Максимум 255 символов
- Только кириллица, латиница, пробелы, дефисы

**Реализация:**
```python
# backend/app/api/users.py
router = APIRouter(prefix="/api/users", tags=["users"])

class RegisterRequest(BaseModel):
    full_name: str

    @field_validator("full_name")
    def validate_name(cls, v):
        v = v.strip()
        if len(v.split()) < 2:
            raise ValueError("Введите имя и фамилию")
        return v

class UserResponse(BaseModel):
    id: int
    telegram_id: int
    full_name: str
    balance: int
    model_config = ConfigDict(from_attributes=True)

@router.post("/register", response_model=UserResponse, status_code=201)
def register(
    body: RegisterRequest,
    current_user_tg_id: int = Depends(get_telegram_id),  # из JWT без проверки в БД
    db: Session = Depends(get_db),
):
    existing = db.query(User).filter(User.telegram_id == current_user_tg_id).first()
    if existing:
        raise HTTPException(status_code=409, detail="Пользователь уже зарегистрирован")

    user = User(
        telegram_id=current_user_tg_id,
        full_name=body.full_name,
        balance=1100,  # 1000 стартовых + 100 бонус
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user
```

**Примечание:** `get_telegram_id` — лёгкий dependency который парсит JWT без запроса в БД (нужен потому что пользователь ещё не создан в БД на этом этапе):

```python
def get_telegram_id(
    credentials: HTTPAuthorizationCredentials = Depends(bearer),
) -> int:
    payload = decode_token(credentials.credentials)
    return int(payload["sub"])
```

---

### `GET /api/users/me`

Возвращает профиль текущего пользователя.

**Auth:** Bearer JWT

**Response (200):**
```json
{
  "id": 1,
  "telegram_id": 123456789,
  "full_name": "Иванов Иван Иванович",
  "balance": 950
}
```

**Response (404):** пользователь не зарегистрирован (есть токен, но нет записи в БД)

---

## Matches

### `GET /api/matches`

Список матчей для TWA. Возвращает только `upcoming` и `active` (не завершённые).

**Auth:** Bearer JWT

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
    "user_bet": {
      "team_choice": 1,
      "amount": 200,
      "potential_win": 340,
      "status": "pending"
    }
  },
  {
    "id": 2,
    "team1_name": "Соколы",
    "team2_name": "Барсы",
    "odds_team1": 1.5,
    "odds_team2": 2.5,
    "bet_deadline": "2026-06-16T12:00:00",
    "status": "active",
    "user_bet": null
  }
]
```

`user_bet` — ставка текущего пользователя на этот матч (или null).
`bet_deadline` — ISO 8601 UTC.

**Логика:**
```python
@router.get("/", response_model=List[MatchResponse])
def list_matches(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    matches = db.query(Match).filter(Match.status != "finished").order_by(Match.bet_deadline).all()
    
    result = []
    for match in matches:
        bet = db.query(Bet).filter(
            Bet.user_id == current_user.id,
            Bet.match_id == match.id
        ).first()
        result.append(MatchResponse.from_match(match, bet))
    return result
```

---

### `GET /api/matches/{match_id}`

Детали одного матча. Включает завершённые (для истории ставок).

**Response (200):** то же что выше + поле `winner: null | 1 | 2`

**Response (404):** матч не найден

---

### `GET /api/matches/history`

Завершённые матчи (для экрана истории ставок).

**Auth:** Bearer JWT

**Response:** массив матчей со статусом `finished`, только те на которые пользователь делал ставку.

```json
[
  {
    "id": 1,
    "team1_name": "Лаптевцы",
    "team2_name": "Медведи",
    "winner": 1,
    "status": "finished",
    "user_bet": {
      "team_choice": 1,
      "amount": 200,
      "potential_win": 340,
      "status": "won"
    }
  }
]
```

---

## Схемы Pydantic

```python
# backend/app/schemas/match.py
from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import Optional

class BetInfo(BaseModel):
    team_choice: int
    amount: int
    potential_win: int
    status: str

class MatchResponse(BaseModel):
    id: int
    team1_name: str
    team2_name: str
    odds_team1: float
    odds_team2: float
    bet_deadline: datetime
    status: str
    winner: Optional[int] = None
    user_bet: Optional[BetInfo] = None

    model_config = ConfigDict(from_attributes=True)

    @classmethod
    def from_match(cls, match, bet=None):
        bet_info = None
        if bet:
            bet_info = BetInfo(
                team_choice=bet.team_choice,
                amount=bet.amount,
                potential_win=bet.potential_win,
                status=bet.status,
            )
        return cls(
            id=match.id,
            team1_name=match.team1_name,
            team2_name=match.team2_name,
            odds_team1=float(match.odds_team1),
            odds_team2=float(match.odds_team2),
            bet_deadline=match.bet_deadline,
            status=match.status,
            winner=match.winner,
            user_bet=bet_info,
        )
```

## Definition of Done

- [ ] `POST /api/users/register` создаёт пользователя с balance=1100
- [ ] Повторный register → 409
- [ ] `GET /api/users/me` → профиль пользователя
- [ ] `GET /api/matches` → список незавершённых матчей с `user_bet`
- [ ] `GET /api/matches` когда матчей нет → пустой массив `[]`
- [ ] `GET /api/matches/{id}` несуществующий → 404
