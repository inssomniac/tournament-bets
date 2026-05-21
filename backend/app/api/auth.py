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
    user = db.query(User).filter(User.telegram_id == telegram_id).first()
    is_admin = telegram_id in settings.admin_ids_list

    token = create_access_token(telegram_id, is_admin, settings.SECRET_KEY)

    return AuthResponse(
        access_token=token,
        is_registered=user is not None,
        is_admin=is_admin,
    )
