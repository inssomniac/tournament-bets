from typing import List

import httpx
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.api.deps import get_current_admin, get_current_user
from app.core.config import settings
from app.core.database import get_db
from app.models.bonus_channel import BonusChannel, UserChannelBonus
from app.models.user import User

router = APIRouter(prefix="/api/bonuses", tags=["bonuses"])

SUBSCRIBED_STATUSES = {"member", "administrator", "creator", "restricted"}


async def check_channel_subscription(channel_id: str, user_tg_id: int) -> bool:
    proxies = {"all://": settings.BOT_PROXY} if settings.BOT_PROXY else None
    try:
        async with httpx.AsyncClient(proxies=proxies, timeout=5.0) as client:
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


# ── Schemas ───────────────────────────────────────────────────────────────────

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


class AddChannelRequest(BaseModel):
    channel_id: str       # @username или -100xxx
    channel_name: str
    channel_url: str
    bonus_points: int


# ── User endpoints ────────────────────────────────────────────────────────────

@router.get("/channels", response_model=List[ChannelResponse])
def list_channels(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    channels = db.query(BonusChannel).filter(BonusChannel.is_active == True).all()
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
    channel = db.query(BonusChannel).filter(
        BonusChannel.id == channel_id,
        BonusChannel.is_active == True,
    ).first()
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


# ── Admin endpoints ───────────────────────────────────────────────────────────

@router.post("/admin/channels", response_model=ChannelResponse)
def add_channel(
    body: AddChannelRequest,
    _: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    existing = db.query(BonusChannel).filter(BonusChannel.channel_id == body.channel_id).first()
    if existing:
        raise HTTPException(409, "Канал уже добавлен")

    ch = BonusChannel(
        channel_id=body.channel_id,
        channel_name=body.channel_name,
        channel_url=body.channel_url,
        bonus_points=body.bonus_points,
        is_active=True,
    )
    db.add(ch)
    db.commit()
    db.refresh(ch)
    return ChannelResponse(
        id=ch.id,
        channel_name=ch.channel_name,
        channel_url=ch.channel_url,
        bonus_points=ch.bonus_points,
        is_claimed=False,
    )


@router.patch("/admin/channels/{channel_id}/toggle")
def toggle_channel(
    channel_id: int,
    _: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    ch = db.query(BonusChannel).filter(BonusChannel.id == channel_id).first()
    if not ch:
        raise HTTPException(404, "Канал не найден")
    ch.is_active = not ch.is_active
    db.commit()
    return {"id": ch.id, "is_active": ch.is_active}
