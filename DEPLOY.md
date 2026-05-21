# Deploy на сервер

## 1. Собери фронт локально

```bash
cd frontend
npm run build
```

## 2. Залей код на сервер

```bash
# из корня проекта (первый раз)
rsync -avz --exclude='.env' --exclude='node_modules' --exclude='__pycache__' --exclude='frontend/node_modules' \
  ./ root@78.17.78.54:/opt/tournament/

# или если уже есть git на сервере:
# git clone / git pull
```

## 3. На сервере — первый запуск

```bash
ssh root@78.17.78.54

cd /opt/tournament

# Скопируй и заполни .env
cp .env.prod.example .env
nano .env
# Заполни: POSTGRES_PASSWORD, BOT_TOKEN, SECRET_KEY (openssl rand -hex 32)

# Создай папку для статики фронта
mkdir -p /var/www/tournament/frontend
cp -r frontend/dist/* /var/www/tournament/frontend/

# Установи nginx конфиг
cp nginx.conf /etc/nginx/sites-available/tournament
ln -sf /etc/nginx/sites-available/tournament /etc/nginx/sites-enabled/tournament
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx

# Запусти контейнеры
docker compose up -d --build

# Проверь логи
docker compose logs -f
```

## 4. Обновление (после изменений)

```bash
# Локально: пересобери фронт
cd frontend && npm run build

# Залей на сервер
rsync -avz --exclude='.env' --exclude='node_modules' --exclude='__pycache__' \
  ./ root@78.17.78.54:/opt/tournament/

# На сервере
ssh root@78.17.78.54
cd /opt/tournament
cp -r frontend/dist/* /var/www/tournament/frontend/
docker compose up -d --build
```

## Полезные команды на сервере

```bash
docker compose ps          # статус контейнеров
docker compose logs -f     # все логи
docker compose logs bot    # логи бота
docker compose logs backend # логи API
docker compose restart bot  # перезапустить бота
```

## Генерация SECRET_KEY

```bash
openssl rand -hex 32
```
