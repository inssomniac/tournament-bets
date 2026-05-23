# Spec: Динамические коэффициенты

## Цель
Коэффициенты на активных матчах автоматически корректируются
в зависимости от распределения ставок. Пользователи видят актуальные
коэфы каждые 3 секунды без перезагрузки страницы.

## Алгоритм (pari-mutuel с якорением)

```python
MARGIN = 0.05   # 5% маржа букмекера
SEED   = 500    # виртуальный пул — якорь к начальным коэфам

def compute_dynamic_odds(initial_odds1, initial_odds2, total_bet1, total_bet2):
    # Якорение: виртуальные ставки пропорционально начальным коэфам
    seed1 = SEED / initial_odds1   # при коэфе 2.0 → 250; при 4.0 → 125
    seed2 = SEED / initial_odds2

    eff1 = total_bet1 + seed1
    eff2 = total_bet2 + seed2
    total = eff1 + eff2

    odds1 = (total / eff1) * (1 - MARGIN)
    odds2 = (total / eff2) * (1 - MARGIN)

    # Ограничить диапазон
    odds1 = max(1.01, min(10.0, round(odds1, 2)))
    odds2 = max(1.01, min(10.0, round(odds2, 2)))

    return odds1, odds2
```

**Поведение:**
- Нет ставок → коэфы близки к начальным (с учётом маржи)
- 80% денег на команду А → её коэф падает, команды Б — растёт
- SEED=500 означает: нужно ~500+ очков суммарных ставок чтобы коэф сдвинулся заметно

**Когда применяется:**
- Только статус `active` — коэфы живые
- Статус `live` / `finished` — показываем коэфы зафиксированные в момент go_live
- При размещении ставки `potential_win = amount * current_dynamic_odds` (коэф момента ставки)

## Изменения в БД

### Таблица `matches`
Добавить два поля:
| Поле | Тип | Описание |
|---|---|---|
| initial_odds_team1 | Numeric(5,2) NOT NULL | Коэф, выставленный админом — не меняется |
| initial_odds_team2 | Numeric(5,2) NOT NULL | Коэф, выставленный админом — не меняется |

`odds_team1` / `odds_team2` — теперь «замороженные» коэфы (фиксируются при go_live).

**Логика при создании матча:**
```
initial_odds_team1 = body.odds_team1
initial_odds_team2 = body.odds_team2
odds_team1 = body.odds_team1   # совпадают до первых ставок
odds_team2 = body.odds_team2
```

**Логика при go_live:**
```python
# Посчитать финальные динамические коэфы и сохранить в odds_team1/2
# Они будут показаны на live/finished матче как информация
final_odds1, final_odds2 = compute_dynamic_odds(match, db)
match.odds_team1 = final_odds1
match.odds_team2 = final_odds2
match.status = "live"
```

### Миграция Alembic
Файл: `alembic/versions/c2d3e4f5a6b7_initial_odds.py`
- `ALTER TABLE matches ADD COLUMN initial_odds_team1 NUMERIC(5,2)`
- `ALTER TABLE matches ADD COLUMN initial_odds_team2 NUMERIC(5,2)`
- Backfill: `UPDATE matches SET initial_odds_team1 = odds_team1, initial_odds_team2 = odds_team2`

## Backend

### Утилита `app/services/odds.py`
```python
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.bet import Bet

MARGIN = 0.05
SEED = 500

def compute_dynamic_odds(match, db: Session) -> tuple[float, float]:
    if match.status != "active":
        return float(match.odds_team1), float(match.odds_team2)

    row = db.query(
        func.coalesce(func.sum(Bet.amount).filter(Bet.team_choice == 1), 0),
        func.coalesce(func.sum(Bet.amount).filter(Bet.team_choice == 2), 0),
    ).filter(Bet.match_id == match.id).first()

    total1, total2 = float(row[0]), float(row[1])
    seed1 = SEED / float(match.initial_odds_team1)
    seed2 = SEED / float(match.initial_odds_team2)

    eff1 = total1 + seed1
    eff2 = total2 + seed2
    total = eff1 + eff2

    o1 = max(1.01, min(10.0, round((total / eff1) * (1 - MARGIN), 2)))
    o2 = max(1.01, min(10.0, round((total / eff2) * (1 - MARGIN), 2)))
    return o1, o2
```

### Изменения в `app/api/matches.py`
- `build_match_response()`: для active-матчей вызывать `compute_dynamic_odds(match, db)` и подставлять в ответ вместо хранимых
- Добавить поле `initial_odds_team1/2` в MatchResponse (для инфо)

### Изменения в `app/api/bets.py`
- `place_bet()`: `odds = compute_dynamic_odds(match, db)[team_choice - 1]` вместо `match.odds_teamN`

### Изменения в `app/api/admin.py`
- `go_live()`: перед сменой статуса вычислить и сохранить финальные коэфы
- `MatchAdminResponse`: добавить `initial_odds_team1/2`
- `create_match()`: сохранять `initial_odds_team1/2`
- `update_match()`: при изменении odds обновлять и initial_odds (матч ещё не начат)

## Frontend

### `Matches.tsx`
- Polling: `useEffect` с `setInterval(fetchMatches, 3000)` только если есть active-матчи
- Показывать коэфы на live-матчах информационно (без кнопок): `× 1.85` серым текстом

### `BetFlow.tsx`
- Показывать актуальный коэф в момент открытия экрана
- Предупреждение: «Коэф может измениться до подтверждения»

### `MatchForm.tsx` (admin)
- Показывать `initial_odds` и `current_odds` раздельно при редактировании

## Edge cases
- Все ставки на одну команду → odds второй достигают 10.0 (clamp), первой → 1.01
- Изменение initial_odds через PUT пока матч active → пересчитать и вернуть актуальный динамический коэф
- Нулевые ставки на обе команды → seed доминирует, коэфы ≈ начальным
