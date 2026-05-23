from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.auth import router as auth_router
from app.api.users import router as users_router
from app.api.matches import router as matches_router
from app.api.bets import router as bets_router
from app.api.leaderboard import router as leaderboard_router
from app.api.bonuses import router as bonuses_router
from app.api.admin import router as admin_router
from app.api.promo import router as promo_router
from app.api.public import router as public_router

app = FastAPI(title="Tournament Bets API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # в проде заменить на конкретный домен
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(users_router)
app.include_router(matches_router)
app.include_router(bets_router)
app.include_router(leaderboard_router)
app.include_router(bonuses_router)
app.include_router(admin_router)
app.include_router(promo_router)
app.include_router(public_router)


@app.get("/health")
def health():
    return {"status": "ok"}
