# Architecture: Tournament Bets TWA

## Структура репозитория

```
tournament-bets/
├── backend/                  # FastAPI приложение
│   ├── app/
│   │   ├── api/              # роутеры
│   │   │   ├── auth.py
│   │   │   ├── users.py
│   │   │   ├── matches.py
│   │   │   ├── bets.py
│   │   │   ├── bonuses.py
│   │   │   ├── leaderboard.py
│   │   │   └── admin.py
│   │   ├── models/           # SQLAlchemy модели
│   │   ├── schemas/          # Pydantic схемы
│   │   ├── services/         # бизнес-логика
│   │   ├── core/
│   │   │   ├── config.py     # настройки из .env
│   │   │   ├── security.py   # JWT + Telegram initData validation
│   │   │   └── database.py   # SQLAlchemy engine + session
│   │   └── main.py
│   ├── alembic/              # миграции БД
│   ├── tests/
│   │   └── simulate_tournament.py
│   ├── Dockerfile
│   └── requirements.txt
│
├── frontend/                 # React (TWA + Админка)
│   ├── src/
│   │   ├── pages/
│   │   │   ├── twa/          # TWA экраны
│   │   │   │   ├── Registration.tsx
│   │   │   │   ├── Home.tsx
│   │   │   │   ├── Matches.tsx
│   │   │   │   ├── BetFlow.tsx
│   │   │   │   ├── Balance.tsx
│   │   │   │   ├── Bonuses.tsx
│   │   │   │   └── Leaderboard.tsx
│   │   │   └── admin/        # Админ-панель
│   │   │       ├── AdminLogin.tsx
│   │   │       ├── Dashboard.tsx
│   │   │       ├── MatchEditor.tsx
│   │   │       └── MatchResult.tsx
│   │   ├── api/              # axios клиент + хуки
│   │   ├── store/            # состояние (zustand или context)
│   │   └── main.tsx
│   ├── Dockerfile
│   └── vite.config.ts
│
├── bot/                      # Telegram Bot (aiogram 3.x)
│   ├── handlers/
│   │   ├── start.py          # /start, проверка подписки
│   │   └── notifications.py  # рассылка результатов
│   ├── Dockerfile
│   └── requirements.txt
│
├── nginx/
│   ├── nginx.conf            # prod конфиг
│   └── nginx.dev.conf        # dev конфиг (для ngrok)
│
├── docker-compose.yml        # prod
├── docker-compose.dev.yml    # dev (только postgres в docker)
├── .env.example
└── Makefile                  # удобные команды
```

---

## База данных

### Схема (PostgreSQL)

```sql
-- Пользователи
CREATE TABLE users (
    id              SERIAL PRIMARY KEY,
    telegram_id     BIGINT UNIQUE NOT NULL,
    full_name       VARCHAR(255) NOT NULL,
    balance         INTEGER NOT NULL DEFAULT 1100,  -- 1000 + 100 бонус
    registered_at   TIMESTAMP DEFAULT NOW()
);

-- Матчи
CREATE TABLE matches (
    id              SERIAL PRIMARY KEY,
    team1_name      VARCHAR(100) NOT NULL,
    team2_name      VARCHAR(100) NOT NULL,
    odds_team1      NUMERIC(4,2) NOT NULL,
    odds_team2      NUMERIC(4,2) NOT NULL,
    bet_deadline    TIMESTAMP NOT NULL,
    status          VARCHAR(20) NOT NULL DEFAULT 'upcoming',
    -- upcoming | active | finished
    winner          SMALLINT,  -- NULL | 1 | 2
    created_at      TIMESTAMP DEFAULT NOW()
);

-- Ставки
CREATE TABLE bets (
    id              SERIAL PRIMARY KEY,
    user_id         INTEGER REFERENCES users(id),
    match_id        INTEGER REFERENCES matches(id),
    team_choice     SMALLINT NOT NULL,  -- 1 | 2
    amount          INTEGER NOT NULL,
    potential_win   INTEGER NOT NULL,
    status          VARCHAR(20) NOT NULL DEFAULT 'pending',
    -- pending | won | lost
    created_at      TIMESTAMP DEFAULT NOW(),
    UNIQUE (user_id, match_id)  -- одна ставка на матч
);

-- Бонусные каналы
CREATE TABLE bonus_channels (
    id              SERIAL PRIMARY KEY,
    channel_id      BIGINT UNIQUE NOT NULL,  -- Telegram channel ID
    channel_name    VARCHAR(100) NOT NULL,
    channel_url     VARCHAR(255) NOT NULL,
    bonus_points    INTEGER NOT NULL DEFAULT 50
);

-- Использованные бонусы за каналы
CREATE TABLE user_channel_bonuses (
    user_id         INTEGER REFERENCES users(id),
    channel_id      INTEGER REFERENCES bonus_channels(id),
    claimed_at      TIMESTAMP DEFAULT NOW(),
    PRIMARY KEY (user_id, channel_id)
);
```

