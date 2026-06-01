import httpx
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.core.security import verify_telegram_init_data, create_access_token
from app.models.user import User

router = APIRouter(prefix="/api/auth", tags=["auth"])


class ValidateRequest(BaseModel):
    init_data: str


class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    is_registered: bool
    is_admin: bool


def _is_channel_member(telegram_id: int) -> bool:
    """
    Проверяет через Bot API, является ли пользователь участником канала.
    Возвращает True если подписан (или если проверка недоступна — fail-open).
    В dev-режиме всегда True.
    """
    if settings.ENVIRONMENT == "development":
        return True

    if not settings.LAPTU_CHANNEL_ID:
        return True

    url = (
        f"https://api.telegram.org/bot{settings.BOT_TOKEN}/getChatMember"
        f"?chat_id={settings.LAPTU_CHANNEL_ID}&user_id={telegram_id}"
    )

    proxies = {"all://": settings.BOT_PROXY} if settings.BOT_PROXY else None

    try:
        with httpx.Client(proxies=proxies, timeout=5.0) as client:
            resp = client.get(url)
        data = resp.json()
    except Exception:
        # Telegram API недоступен — пропускаем (fail-open)
        return True

    if not data.get("ok"):
        # Пользователь не найден в канале (private channel + не в канале)
        return False

    status = data.get("result", {}).get("status", "left")
    return status in ("creator", "administrator", "member", "restricted")


@router.post("/validate", response_model=AuthResponse)
def validate(body: ValidateRequest, db: Session = Depends(get_db)):
    try:
        user_data = verify_telegram_init_data(
            body.init_data,
            settings.BOT_TOKEN,
            settings.ENVIRONMENT,
        )
    except ValueError as e:
        raise HTTPException(status_code=401, detail=str(e))

    telegram_id = user_data["id"]

    # Проверка подписки на канал
    if not _is_channel_member(telegram_id):
        raise HTTPException(
            status_code=403,
            detail={
                "code": "not_subscribed",
                "channel_url": settings.CHANNEL_INVITE_URL,
            },
        )

    user = db.query(User).filter(User.telegram_id == telegram_id).first()
    is_admin = telegram_id in settings.admin_ids_list

    token = create_access_token(telegram_id, is_admin, settings.SECRET_KEY)

    return AuthResponse(
        access_token=token,
        is_registered=user is not None,
        is_admin=is_admin,
    )
