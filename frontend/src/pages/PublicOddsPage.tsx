import { useEffect, useRef, useState } from 'react'
import { api } from '../api/client'

interface PublicMatch {
  id: number
  team1_name: string
  team2_name: string
  odds_team1: number
  odds_team2: number
  status: string
  total_bets: number
  bets_count: number
}

function formatTime(d: Date): string {
  return d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

function MatchRowSkeleton() {
  return (
    <div
      className="flex items-center gap-4 px-6 py-5 rounded-2xl"
      style={{ background: '#1a1a1a' }}
    >
      <div className="flex-1 flex flex-col gap-2">
        <div className="sk rounded-md h-5 w-48" />
        <div className="sk rounded-md h-3 w-24" />
      </div>
      <div className="flex gap-6 shrink-0">
        <div className="sk rounded-lg h-10 w-20" />
        <div className="sk rounded-lg h-10 w-20" />
      </div>
    </div>
  )
}

export default function PublicOddsPage() {
  const [matches, setMatches] = useState<PublicMatch[]>([])
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [networkError, setNetworkError] = useState(false)

  const fetchData = () => {
    api.get('/public/odds')
      .then(({ data }) => {
        setMatches(data)
        setLastUpdated(new Date())
        setNetworkError(false)
      })
      .catch(() => setNetworkError(true))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 5000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: '#0d0d0d', color: '#f0f0f0', fontFamily: 'system-ui, sans-serif' }}
    >
      {/* Header */}
      <div
        className="px-6 py-5 flex justify-between items-center"
        style={{ borderBottom: '1px solid #222' }}
      >
        <div>
          <h1 className="text-2xl font-bold tracking-tight">🏏 Летний Кубок по лапте 2026</h1>
          <p className="text-sm mt-0.5" style={{ color: '#666' }}>Университетский турнир — коэффициенты</p>
        </div>
        <div className="text-right">
          {lastUpdated && (
            <p className="text-sm tabular-nums" style={{ color: '#888' }}>
              {networkError ? '⚠️ ' : ''}Обновлено: {formatTime(lastUpdated)}
            </p>
          )}
          {loading && !lastUpdated && (
            <p className="text-sm" style={{ color: '#555' }}>Загрузка...</p>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 px-6 py-6 flex flex-col gap-4">
        {loading && (
          <>
            <MatchRowSkeleton />
            <MatchRowSkeleton />
            <MatchRowSkeleton />
          </>
        )}

        {!loading && matches.length === 0 && (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <p className="text-5xl mb-4">🏏</p>
              <p className="text-xl font-semibold" style={{ color: '#888' }}>Матчей нет</p>
              <p className="text-sm mt-1" style={{ color: '#555' }}>Ожидайте начала турнира</p>
            </div>
          </div>
        )}

        {!loading && matches.map((match) => {
          const isLive = match.status === 'live'
          return (
            <div
              key={match.id}
              className="flex items-center gap-4 px-6 py-5 rounded-2xl"
              style={{ background: '#1a1a1a', border: isLive ? '1px solid #ef4444' : '1px solid #222' }}
            >
              {/* Status badge */}
              <div className="shrink-0 w-20 text-center">
                {isLive ? (
                  <span
                    className="text-xs font-bold px-2 py-1 rounded-full"
                    style={{ background: '#ef4444', color: '#fff' }}
                  >
                    🔴 LIVE
                  </span>
                ) : (
                  <span
                    className="text-xs font-bold px-2 py-1 rounded-full"
                    style={{ background: '#16a34a', color: '#fff' }}
                  >
                    🟢 OPEN
                  </span>
                )}
              </div>

              {/* Teams + stats */}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-lg truncate" style={{ color: '#f0f0f0' }}>
                  {match.team1_name}
                  <span style={{ color: '#555', margin: '0 8px' }}>vs</span>
                  {match.team2_name}
                </p>
                <p className="text-xs mt-0.5" style={{ color: '#555' }}>
                  {match.bets_count} ставок · {match.total_bets} очков в пуле
                </p>
              </div>

              {/* Odds */}
              <div className="flex gap-3 shrink-0">
                <OddsBlock label={match.team1_name} odds={match.odds_team1} isLive={isLive} />
                <OddsBlock label={match.team2_name} odds={match.odds_team2} isLive={isLive} />
              </div>
            </div>
          )
        })}
      </div>

      {/* Footer */}
      <div
        className="px-6 py-3 text-center text-xs"
        style={{ color: '#333', borderTop: '1px solid #1a1a1a' }}
      >
        Авто-обновление каждые 5 секунд
      </div>
    </div>
  )
}

function OddsBlock({ label, odds, isLive }: { label: string; odds: number; isLive: boolean }) {
  return (
    <div
      className="flex flex-col items-center px-4 py-2 rounded-xl min-w-[80px]"
      style={{ background: '#111' }}
    >
      <p className="text-xs truncate max-w-[72px] text-center" style={{ color: '#666' }}>{label}</p>
      <p
        className="text-2xl font-bold tabular-nums mt-0.5"
        style={{ color: isLive ? '#888' : '#22c55e' }}
      >
        ×{odds}
      </p>
    </div>
  )
}
