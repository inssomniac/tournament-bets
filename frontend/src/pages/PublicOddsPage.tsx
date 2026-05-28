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

export default function PublicOddsPage() {
  const [matches, setMatches] = useState<PublicMatch[]>([])
  const [loading, setLoading] = useState(true)
  const [updatedAt, setUpdatedAt] = useState(new Date())

  const fetchMatches = () => {
    api.get('/public/odds').then(({ data }) => {
      setMatches(data)
      setUpdatedAt(new Date())
    }).finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchMatches()
    const id = setInterval(fetchMatches, 5000)
    return () => clearInterval(id)
  }, [])

  const live = matches.filter((m) => m.status === 'live')
  const open = matches.filter((m) => m.status === 'active')
  const all  = [...live, ...open]

  return (
    <div style={{
      minHeight: '100dvh',
      background: 'var(--lp-bg)',
      display: 'flex',
      flexDirection: 'column',
      fontFamily: "system-ui, sans-serif",
    }}>

      {/* ── HEADER ───────────────────────────────────────────────────── */}
      <div style={{
        background: 'var(--lp-primary)',
        clipPath: 'polygon(0 0, 100% 0, 100% 80%, 0 100%)',
        padding: '32px 48px 64px',
        flexShrink: 0,
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
      }}>
        <div>
          <p style={{
            fontFamily: "'Russo One', sans-serif",
            fontSize: 'clamp(28px, 4vw, 56px)',
            color: 'white',
            lineHeight: 1,
            marginBottom: 8,
          }}>
            ЛЕТНИЙ КУБОК<br />ПО ЛАПТЕ 2026
          </p>
          <p style={{
            fontFamily: "'Oswald', sans-serif",
            fontWeight: 700,
            fontSize: 'clamp(10px, 1.2vw, 14px)',
            color: 'rgba(255,255,255,0.5)',
            letterSpacing: '0.1em',
          }}>
            ДВФУ · ИЮНЬ 2026
          </p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <p style={{
            fontFamily: "'Oswald', sans-serif",
            fontWeight: 700,
            fontSize: 'clamp(10px, 1.1vw, 13px)',
            color: 'rgba(255,255,255,0.4)',
            letterSpacing: '0.08em',
            marginBottom: 4,
          }}>
            ОБНОВЛЕНО
          </p>
          <p style={{
            fontFamily: "'Russo One', sans-serif",
            fontSize: 'clamp(14px, 2vw, 28px)',
            color: 'white',
            letterSpacing: '0.05em',
          }}>
            {formatTime(updatedAt)}
          </p>
        </div>
      </div>

      {/* ── CONTENT ──────────────────────────────────────────────────── */}
      <div style={{
        flex: 1,
        maxWidth: 1400,
        width: '100%',
        margin: '0 auto',
        padding: 'clamp(16px, 3vw, 48px)',
        marginTop: -28,
      }}>
        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 20 }}>
            {[0,1,2].map(i => (
              <div key={i} className="lp-sk" style={{ height: 200, borderRadius: 8 }} />
            ))}
          </div>
        ) : all.length === 0 ? (
          <div style={{ textAlign: 'center', paddingTop: 80 }}>
            <p style={{
              fontFamily: "'Russo One', sans-serif",
              fontSize: 'clamp(18px, 2.5vw, 32px)',
              color: 'var(--lp-muted)',
            }}>НЕТ АКТИВНЫХ МАТЧЕЙ</p>
          </div>
        ) : (
          <>
            {live.length > 0 && (
              <div style={{ marginBottom: 32 }}>
                <p style={{
                  fontFamily: "'Oswald', sans-serif",
                  fontWeight: 700,
                  fontSize: 'clamp(11px, 1vw, 13px)',
                  letterSpacing: '0.12em',
                  color: 'var(--lp-primary)',
                  marginBottom: 14,
                }}>🔴 ИДУТ МАТЧИ</p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 20 }}>
                  {live.map((m) => <MatchCard key={m.id} match={m} />)}
                </div>
              </div>
            )}
            {open.length > 0 && (
              <div>
                <p style={{
                  fontFamily: "'Oswald', sans-serif",
                  fontWeight: 700,
                  fontSize: 'clamp(11px, 1vw, 13px)',
                  letterSpacing: '0.12em',
                  color: 'var(--lp-secondary)',
                  marginBottom: 14,
                }}>🟢 ПРИНИМАЕМ СТАВКИ</p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 20 }}>
                  {open.map((m) => <MatchCard key={m.id} match={m} />)}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* ── MARQUEE ──────────────────────────────────────────────────── */}
      <div className="lp-marquee" style={{ marginTop: 'auto' }}>
        <div className="lp-marquee-track">
          <span className="lp-marquee-text">ЛЕТНИЙ КУБОК ПО ЛАПТЕ 2026 &nbsp;·&nbsp; ДВФУ &nbsp;·&nbsp; ДЕЛАЙ СТАВКИ &nbsp;·&nbsp; ВЫИГРЫВАЙ ОЧКИ &nbsp;·&nbsp; ЛЕТНИЙ КУБОК ПО ЛАПТЕ 2026 &nbsp;·&nbsp; ДВФУ &nbsp;·&nbsp; ДЕЛАЙ СТАВКИ &nbsp;·&nbsp; ВЫИГРЫВАЙ ОЧКИ &nbsp;·&nbsp; ЛЕТНИЙ КУБОК ПО ЛАПТЕ 2026 &nbsp;·&nbsp; ДВФУ &nbsp;·&nbsp; ДЕЛАЙ СТАВКИ &nbsp;·&nbsp; ВЫИГРЫВАЙ ОЧКИ &nbsp;·&nbsp; ЛЕТНИЙ КУБОК ПО ЛАПТЕ 2026 &nbsp;·&nbsp; ДВФУ &nbsp;·&nbsp; ДЕЛАЙ СТАВКИ &nbsp;·&nbsp; ВЫИГРЫВАЙ ОЧКИ &nbsp;·&nbsp; ЛЕТНИЙ КУБОК ПО ЛАПТЕ 2026 &nbsp;·&nbsp; ДВФУ &nbsp;·&nbsp; ДЕЛАЙ СТАВКИ &nbsp;·&nbsp; ВЫИГРЫВАЙ ОЧКИ &nbsp;·&nbsp; ЛЕТНИЙ КУБОК ПО ЛАПТЕ 2026 &nbsp;·&nbsp; ДВФУ &nbsp;·&nbsp; ДЕЛАЙ СТАВКИ &nbsp;·&nbsp; ВЫИГРЫВАЙ ОЧКИ &nbsp;·&nbsp; ЛЕТНИЙ КУБОК ПО ЛАПТЕ 2026 &nbsp;·&nbsp; ДВФУ &nbsp;·&nbsp; ДЕЛАЙ СТАВКИ &nbsp;·&nbsp; ВЫИГРЫВАЙ ОЧКИ &nbsp;·&nbsp; ЛЕТНИЙ КУБОК ПО ЛАПТЕ 2026 &nbsp;·&nbsp; ДВФУ &nbsp;·&nbsp; ДЕЛАЙ СТАВКИ &nbsp;·&nbsp; ВЫИГРЫВАЙ ОЧКИ &nbsp;·&nbsp; </span>
          <span className="lp-marquee-text">ЛЕТНИЙ КУБОК ПО ЛАПТЕ 2026 &nbsp;·&nbsp; ДВФУ &nbsp;·&nbsp; ДЕЛАЙ СТАВКИ &nbsp;·&nbsp; ВЫИГРЫВАЙ ОЧКИ &nbsp;·&nbsp; ЛЕТНИЙ КУБОК ПО ЛАПТЕ 2026 &nbsp;·&nbsp; ДВФУ &nbsp;·&nbsp; ДЕЛАЙ СТАВКИ &nbsp;·&nbsp; ВЫИГРЫВАЙ ОЧКИ &nbsp;·&nbsp; ЛЕТНИЙ КУБОК ПО ЛАПТЕ 2026 &nbsp;·&nbsp; ДВФУ &nbsp;·&nbsp; ДЕЛАЙ СТАВКИ &nbsp;·&nbsp; ВЫИГРЫВАЙ ОЧКИ &nbsp;·&nbsp; ЛЕТНИЙ КУБОК ПО ЛАПТЕ 2026 &nbsp;·&nbsp; ДВФУ &nbsp;·&nbsp; ДЕЛАЙ СТАВКИ &nbsp;·&nbsp; ВЫИГРЫВАЙ ОЧКИ &nbsp;·&nbsp; ЛЕТНИЙ КУБОК ПО ЛАПТЕ 2026 &nbsp;·&nbsp; ДВФУ &nbsp;·&nbsp; ДЕЛАЙ СТАВКИ &nbsp;·&nbsp; ВЫИГРЫВАЙ ОЧКИ &nbsp;·&nbsp; ЛЕТНИЙ КУБОК ПО ЛАПТЕ 2026 &nbsp;·&nbsp; ДВФУ &nbsp;·&nbsp; ДЕЛАЙ СТАВКИ &nbsp;·&nbsp; ВЫИГРЫВАЙ ОЧКИ &nbsp;·&nbsp; ЛЕТНИЙ КУБОК ПО ЛАПТЕ 2026 &nbsp;·&nbsp; ДВФУ &nbsp;·&nbsp; ДЕЛАЙ СТАВКИ &nbsp;·&nbsp; ВЫИГРЫВАЙ ОЧКИ &nbsp;·&nbsp; ЛЕТНИЙ КУБОК ПО ЛАПТЕ 2026 &nbsp;·&nbsp; ДВФУ &nbsp;·&nbsp; ДЕЛАЙ СТАВКИ &nbsp;·&nbsp; ВЫИГРЫВАЙ ОЧКИ &nbsp;·&nbsp; </span>
        </div>
      </div>
    </div>
  )
}

