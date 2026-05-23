from typing import List

from fastapi import APIRouter, Depends
from pydantic import BaseModel, ConfigDict
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.bet import Bet
from app.models.match import Match
from app.services.odds import compute_dynamic_odds

router = APIRouter(prefix="/public", tags=["public"])


class PublicMatchResponse(BaseModel):
    id: int
    team1_name: str
    team2_name: str
    odds_team1: float
    odds_team2: float
    status: str
    total_bets: int
    bets_count: int

    model_config = ConfigDict(from_attributes=True)


@router.get("/odds", response_model=List[PublicMatchResponse])
def public_odds(db: Session = Depends(get_db)):
    """Public endpoint — no auth required. Returns active and live matches with current odds."""
    matches = (
        db.query(Match)
        .filter(Match.status.in_(["active", "live"]))
        .order_by(Match.created_at.asc())
        .all()
    )

    result = []
    for match in matches:
        agg = db.query(
            func.count(Bet.id),
            func.coalesce(func.sum(Bet.amount), 0),
        ).filter(Bet.match_id == match.id).first()

        bets_count = agg[0]
        total_bets = int(agg[1])

        odds1, odds2 = compute_dynamic_odds(match, db)

        result.append(PublicMatchResponse(
            id=match.id,
            team1_name=match.team1_name,
            team2_name=match.team2_name,
            odds_team1=odds1,
            odds_team2=odds2,
            status=match.status,
            total_bets=total_bets,
            bets_count=bets_count,
        ))

    return result
