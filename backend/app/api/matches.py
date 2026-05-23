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
from app.services.odds import compute_dynamic_odds

router = APIRouter(prefix="/api/matches", tags=["matches"])


class BetInfo(BaseModel):
    team_choice: int
    amount: int
    potential_win: int
    status: str
    bets_count: int = 1


class MatchResponse(BaseModel):
    id: int
    team1_name: str
    team2_name: str
    odds_team1: float
    odds_team2: float
    initial_odds_team1: float
    initial_odds_team2: float
    bet_deadline: Optional[datetime] = None
    status: str
    winner: Optional[int] = None
    user_bet: Optional[BetInfo] = None
    is_deadline_passed: bool

    model_config = ConfigDict(from_attributes=True)


def _aggregate_bets(bets: list) -> Optional[BetInfo]:
    """Aggregate multiple bets on same match/team into a single BetInfo."""
    if not bets:
        return None
    return BetInfo(
        team_choice=bets[0].team_choice,
        amount=sum(b.amount for b in bets),
        potential_win=sum(b.potential_win for b in bets),
        status=bets[0].status,
        bets_count=len(bets),
    )


def build_match_response(match: Match, bets: list, db: Session) -> MatchResponse:
    is_closed = match.status in ("live", "finished")

    # For active matches return live dynamic odds; otherwise stored (frozen) odds
    dyn_odds1, dyn_odds2 = compute_dynamic_odds(match, db)

    return MatchResponse(
        id=match.id,
        team1_name=match.team1_name,
        team2_name=match.team2_name,
        odds_team1=dyn_odds1,
        odds_team2=dyn_odds2,
        initial_odds_team1=float(match.initial_odds_team1),
        initial_odds_team2=float(match.initial_odds_team2),
        bet_deadline=match.bet_deadline,
        status=match.status,
        winner=match.winner,
        user_bet=_aggregate_bets(bets),
        is_deadline_passed=is_closed,
    )


@router.get("/", response_model=List[MatchResponse])
def list_matches(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    matches = (
        db.query(Match)
        .order_by(Match.created_at.desc())
        .all()
    )

    result = []
    for match in matches:
        bets = db.query(Bet).filter(
            Bet.user_id == current_user.id,
            Bet.match_id == match.id,
        ).all()
        result.append(build_match_response(match, bets, db))
    return result


@router.get("/history", response_model=List[MatchResponse])
def list_history(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Completed matches the user has bet on."""
    all_bets = db.query(Bet).filter(Bet.user_id == current_user.id).all()
    match_ids = {b.match_id for b in all_bets}

    matches = (
        db.query(Match)
        .filter(Match.status == "finished", Match.id.in_(match_ids))
        .order_by(Match.created_at.desc())
        .all()
    )

    bets_by_match: dict = {}
    for b in all_bets:
        bets_by_match.setdefault(b.match_id, []).append(b)

    return [build_match_response(m, bets_by_match.get(m.id, []), db) for m in matches]


@router.get("/{match_id}", response_model=MatchResponse)
def get_match(
    match_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    match = db.query(Match).filter(Match.id == match_id).first()
    if not match:
        raise HTTPException(status_code=404, detail="\u041c\u0430\u0442\u0447 \u043d\u0435 \u043d\u0430\u0439\u0434\u0435\u043d")

    bets = db.query(Bet).filter(
        Bet.user_id == current_user.id,
        Bet.match_id == match_id,
    ).all()
    return build_match_response(match, bets, db)
