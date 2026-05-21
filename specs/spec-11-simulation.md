# Spec 11 — Tournament Simulation

## Цель

Скрипт эмулирует полный турнир: создаёт пользователей, делает ставки, завершает матчи.
Используется для:
- Проверки корректности бизнес-логики
- Нагрузочного тестирования (100 пользователей)
- Демонстрации заказчику

## Файл

`backend/tests/simulate_tournament.py`

## Зависимости

Скрипт работает напрямую с БД через SQLAlchemy (не через HTTP).
Это быстрее и позволяет проверить логику без запущенного сервера.

```python
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy.orm import Session
from app.core.database import SessionLocal, engine
from app.models import *  # все модели
from app.core.database import Base
import random
from decimal import Decimal
from datetime import datetime, timedelta, timezone
```

## Структура скрипта

```python
def run_simulation(
    num_users: int = 100,
    num_matches: int = 10,
    verbose: bool = True,
):
    db = SessionLocal()
    try:
        setup_database(db)
        users = create_users(db, num_users, verbose)
        matches = create_matches(db, num_matches, verbose)
        place_bets(db, users, matches, verbose)
        finish_matches(db, matches, verbose)
        verify_results(db, users, matches, verbose)
    finally:
        db.close()
```

---

## Шаги симуляции

### 1. setup_database

Очищает тестовые данные (опционально) и создаёт бонусные каналы если их нет.

```python
def setup_database(db: Session):
    # Очистить старые тестовые данные
    db.query(UserChannelBonus).delete()
    db.query(Bet).delete()
    db.query(Match).delete()
    db.query(User).delete()
    db.commit()
    print("✅ База очищена")
```

### 2. create_users

```python
FIRST_NAMES = ["Иван", "Пётр", "Сергей", "Андрей", "Алексей",
               "Михаил", "Дмитрий", "Николай", "Артём", "Владимир"]
LAST_NAMES  = ["Иванов", "Петров", "Сидоров", "Козлов", "Новиков",
               "Морозов", "Волков", "Соколов", "Попов", "Лебедев"]

def create_users(db: Session, n: int, verbose: bool) -> list[User]:
    users = []
    for i in range(n):
        user = User(
            telegram_id=1000000 + i,       # фейковые ID
            full_name=f"{random.choice(LAST_NAMES)} {random.choice(FIRST_NAMES)} {random.choice(FIRST_NAMES)}",
            balance=1100,
        )
        db.add(user)
        users.append(user)
    db.commit()
    if verbose:
        print(f"✅ Создано {n} пользователей")
    return users
```

### 3. create_matches

```python
TEAMS = [
    "Лаптевцы", "Медведи", "Соколы", "Барсы",
    "Орлы", "Тигры", "Рыси", "Волки", "Буйволы", "Кречеты",
]

def create_matches(db: Session, n: int, verbose: bool) -> list[Match]:
    matches = []
    team_pairs = list(zip(TEAMS[::2], TEAMS[1::2]))[:n]  # попарно

    for i, (team1, team2) in enumerate(team_pairs):
        # Коэффициенты: сумма не обязательно = 1/p (как в реальных букмекерах)
        odds1 = round(random.uniform(1.3, 2.5), 2)
        odds2 = round(random.uniform(1.3, 2.5), 2)

        match = Match(
            team1_name=team1,
            team2_name=team2,
            odds_team1=Decimal(str(odds1)),
            odds_team2=Decimal(str(odds2)),
            # Дедлайны в прошлом чтобы симулировать завершённые матчи
            bet_deadline=datetime.now(timezone.utc) - timedelta(hours=i+1),
            status="active",
        )
        db.add(match)
        matches.append(match)

    db.commit()
    if verbose:
        print(f"✅ Создано {n} матчей")
    return matches
```

### 4. place_bets

```python
def place_bets(db: Session, users: list[User], matches: list[Match], verbose: bool):
    bet_count = 0
    skip_count = 0

    for user in users:
        # Каждый пользователь ставит на случайное подмножество матчей (60-100%)
        selected_matches = random.sample(matches, k=random.randint(
            int(len(matches) * 0.6), len(matches)
        ))

        for match in selected_matches:
            team_choice = random.choice([1, 2])
            amount = random.randint(1, 5) * 50  # 50, 100, 150, 200, 250
            amount = min(amount, 500, user.balance)  # не больше баланса и лимита

            if amount < 10:
                skip_count += 1
                continue

            odds = float(match.odds_team1 if team_choice == 1 else match.odds_team2)
            potential_win = int(amount * odds)

            bet = Bet(
                user_id=user.id,
                match_id=match.id,
                team_choice=team_choice,
                amount=amount,
                potential_win=potential_win,
                status="pending",
            )
            user.balance -= amount
            db.add(bet)
            bet_count += 1

    db.commit()
    if verbose:
        print(f"✅ Сделано {bet_count} ставок (пропущено {skip_count} из-за баланса)")
```