function MatchCard({ match }: { match: PublicMatch }) {
  const isLive     = match.status === 'live'
  const accentColor = isLive ? 'var(--lp-primary)' : 'var(--lp-secondary)'

  return (
    <div style={{
      background: 'white',
      borderRadius: 8,
      overflow: 'hidden',
      boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
      border: '1.5px solid var(--lp-cream-dark)',
      position: 'relative',
    }}>
      {/* Top accent stripe */}
      <div style={{ height: 4, background: accentColor }} />

      {/* Status pill */}
      <div style={{ padding: '12px 16px 0', textAlign: 'center' }}>
        <span style={{
          fontFamily: "'Oswald', sans-serif",
          fontWeight: 700,
          fontSize: 'clamp(10px, 1vw, 13px)',
          letterSpacing: '0.08em',
          background: accentColor,
          color: 'white',
          padding: '4px 14px',
          borderRadius: 3,
          display: 'inline-block',
        }}>
          {isLive ? '🔴 LIVE' : '🟢 OPEN'}
        </span>
      </div>

      {/* Teams + odds */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        padding: 'clamp(12px, 2vw, 24px) clamp(12px, 2vw, 24px)',
        gap: 12,
      }}>
        {/* Team 1 */}
        <div style={{ flex: 1, textAlign: 'right' }}>
          <p style={{
            fontFamily: "'Russo One', sans-serif",
            fontSize: 'clamp(13px, 1.4vw, 18px)',
            color: 'var(--lp-text)',
            marginBottom: 4,
            lineHeight: 1.2,
          }}>{match.team1_name}</p>
          <p style={{
            fontFamily: "'Russo One', sans-serif",
            fontSize: 'clamp(36px, 5vw, 72px)',
            lineHeight: 1,
            color: 'var(--lp-primary)',
          }}>×{match.odds_team1}</p>
        </div>

        {/* VS */}
        <div style={{
          width: 'clamp(36px, 4vw, 56px)',
          height: 'clamp(36px, 4vw, 56px)',
          borderRadius: '50%',
          background: 'var(--lp-bg)',
          border: '2px solid var(--lp-cream-dark)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}>
          <span style={{
            fontFamily: "'Oswald', sans-serif",
            fontWeight: 700,
            fontSize: 'clamp(9px, 1vw, 13px)',
            color: 'var(--lp-muted)',
            letterSpacing: '0.05em',
          }}>VS</span>
        </div>

        {/* Team 2 */}
        <div style={{ flex: 1 }}>
          <p style={{
            fontFamily: "'Russo One', sans-serif",
            fontSize: 'clamp(13px, 1.4vw, 18px)',
            color: 'var(--lp-text)',
            marginBottom: 4,
            lineHeight: 1.2,
          }}>{match.team2_name}</p>
          <p style={{
            fontFamily: "'Russo One', sans-serif",
            fontSize: 'clamp(36px, 5vw, 72px)',
            lineHeight: 1,
            color: 'var(--lp-secondary)',
          }}>×{match.odds_team2}</p>
        </div>
      </div>

      {/* Pool info */}
      {match.bets_count > 0 && (
        <div style={{
          background: 'var(--lp-bg)',
          borderTop: '1px solid var(--lp-cream-dark)',
          padding: '8px 20px',
          display: 'flex',
          justifyContent: 'center',
          gap: 20,
        }}>
          <span style={{ fontFamily: "'Oswald', sans-serif", fontSize: 'clamp(10px, 1vw, 12px)', fontWeight: 700, color: 'var(--lp-muted)', letterSpacing: '0.05em' }}>
            {match.bets_count} ставок
          </span>
          <span style={{ color: 'var(--lp-cream-dark)' }}>·</span>
          <span style={{ fontFamily: "'Oswald', sans-serif", fontSize: 'clamp(10px, 1vw, 12px)', fontWeight: 700, color: 'var(--lp-muted)', letterSpacing: '0.05em' }}>
            {match.total_bets} очков в пуле
          </span>
        </div>
      )}
    </div>
  )
}
