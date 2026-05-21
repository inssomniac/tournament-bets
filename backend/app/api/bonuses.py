from typing import List

import httpx
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.config import settings
from app.core.database import get_db
from app.models.bonus_channel import BonusChannel, UserChannelBonus
from app.models.user import User

router = APIRouter(prefix="/api/bonuses", tags=["bonuses"])

SUBSCRIBED_STATUSES = {"member", "administrator", "creator"}


async def check_channel_subscription(channel_id: int, user_tg_id: int) -> bool:
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            resp = await client.get(
                f"https://api.telegram.org/bot{settings.BOT_TOKEN}/getChatMember",
                params={"chat_id": channel_id, "user_id": user_tg_id},
            )
        data = resp.json()
        if not data.get("ok"):
            return False
        return data["result"]["status"] in SUBSCRIBED_STATUSES
    except Exception:
        return False


class ChannelResponse(BaseModel):
    id: int
    channel_name: str
    channel_url: str
    bonus_points: int
    is_claimed: bool


class ClaimResponse(BaseModel):
    success: bool
    bonus_points: int
    new_balance: int


@router.get("/channels", response_model=List[ChannelResponse])
def list_channels(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    channels = db.query(BonusChannel).all()
    claimed_ids = {
        ucb.channel_id
        for ucb in db.query(UserChannelBonus).filter(
            UserChannelBonus.user_id == current_user.id
        ).all()
    }
    return [
        ChannelResponse(
            id=ch.id,
            channel_name=ch.channel_name,
            channel_url=ch.channel_url,
            bonus_points=ch.bonus_points,
            is_claimed=ch.id in claimed_ids,
        )
        for ch in channels
    ]


@router.post("/claim/{channel_id}", response_model=ClaimResponse)
async def claim_bonus(
    channel_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    channel = db.query(BonusChannel).filter(BonusChannel.id == channel_id).first()
    if not channel:
        raise HTTPException(404, "Канал не найден")

    existing = db.query(UserChannelBonus).filter(
        UserChannelBonus.user_id == current_user.id,
        UserChannelBonus.channel_id == channel_id,
    ).first()
    if existing:
        raise HTTPException(409, "Бонус уже получен")

    is_subscribed = await check_channel_subscription(
        channel.channel_id, current_user.telegram_id
    )
    if not is_subscribed:
        raise HTTPException(400, "Вы не подписаны на канал")

    current_user.balance += channel.bonus_points
    db.add(UserChannelBonus(user_id=current_user.id, channel_id=channel_id))
    db.commit()
    db.refresh(current_user)

    return ClaimResponse(
        success=True,
        bonus_points=channel.bonus_points,
        new_balance=current_user.balance,
    )