---

## Backend: FastAPI

### Аутентификация

Telegram TWA передаёт `initData` в строке запуска. Бекенд валидирует HMAC-SHA256:

```
HMAC_SHA256(secret_key, data_check_string) == hash из initData
secret_key = HMAC_SHA256("WebAppData", bot_token)
```

После валидации — выдаём JWT токен (срок 24ч). Дальше все запросы через `Authorization: Bearer <token>`.

### API эндпоинты

```
POST   /api/auth/validate          # Принять initData → вернуть JWT
POST   /api/users/register         # Зарегистрировать (ввод ФИО)
GET    /api/users/me               # Текущий пользователь + баланс

GET    /api/matches                # Список матчей (upcoming + active)
GET    /api/matches/{id}           # Детали матча

POST   /api/bets                   # Сделать ставку
GET    /api/bets/my                # История ставок юзера

GET    /api/leaderboard            # Топ-50 по балансу

GET    /api/bonuses/channels       # Каналы + статус получения бонуса
POST   /api/bonuses/claim/{ch_id}  # Проверить подписку и начислить

# Админка (проверка: telegram_id в ADMIN_IDS)
GET    /api/admin/matches          # Все матчи
POST   /api/admin/matches          # Создать матч
PUT    /api/admin/matches/{id}     # Редактировать матч
POST   /api/admin/matches/{id}/result  # Ввести результат → пересчёт + уведомления
GET    /api/admin/users            # Все пользователи + баланс
GET    /api/admin/stats            # Сводка: юзеров, ставок, сумм
```

### Логика завершения матча (`/result`)

```
1. Установить match.winner = X, match.status = 'finished'
2. Найти все pending ставки на этот матч
3. Для каждой ставки:
   - Если team_choice == winner → bet.status = 'won', user.balance += potential_win
   - Иначе → bet.status = 'lost'
4. Всё в одной транзакции (атомарно)
5. Запустить фоновую задачу: бот рассылает уведомления
```

---

## Frontend: React TWA

### Стек

- **Vite** + **React 18** + **TypeScript**
- **@twa-dev/sdk** — Telegram Web App API (кнопки, тема, initData)
- **React Router v6** — маршрутизация
- **Zustand** — глобальное состояние (user, balance)
- **Axios** — HTTP клиент
- **TailwindCSS** — стили (минимальный бандл)

### Маршруты

```
/                → TWA (определяется по tg.initData)
  /register      → Экран регистрации
  /home          → Главное меню
  /matches       → Список матчей
  /matches/:id   → Ставка на матч
  /balance       → Баланс + история ставок
  /bonuses       → Бонусные каналы
  /leaderboard   → Лидерборд

/admin           → Вход в админку (по Telegram ID)
  /admin/matches        → Список матчей
  /admin/matches/new    → Создать матч
  /admin/matches/:id    → Редактировать / ввести результат
  /admin/users          → Участники
  /admin/stats          → Статистика
```

### Определение роли

```typescript
// При запуске приложения:
const tg = window.Telegram.WebApp
const telegramId = tg.initDataUnsafe?.user?.id

// Бекенд возвращает в JWT: { telegram_id, is_admin: bool }
// Если is_admin → доступен роут /admin
```

---

## Bot: aiogram 3.x

### Команды

```
/start
  → Проверить подписку на канал "Лапта 2026"
     → Не подписан: выслать ссылку, попросить подписаться
     → Подписан, не зарегистрирован: показать приветствие + кнопку "Открыть приложение"
     → Подписан, зарегистрирован: сразу кнопку "Открыть приложение"
```

### Уведомления (вызываются из FastAPI через внутренний HTTP)

```
FastAPI после завершения матча → POST http://bot:8001/notify
Bot рассылает сообщения участникам ставки
```

Либо вариант проще: бот и FastAPI шарят одну БД, FastAPI кладёт задачи в таблицу `notifications`, бот их забирает по polling раз в секунду.

**Выбор:** FastAPI → HTTP вызов к боту. Проще отлаживать, нет лишней таблицы.

### Dev vs Prod

| | Dev | Prod |
|-|-----|------|
| Режим | Polling | Webhook |
| URL | localhost | https://yourdomain.com/bot |
| ngrok | Нужен для webhook тестирования | Не нужен |

