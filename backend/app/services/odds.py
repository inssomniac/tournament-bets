"""
Pari-mutuel dynamic odds with anchoring.

When no real bets exist, initial odds are shown exactly as set by the admin.
Once bets arrive, odds shift proportionally using implied-probability seeding.
MARGIN is the bookmaker's edge applied once bets are in play.
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
    For active matches with no bets returns initial odds unchanged.
    For active matches with bets applies pari-mutuel adjustment.
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

    # No real bets yet — show initial odds as-is
    if total1 == 0 and total2 == 0:
        return float(match.initial_odds_team1), float(match.initial_odds_team2)

    # Seed proportional to implied probability of each team
    p1 = 1.0 / float(match.initial_odds_team1)
    p2 = 1.0 / float(match.initial_odds_team2)
    seed1 = SEED * p1
    seed2 = SEED * p2

    eff1 = total1 + seed1
    eff2 = total2 + seed2
    total = eff1 + eff2

    o1 = round((total / eff1) * (1 - MARGIN), 2)
    o2 = round((total / eff2) * (1 - MARGIN), 2)

    o1 = max(1.01, min(10.0, o1))
    o2 = max(1.01, min(10.0, o2))

    return o1, o2
