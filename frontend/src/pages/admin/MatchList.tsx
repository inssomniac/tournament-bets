import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../../api/client'
import Spinner from '../../components/Spinner'

interface Match {
  id: number
  team1_name: string
  team2_name: string
  odds_team1: number
  odds_team2: number
  bet_deadline: string | null
  status: string
  winner: number | null
  bets_count: number
  total_bet_amount: number
}

function formatDate(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('ru-RU', {
    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
  })
}

function StatusBadge({ status }: { status: string }) {
  if (status === 'finished') return (
    <span className="text-xs px-2 py-1 rounded-full bg-tg-bg text-tg-hint">✅ Завершён</span>
  )
  if (status === 'live') return (
    <span className="text-xs px-2 py-1 rounded-full bg-red-100 text-red-600 font-medium">🔴 Идёт</span>
  )
  return (
    <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-700">🟢 Ставки открыты</span>
  )
}

export default function MatchList() {
  const [matches, setMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<number | null>(null)
  const [errors, setErrors] = useState<Record<number, string>>({})
  const navigate = useNavigate()

  const reload = () => {
    api.get('/api/admin/matches').then(({ data }) => setMatches(data)).finally(() => setLoading(false))
  }

  useEffect(() => { reload() }, [])

  const goLive = async (id: number) => {
    setActionLoading(id)
    setErrors((e) => ({ ...e, [id]: '' }))
    try {
      await api.post(`/api/admin/matches/${id}/go_live`)
      reload()
    } catch (e: any) {
      setErrors((prev) => ({ ...prev, [id]: e.message }))
    } finally {
      setActionLoading(null)
    }
  }

  return (
    <div className="pt-2">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-lg font-bold text-tg-text">Матчи</h1>
        <button onClick={() => navigate('/admin/matches/new')} className="tg-btn py-2 px-4 text-sm w-auto rounded-xl">
          + Создать
        </button>
      </div>

      {loading && <div className="flex justify-center py-8"><Spinner inline /></div>}
      {!loading && matches.length === 0 && (
        <p className="text-tg-hint text-center mt-10">Матчей ещё нет</p>
      )}

      <div className="flex flex-col gap-3">
        {matches.map((m) => (
          <div key={m.id} className="tg-card">
            <div className="flex justify-between items-start mb-2">
              <h2 className="font-semibold text-tg-text text-sm flex-1 pr-2">
                {m.team1_name} vs {m.team2_name}
              </h2>
              <StatusBadge status={m.status} />
            </div>

            <div className="text-xs text-tg-hint mb-1">
              Коэф: ×{m.odds_team1} / ×{m.odds_team2}
            </div>
            {m.bet_deadline && (
              <div className="text-xs text-tg-hint mb-1">
                Дедлайн: {formatDate(m.bet_deadline)}
              </div>
            )}
            <div className="text-xs text-tg-hint mb-3">
              Ставок: {m.bets_count} ({m.total_bet_amount} очков)
            </div>

            {errors[m.id] && (
              <p className="text-xs text-tg-destructive mb-2">{errors[m.id]}</p>
            )}

            {m.status === 'finished' && (
              <p className="text-sm font-medium text-tg-text">
                🏆 Победитель: {m.winner === 1 ? m.team1_name : m.team2_name}
              </p>
            )}

            {m.status === 'active' && (
              <div className="flex gap-2">
                <button
                  onClick={() => navigate(`/admin/matches/${m.id}/edit`)}
                  className="flex-1 tg-card text-tg-text text-xs py-2 text-center active:scale-95 transition-transform rounded-xl"
                >
                  ✏️ Редактировать
                </button>
                <button
                  onClick={() => goLive(m.id)}
                  disabled={actionLoading === m.id}
                  className="flex-1 bg-orange-500 text-white rounded-xl py-2 text-xs font-medium active:scale-95 transition-transform disabled:opacity-50"
                >
                  {actionLoading === m.id ? '...' : '▶️ Начать матч'}
                </button>
              </div>
            )}

            {m.status === 'live' && (
              <button
                onClick={() => navigate(`/admin/matches/${m.id}/result`, { state: { match: m } })}
                className="w-full bg-red-500 text-white rounded-xl py-2 text-xs font-medium active:scale-95 transition-transform"
              >
                🏁 Записать результат
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
