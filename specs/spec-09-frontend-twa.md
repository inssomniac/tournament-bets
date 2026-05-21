# Spec 09 — Frontend: TWA

## Цель

React-приложение для пользователей. Открывается внутри Telegram через кнопку бота.

## Инициализация Telegram WebApp

```typescript
// src/main.tsx
import WebApp from '@twa-dev/sdk'
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'

WebApp.ready() // сообщает Telegram что приложение готово
WebApp.expand() // разворачивает на весь экран

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
```

## Роутинг и защита маршрутов

```typescript
// src/App.tsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAppStore } from './store/useAppStore'
import Registration from './pages/twa/Registration'
import Home from './pages/twa/Home'
import Matches from './pages/twa/Matches'
import BetFlow from './pages/twa/BetFlow'
import Balance from './pages/twa/Balance'
import Bonuses from './pages/twa/Bonuses'
import Leaderboard from './pages/twa/Leaderboard'
import AdminApp from './pages/admin/AdminApp'
import AuthGate from './components/AuthGate'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Админка — отдельный поддерев */}
        <Route path="/admin/*" element={<AdminApp />} />

        {/* TWA — весь флоу через AuthGate */}
        <Route element={<AuthGate />}>
          <Route path="/register" element={<Registration />} />
          <Route path="/home" element={<Home />} />
          <Route path="/matches" element={<Matches />} />
          <Route path="/matches/:id" element={<BetFlow />} />
          <Route path="/balance" element={<Balance />} />
          <Route path="/bonuses" element={<Bonuses />} />
          <Route path="/leaderboard" element={<Leaderboard />} />
          <Route path="*" element={<Navigate to="/home" />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
```

## AuthGate — точка входа

Компонент который при первом рендере:
1. Берёт `initData` из `window.Telegram.WebApp`
2. Отправляет на `/api/auth/validate`
3. Сохраняет JWT в store
4. Редиректит на `/register` если не зарегистрирован, иначе на `/home`

```typescript
// src/components/AuthGate.tsx
import { useEffect, useState } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import WebApp from '@twa-dev/sdk'
import { api } from '../api/client'
import { useAppStore } from '../store/useAppStore'

export default function AuthGate() {
  const [loading, setLoading] = useState(true)
  const { setToken, setUser } = useAppStore()
  const navigate = useNavigate()

  useEffect(() => {
    const init = async () => {
      try {
        const initData = WebApp.initData || `dev:${Date.now()}` // dev fallback
        const { data } = await api.post('/api/auth/validate', { init_data: initData })
        
        setToken(data.access_token)
        api.defaults.headers.common['Authorization'] = `Bearer ${data.access_token}`

        if (!data.is_registered) {
          navigate('/register')
        } else {
          // Загрузить профиль
          const { data: user } = await api.get('/api/users/me')
          setUser(user)
          navigate('/home')
        }
      } catch (e) {
        // Показать экран ошибки
        console.error('Auth failed', e)
      } finally {
        setLoading(false)
      }
    }
    init()
  }, [])

  if (loading) return <div className="flex items-center justify-center h-screen">Загрузка...</div>
  return <Outlet />
}
```

## Глобальный Store (Zustand)

```typescript
// src/store/useAppStore.ts
import { create } from 'zustand'

interface User {
  id: number
  telegram_id: number
  full_name: string
  balance: number
}

interface AppStore {
  token: string | null
  user: User | null
  setToken: (token: string) => void
  setUser: (user: User) => void
  updateBalance: (balance: number) => void
}

export const useAppStore = create<AppStore>((set) => ({
  token: null,
  user: null,
  setToken: (token) => set({ token }),
  setUser: (user) => set({ user }),
  updateBalance: (balance) => set((s) => ({ user: s.user ? { ...s.user, balance } : null })),
}))
```

## API клиент

```typescript
// src/api/client.ts
import axios from 'axios'

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '',
  timeout: 10000,
})

// Глобальный обработчик ошибок
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const message = err.response?.data?.detail || 'Ошибка сети'
    // Можно показать toast
    return Promise.reject(new Error(message))
  }
)
```

