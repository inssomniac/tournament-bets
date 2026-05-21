# Spec 02 — Database Models & Migrations

## Цель

Определить SQLAlchemy модели, настроить Alembic, создать первую миграцию.
После этого спека: таблицы существуют в postgres, можно делать запросы.

## Модели

### `backend/app/models/user.py`

```python
from sqlalchemy import BigInteger, Integer, String, DateTime, func
from sqlalchemy.orm import Mapped, mapped_column
from app.core.database import Base

class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    telegram_id: Mapped[int] = mapped_column(BigInteger, unique=True, nullable=False)
    full_name: Mapped[str] = mapped_column(String(255), nullable=False)
    balance: Mapped[int] = mapped_column(Integer, nullable=False, default=1100)
    registered_at: Mapped[DateTime] = mapped_column(DateTime, server_default=func.now())
```

**Примечания:**
- `balance` стартует с 1100 (1000 + 100 стартовый бонус) — начисляется при регистрации
- `telegram_id` — BigInteger, Telegram IDs бывают > 2^31

### `backend/app/models/match.py`

```python
from sqlalchemy import Integer, String, Numeric, DateTime, SmallInteger, func
from sqlalchemy.orm import Mapped, mapped_column
from app.core.database import Base

class Match(Base):
    __tablename__ = "matches"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    team1_name: Mapped[str] = mapped_column(String(100), nullable=False)
    team2_name: Mapped[str] = mapped_column(String(100), nullable=False)
    odds_team1: Mapped[float] = mapped_column(Numeric(4, 2), nullable=False)
    odds_team2: Mapped[float] = mapped_column(Numeric(4, 2), nullable=False)
    bet_deadline: Mapped[DateTime] = mapped_column(DateTime, nullable=False)
    status: Mapped[str] = mapped_column(
        String(20), nullable=False, default="upcoming"
    )
    # upcoming | active | finished
    winner: Mapped[int | None] = mapped_column(SmallInteger, nullable=True)
    # NULL = ещё нет результата, 1 = победа team1, 2 = победа team2
    created_at: Mapped[DateTime] = mapped_column(DateTime, server_default=func.now())
```

**Статусы матча:**
- `upcoming` — ставки ещё не открыты (создан, но до дедлайна далеко)
- `active` — ставки принимаются (до bet_deadline)
- `finished` — результат введён, ставки закрыты

**Примечание:** В MVP статус `upcoming` и `active` можно считать одинаковыми — ставки открыты если `status != 'finished'` и `bet_deadline > now()`.

### `backend/app/models/bet.py`

```python
from sqlalchemy import Integer, SmallInteger, DateTime, ForeignKey, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base

class Bet(Base):
    __tablename__ = "bets"
    __table_args__ = (
        UniqueConstraint("user_id", "match_id", name="uq_user_match"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), nullable=False)
    match_id: Mapped[int] = mapped_column(Integer, ForeignKey("matches.id"), nullable=False)
    team_choice: Mapped[int] = mapped_column(SmallInteger, nullable=False)  # 1 | 2
    amount: Mapped[int] = mapped_column(Integer, nullable=False)
    potential_win: Mapped[int] = mapped_column(Integer, nullable=False)
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="pending")
    # pending | won | lost
    created_at: Mapped[DateTime] = mapped_column(DateTime, server_default=func.now())

    user = relationship("User", backref="bets")
    match = relationship("Match", backref="bets")
```

**Расчёт potential_win:**
```python
# При создании ставки:
odds = match.odds_team1 if team_choice == 1 else match.odds_team2
potential_win = int(amount * float(odds))
```

**Важно:** UniqueConstraint на (user_id, match_id) — защита на уровне БД от двойной ставки.

### `backend/app/models/bonus_channel.py`

```python
from sqlalchemy import Integer, BigInteger, String, DateTime, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column
from app.core.database import Base

class BonusChannel(Base):
    __tablename__ = "bonus_channels"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    channel_id: Mapped[int] = mapped_column(BigInteger, unique=True, nullable=False)
    channel_name: Mapped[str] = mapped_column(String(100), nullable=False)
    channel_url: Mapped[str] = mapped_column(String(255), nullable=False)
    bonus_points: Mapped[int] = mapped_column(Integer, nullable=False, default=50)


class UserChannelBonus(Base):
    __tablename__ = "user_channel_bonuses"

    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), primary_key=True)
    channel_id: Mapped[int] = mapped_column(Integer, ForeignKey("bonus_channels.id"), primary_key=True)
    claimed_at: Mapped[DateTime] = mapped_column(DateTime, server_default=func.now())
```

### `backend/app/models/__init__.py`

```python
from app.models.user import User
from app.models.match import Match
from app.models.bet import Bet
from app.models.bonus_channel import BonusChannel, UserChannelBonus
```

## Alembic

### Настройка `backend/alembic/env.py`

```python
from logging.config import fileConfig
from sqlalchemy import engine_from_config, pool
from alembic import context
from app.core.database import Base
from app.core.config import settings
import app.models  # noqa — импорт всех моделей для autogenerate

config = context.config
config.set_main_option("sqlalchemy.url", settings.DATABASE_URL)

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

target_metadata = Base.metadata

def run_migrations_offline():
    url = config.get_main_option("sqlalchemy.url")
    context.configure(url=url, target_metadata=target_metadata, literal_binds=True)
    with context.begin_transaction():
        context.run_migrations()

def run_migrations_online():
    connectable = engine_from_config(
        config.get_section(config.config_ini_section),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )
    with connectable.connect() as connection:
        context.configure(connection=connection, target_metadata=target_metadata)
        with context.begin_transaction():
            context.run_migrations()

if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
```

### Команды

```bash
# Инициализация (один раз)
cd backend
alembic init alembic

# Создать первую миграцию
alembic revision --autogenerate -m "initial schema"

# Применить
alembic upgrade head

# Откатить
alembic downgrade -1
```

## Начальные данные (seed)

После первой миграции добавить бонусные каналы вручную через seed-скрипт:

```python
# backend/seed.py
from app.core.database import SessionLocal
from app.models.bonus_channel import BonusChannel

def seed():
    db = SessionLocal()
    channels = [
        BonusChannel(
            channel_id=-1001234567890,  # заменить на реальный ID
            channel_name="СЛАВДА",
            channel_url="https://t.me/slavda",
            bonus_points=50
        ),
        # добавить остальные после уточнения у заказчика
    ]
    db.add_all(channels)
    db.commit()
    db.close()

if __name__ == "__main__":
    seed()
```

**Как узнать channel_id канала:**
Переслать любое сообщение из канала боту `@username_to_id_bot` или использовать Telegram API.

## Definition of Done

- [ ] Все 5 таблиц созданы в postgres после `alembic upgrade head`
- [ ] `UniqueConstraint` на `bets(user_id, match_id)` проверяется: двойная вставка даёт ошибку
- [ ] Импорт всех моделей не даёт ошибок
