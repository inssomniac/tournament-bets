import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../../api/client'

interface Stats {
  total_users: number
  total_bets: number
  active_matches: number
  finished_matches: number
}

export default function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null)
  const navigate = useNavigate()

  useEffect(() => {
    api.get('/api/admin/stats').then(({ data }) => setStats(data)).catch(() => {})
  }, [])

  const cards = stats ? [
    { label: 'Участников',          value: stats.total_users,      icon: '👥' },
    { label: 'Активных матчей',     value: stats.active_matches,   icon: '🟢' },
    { label: 'Завершённых матчей',  value: stats.finished_matches, icon: '✅' },
    { label: 'Всего ставок',        value: stats.total_bets,       icon: '🎯' },
  ] : []

  return (
    <div className="pt-2">
      <h1 className="text-lg font-bold text-tg-text mb-4">Дашборд</h1>

      <div className="grid grid-cols-2 gap-3 mb-6">
        {cards.map((c) => (
          <div key={c.label} className="tg-card">
            <p className="text-2xl mb-1">{c.icon}</p>
            <p className="text-2xl font-bold text-tg-text">{c.value}</p>
            <p className="text-xs text-tg-hint">{c.label}</p>
          </div>
        ))}
        {!stats && <p className="col-span-2 text-tg-hint text-sm">Загрузка...</p>}
      </div>

      <div className="flex flex-col gap-2">
        <button onClick={() => navigate('/admin/matches/new')} className="tg-btn">
          + Создать матч
        </button>
        <button
          onClick={() => navigate('/admin/matches')}
          className="tg-card text-tg-text font-medium text-sm py-3 text-center active:scale-95 transition-transform"
        >
          📋 Все матчи
        </button>
        <button
          onClick={() => navigate('/admin/users')}
          className="tg-card text-tg-text font-medium text-sm py-3 text-center active:scale-95 transition-transform"
        >
          👥 Участники
        </button>
      </div>
    </div>
  )
}
