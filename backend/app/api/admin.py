from datetime import datetime, timezone
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from pydantic import BaseModel, ConfigDict, field_validator
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.api.deps import get_current_admin
from app.core.database import get_db
from app.models.bet import Bet
from app.models.match import Match
from app.models.user import User
from app.services.notifications import send_result_notification

router = APIRouter(prefix="/api/admin", tags=["admin"])


# ── Schemas ──────────────────────────────────────────────────────────────────

class MatchCreate(BaseModel):
    team1_name: str
    team2_name: str
    odds_team1: float
    odds_team2: float
    bet_deadline: Optional[datetime] = None  # informational only; bets close on go_live

    @field_validator("team1_name", "team2_name")
    @classmethod
    def not_empty(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Название команды не может быть пустым")
        return v.strip()

    @field_validator("odds_team1", "odds_team2")
    @classmethod
    def valid_odds(cls, v: float) -> float:
        if not (1.01 <= v <= 10.0):
            raise ValueError("Коэффициент должен быть от 1.01 до 10.0")
        return round(v, 2)


class MatchUpdate(BaseModel):
    team1_name: Optional[str] = None
    team2_name: Optional[str] = None
    odds_team1: Optional[float] = None
    odds_team2: Optional[float] = None
    bet_deadline: Optional[datetime] = None


class MatchAdminResponse(BaseModel):
    id: int
    team1_name: str
    team2_name: str
    odds_team1: float
    odds_team2: float
    bet_deadline: Optional[datetime] = None
    status: str
    winner: Optional[int] = None
    bets_count: int
    total_bet_amount: int
    model_config = ConfigDict(from_attributes=True)


class ResultRequest(BaseModel):
    winner: int

    @field_validator("winner")
    @classmethod
    def valid_winner(cls, v: int) -> int:
        if v not in (1, 2):
            raise ValueError("winner должен быть 1 или 2")
        return v


class ResultResponse(BaseModel):
    match_id: int
    winner: int
    bets_processed: int
    winners_count: int
    losers_count: int
    total_paid_out: int


class UserAdminResponse(BaseModel):
    id: int
    telegram_id: int
    full_name: str
    balance: int
    bets_count: int
    registered_at: datetime
    model_config = ConfigDict(from_attributes=True)


class StatsResponse(BaseModel):
    total_users: int
    total_bets: int
    active_matches: int
    finished_matches: int


# ── Helpers ───────────────────────────────────────────────────────────────────

def _match_response(match: Match, db: Session) -> MatchAdminResponse:
    agg = db.query(
        func.count(Bet.id),
        func.coalesce(func.sum(Bet.amount), 0),
    ).filter(Bet.match_id == match.id).first()
    return MatchAdminResponse(
        id=match.id,
        team1_name=match.team1_name,
        team2_name=match.team2_name,
        odds_team1=float(match.odds_team1),
        odds_team2=float(match.odds_team2),
        bet_deadline=match.bet_deadline,
        status=match.status,
        winner=match.winner,
        bets_count=agg[0],
        total_bet_amount=agg[1],
    )


# ── Matches ───────────────────────────────────────────────────────────────────

@router.get("/matches", response_model=List[MatchAdminResponse])
def list_matches(
    _: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    matches = db.query(Match).order_by(Match.created_at.desc()).all()
    return [_match_response(m, db) for m in matches]


@router.post("/matches", response_model=MatchAdminResponse, status_code=201)
def create_match(
    body: MatchCreate,
    _: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    match = Match(
        team1_name=body.team1_name,
        team2_name=body.team2_name,
        odds_team1=body.odds_team1,
        odds_team2=body.odds_team2,
        bet_deadline=body.bet_deadline,
        status="active",
    )
    db.add(match)
    db.commit()
    db.refresh(match)
    return _match_response(match, db)


@router.put("/matches/{match_id}", response_model=MatchAdminResponse)
def update_match(
    match_id: int,
    body: MatchUpdate,
    _: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    match = db.query(Match).filter(Match.id == match_id).first()
    if not match:
        raise HTTPException(404, "Матч не найден")
    if match.status == "finished":
        raise HTTPException(400, "Нельзя редактировать завершённый матч")
    if match.status == "live":
        raise HTTPException(400, "Матч идёт — редактирование недоступно")

    if body.team1_name is not None:
        match.team1_name = body.team1_name.strip()
    if body.team2_name is not None:
        match.team2_name = body.team2_name.strip()
    if body.odds_team1 is not None:
        match.odds_team1 = body.odds_team1
    if body.odds_team2 is not None:
        match.odds_team2 = body.odds_team2
    if body.bet_deadline is not None:
        match.bet_deadline = body.bet_deadline

    db.commit()
    db.refresh(match)
    return _match_response(match, db)


@router.post("/matches/{match_id}/go_live", response_model=MatchAdminResponse)
def go_live(
    match_id: int,
    _: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """Закрыть приём ставок и перевести матч в статус 'идёт'."""
    match = db.query(Match).filter(Match.id == match_id).first()
    if not match:
        raise HTTPException(404, "Матч не найден")
    if match.status != "active":
        raise HTTPException(400, f"Нельзя начать матч со статусом '{match.status}'")

    match.status = "live"
    db.commit()
    db.refresh(match)
    return _match_response(match, db)


@router.delete("/matches/{match_id}", status_code=204)
def delete_match(
    match_id: int,
    _: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    match = db.query(Match).filter(Match.id == match_id).first()
    if not match:
        raise HTTPException(404, "Матч не найден")
    if match.status == "live":
        raise HTTPException(400, "Нельзя удалить матч во время игры")
    # Удаляем связанные ставки, затем матч
    db.query(Bet).filter(Bet.match_id == match_id).delete()
    db.delete(match)
    db.commit()


@router.post("/matches/{match_id}/result", response_model=ResultResponse)
async def set_result(
    match_id: int,
    body: ResultRequest,
    background_tasks: BackgroundTasks,
    _: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    match = db.query(Match).filter(Match.id == match_id).first()
    if not match:
        raise HTTPException(404, "Матч не найден")
    if match.status == "finished":
        raise HTTPException(400, "Матч уже завершён")
    if match.status == "active":
        raise HTTPException(400, "Сначала начните матч (статус → идёт)")

    bets = db.query(Bet).filter(
        Bet.match_id == match_id,
        Bet.status == "pending",
    ).all()

    winners_count = 0
    losers_count = 0
    total_paid_out = 0
    notifications = []

    match_title = f"{match.team1_name} vs {match.team2_name}"

    for bet in bets:
        user = bet.user
        if bet.team_choice == body.winner:
            bet.status = "won"
            user.balance += bet.potential_win
            winners_count += 1
            total_paid_out += bet.potential_win
            notifications.append(dict(
                telegram_id=user.telegram_id,
                match_title=match_title,
                team_name=match.team1_name if body.winner == 1 else match.team2_name,
                won=True,
                amount=bet.potential_win,
                new_balance=user.balance,
            ))
        else:
            bet.status = "lost"
            losers_count += 1
            notifications.append(dict(
                telegram_id=user.telegram_id,
                match_title=match_title,
                team_name=match.team1_name if bet.team_choice == 1 else match.team2_name,
                won=False,
                amount=bet.amount,
                new_balance=user.balance,
            ))

    match.status = "finished"
    match.winner = body.winner
    db.commit()

    for n in notifications:
        background_tasks.add_task(send_result_notification, **n)

    return ResultResponse(
        match_id=match_id,
        winner=body.winner,
        bets_processed=len(bets),
        winners_count=winners_count,
        losers_count=losers_count,
        total_paid_out=total_paid_out,
    )


# ── Users ─────────────────────────────────────────────────────────────────────

@router.get("/users", response_model=List[UserAdminResponse])
def list_users(
    _: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    users = db.query(User).order_by(User.balance.desc()).all()
    result = []
    for u in users:
        bets_count = db.query(func.count(Bet.id)).filter(Bet.user_id == u.id).scalar()
        result.append(UserAdminResponse(
            id=u.id,
            telegram_id=u.telegram_id,
            full_name=u.full_name,
            balance=u.balance,
            bets_count=bets_count,
            registered_at=u.registered_at,
        ))
    return result


# ── Stats ─────────────────────────────────────────────────────────────────────

@router.get("/stats", response_model=StatsResponse)
def get_stats(
    _: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    return StatsResponse(
        total_users=db.query(func.count(User.id)).scalar(),
        total_bets=db.query(func.count(Bet.id)).scalar(),
        active_matches=db.query(func.count(Match.id)).filter(Match.status == "active").scalar(),
        finished_matches=db.query(func.count(Match.id)).filter(Match.status == "finished").scalar(),
    )
