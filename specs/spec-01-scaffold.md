# Spec 01 — Project Scaffold

## Цель

Создать структуру директорий, настроить локальное окружение разработки.
После этого спека: postgres крутится в Docker, backend и frontend запускаются локально.

## Структура директорий

```
tournament-bets/
├── specs/                        # этот файл и другие спеки
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   └── __init__.py
│   │   ├── models/
│   │   │   └── __init__.py
│   │   ├── schemas/
│   │   │   └── __init__.py
│   │   ├── services/
│   │   │   └── __init__.py
│   │   ├── core/
│   │   │   ├── config.py
│   │   │   ├── database.py
│   │   │   └── security.py
│   │   └── main.py
│   ├── alembic/
│   │   ├── versions/
│   │   └── env.py
│   ├── tests/
│   │   └── simulate_tournament.py
│   ├── alembic.ini
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   │   └── client.ts
│   │   ├── pages/
│   │   │   ├── twa/
│   │   │   └── admin/
│   │   ├── store/
│   │   │   └── useAppStore.ts
│   │   ├── components/
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── public/
│   ├── index.html
│   ├── vite.config.ts
│   ├── tsconfig.json
│   ├── package.json
│   └── Dockerfile
├── bot/
│   ├── handlers/
│   │   ├── __init__.py
│   │   ├── start.py
│   │   └── notifications.py
│   ├── main.py
│   ├── requirements.txt
│   └── Dockerfile
├── nginx/
│   ├── nginx.conf
│   └── nginx.dev.conf
├── docker-compose.yml
├── docker-compose.dev.yml
├── .env
├── .env.example
├── .gitignore
└── Makefile
```

## Файлы для создания

### `.env.example`

```env
# Database
DB_USER=dev
DB_PASSWORD=dev
DB_NAME=tournament
DATABASE_URL=postgresql://dev:dev@localhost:5432/tournament

# Telegram
BOT_TOKEN=123456:ABC-DEF...
LAPTU_CHANNEL_ID=-100123456789

# JWT
SECRET_KEY=change_me_to_64_random_chars

# Admin (telegram_id через запятую)
ADMIN_IDS=123456789

# App
DOMAIN=insomniac.tournament-dvfu.ru
ENVIRONMENT=development
```

### `.gitignore`

```
.env
__pycache__/
*.pyc
.venv/
node_modules/
dist/
*.egg-info/
.pytest_cache/
```

### `docker-compose.dev.yml`

```yaml
services:
  postgres:
    image: postgres:16-alpine
    ports:
      - "5432:5432"
    environment:
      POSTGRES_DB: tournament
      POSTGRES_USER: dev
      POSTGRES_PASSWORD: dev
    volumes:
      - postgres_dev_data:/var/lib/postgresql/data

volumes:
  postgres_dev_data:
```

### `backend/requirements.txt`

```
fastapi==0.115.0
uvicorn[standard]==0.30.0
sqlalchemy==2.0.36
alembic==1.13.3
psycopg2-binary==2.9.10
python-jose[cryptography]==3.3.0
python-dotenv==1.0.1
httpx==0.27.0
pydantic-settings==2.5.2
```

### `bot/requirements.txt`

```
aiogram==3.13.0
python-dotenv==1.0.1
httpx==0.27.0
```

### `backend/app/core/config.py`

```python
from pydantic_settings import BaseSettings
from typing import List

class Settings(BaseSettings):
    DATABASE_URL: str
    BOT_TOKEN: str
    LAPTU_CHANNEL_ID: int
    SECRET_KEY: str
    ADMIN_IDS: str  # "123,456" -> парсим в список
    ENVIRONMENT: str = "development"

    @property
    def admin_ids_list(self) -> List[int]:
        return [int(x.strip()) for x in self.ADMIN_IDS.split(",")]

    class Config:
        env_file = ".env"

settings = Settings()
```

### `backend/app/core/database.py`

```python
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase
from app.core.config import settings

engine = create_engine(settings.DATABASE_URL)
SessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False)

class Base(DeclarativeBase):
    pass

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
```

### `backend/app/main.py`

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="Tournament Bets API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # в проде заменить на домен
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health():
    return {"status": "ok"}
```

### `frontend/package.json` (ключевые зависимости)

```json
{
  "dependencies": {
    "react": "^18.3.0",
    "react-dom": "^18.3.0",
    "react-router-dom": "^6.26.0",
    "axios": "^1.7.0",
    "zustand": "^4.5.0",
    "@twa-dev/sdk": "^7.10.0"
  },
  "devDependencies": {
    "vite": "^5.4.0",
    "@vitejs/plugin-react": "^4.3.0",
    "typescript": "^5.5.0",
    "tailwindcss": "^3.4.0",
    "autoprefixer": "^10.4.0"
  }
}
```

### `frontend/vite.config.ts`

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': 'http://localhost:8000'
    }
  }
})
```

### `Makefile`

```makefile
dev-db:
	docker compose -f docker-compose.dev.yml up -d

dev-db-stop:
	docker compose -f docker-compose.dev.yml down

backend:
	cd backend && uvicorn app.main:app --reload --port 8000

frontend:
	cd frontend && npm run dev

bot:
	cd bot && python main.py

migrate:
	cd backend && alembic upgrade head

migration:
	cd backend && alembic revision --autogenerate -m "$(name)"
```

## Порядок создания

1. Создать все директории и `__init__.py`
2. Скопировать `.env.example` → `.env`, заполнить `BOT_TOKEN` и `ADMIN_IDS`
3. `docker compose -f docker-compose.dev.yml up -d`
4. `cd backend && pip install -r requirements.txt`
5. `cd frontend && npm install`
6. Проверить: `curl http://localhost:8000/health` после запуска бекенда

## Definition of Done

- [ ] `docker compose -f docker-compose.dev.yml up -d` — postgres запускается
- [ ] `uvicorn app.main:app --reload` — FastAPI стартует без ошибок
- [ ] `GET /health` → `{"status": "ok"}`
- [ ] `npm run dev` — Vite стартует на порту 5173
