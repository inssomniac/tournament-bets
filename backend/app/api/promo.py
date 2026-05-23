import csv
import io
import random
import string
from datetime import datetime, timezone
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, ConfigDict
from sqlalchemy.orm import Session

from app.api.deps import get_current_admin, get_current_user
from app.core.database import get_db
from app.models.promo_code import PromoCode
from app.models.user import User

router = APIRouter(tags=["promo"])

ALPHABET = string.ascii_uppercase + string.digits  # A-Z0-9


def _generate_code() -> str:
    return "".join(random.choices(ALPHABET, k=5))


# ── Schemas ───────────────────────────────────────────────────────────────────

class GenerateRequest(BaseModel):
    amount: int
    count: int = 500


class PromoCodeResponse(BaseModel):
    id: int
    code: str
    amount: int
    is_used: bool
    used_by_user_id: Optional[int]
    used_at: Optional[datetime]
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)


class RedeemRequest(BaseModel):
    code: str


class RedeemResponse(BaseModel):
    amount: int
    new_balance: int


# ── Admin endpoints ───────────────────────────────────────────────────────────

@router.post("/api/admin/promo/generate", response_model=dict)
def generate_codes(
    body: GenerateRequest,
    _: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    if body.amount not in (100, 200, 300, 400):
        raise HTTPException(400, "Допустимые номиналы: 100, 200, 300, 400")
    if not (1 <= body.count <= 1000):
        raise HTTPException(400, "count должен быть от 1 до 1000")

    codes = []
    attempts = 0
    while len(codes) < body.count and attempts < body.count * 10:
        attempts += 1
        candidate = _generate_code()
        exists = db.query(PromoCode).filter(PromoCode.code == candidate).first()
        if not exists:
            codes.append(PromoCode(code=candidate, amount=body.amount))

    db.bulk_save_objects(codes)
    db.commit()

    return {"generated": len(codes), "codes": [c.code for c in codes]}


@router.get("/api/admin/promo/list", response_model=List[PromoCodeResponse])
def list_codes(
    amount: Optional[int] = None,
    used: Optional[bool] = None,
    _: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    q = db.query(PromoCode)
    if amount is not None:
        q = q.filter(PromoCode.amount == amount)
    if used is not None:
        q = q.filter(PromoCode.is_used == used)
    return q.order_by(PromoCode.created_at.desc()).all()


@router.get("/api/admin/promo/export.csv")
def export_codes_csv(
    amount: Optional[int] = None,
    used: Optional[bool] = None,
    _: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    q = db.query(PromoCode)
    if amount is not None:
        q = q.filter(PromoCode.amount == amount)
    if used is not None:
        q = q.filter(PromoCode.is_used == used)
    codes = q.order_by(PromoCode.created_at.asc()).all()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["code", "amount", "is_used", "used_at"])
    for c in codes:
        writer.writerow([c.code, c.amount, c.is_used, c.used_at or ""])

    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=promo_codes.csv"},
    )


# ── User endpoint ─────────────────────────────────────────────────────────────

@router.post("/api/bonuses/redeem", response_model=RedeemResponse)
def redeem_code(
    body: RedeemRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    code_str = body.code.strip().upper()
    promo = db.query(PromoCode).filter(PromoCode.code == code_str).first()

    if not promo:
        raise HTTPException(404, "Код не найден")
    if promo.is_used:
        raise HTTPException(409, "Этот код уже активирован")

    promo.is_used = True
    promo.used_by_user_id = current_user.id
    promo.used_at = datetime.now(timezone.utc)
    current_user.balance += promo.amount

    db.commit()
    db.refresh(current_user)

    return RedeemResponse(amount=promo.amount, new_balance=current_user.balance)
