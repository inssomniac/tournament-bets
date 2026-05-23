# Spec: Промокоды

## Цель
Администратор генерирует пачки одноразовых кодов с фиксированным бонусом.
Пользователь вводит код в приложении и получает очки на баланс.

## Модель данных

### Новая таблица `promo_codes`
| Поле | Тип | Описание |
|---|---|---|
| id | Integer PK | |
| code | String(10) UNIQUE NOT NULL | Код (5 символов A-Z0-9) |
| amount | Integer NOT NULL | Сумма бонуса (100/200/300/400) |
| is_used | Boolean DEFAULT false | Использован ли |
| used_by_user_id | Integer FK users.id nullable | Кто использовал |
| used_at | DateTime nullable | Когда использован |
| created_at | DateTime DEFAULT now | |

### Миграция Alembic
Файл: `alembic/versions/b1c2d3e4f5a6_promo_codes.py`

## Backend API

### Admin endpoints (требуют is_admin)

**POST /api/admin/promo/generate**
```json
Request:  { "amount": 200, "count": 500 }
Response: { "generated": 500, "codes": ["AB1C2", ...] }
```
- Генерирует `count` уникальных 5-символьных кодов (A-Z + 0-9)
- Проверяет уникальность через DB UNIQUE constraint (retry при коллизии)
- Возвращает полный список (фронт скачивает как CSV)

**GET /api/admin/promo/list**
```
Query params: ?amount=200&used=false
Response: [{ id, code, amount, is_used, used_by_user_id, used_at, created_at }, ...]
```

**GET /api/admin/promo/export.csv**
```
Возвращает CSV: code,amount,is_used,used_at
Content-Disposition: attachment; filename="promo_codes.csv"
```

### User endpoint

**POST /api/bonuses/redeem**
```json
Request:  { "code": "AB1C2" }
Response: { "amount": 200, "new_balance": 1300 }
```
Ошибки:
- 404 — код не существует
- 409 — код уже использован (`"Этот код уже активирован"`)

Логика:
1. Найти код (case-insensitive, trim)
2. Проверить `is_used`
3. `user.balance += amount`
4. Пометить `is_used=True`, `used_by_user_id`, `used_at=now()`
5. Commit, вернуть новый баланс

**Ограничения:**
- Один пользователь может активировать неограниченное число разных кодов
- Один код — строго один раз глобально

## Frontend

### Admin: страница `/admin/promo`
- Вкладка в AdminTabBar: 🎟 Коды
- Форма генерации: выбор номинала (100/200/300/400) + количество (default 500) + кнопка «Сгенерировать»
- После генерации: кнопка «Скачать CSV» (blob download)
- Таблица всех кодов с фильтрами по номиналу и статусу (использован/нет)
- Skeleton пока загружается список

### User: раздел в `Bonuses.tsx`
- Новый блок над каналами: «🎟 Промокод»
- Поле ввода (uppercase автоматически) + кнопка «Активировать»
- Состояния: idle / loading / success (показать +N очков) / error
- После успеха: обновить баланс в store через `updateBalance()`

## Edge cases
- Код вводится в любом регистре — привести к upper на бэке перед поиском
- Генерация 500 кодов: batch insert одной транзакцией
- Коллизия кода при генерации: retry с новым случайным кодом (вероятность мала — 36^5 = 60M комбинаций)
