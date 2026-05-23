from datetime import datetime, timezone
from typing import List

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, ConfigDict
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.database import get_db
from app.models.bet import Bet
from app.models.match import Match
from app.models.user import User
from app.services.odds import compute_dynamic_odds

router = APIRouter(prefix="/api/bets", tags=["bets"])


class BetRequest(BaseModel):
    match_id: int
    team_choice: int  # 1 | 2
    amount: int


class BetResponse(BaseModel):
    id: int
    match_id: int
    team_choice: int
    amount: int
    potential_win: int
    status: str
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)


class BetHistoryItem(BaseModel):
    id: int
    match_id: int
    team1_name: str
    team2_name: str
    team_choice: int
    amount: int
    potential_win: int
    status: str
    created_at: datetime


@router.post("/", response_model=BetResponse, status_code=201)
def place_bet(
    body: BetRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # Найти матч
    match = db.query(Match).filter(Match.id == body.match_id).first()
    if not match:
        raise HTTPException(404, "Матч не найден")

    # Ставки принимаются только пока матч в статусе active
    if match.status != "active":
        raise HTTPException(400, "Приём ставок закрыт")

    # Валидация team_choice
    if body.team_choice not in (1, 2):
        raise HTTPException(400, "team_choice должен быть 1 или 2")

    # Валидация суммы
    if body.amount < 50:
        raise HTTPException(400, "Минимальная ставка — 50 очков")

    # Баланс
    if current_user.balance < body.amount:
        raise HTTPException(400, "Недостаточно очков на балансе")

    # Проверка: нельзя ставить на другую команду (на ту же — разрешено, это додеп)
    existing = db.query(Bet).filter(
        Bet.user_id == current_user.id,
        Bet.match_id == body.match_id,
    ).first()
    if existing and existing.team_choice != body.team_choice:
        raise HTTPException(409, "Нельзя ставить на другую команду — вы уже поставили на эту")

    # Рассчитать выигрыш по актуальному динамическому коэфу
    dyn_odds1, dyn_odds2 = compute_dynamic_odds(match, db)
    odds = dyn_odds1 if body.team_choice == 1 else dyn_odds2
    potential_win = int(body.amount * odds)

    # Атомарно: списать баланс + создать ставку
    current_user.balance -= body.amount
    bet = Bet(
        user_id=current_user.id,
        match_id=body.match_id,
        team_choice=body.team_choice,
        amount=body.amount,
        potential_win=potential_win,
        status="pending",
    )
    db.add(bet)
    db.commit()
    db.refresh(bet)
    return bet


@router.get("/my", response_model=List[BetHistoryItem])
def my_bets(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    bets = (
        db.query(Bet)
        .filter(Bet.user_id == current_user.id)
        .order_by(Bet.created_at.desc())
        .all()
    )
    result = []
    for bet in bets:
        # Защита от осиротевших ставок: если матч был удалён, пропускаем
        if bet.match is None:
            continue
        result.append(BetHistoryItem(
            id=bet.id,
            match_id=bet.match_id,
            team1_name=bet.match.team1_name,
            team2_name=bet.match.team2_name,
            team_choice=bet.team_choice,
            amount=bet.amount,
            potential_win=bet.potential_win,
            status=bet.status,
            created_at=bet.created_at,
        ))
    return result
