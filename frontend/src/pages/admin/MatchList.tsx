import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../../api/client'

interface Match {
  id: number
  team1_name: string
  team2_name: string
  odds_team1: number
  odds_team2: number
  bet_deadline: string
  status: string
  winner: number | null
  bets_count: number
  total_bet_amount: number
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('ru-RU', {
    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
  })
}

export default function MatchList() {
  const [matches, setMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    api.get('/api/admin/matches').then(({ data }) => setMatches(data)).finally(() => setLoading(false))
  }, [])

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Матчи</h1>
        <button
          onClick={() => navigate('/admin/matches/new')}
          className="bg-blue-500 text-white px-4 py-2 rounded-xl text-sm font-medium"
        >
          + Создать
        </button>
      </div>

      {loading && <p className="text-gray-400">Загрузка...</p>}
      {!loading && matches.length === 0 && (
        <p className="text-gray-400 text-center mt-10">Матчей ещё нет</p>
      )}

      <div className="flex flex-col gap-4">
        {matches.map((m) => (
          <div key={m.id} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <div className="flex justify-between items-start mb-2">
              <h2 className="font-semibold">{m.team1_name} vs {m.team2_name}</h2>
              <span className={`text-xs px-2 py-1 rounded-full ${
                m.status === 'finished' ? 'bg-gray-100 text-gray-500' : 'bg-green-100 text-green-700'
              }`}>
                {m.status === 'finished' ? '✅ Завершён' : '🟢 Активен'}
              </span>
            </div>

            <div className="text-sm text-gray-500 mb-1">
              Коэф: {m.team1_name} ×{m.odds_team1} / {m.team2_name} ×{m.odds_team2}
            </div>
            <div className="text-sm text-gray-500 mb-1">
              Дедлайн: {formatDate(m.bet_deadline)}
            </div>
            <div className="text-sm text-gray-500 mb-3">
              Ставок: {m.bets_count} ({m.total_bet_amount} очков)
            </div>

            {m.status === 'finished' ? (
              <p className="text-sm font-medium text-gray-600">
                Победитель: {m.winner === 1 ? m.team1_name : m.team2_name}
              </p>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={() => navigate(`/admin/matches/${m.id}/edit`)}
                  className="flex-1 border border-gray-300 rounded-xl py-2 text-sm text-gray-700"
                >
                  ✏️ Редактировать
                </button>
                <button
                  onClick={() => navigate(`/admin/matches/${m.id}/result`, { state: { match: m } })}
                  className="flex-1 bg-red-500 text-white rounded-xl py-2 text-sm font-medium"
                >
                  🏁 Завершить
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
