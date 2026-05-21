from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.core.security import decode_token
from app.models.user import User

bearer = HTTPBearer()


def get_telegram_id(
    credentials: HTTPAuthorizationCredentials = Depends(bearer),
) -> int:
    """Парсит JWT и возвращает telegram_id без запроса в БД."""
    try:
        payload = decode_token(credentials.credentials, settings.SECRET_KEY)
        return int(payload["sub"])
    except (ValueError, KeyError):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Невалидный токен")


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer),
    db: Session = Depends(get_db),
) -> User:
    """Парсит JWT и возвращает пользователя из БД."""
    try:
        payload = decode_token(credentials.credentials, settings.SECRET_KEY)
        telegram_id = int(payload["sub"])
    except (ValueError, KeyError):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Невалидный токен")

    user = db.query(User).filter(User.telegram_id == telegram_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Пользователь не найден")
    return user


def get_current_admin(
    user: User = Depends(get_current_user),
) -> User:
    """Проверяет что пользователь является администратором."""
    if user.telegram_id not in settings.admin_ids_list:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Доступ запрещён")
    return user
