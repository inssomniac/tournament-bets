# Spec 03 — Authentication

## Цель

Реализовать валидацию Telegram initData и выдачу JWT.
После этого спека: фронт может отправить initData → получить токен → делать авторизованные запросы.

## Как работает Telegram initData

Когда пользователь открывает TWA, Telegram передаёт в `window.Telegram.WebApp.initData` строку вида:

```
query_id=AAH...&user=%7B%22id%22%3A123456789%2C%22first_name%22...&auth_date=1716000000&hash=abc123...
```

Бекенд должен верифицировать `hash` через HMAC-SHA256 чтобы убедиться, что данные пришли именно от Telegram.

### Алгоритм верификации

```python
import hashlib
import hmac
from urllib.parse import unquote

def verify_telegram_init_data(init_data: str, bot_token: str) -> dict:
    """
    Верифицирует initData от Telegram WebApp.
    Возвращает распарсенные данные или бросает ValueError.
    """
    # 1. Распарсить строку в dict
    vals = {}
    for part in init_data.split("&"):
        key, _, value = part.partition("=")
        vals[key] = unquote(value)

    received_hash = vals.pop("hash", None)
    if not received_hash:
        raise ValueError("hash отсутствует")

    # 2. Собрать data_check_string (отсортировать ключи, соединить \n)
    data_check_string = "\n".join(
        f"{k}={v}" for k, v in sorted(vals.items())
    )

    # 3. Вычислить secret_key
    secret_key = hmac.new(
        b"WebAppData", bot_token.encode(), hashlib.sha256
    ).digest()

    # 4. Вычислить ожидаемый hash
    expected_hash = hmac.new(
        secret_key, data_check_string.encode(), hashlib.sha256
    ).hexdigest()

    if not hmac.compare_digest(expected_hash, received_hash):
        raise ValueError("Невалидная подпись")

    # 5. Проверить auth_date (не старше 24 часов)
    import time
    auth_date = int(vals.get("auth_date", 0))
    if time.time() - auth_date > 86400:
        raise ValueError("initData устарела")

    # 6. Распарсить user
    import json
    user_data = json.loads(vals["user"])
    return user_data  # {"id": 123, "first_name": "Ivan", ...}
```

**Важно:** `hmac.compare_digest` защищает от timing attacks. Не использовать `==`.

## JWT

### `backend/app/core/security.py`

```python
from datetime import datetime, timedelta
from jose import jwt, JWTError
from app.core.config import settings

ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE = timedelta(hours=24)

def create_access_token(telegram_id: int, is_admin: bool) -> str:
    payload = {
        "sub": str(telegram_id),
        "is_admin": is_admin,
        "exp": datetime.utcnow() + ACCESS_TOKEN_EXPIRE,
    }
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=ALGORITHM)

def decode_token(token: str) -> dict:
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        raise ValueError("Невалидный токен")
```

### Dependency для защищённых роутов

```python
# backend/app/api/deps.py
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from app.core.security import decode_token
from app.core.database import get_db
from app.models.user import User

bearer = HTTPBearer()

def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer),
    db: Session = Depends(get_db),
) -> User:
    try:
        payload = decode_token(credentials.credentials)
        telegram_id = int(payload["sub"])
    except (ValueError, KeyError):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED)

    user = db.query(User).filter(User.telegram_id == telegram_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED)
    return user

def get_current_admin(user: User = Depends(get_current_user)) -> User:
    from app.core.config import settings
    if user.telegram_id not in settings.admin_ids_list:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN)
    return user
```

## Эндпоинт

### `POST /api/auth/validate`

**Request:**
```json
{
  "init_data": "query_id=AAH...&user=...&auth_date=...&hash=..."
}
```

**Response (200):**
```json
{
  "access_token": "eyJ...",
  "token_type": "bearer",
  "is_registered": true,
  "is_admin": false
}
```

**Response (401):**
```json
{ "detail": "Невалидная подпись" }
```

### Реализация роутера

```python
# backend/app/api/auth.py
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.config import settings
from app.core.security import create_access_token
from app.models.user import User

router = APIRouter(prefix="/api/auth", tags=["auth"])

class ValidateRequest(BaseModel):
    init_data: str

class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    is_registered: bool
    is_admin: bool

@router.post("/validate", response_model=AuthResponse)
def validate(body: ValidateRequest, db: Session = Depends(get_db)):
    try:
        user_data = verify_telegram_init_data(body.init_data, settings.BOT_TOKEN)
    except ValueError as e:
        raise HTTPException(status_code=401, detail=str(e))

    telegram_id = user_data["id"]
    user = db.query(User).filter(User.telegram_id == telegram_id).first()
    is_admin = telegram_id in settings.admin_ids_list

    token = create_access_token(telegram_id, is_admin)
    return AuthResponse(
        access_token=token,
        is_registered=user is not None,
        is_admin=is_admin,
    )
```

## Локальное тестирование без Telegram

В dev-режиме реальный initData получить сложно без запущенного бота.
Решение — **dev bypass**:

```python
# backend/app/core/security.py (добавить)
def verify_telegram_init_data(init_data: str, bot_token: str) -> dict:
    from app.core.config import settings
    
    # DEV BYPASS: если ENVIRONMENT=development и init_data начинается с "dev:"
    # Формат: "dev:TELEGRAM_ID"
    if settings.ENVIRONMENT == "development" and init_data.startswith("dev:"):
        telegram_id = int(init_data.split(":")[1])
        return {"id": telegram_id, "first_name": "TestUser"}
    
    # ... обычная валидация
```

Фронт в dev-режиме отправляет `"dev:123456789"` вместо реального initData.

## Подключение роутера в main.py

```python
# backend/app/main.py
from app.api.auth import router as auth_router
app.include_router(auth_router)
```

## Definition of Done

- [ ] `POST /api/auth/validate` с реальным initData → возвращает JWT
- [ ] `POST /api/auth/validate` с поддельным hash → 401
- [ ] `POST /api/auth/validate` с `dev:123` в dev-режиме → возвращает JWT
- [ ] Защищённый роут без токена → 401
- [ ] Защищённый роут с токеном → 200
- [ ] Роут с `get_current_admin` для не-админа → 403
