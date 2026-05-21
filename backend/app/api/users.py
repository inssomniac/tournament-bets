from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, field_validator, ConfigDict
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_telegram_id
from app.core.database import get_db
from app.models.user import User

router = APIRouter(prefix="/api/users", tags=["users"])


class RegisterRequest(BaseModel):
    full_name: str

    @field_validator("full_name")
    @classmethod
    def validate_name(cls, v: str) -> str:
        v = v.strip()
        if len(v.split()) < 2:
            raise ValueError("Введите имя и фамилию (минимум два слова)")
        if len(v) > 255:
            raise ValueError("Имя слишком длинное")
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
    telegram_id: int = Depends(get_telegram_id),
    db: Session = Depends(get_db),
):
    existing = db.query(User).filter(User.telegram_id == telegram_id).first()
    if existing:
        raise HTTPException(status_code=409, detail="Пользователь уже зарегистрирован")

    user = User(
        telegram_id=telegram_id,
        full_name=body.full_name,
        balance=1100,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user
