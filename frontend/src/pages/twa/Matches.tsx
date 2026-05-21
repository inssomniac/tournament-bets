import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../../api/client'
import TabBar from '../../components/TabBar'
import Spinner from '../../components/Spinner'

interface UserBet {
  team_choice: number
  amount: number
  potential_win: number
  status: string
}

interface Match {
  id: number
  team1_name: string
  team2_name: string
  odds_team1: number
  odds_team2: number
  bet_deadline: string
  status: string
  is_deadline_passed: boolean
  user_bet: UserBet | null
}

function formatDeadline(iso: string): string {
  const d = new Date(iso)
  const now = new Date()
  const diffH = (d.getTime() - now.getTime()) / 3600000
  if (diffH > 0 && diffH < 24) {
    const h = Math.floor(diffH)
    const m = Math.floor((diffH - h) * 60)
    return `через ${h}ч ${m}м`
  }
  return d.toLocaleString('ru-RU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
}

export default function Matches() {
  const [matches, setMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    api.get('/api/matches/').then(({ data }) => setMatches(data)).finally(() => setLoading(false))
  }, [])

  if (loading) return <Spinner />

  const open = matches.filter((m) => !m.is_deadline_passed && m.status !== 'finished')
  const closed = matches.filter((m) => m.is_deadline_passed || m.status === 'finished')

  return (
    <div className="flex flex-col min-h-screen pb-16 bg-tg-bg">
      <div className="p-4">
        <h1 className="text-xl font-bold text-tg-text mb-4">🏆 Матчи</h1>

        {matches.length === 0 && (
          <p className="text-tg-hint text-center mt-16">Активных матчей нет</p>
        )}

        {/* Open matches */}
        {open.length > 0 && (
          <div className="flex flex-col gap-3 mb-4">
            {open.map((match) => (
              <MatchCard key={match.id} match={match} navigate={navigate} />
            ))}
          </div>
        )}

        {/* Closed matches */}
        {closed.length > 0 && (
          <>
            <p className="text-tg-hint text-xs uppercase tracking-wide mb-2 mt-2">Завершённые</p>
            <div className="flex flex-col gap-3">
              {closed.map((match) => (
                <MatchCard key={match.id} match={match} navigate={navigate} />
              ))}
            </div>
          </>
        )}
      </div>
      <TabBar />
    </div>
  )
}

function MatchCard({ match, navigate }: { match: Match; navigate: (path: string, opts?: any) => void }) {
  const isClosed = match.is_deadline_passed || match.status === 'finished'
  const isFinished = match.status === 'finished'

  return (
    <div className="tg-card">
      {/* Status + deadline */}
      <div className="flex justify-between items-center mb-3">
        <span className={`text-xs font-medium px-2 py-1 rounded-full ${
          isFinished ? 'bg-tg-bg text-tg-hint'
          : isClosed  ? 'bg-tg-bg text-tg-hint'
          :             'bg-green-100 text-green-700'
        }`}>
          {isFinished ? '✅ Завершён' : isClosed ? '🔒 Закрыто' : '🟢 Открыто'}
        </span>
        {!isFinished && (
          <span className="text-xs text-tg-hint">
            {isClosed ? 'Ставки закрыты' : `⏰ ${formatDeadline(match.bet_deadline)}`}
          </span>
        )}
      </div>

      {/* Teams — two big tap targets */}
      {!isClosed && !match.user_bet ? (
        <div className="flex gap-2">
          {([1, 2] as const).map((choice) => {
            const name = choice === 1 ? match.team1_name : match.team2_name
            const odds = choice === 1 ? match.odds_team1 : match.odds_team2
            return (
              <button
                key={choice}
                onClick={() => navigate(`/matches/${match.id}`, { state: { match, teamChoice: choice } })}
                className="flex-1 rounded-xl py-4 text-center active:scale-95 transition-transform"
                style={{ background: 'var(--tg-theme-bg-color)' }}
              >
                <p className="font-semibold text-tg-text text-sm leading-tight">{name}</p>
                <p className="text-tg-link font-bold mt-1">× {odds}</p>
              </button>
            )
          })}
        </div>
      ) : (
        /* Closed or already bet — show names inline */
        <div className="flex justify-between items-center">
          <span className="font-semibold text-tg-text text-sm">
            {match.team1_name} <span className="text-tg-hint font-normal">vs</span> {match.team2_name}
          </span>
        </div>
      )}

      {/* Existing bet */}
      {match.user_bet && (
        <div className="mt-3 rounded-xl p-3 bg-green-50">
          <p className="text-green-700 font-medium text-sm">
            ✅ {match.user_bet.team_choice === 1 ? match.team1_name : match.team2_name}
          </p>
          <p className="text-green-600 text-xs mt-0.5">
            {match.user_bet.amount} → {match.user_bet.potential_win} очков потенциально
          </p>
        </div>
      )}
    </div>
  )
}
