"""
Симуляция турнира: создаёт матчи, пользователей, ставки, завершает матчи.

Запуск (из backend/):
    python -m tests.simulate_tournament [--base-url http://localhost:8000] [--admin-id 916883940]

Требования:
  - FastAPI запущена и доступна
  - ENVIRONMENT=development (dev-bypass авторизации работает)
  - БД пустая или содержит только реальных пользователей (скрипт не трогает существующих)
"""

import argparse
import random
import sys
import time
from datetime import datetime, timezone, timedelta
from typing import Optional

import httpx

# ── Конфиг симуляции ──────────────────────────────────────────────────────────

FAKE_USERS = [
    {"tg_id": 100_001 + i, "name": name}
    for i, name in enumerate([
        "Алексей Петров",
        "Мария Иванова",
        "Дмитрий Сидоров",
        "Екатерина Козлова",
        "Николай Новиков",
        "Анна Морозова",
        "Сергей Волков",
        "Ольга Соколова",
        "Павел Лебедев",
        "Юлия Зайцева",
        "Иван Кузнецов",
        "Светлана Попова",
        "Андрей Федоров",
        "Татьяна Белова",
        "Роман Михайлов",
    ])
]

MATCHES = [
    {"team1": "Лаптевцы",   "team2": "Медведи",       "odds1": 1.80, "odds2": 2.10},
    {"team1": "Орлы",        "team2": "Тигры",          "odds1": 1.50, "odds2": 2.60},
    {"team1": "Соколы",      "team2": "Барсы",          "odds1": 2.20, "odds2": 1.70},
    {"team1": "Ястребы",     "team2": "Волки",          "odds1": 1.90, "odds2": 1.95},
    {"team1": "Лаптевцы",   "team2": "Орлы",           "odds1": 2.00, "odds2": 1.85},
    {"team1": "Медведи",     "team2": "Соколы",         "odds1": 1.65, "odds2": 2.30},
]


# ── HTTP-клиент ───────────────────────────────────────────────────────────────

class Client:
    def __init__(self, base_url: str):
        self.base = base_url.rstrip("/")
        # trust_env=False — не использовать системный прокси (Throne/etc.)
        self._http = httpx.Client(timeout=15.0, trust_env=False)
        self.token: Optional[str] = None

    def _headers(self) -> dict:
        h = {"Content-Type": "application/json"}
        if self.token:
            h["Authorization"] = f"Bearer {self.token}"
        return h

    def auth(self, tg_id: int) -> dict:
        r = self._http.post(
            f"{self.base}/api/auth/validate",
            json={"init_data": f"dev:{tg_id}"},
            headers={"Content-Type": "application/json"},
        )
        r.raise_for_status()
        data = r.json()
        self.token = data["access_token"]
        return data

    def register(self, name: str) -> dict:
        r = self._http.post(
            f"{self.base}/api/users/register",
            json={"full_name": name},
            headers=self._headers(),
        )
        r.raise_for_status()
        return r.json()

    def me(self) -> dict:
        r = self._http.get(f"{self.base}/api/users/me", headers=self._headers())
        r.raise_for_status()
        return r.json()

    def create_match(self, team1: str, team2: str, odds1: float, odds2: float) -> dict:
        deadline = (datetime.now(timezone.utc) + timedelta(hours=2)).isoformat()
        r = self._http.post(
            f"{self.base}/api/admin/matches",
            json={
                "team1_name": team1,
                "team2_name": team2,
                "odds_team1": odds1,
                "odds_team2": odds2,
                "bet_deadline": deadline,
            },
            headers=self._headers(),
        )
        r.raise_for_status()
        return r.json()

    def place_bet(self, match_id: int, team_choice: int, amount: int) -> dict:
        r = self._http.post(
            f"{self.base}/api/bets/",
            json={"match_id": match_id, "team_choice": team_choice, "amount": amount},
            headers=self._headers(),
        )
        r.raise_for_status()
        return r.json()

    def set_result(self, match_id: int, winner: int) -> dict:
        r = self._http.post(
            f"{self.base}/api/admin/matches/{match_id}/result",
            json={"winner": winner},
            headers=self._headers(),
        )
        r.raise_for_status()
        return r.json()

    def leaderboard(self) -> dict:
        r = self._http.get(f"{self.base}/api/leaderboard/", headers=self._headers())
        r.raise_for_status()
        return r.json()


# ── Helpers ───────────────────────────────────────────────────────────────────

def ok(msg: str) -> None:
    print(f"  ✅ {msg}")

def info(msg: str) -> None:
    print(f"  ℹ️  {msg}")

def section(title: str) -> None:
    print(f"\n{'─' * 55}")
    print(f"  {title}")
    print(f"{'─' * 55}")


# ── Main ──────────────────────────────────────────────────────────────────────