---

## Экраны

### Registration

**Путь:** `/register`

Форма ввода ФИО. После успешного сабмита — редирект на `/home`.

```typescript
// src/pages/twa/Registration.tsx
export default function Registration() {
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { setUser } = useAppStore()
  const navigate = useNavigate()

  const handleSubmit = async () => {
    setLoading(true)
    setError('')
    try {
      const { data } = await api.post('/api/users/register', { full_name: name })
      setUser(data)
      navigate('/home')
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-4 flex flex-col gap-4 min-h-screen">
      <h1 className="text-2xl font-bold">🏏 Летний Кубок по лапте 2026</h1>
      <p className="text-gray-600">
        Твой стартовый банк: <strong>1100 очков</strong>.
        Делай ставки, набирай очки, выигрывай призы!
      </p>
      <input
        className="border rounded-xl p-3 text-base"
        placeholder="Иванов Иван Иванович"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      {error && <p className="text-red-500 text-sm">{error}</p>}
      <button
        className="bg-blue-500 text-white rounded-xl py-3 font-semibold disabled:opacity-50"
        onClick={handleSubmit}
        disabled={loading || name.trim().split(' ').length < 2}
      >
        {loading ? 'Регистрация...' : 'Зарегистрироваться'}
      </button>
    </div>
  )
}
```

---

### Home

**Путь:** `/home`

Главное меню. Три кнопки + текущий баланс.

```
┌─────────────────────────┐
│  🏏 Летний Кубок 2026   │
│  Привет, Иван!          │
│  💰 Баланс: 950 очков   │
├─────────────────────────┤
│  [🏆 Матчи]             │
│  [💰 Мой баланс]        │
│  [🎁 Получить бонусы]   │
│  [📊 Лидерборд]         │
└─────────────────────────┘
```

При входе на этот экран — перезагружать баланс через `GET /api/users/me`.

---

### Matches

**Путь:** `/matches`

Список матчей. Карточка для каждого матча.

```
┌─────────────────────────────┐
│ 🏆 Матч #1                  │
│ Лаптевцы vs Медведи         │
│ коэф: 1.7 / 2.2             │
│ Ставки до: 15 июн, 14:00    │
│                             │
│ [✅ Ваша ставка: Лаптевцы]  │  ← если ставка есть
│ ─ или ─                     │
│ [Ставка на Лаптевцев] [Ставка на Медведей]  │  ← если нет
└─────────────────────────────┘
```

**Состояния карточки:**
- Ставка уже сделана → зелёная плашка с командой и суммой, кнопки скрыты
- Дедлайн прошёл → кнопки задизейблены, текст "Ставки закрыты"
- Матч завершён → показывать в секции "Завершённые" (или не показывать)

```typescript
// Проверка дедлайна на фронте
const isPastDeadline = new Date(match.bet_deadline) < new Date()
```

---

### BetFlow

**Путь:** `/matches/:id`

Экран подтверждения ставки. Переход сюда после нажатия "Ставка на [команду]".

```
┌─────────────────────────────┐
│ Лаптевцы vs Медведи         │
│ Вы выбрали: Лаптевцы (×1.7) │
│ Ваш баланс: 1100 очков      │
│                             │
│ Сумма ставки:               │
│ [____200____]               │
│ мин 10 / макс 500           │
│                             │
│ Потенциальный выигрыш: 340  │
│                             │
│ [Подтвердить ставку]        │
└─────────────────────────────┘
```

Потенциальный выигрыш пересчитывается в реальном времени при вводе суммы.
После подтверждения — редирект на `/matches`.

**State:**
```typescript
const [amount, setAmount] = useState(100)
const teamChoice = // из query params или location.state
const potentialWin = Math.floor(amount * odds)
```

---

### Balance

**Путь:** `/balance`

Текущий баланс + история ставок.

