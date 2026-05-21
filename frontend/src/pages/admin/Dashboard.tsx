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
    { label: 'Участников', value: stats.total_users, icon: '👥' },
    { label: 'Активных матчей', value: stats.active_matches, icon: '🟢' },
    { label: 'Завершённых матчей', value: stats.finished_matches, icon: '✅' },
    { label: 'Всего ставок', value: stats.total_bets, icon: '🎯' },
  ] : []

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Дашборд</h1>

      <div className="grid grid-cols-2 gap-4 mb-8">
        {cards.map((c) => (
          <div key={c.label} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <p className="text-3xl mb-1">{c.icon}</p>
            <p className="text-2xl font-bold">{c.value}</p>
            <p className="text-sm text-gray-500">{c.label}</p>
          </div>
        ))}
        {!stats && <p className="col-span-2 text-gray-400">Загрузка...</p>}
      </div>

      <div className="flex flex-col gap-3">
        <button
          onClick={() => navigate('/admin/matches/new')}
          className="bg-blue-500 text-white rounded-xl py-3 font-semibold"
        >
          + Создать матч
        </button>
        <button
          onClick={() => navigate('/admin/matches')}
          className="bg-white border border-gray-200 rounded-xl py-3 font-medium text-gray-700"
        >
          📋 Все матчи
        </button>
        <button
          onClick={() => navigate('/admin/users')}
          className="bg-white border border-gray-200 rounded-xl py-3 font-medium text-gray-700"
        >
          👥 Участники
        </button>
      </div>
    </div>
  )
}