def main(base_url: str, admin_id: int) -> None:
    c = Client(base_url)

    # 1. Проверка сервера
    section("1. Проверка сервера")
    try:
        r = httpx.get(f"{base_url}/health", timeout=5, trust_env=False)
        r.raise_for_status()
        ok(f"Сервер доступен: {base_url}")
    except Exception as e:
        print(f"\n❌ Сервер недоступен: {e}")
        print("   Запустите: python -m uvicorn app.main:app --reload")
        sys.exit(1)

    # 2. Авторизация как admin
    section("2. Авторизация администратора")
    auth_data = c.auth(admin_id)
    if not auth_data.get("is_admin"):
        print(f"❌ tg_id {admin_id} не является администратором.")
        print("   Проверьте ADMIN_IDS в .env")
        sys.exit(1)
    ok(f"Авторизован как админ (tg_id={admin_id})")

    # 3. Создание матчей
    section("3. Создание матчей")
    created_matches = []
    for m in MATCHES:
        match = c.create_match(m["team1"], m["team2"], m["odds1"], m["odds2"])
        created_matches.append(match)
        ok(f'Матч #{match["id"]}: {m["team1"]} vs {m["team2"]} (×{m["odds1"]} / ×{m["odds2"]})')

    # 4. Регистрация фейковых пользователей
    section("4. Регистрация пользователей")
    registered_users = []
    for u in FAKE_USERS:
        auth_data = c.auth(u["tg_id"])
        if auth_data["is_registered"]:
            user = c.me()
            info(f'{u["name"]} уже зарегистрирован (tg_id={u["tg_id"]}, баланс={user["balance"]})')
        else:
            user = c.register(u["name"])
            ok(f'{u["name"]} зарегистрирован (tg_id={u["tg_id"]}, баланс={user["balance"]})')
        registered_users.append({"info": u, "user": user})

    # 5. Ставки
    section("5. Размещение ставок")
    bet_stats = {"placed": 0, "skipped": 0}

    for match in created_matches:
        mid = match["id"]
        t1 = match["team1_name"]
        t2 = match["team2_name"]
        print(f"\n  🏆 Матч #{mid}: {t1} vs {t2}")

        for ru in registered_users:
            u = ru["info"]
            c.auth(u["tg_id"])  # переключаем токен на этого юзера

            # Случайная ставка: 60% участников ставят на каждый матч
            if random.random() > 0.60:
                info(f'  {u["name"]} пропускает матч')
                bet_stats["skipped"] += 1
                continue

            choice = random.choice([1, 2])
            amount = random.randint(1, 10) * 10  # 10, 20, ..., 100 (кратно 10, макс 100)

            try:
                bet = c.place_bet(mid, choice, amount)
                team_name = t1 if choice == 1 else t2
                ok(f'  {u["name"]}: {amount} очков на {team_name} (возможный выигрыш: {bet["potential_win"]})')
                bet_stats["placed"] += 1
            except httpx.HTTPStatusError as e:
                detail = e.response.json().get("detail", e.response.text)
                info(f'  {u["name"]}: ставка отклонена — {detail}')
                bet_stats["skipped"] += 1

    print(f"\n  Итого ставок: {bet_stats['placed']} размещено, {bet_stats['skipped']} пропущено")

    # 6. Завершение матчей (admin)
    section("6. Завершение матчей (выбор победителей)")
    c.auth(admin_id)

    results = []
    for match in created_matches:
        winner = random.choice([1, 2])
        winner_name = match["team1_name"] if winner == 1 else match["team2_name"]
        result = c.set_result(match["id"], winner)
        results.append(result)
        ok(
            f'Матч #{match["id"]}: победил {winner_name} | '
            f'ставок: {result["bets_processed"]}, '
            f'победителей: {result["winners_count"]} (+{result["total_paid_out"]} очков)'
        )
        time.sleep(0.3)  # небольшая пауза чтобы не флудить в фоне

    # 7. Лидерборд
    section("7. Итоговый лидерборд")
    lb = c.leaderboard()
    print(f"\n  {'#':<4} {'Имя':<22} {'Баланс':>8}")
    print(f"  {'─'*4} {'─'*22} {'─'*8}")
    for entry in lb["leaderboard"][:15]:
        medal = {1: "🥇", 2: "🥈", 3: "🥉"}.get(entry["rank"], "  ")
        print(f"  {medal} {entry['rank']:<3} {entry['full_name']:<22} {entry['balance']:>8} очков")

    print(f"\n  Всего участников: {lb['total_players']}")

    section("✅ Симуляция завершена")
    print(f"  Матчей сыграно:  {len(created_matches)}")
    print(f"  Ставок сделано:  {bet_stats['placed']}")
    print(f"  Пользователей:   {len(FAKE_USERS)}")
    print()


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Симуляция турнира")
    parser.add_argument("--base-url", default="http://localhost:8000", help="URL API сервера")
    parser.add_argument("--admin-id", type=int, default=916883940, help="Telegram ID администратора")
    args = parser.parse_args()
    main(args.base_url, args.admin_id)