```
┌─────────────────────────────┐
│ 💰 Ваш баланс: 950 очков    │
├─────────────────────────────┤
│ История ставок              │
│                             │
│ ✅ Лаптевцы vs Медведи      │
│    Ставка: 200 → +340       │
│                             │
│ ❌ Соколы vs Барсы          │
│    Ставка: 150 → -150       │
│                             │
│ ⏳ Орлы vs Тигры            │
│    Ставка: 100 (ожидание)   │
└─────────────────────────────┘
```

Иконки статуса: ✅ won, ❌ lost, ⏳ pending.

---

### Bonuses

**Путь:** `/bonuses`

Список каналов для получения бонусов.

```
┌─────────────────────────────┐
│ 🎁 Бонусы                   │
├─────────────────────────────┤
│ СЛАВДА               +50 🪙 │
│ [Подписаться] [Получить]    │
│                             │
│ Лапта News           +75 🪙 │
│ [✅ Получено]               │  ← задизейблена
└─────────────────────────────┘
```

Flow при нажатии "Получить":
1. `POST /api/bonuses/claim/{channel_id}`
2. Успех → обновить баланс в store, задизейблить кнопку
3. Ошибка "не подписан" → показать сообщение "Подпишитесь сначала"

---

### Leaderboard

**Путь:** `/leaderboard`

Топ участников. Текущий пользователь подсвечен.

```
┌─────────────────────────────┐
│ 📊 Лидерборд (47 участников)│
├─────────────────────────────┤
│ 🥇 1. Петров П.П.   2850 🪙 │
│ 🥈 2. Сидоров С.С.  2100 🪙 │
│ ► 3. Иванов И.И.   1950 🪙  │  ← текущий (другой фон)
│    4. Козлов К.К.   1800 🪙 │
│   ...                       │
│                             │
│ Ваша позиция: #3            │
└─────────────────────────────┘
```

Обновление: `useEffect` с polling раз в 30 секунд (простой setInterval).

```typescript
useEffect(() => {
  fetchLeaderboard()
  const interval = setInterval(fetchLeaderboard, 30_000)
  return () => clearInterval(interval)
}, [])
```

---

## Навигация

Нижняя панель навигации (Tab Bar) на всех экранах кроме Registration и BetFlow:

```
[🏆 Матчи] [💰 Баланс] [🎁 Бонусы] [📊 Рейтинг]
```

```typescript
// src/components/TabBar.tsx
const tabs = [
  { path: '/matches', icon: '🏆', label: 'Матчи' },
  { path: '/balance', icon: '💰', label: 'Баланс' },
  { path: '/bonuses', icon: '🎁', label: 'Бонусы' },
  { path: '/leaderboard', icon: '📊', label: 'Рейтинг' },
]
```

## Стилизация

- TailwindCSS — утилитарные классы
- Цветовая схема адаптируется к теме Telegram: `WebApp.colorScheme` (`light` / `dark`)
- Основной цвет кнопок: `bg-blue-500` (или `tg-button-color` из CSS переменных TWA)
- Telegram предоставляет CSS переменные: `--tg-theme-bg-color`, `--tg-theme-text-color`, etc.

```css
/* src/index.css */
body {
  background-color: var(--tg-theme-bg-color, #ffffff);
  color: var(--tg-theme-text-color, #000000);
}
```

## Definition of Done

- [ ] AuthGate получает JWT и редиректит на нужный экран
- [ ] Registration создаёт пользователя и переходит на Home
- [ ] Matches показывает список с состоянием ставки
- [ ] BetFlow считает потенциальный выигрыш в реальном времени
- [ ] BetFlow не даёт поставить больше баланса (валидация на фронте)
- [ ] Balance показывает историю с иконками статуса
- [ ] Bonuses: claim обновляет баланс в store без перезагрузки
- [ ] Leaderboard подсвечивает текущего пользователя
- [ ] TabBar навигация работает на всех экранах
- [ ] Приложение открывается через кнопку бота в Telegram
