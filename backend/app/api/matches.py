from datetime import datetime, timezone
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, ConfigDict
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.database import get_db
from app.models.bet import Bet
from app.models.match import Match
from app.models.user import User

router = APIRouter(prefix="/api/matches", tags=["matches"])


class BetInfo(BaseModel):
    team_choice: int
    amount: int
    potential_win: int
    status: str


class MatchResponse(BaseModel):
    id: int
    team1_name: str
    team2_name: str
    odds_team1: float
    odds_team2: float
    bet_deadline: Optional[datetime] = None
    status: str
    winner: Optional[int] = None
    user_bet: Optional[BetInfo] = None
    is_deadline_passed: bool

    model_config = ConfigDict(from_attributes=True)


def build_match_response(match: Match, bet: Optional[Bet]) -> MatchResponse:
    # Bets are closed when match is live or finished — not by deadline clock.
    # Deadline is informational only.
    is_closed = match.status in ("live", "finished")

    bet_info = None
    if bet:
        bet_info = BetInfo(
            team_choice=bet.team_choice,
            amount=bet.amount,
            potential_win=bet.potential_win,
            status=bet.status,
        )

    return MatchResponse(
        id=match.id,
        team1_name=match.team1_name,
        team2_name=match.team2_name,
        odds_team1=float(match.odds_team1),
        odds_team2=float(match.odds_team2),
        bet_deadline=match.bet_deadline,
        status=match.status,
        winner=match.winner,
        user_bet=bet_info,
        is_deadline_passed=is_closed,
    )


@router.get("/", response_model=List[MatchResponse])
def list_matches(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    matches = (
        db.query(Match)
        .filter(Match.status != "finished")
        .order_by(Match.created_at.desc())
        .all()
    )

    result = []
    for match in matches:
        bet = db.query(Bet).filter(
            Bet.user_id == current_user.id,
            Bet.match_id == match.id,
        ).first()
        result.append(build_match_response(match, bet))
    return result


@router.get("/history", response_model=List[MatchResponse])
def list_history(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Завершённые матчи на которые пользователь делал ставки."""
    bets = db.query(Bet).filter(Bet.user_id == current_user.id).all()
    match_ids = {b.match_id for b in bets}

    matches = (
        db.query(Match)
        .filter(Match.status == "finished", Match.id.in_(match_ids))
        .order_by(Match.created_at.desc())
        .all()
    )

    bet_by_match = {b.match_id: b for b in bets}
    return [build_match_response(m, bet_by_match.get(m.id)) for m in matches]


@router.get("/{match_id}", response_model=MatchResponse)
def get_match(
    match_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    match = db.query(Match).filter(Match.id == match_id).first()
    if not match:
        raise HTTPException(status_code=404, detail="Матч не найден")

    bet = db.query(Bet).filter(
        Bet.user_id == current_user.id,
        Bet.match_id == match_id,
    ).first()
    return build_match_response(match, bet)
