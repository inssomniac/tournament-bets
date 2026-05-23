# Spec: Публичная страница коэффициентов

## Цель
Страница без авторизации, которую можно открыть на любом экране
(трансляция, планшет у судьи) и видеть текущие матчи с коэфами.
Авто-обновление каждые 5 секунд.

## Backend

### Новый роутер `app/api/public.py`
```
GET /public/odds
```
- Без авторизации (не подключать `get_current_user`)
- Возвращает все матчи со статусом `active` или `live`
- Для active: динамические коэфы (через `compute_dynamic_odds`)
- Для live: зафиксированные коэфы (из `odds_team1/2`)

```python
class PublicMatchResponse(BaseModel):
    id: int
    team1_name: str
    team2_name: str
    odds_team1: float
    odds_team2: float
    status: str          # "active" | "live"
    total_bets: int      # суммарно очков поставлено (интересно для зрителей)
    bets_count: int      # количество ставок

model_config = ConfigDict(from_attributes=True)
```

### Подключение в `main.py`
```python
from app.api.public import router as public_router
app.include_router(public_router)
```

## Frontend

### Маршрут `/odds` вне AuthGate
В `App.tsx` добавить публичный route до `<Route element={<AuthGate />}>`:
```tsx
<Route path="/odds" element={<PublicOddsPage />} />
```

### Страница `src/pages/PublicOddsPage.tsx`

**Дизайн:** тёмный фон (`#0d0d0d`), крупный шрифт, минималистичный.
Оптимизировано для вывода на внешний экран.

**Структура:**
```
┌─────────────────────────────────────────┐
│  🏏 Летний Кубок по лапте 2026          │  ← заголовок
│  Обновлено: 14:23:05                    │  ← время последнего обновления
├─────────────────────────────────────────┤
│  Команда А          ×1.85  vs  ×2.10  Команда Б │  ← матч active
│  🔴 Идёт            ×1.72       ×2.45            │  ← матч live (коэфы серые)
│  ...                                    │
└─────────────────────────────────────────┘
```

**Polling:** `setInterval(fetch, 5000)` в `useEffect`

**Skeleton:** 3 строки-заглушки при первой загрузке

**Состояния:**
- Нет матчей → «Матчей нет» по центру
- Ошибка сети → последние данные остаются, иконка ⚠️ мигает
- Успешный fetch → обновляет данные без мигания (React state update)

**Не требует:** TabBar, авторизации, Telegram WebApp SDK

## Nginx / роутинг

Страница открывается по прямой ссылке:
`https://insomniac.tournament-dvfu.ru/odds`

Nginx уже настроен на SPA (`try_files $uri /index.html`),
поэтому маршрут `/odds` автоматически отдаст `index.html` и React-роутер
отрисует нужную страницу. Дополнительной конфигурации не нужно.

## Edge cases
- Страница доступна без VPN и без Telegram (просто URL в браузере)
- При пустом списке матчей: показать заглушку, не крашиться
- CORS: `/public/odds` открыт всем (`allow_origins=["*"]` уже есть в main.py)
- При открытии на мобильном: адаптивная вёрстка (коэфы не обрезаются)
