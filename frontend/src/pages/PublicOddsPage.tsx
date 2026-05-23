import { useEffect, useState } from 'react'
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

function MatchCardSkeleton() {
  return (
    <div style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 20, padding: '24px 32px' }}>
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
        <div className="sk" style={{ width: 80, height: 28, borderRadius: 20 }} />
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
          <div className="sk" style={{ width: 120, height: 22, borderRadius: 6 }} />
          <div className="sk" style={{ width: 60, height: 32, borderRadius: 6 }} />
        </div>
        <div className="sk" style={{ width: 40, height: 22, borderRadius: 6, flexShrink: 0 }} />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 8 }}>
          <div className="sk" style={{ width: 120, height: 22, borderRadius: 6 }} />
          <div className="sk" style={{ width: 60, height: 32, borderRadius: 6 }} />
        </div>
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
    <div style={{
      minHeight: '100vh',
      background: '#0d0d0d',
      color: '#f0f0f0',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* Header */}
      <div style={{ textAlign: 'center', padding: '36px 24px 24px' }}>
        <h1 style={{
          fontSize: 'clamp(1.2rem, 4vw, 2rem)',
          fontWeight: 800,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: '#fff',
          margin: 0,
        }}>
          🏏 Летний Кубок по лапте 2026
        </h1>
        <p style={{ color: '#444', fontSize: 13, marginTop: 10 }}>
          {networkError ? '⚠️ ' : ''}
          {lastUpdated ? `Обновлено: ${formatTime(lastUpdated)}` : 'Загрузка...'}
        </p>
      </div>

      {/* Matches */}
      <div style={{ flex: 1, padding: '0 24px 40px', maxWidth: 860, margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>
        {loading && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <MatchCardSkeleton />
            <MatchCardSkeleton />
            <MatchCardSkeleton />
          </div>
        )}

        {!loading && matches.length === 0 && (
          <div style={{ textAlign: 'center', marginTop: 80 }}>
            <p style={{ fontSize: 48, margin: 0 }}>🏏</p>
            <p style={{ color: '#555', fontSize: 18, marginTop: 16 }}>Матчей нет</p>
          </div>
        )}

        {!loading && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {matches.map((match) => {
              const isLive = match.status === 'live'
              return (
                <div
                  key={match.id}
                  style={{
                    background: '#1a1a1a',
                    border: `1px solid ${isLive ? '#ef4444' : '#2a2a2a'}`,
                    borderRadius: 20,
                    padding: '24px 32px',
                  }}
                >
                  {/* Status badge — centered top */}
                  <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
                    <span style={{
                      fontSize: 13,
                      fontWeight: 700,
                      letterSpacing: '0.06em',
                      textTransform: 'uppercase',
                      padding: '5px 18px',
                      borderRadius: 20,
                      background: isLive ? '#ef4444' : '#16a34a',
                      color: '#fff',
                    }}>
                      {isLive ? '🔴 Live' : '🟢 Open'}
                    </span>
                  </div>

                  {/* Teams row: Team1 | VS | Team2 */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    {/* Team 1 — right-aligned */}
                    <div style={{ flex: 1, textAlign: 'right' }}>
                      <p style={{
                        fontSize: 'clamp(0.95rem, 2.5vw, 1.15rem)',
                        fontWeight: 600,
                        color: '#f0f0f0',
                        margin: '0 0 6px',
                        lineHeight: 1.3,
                      }}>
                        {match.team1_name}
                      </p>
                      <p style={{
                        fontSize: 'clamp(1.4rem, 4vw, 2rem)',
                        fontWeight: 800,
                        color: isLive ? '#666' : '#22c55e',
                        margin: 0,
                        fontVariantNumeric: 'tabular-nums',
                      }}>
                        ×{match.odds_team1}
                      </p>
                    </div>

                    {/* VS */}
                    <div style={{
                      flexShrink: 0,
                      width: 48,
                      textAlign: 'center',
                      fontSize: 'clamp(0.9rem, 2vw, 1.1rem)',
                      fontWeight: 700,
                      color: '#444',
                      letterSpacing: '0.04em',
                    }}>
                      VS
                    </div>

                    {/* Team 2 — left-aligned */}
                    <div style={{ flex: 1, textAlign: 'left' }}>
                      <p style={{
                        fontSize: 'clamp(0.95rem, 2.5vw, 1.15rem)',
                        fontWeight: 600,
                        color: '#f0f0f0',
                        margin: '0 0 6px',
                        lineHeight: 1.3,
                      }}>
                        {match.team2_name}
                      </p>
                      <p style={{
                        fontSize: 'clamp(1.4rem, 4vw, 2rem)',
                        fontWeight: 800,
                        color: isLive ? '#666' : '#22c55e',
                        margin: 0,
                        fontVariantNumeric: 'tabular-nums',
                      }}>
                        ×{match.odds_team2}
                      </p>
                    </div>
                  </div>

                  {/* Pool info */}
                  {match.bets_count > 0 && (
                    <p style={{
                      textAlign: 'center',
                      color: '#444',
                      fontSize: 12,
                      marginTop: 16,
                      marginBottom: 0,
                    }}>
                      {match.bets_count} ставок · {match.total_bets} очков в пуле
                    </p>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{ textAlign: 'center', color: '#2a2a2a', fontSize: 12, padding: '0 0 20px' }}>
        авто-обновление каждые 5 секунд
      </div>
    </div>
  )
}