---

## Nginx

### prod конфиг (схематично)

```nginx
server {
    listen 443 ssl;
    server_name yourdomain.com;

    # SSL (Let's Encrypt)
    ssl_certificate     /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    # React статика (TWA + Admin)
    location / {
        root /usr/share/nginx/html;
        try_files $uri /index.html;  # SPA fallback
    }

    # FastAPI
    location /api/ {
        proxy_pass http://backend:8000;
        proxy_set_header Host $host;
    }

    # Telegram Bot webhook
    location /bot {
        proxy_pass http://bot:8001;
    }
}

server {
    listen 80;
    return 301 https://$host$request_uri;
}
```

---

## Docker Compose

### `docker-compose.yml` (prod)

```yaml
services:
  postgres:
    image: postgres:16
    environment:
      POSTGRES_DB: tournament
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data

  backend:
    build: ./backend
    environment:
      DATABASE_URL: postgresql://${DB_USER}:${DB_PASSWORD}@postgres/tournament
      BOT_TOKEN: ${BOT_TOKEN}
      SECRET_KEY: ${SECRET_KEY}
      ADMIN_IDS: ${ADMIN_IDS}  # "123456789,987654321"
    depends_on:
      - postgres

  bot:
    build: ./bot
    environment:
      BOT_TOKEN: ${BOT_TOKEN}
      BACKEND_URL: http://backend:8000
      WEBHOOK_URL: https://${DOMAIN}/bot
    depends_on:
      - backend

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf
      - ./frontend/dist:/usr/share/nginx/html
      - /etc/letsencrypt:/etc/letsencrypt:ro
    depends_on:
      - backend
      - bot

volumes:
  postgres_data:
```

### `docker-compose.dev.yml` (локальная разработка)

```yaml
# Только postgres в Docker, остальное запускается локально
services:
  postgres:
    image: postgres:16
    ports:
      - "5432:5432"
    environment:
      POSTGRES_DB: tournament
      POSTGRES_USER: dev
      POSTGRES_PASSWORD: dev
```

---

## .env.example

```env
# База данных
DB_USER=tournament_user
DB_PASSWORD=strong_password_here

# Telegram
BOT_TOKEN=123456:ABC-DEF...
LAPTU_CHANNEL_ID=-100123456789   # ID канала "Лапта 2026"

# JWT
SECRET_KEY=random_64_char_string_here

# Домен
DOMAIN=yourdomain.com

# Админы (telegram_id через запятую)
ADMIN_IDS=123456789,987654321

# Бонусные каналы (заполняется после уточнения у заказчика)
# BONUS_CHANNEL_1_ID=-100...
# BONUS_CHANNEL_1_NAME=СЛАВДА
# BONUS_CHANNEL_1_POINTS=50
```

---

## Локальная разработка (ngrok)

```bash
# 1. Запустить postgres
docker compose -f docker-compose.dev.yml up -d

# 2. Backend
cd backend
pip install -r requirements.txt
alembic upgrade head
uvicorn app.main:app --reload --port 8000

# 3. Frontend
cd frontend
npm install
npm run dev  # localhost:5173

# 4. Bot (polling режим для локальной разработки)
cd bot
python main.py

# 5. ngrok (для тестирования TWA — нужен HTTPS)
ngrok http 5173
# Полученный URL вставить в BotFather → Web App URL
```

---

## Деплой на сервер

```bash
# Первичная настройка (один раз)
ssh root@YOUR_SERVER_IP
apt update && apt install -y docker.io docker-compose-v2 certbot nginx
certbot certonly --standalone -d yourdomain.com

# Деплой
git clone https://github.com/you/tournament-bets
cd tournament-bets
cp .env.example .env
# Заполнить .env реальными значениями

cd frontend && npm run build && cd ..
docker compose up -d --build
```

### `Makefile` для удобства

```makefile
dev-db:
	docker compose -f docker-compose.dev.yml up -d

deploy:
	cd frontend && npm run build
	docker compose up -d --build

logs:
	docker compose logs -f

migrate:
	docker compose exec backend alembic upgrade head

shell-db:
	docker compose exec postgres psql -U $(DB_USER) tournament
```

---

## Открытые вопросы (блокируют старт отдельных частей)

| Вопрос | Блокирует |
|--------|-----------|
| Список бонусных каналов (ID, название, очки) | Экран бонусов |
| Промокоды — будут? | Таблица промокодов |
| Домен (нужно купить) | SSL, webhook, TWA URL |
| BotFather токен | Bot + TWA запуск |
