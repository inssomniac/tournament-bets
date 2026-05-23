"""
Pari-mutuel dynamic odds with anchoring.

SEED virtual pool anchors odds to initial values when real bets are small.
MARGIN is the bookmaker's edge applied uniformly.
"""
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.models.bet import Bet

MARGIN = 0.05
SEED = 500


def compute_dynamic_odds(match, db: Session) -> tuple[float, float]:
    """
    Return (odds1, odds2) for a match.
    For non-active matches returns the stored (frozen) odds.
    """
    if match.status != "active":
        return float(match.odds_team1), float(match.odds_team2)

    row = db.query(
        func.coalesce(
            func.sum(Bet.amount).filter(Bet.team_choice == 1), 0
        ),
        func.coalesce(
            func.sum(Bet.amount).filter(Bet.team_choice == 2), 0
        ),
    ).filter(Bet.match_id == match.id).first()

    total1 = float(row[0])
    total2 = float(row[1])

    seed1 = SEED / float(match.initial_odds_team1)
    seed2 = SEED / float(match.initial_odds_team2)

    eff1 = total1 + seed1
    eff2 = total2 + seed2
    total = eff1 + eff2

    o1 = round((total / eff1) * (1 - MARGIN), 2)
    o2 = round((total / eff2) * (1 - MARGIN), 2)

    o1 = max(1.01, min(10.0, o1))
    o2 = max(1.01, min(10.0, o2))

    return o1, o2
