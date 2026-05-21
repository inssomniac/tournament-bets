import hashlib
import hmac
import json
import time
from datetime import datetime, timedelta
from urllib.parse import unquote

from jose import jwt, JWTError

ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE = timedelta(hours=24)


def verify_telegram_init_data(init_data: str, bot_token: str, environment: str = "production") -> dict:
    """
    Верифицирует initData от Telegram WebApp.
    Возвращает данные пользователя или бросает ValueError.
    """
    # DEV BYPASS: "dev:TELEGRAM_ID"
    if environment == "development" and init_data.startswith("dev:"):
        telegram_id = int(init_data.split(":")[1])
        return {"id": telegram_id, "first_name": "DevUser", "last_name": "Test"}

    # Распарсить строку
    vals = {}
    for part in init_data.split("&"):
        key, _, value = part.partition("=")
        vals[key] = unquote(value)

    received_hash = vals.pop("hash", None)
    if not received_hash:
        raise ValueError("hash отсутствует")

    # Собрать data_check_string
    data_check_string = "\n".join(
        f"{k}={v}" for k, v in sorted(vals.items())
    )

    # Вычислить secret_key
    secret_key = hmac.new(
        b"WebAppData", bot_token.encode(), hashlib.sha256
    ).digest()

    # Проверить hash
    expected_hash = hmac.new(
        secret_key, data_check_string.encode(), hashlib.sha256
    ).hexdigest()

    if not hmac.compare_digest(expected_hash, received_hash):
        raise ValueError("Невалидная подпись")

    # Проверить свежесть (не старше 24 часов)
    auth_date = int(vals.get("auth_date", 0))
    if time.time() - auth_date > 86400:
        raise ValueError("initData устарела")

    user_data = json.loads(vals["user"])
    return user_data


def create_access_token(telegram_id: int, is_admin: bool, secret_key: str) -> str:
    payload = {
        "sub": str(telegram_id),
        "is_admin": is_admin,
        "exp": datetime.utcnow() + ACCESS_TOKEN_EXPIRE,
    }
    return jwt.encode(payload, secret_key, algorithm=ALGORITHM)


def decode_token(token: str, secret_key: str) -> dict:
    try:
        payload = jwt.decode(token, secret_key, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        raise ValueError("Невалидный токен")
