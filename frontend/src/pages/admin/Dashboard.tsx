import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../../api/client'

interface Stats {
  total_users: number
  total_bets: number
  active_matches: number
  finished_matches: number
}

const CARD_DEFS = [
  { key: 'total_users',       label: 'Участников',         icon: '👥' },
  { key: 'active_matches',    label: 'Активных матчей',    icon: '🟢' },
  { key: 'finished_matches',  label: 'Завершённых матчей', icon: '✅' },
  { key: 'total_bets',        label: 'Всего предсказаний',       icon: '🎯' },
] as const

function StatCardSkeleton() {
  return (
    <div className="tg-card flex flex-col gap-2">
      <div className="sk rounded-md h-7 w-7" />
      <div className="sk rounded-md h-7 w-12" />
      <div className="sk rounded-md h-3 w-24" />
    </div>
  )
}

export default function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null)
  const navigate = useNavigate()

  useEffect(() => {
    api.get('/api/admin/stats').then(({ data }) => setStats(data)).catch(() => {})
  }, [])

  return (
    <div className="pt-2">
      <h1 className="text-lg font-bold text-tg-text mb-4">Дашборд</h1>

      <div className="grid grid-cols-2 gap-3 mb-6">
        {stats
          ? CARD_DEFS.map((c) => (
              <div key={c.key} className="tg-card">
                <p className="text-2xl mb-1">{c.icon}</p>
                <p className="text-2xl font-bold text-tg-text">{stats[c.key]}</p>
                <p className="text-xs text-tg-hint">{c.label}</p>
              </div>
            ))
          : [0, 1, 2, 3].map((i) => <StatCardSkeleton key={i} />)
        }
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
