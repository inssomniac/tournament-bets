import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../../api/client'
import TabBar from '../../components/TabBar'

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
  bet_deadline: string | null
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

function MatchCardSkeleton() {
  return (
    <div className="tg-card">
      <div className="flex justify-between items-center mb-3">
        <div className="sk rounded-full h-5 w-24" />
        <div className="sk rounded-md h-4 w-16" />
      </div>
      <div className="flex gap-2">
        <div className="sk rounded-xl flex-1 h-16" />
        <div className="sk rounded-xl flex-1 h-16" />
      </div>
    </div>
  )
}

export default function Matches() {
  const [matches, setMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    api.get('/api/matches/').then(({ data }) => setMatches(data)).finally(() => setLoading(false))
  }, [])

  const open = matches.filter((m) => m.status === 'active')
  const live = matches.filter((m) => m.status === 'live')
  const closed = matches.filter((m) => m.is_deadline_passed && m.status !== 'live' && m.status !== 'active')

  return (
    <div className="flex flex-col min-h-screen pb-tabbar pt-tg-header bg-tg-bg">
      <div className="p-4">
        <h1 className="text-xl font-bold text-tg-text mb-4">🏆 Матчи</h1>

        {loading && (
          <div className="flex flex-col gap-3">
            <MatchCardSkeleton />
            <MatchCardSkeleton />
            <MatchCardSkeleton />
          </div>
        )}

        {!loading && matches.length === 0 && (
          <p className="text-tg-hint text-center mt-16">Активных матчей нет</p>
        )}

        {!loading && (
          <>
            {/* Live matches */}
            {live.length > 0 && (
              <>
                <p className="text-red-500 text-xs uppercase tracking-wide font-bold mb-2">🔴 Сейчас идут</p>
                <div className="flex flex-col gap-3 mb-4">
                  {live.map((match) => (
                    <MatchCard key={match.id} match={match} navigate={navigate} />
                  ))}
                </div>
              </>
            )}

            {/* Open matches */}
            {open.length > 0 && (
              <>
                {live.length > 0 && <p className="text-tg-hint text-xs uppercase tracking-wide mb-2 mt-2">Принимаем ставки</p>}
                <div className="flex flex-col gap-3 mb-4">
                  {open.map((match) => (
                    <MatchCard key={match.id} match={match} navigate={navigate} />
                  ))}
                </div>
              </>
            )}

            {/* Closed/finished */}
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
          </>
        )}
      </div>
      <TabBar />
    </div>
  )
}

function MatchCard({ match, navigate }: { match: Match; navigate: (path: string, opts?: any) => void }) {
  const isLive = match.status === 'live'
  const isFinished = match.status === 'finished'
  const isClosed = isLive || isFinished

  return (
    <div className="tg-card">
      {/* Status + deadline */}
      <div className="flex justify-between items-center mb-3">
        <span className={`text-xs font-medium px-2 py-1 rounded-full ${
          isFinished ? 'bg-tg-bg text-tg-hint'
          : isLive    ? 'bg-red-100 text-red-600'
          :             'bg-green-100 text-green-700'
        }`}>
          {isFinished ? '✅ Завершён' : isLive ? '🔴 Идёт матч' : '🟢 Открыто'}
        </span>
        {!isFinished && !isLive && match.bet_deadline && (
          <span className="text-xs text-tg-hint">
            ⏰ {formatDeadline(match.bet_deadline)}
          </span>
        )}
        {isLive && (
          <span className="text-xs text-tg-hint">Ставки закрыты</span>
        )}
      </div>

      {/* Teams */}
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
