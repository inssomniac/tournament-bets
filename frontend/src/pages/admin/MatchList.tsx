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
              <span className={`text-xs px-2 py-1 rounded-full shrink-0 ${
                m.status === 'finished' ? 'bg-tg-bg text-tg-hint' : 'bg-green-100 text-green-700'
              }`}>
                {m.status === 'finished' ? '✅ Завершён' : '🟢 Активен'}
              </span>
            </div>

            <div className="text-xs text-tg-hint mb-1">
              Коэф: ×{m.odds_team1} / ×{m.odds_team2}
            </div>
            <div className="text-xs text-tg-hint mb-1">
              Дедлайн: {formatDate(m.bet_deadline)}
            </div>
            <div className="text-xs text-tg-hint mb-3">
              Ставок: {m.bets_count} ({m.total_bet_amount} очков)
            </div>

            {m.status === 'finished' ? (
              <p className="text-sm font-medium text-tg-text">
                Победитель: {m.winner === 1 ? m.team1_name : m.team2_name}
              </p>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={() => navigate(`/admin/matches/${m.id}/edit`)}
                  className="flex-1 tg-card text-tg-text text-xs py-2 text-center active:scale-95 transition-transform rounded-xl"
                >
                  ✏️ Редактировать
                </button>
                <button
                  onClick={() => navigate(`/admin/matches/${m.id}/result`, { state: { match: m } })}
                  className="flex-1 bg-red-500 text-white rounded-xl py-2 text-xs font-medium active:scale-95 transition-transform"
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
