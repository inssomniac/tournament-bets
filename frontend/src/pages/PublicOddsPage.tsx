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
  const count = all.length

  // Колонки: 1→1, 2→2, 3→3, 4→2, 5+→3
  const cols = count === 1 ? 1 : count === 2 ? 2 : count === 4 ? 2 : 3

  return (
    <div style={{
      height: '100dvh',
      background: 'var(--lp-bg)',
      display: 'flex',
      flexDirection: 'column',
      fontFamily: "system-ui, sans-serif",
      overflow: 'hidden',
    }}>

      {/* ── HEADER ───────────────────────────────────────────────────── */}
      <div style={{
        background: 'var(--lp-primary)',
        clipPath: 'polygon(0 0, 100% 0, 100% 70%, 0 100%)',
        padding: '20px 40px 44px',
        flexShrink: 0,
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        gap: 24,
      }}>
        <div>
          <p style={{
            fontFamily: "'Russo One', sans-serif",
            fontSize: 'clamp(20px, 2.8vw, 44px)',
            color: 'white',
            lineHeight: 1,
            marginBottom: 4,
          }}>
            ЛЕТНИЙ КУБОК ПО ЛАПТЕ 2026
          </p>
          <p style={{
            fontFamily: "'Oswald', sans-serif",
            fontWeight: 700,
            fontSize: 'clamp(10px, 1vw, 14px)',
            color: 'rgba(255,255,255,0.4)',
            letterSpacing: '0.12em',
          }}>
            ДВФУ · ИЮНЬ 2026
          </p>
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <p style={{
            fontFamily: "'Oswald', sans-serif",
            fontWeight: 700,
            fontSize: 'clamp(9px, 0.9vw, 13px)',
            color: 'rgba(255,255,255,0.35)',
            letterSpacing: '0.1em',
            marginBottom: 2,
          }}>ОБНОВЛЕНО</p>
          <p style={{
            fontFamily: "'Russo One', sans-serif",
            fontSize: 'clamp(16px, 2.2vw, 32px)',
            color: 'white',
            letterSpacing: '0.04em',
          }}>{formatTime(updatedAt)}</p>
        </div>
      </div>

      {/* ── CONTENT ──────────────────────────────────────────────────── */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        padding: 'clamp(10px, 1.5vw, 24px) clamp(16px, 2.5vw, 40px) 0',
        marginTop: -14,
        minHeight: 0,
      }}>
        {loading ? (
          <div style={{ display: 'flex', gap: 16, flex: 1 }}>
            {[0, 1].map(i => <div key={i} className="lp-sk" style={{ flex: 1, borderRadius: 10 }} />)}
          </div>
        ) : all.length === 0 ? (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <p style={{
              fontFamily: "'Russo One', sans-serif",
              fontSize: 'clamp(20px, 3vw, 48px)',
              color: 'var(--lp-muted)',
            }}>НЕТ АКТИВНЫХ МАТЧЕЙ</p>
          </div>
        ) : (
          <div style={{
            flex: 1,
            display: 'grid',
            gridTemplateColumns: `repeat(${cols}, 1fr)`,
            gap: 'clamp(10px, 1.2vw, 20px)',
            alignItems: 'stretch',
            minHeight: 0,
          }}>
            {all.map((m) => <MatchCard key={m.id} match={m} count={count} />)}
          </div>
        )}
      </div>

      {/* ── MARQUEE ──────────────────────────────────────────────────── */}
      <div className="lp-marquee" style={{ marginTop: 'clamp(10px, 1.2vw, 20px)', flexShrink: 0 }}>
        <div className="lp-marquee-track">
          {[0, 1].map(i => (
            <span key={i} className="lp-marquee-text">
              ЛЕТНИЙ КУБОК ПО ЛАПТЕ 2026 &nbsp;·&nbsp; ДВФУ &nbsp;·&nbsp; ДЕЛАЙ ПРЕДСКАЗАНИЯ &nbsp;·&nbsp; ВЫИГРЫВАЙ ОЧКИ &nbsp;·&nbsp;
              ЛЕТНИЙ КУБОК ПО ЛАПТЕ 2026 &nbsp;·&nbsp; ДВФУ &nbsp;·&nbsp; ДЕЛАЙ ПРЕДСКАЗАНИЯ &nbsp;·&nbsp; ВЫИГРЫВАЙ ОЧКИ &nbsp;·&nbsp;
              ЛЕТНИЙ КУБОК ПО ЛАПТЕ 2026 &nbsp;·&nbsp; ДВФУ &nbsp;·&nbsp; ДЕЛАЙ ПРЕДСКАЗАНИЯ &nbsp;·&nbsp; ВЫИГРЫВАЙ ОЧКИ &nbsp;·&nbsp;
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}

function MatchCard({ match, count }: { match: PublicMatch; count: number }) {
  const isLive      = match.status === 'live'
  const accentColor = isLive ? 'var(--lp-primary)' : 'var(--lp-secondary)'

  // Масштаб шрифтов адаптируется под кол-во карточек
  const nameSize  = count <= 2 ? 'clamp(18px, 2.4vw, 44px)'  : 'clamp(14px, 1.6vw, 30px)'
  const oddsSize  = count <= 2 ? 'clamp(52px, 7.5vw, 120px)' : 'clamp(36px, 5vw, 80px)'
  const vsSize    = count <= 2 ? 'clamp(44px, 5vw, 76px)'    : 'clamp(32px, 3.5vw, 56px)'
  const vsFont    = count <= 2 ? 'clamp(12px, 1.3vw, 20px)'  : 'clamp(10px, 1vw, 15px)'

  return (
    <div style={{
      background: 'white',
      borderRadius: 10,
      overflow: 'hidden',
      boxShadow: '0 4px 24px rgba(0,0,0,0.10)',
      border: `2px solid ${accentColor}`,
      display: 'flex',
      flexDirection: 'column',
      minHeight: 0,
    }}>
      {/* Status header strip */}
      <div style={{
        background: accentColor,
        padding: 'clamp(6px, 0.8vw, 12px) 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        flexShrink: 0,
      }}>
        <span style={{
          fontFamily: "'Oswald', sans-serif",
          fontWeight: 700,
          fontSize: 'clamp(11px, 1.1vw, 16px)',
          letterSpacing: '0.1em',
          color: 'white',
        }}>
          {isLive ? '🔴 МАТЧ ИДЁТ — LIVE' : '🟢 ПРИНИМАЕМ ПРЕДСКАЗАНИЯ'}
        </span>
      </div>

      {/* Teams + odds */}
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        padding: 'clamp(12px, 1.5vw, 28px) clamp(16px, 2.5vw, 40px)',
        gap: 'clamp(8px, 1.5vw, 24px)',
        minHeight: 0,
      }}>

        {/* Team 1 — right-aligned */}
        <div style={{ flex: 1, textAlign: 'right', minWidth: 0 }}>
          <p style={{
            fontFamily: "'Russo One', sans-serif",
            fontSize: nameSize,
            color: 'var(--lp-text)',
            lineHeight: 1.15,
            marginBottom: 'clamp(2px, 0.5vw, 8px)',
            wordBreak: 'break-word',
            textTransform: 'uppercase',
          }}>{match.team1_name}</p>
          <p style={{
            fontFamily: "'Russo One', sans-serif",
            fontSize: oddsSize,
            lineHeight: 1,
            color: 'var(--lp-primary)',
          }}>×{match.odds_team1}</p>
        </div>

        {/* VS — dark contrasting circle */}
        <div style={{
          width: vsSize,
          height: vsSize,
          minWidth: vsSize,
          borderRadius: '50%',
          background: 'var(--lp-contrast)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
        }}>
          <span style={{
            fontFamily: "'Oswald', sans-serif",
            fontWeight: 700,
            fontSize: vsFont,
            color: 'var(--lp-on-dark)',
            letterSpacing: '0.05em',
          }}>VS</span>
        </div>

        {/* Team 2 — left-aligned */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{
            fontFamily: "'Russo One', sans-serif",
            fontSize: nameSize,
            color: 'var(--lp-text)',
            lineHeight: 1.15,
            marginBottom: 'clamp(2px, 0.5vw, 8px)',
            wordBreak: 'break-word',
            textTransform: 'uppercase',
          }}>{match.team2_name}</p>
          <p style={{
            fontFamily: "'Russo One', sans-serif",
            fontSize: oddsSize,
            lineHeight: 1,
            color: 'var(--lp-secondary)',
          }}>×{match.odds_team2}</p>
        </div>
      </div>

      {/* Pool info */}
      <div style={{
        background: 'var(--lp-bg)',
        borderTop: `1px solid var(--lp-cream-dark)`,
        padding: 'clamp(6px, 0.8vw, 12px) 24px',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 'clamp(12px, 2vw, 28px)',
        flexShrink: 0,
      }}>
        <span style={{
          fontFamily: "'Oswald', sans-serif",
          fontSize: 'clamp(11px, 1vw, 16px)',
          fontWeight: 700,
          color: 'var(--lp-muted)',
          letterSpacing: '0.06em',
          whiteSpace: 'nowrap',
        }}>👥 {match.bets_count} предсказаний</span>
        <span style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--lp-cream-dark)', flexShrink: 0 }} />
        <span style={{
          fontFamily: "'Oswald', sans-serif",
          fontSize: 'clamp(11px, 1vw, 16px)',
          fontWeight: 700,
          color: 'var(--lp-muted)',
          letterSpacing: '0.06em',
          whiteSpace: 'nowrap',
        }}>💰 {match.total_bets} очков в пуле</span>
      </div>
    </div>
  )
}
