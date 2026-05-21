.PHONY: dev-db dev-db-stop backend frontend bot migrate migration logs

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

seed:
	cd backend && python seed.py

simulate:
	cd backend && python tests/simulate_tournament.py

logs:
	docker compose logs -f
