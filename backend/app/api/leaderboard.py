from typing import List

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.database import get_db
from app.models.user import User

router = APIRouter(prefix="/api/leaderboard", tags=["leaderboard"])


class LeaderboardEntry(BaseModel):
    rank: int
    full_name: str
    balance: int
    is_current_user: bool


class LeaderboardResponse(BaseModel):
    leaderboard: List[LeaderboardEntry]
    current_user_rank: int | None
    total_players: int


@router.get("/", response_model=LeaderboardResponse)
def get_leaderboard(
    limit: int = Query(default=50, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    all_users = db.query(User).order_by(User.balance.desc()).all()
    total = len(all_users)

    current_rank = next(
        (i + 1 for i, u in enumerate(all_users) if u.id == current_user.id),
        None,
    )

    top_users = all_users[:limit]
    leaderboard = [
        LeaderboardEntry(
            rank=i + 1,
            full_name=u.full_name,
            balance=u.balance,
            is_current_user=u.id == current_user.id,
        )
        for i, u in enumerate(top_users)
    ]

    return LeaderboardResponse(
        leaderboard=leaderboard,
        current_user_rank=current_rank,
        total_players=total,
    )