### 5. finish_matches

```python
def finish_matches(db: Session, matches: list[Match], verbose: bool):
    for match in matches:
        winner = random.choice([1, 2])
        match.status = "finished"
        match.winner = winner

        # Пересчитать ставки (та же логика что в spec-07)
        bets = db.query(Bet).filter(
            Bet.match_id == match.id,
            Bet.status == "pending"
        ).all()

        for bet in bets:
            if bet.team_choice == winner:
                bet.status = "won"
                bet.user.balance += bet.potential_win
            else:
                bet.status = "lost"

        if verbose:
            winners = sum(1 for b in bets if b.status == "won")
            print(f"  Матч {match.team1_name} vs {match.team2_name}: "
                  f"победила {'команда 1' if winner == 1 else 'команда 2'}, "
                  f"{winners}/{len(bets)} ставок выиграло")

    db.commit()
    print("✅ Все матчи завершены")
```

### 6. verify_results

Проверяет инварианты после симуляции. **Если что-то не так — выводит ошибку.**

```python
def verify_results(db: Session, users: list[User], matches: list[Match], verbose: bool):
    errors = []

    # 1. Нет pending ставок после завершения всех матчей
    pending = db.query(Bet).filter(Bet.status == "pending").count()
    if pending > 0:
        errors.append(f"❌ Остались {pending} pending ставок после завершения всех матчей")

    # 2. Ни у кого нет отрицательного баланса
    negative = db.query(User).filter(User.balance < 0).all()
    if negative:
        errors.append(f"❌ {len(negative)} пользователей с отрицательным балансом")

    # 3. Нет дублей ставок (user_id + match_id уникальны)
    from sqlalchemy import func
    dupes = (
        db.query(Bet.user_id, Bet.match_id, func.count())
        .group_by(Bet.user_id, Bet.match_id)
        .having(func.count() > 1)
        .all()
    )
    if dupes:
        errors.append(f"❌ Найдено {len(dupes)} дублей ставок")

    # 4. Статистика
    total_bets = db.query(Bet).count()
    won_bets = db.query(Bet).filter(Bet.status == "won").count()
    total_balance = db.query(func.sum(User.balance)).scalar()

    print("\n📊 Итоги симуляции:")
    print(f"   Пользователей: {len(users)}")
    print(f"   Матчей:        {len(matches)}")
    print(f"   Ставок:        {total_bets}")
    print(f"   Выигравших:    {won_bets} ({won_bets/total_bets*100:.1f}%)")
    print(f"   Суммарный баланс всех: {total_balance} очков")
    print(f"   Средний баланс:  {total_balance / len(users):.0f} очков")

    # Топ-5 лидерборда
    top5 = db.query(User).order_by(User.balance.desc()).limit(5).all()
    print("\n🏆 Топ-5:")
    for i, u in enumerate(top5, 1):
        print(f"   {i}. {u.full_name}: {u.balance} очков")

    if errors:
        print("\n⛔ Ошибки верификации:")
        for e in errors:
            print(f"   {e}")
        sys.exit(1)
    else:
        print("\n✅ Верификация пройдена — логика корректна")
```

---

## Запуск

```bash
cd backend

# Базовый запуск (100 юзеров, 10 матчей)
python tests/simulate_tournament.py

# С параметрами
python tests/simulate_tournament.py --users 50 --matches 5

# Тихий режим (только итоги)
python tests/simulate_tournament.py --quiet
```

```python
# В конце файла
if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument("--users", type=int, default=100)
    parser.add_argument("--matches", type=int, default=10)
    parser.add_argument("--quiet", action="store_true")
    args = parser.parse_args()

    run_simulation(
        num_users=args.users,
        num_matches=args.matches,
        verbose=not args.quiet,
    )
```

## Definition of Done

- [ ] Скрипт запускается без ошибок на чистой БД
- [ ] После симуляции нет pending ставок
- [ ] Нет отрицательных балансов
- [ ] Нет дублей ставок
- [ ] Верификация выводит корректную статистику
- [ ] Выход с кодом 1 если верификация не прошла (для CI)
