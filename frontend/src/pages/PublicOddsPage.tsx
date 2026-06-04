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

  // Выбираем количество колонок в зависимости от числа матчей
  const cols = all.length === 1 ? 1 : all.length === 2 ? 2 : 3

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
        clipPath: 'polygon(0 0, 100% 0, 100% 75%, 0 100%)',
        padding: '28px 48px 52px',
        flexShrink: 0,
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        gap: 24,
      }}>
        <div>
          <p style={{
            fontFamily: "'Russo One', sans-serif",
            fontSize: 'clamp(22px, 3vw, 48px)',
            color: 'white',
            lineHeight: 1.1,
            marginBottom: 4,
          }}>
            ЛЕТНИЙ КУБОК ПО ЛАПТЕ 2026
          </p>
          <p style={{
            fontFamily: "'Oswald', sans-serif",
            fontWeight: 700,
            fontSize: 'clamp(11px, 1.1vw, 16px)',
            color: 'rgba(255,255,255,0.45)',
            letterSpacing: '0.12em',
          }}>
            ДВФУ · ИЮНЬ 2026
          </p>
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <p style={{
            fontFamily: "'Oswald', sans-serif",
            fontWeight: 700,
            fontSize: 'clamp(10px, 1vw, 14px)',
            color: 'rgba(255,255,255,0.35)',
            letterSpacing: '0.1em',
            marginBottom: 2,
          }}>
            ОБНОВЛЕНО
          </p>
          <p style={{
            fontFamily: "'Russo One', sans-serif",
            fontSize: 'clamp(18px, 2.5vw, 36px)',
            color: 'white',
            letterSpacing: '0.04em',
          }}>
            {formatTime(updatedAt)}
          </p>
        </div>
      </div>

      {/* ── CONTENT ──────────────────────────────────────────────────── */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        padding: 'clamp(12px, 2vw, 32px) clamp(16px, 3vw, 48px) 0',
        marginTop: -16,
        minHeight: 0,
      }}>
        {loading ? (
          <div style={{ display: 'flex', gap: 20, flex: 1 }}>
            {[0, 1].map(i => (
              <div key={i} className="lp-sk" style={{ flex: 1, borderRadius: 10 }} />
            ))}
          </div>
        ) : all.length === 0 ? (
          <div style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
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
            gap: 'clamp(12px, 1.5vw, 24px)',
            alignItems: 'stretch',
            minHeight: 0,
          }}>
            {all.map((m) => <MatchCard key={m.id} match={m} />)}
          </div>
        )}
      </div>

      {/* ── MARQUEE ──────────────────────────────────────────────────── */}
      <div className="lp-marquee" style={{ marginTop: 'clamp(12px, 1.5vw, 24px)', flexShrink: 0 }}>
        <div className="lp-marquee-track">
          <span className="lp-marquee-text">
            ЛЕТНИЙ КУБОК ПО ЛАПТЕ 2026 &nbsp;·&nbsp; ДВФУ &nbsp;·&nbsp; ДЕЛАЙ ПРЕДСКАЗАНИЯ &nbsp;·&nbsp; ВЫИГРЫВАЙ ОЧКИ &nbsp;·&nbsp;
            ЛЕТНИЙ КУБОК ПО ЛАПТЕ 2026 &nbsp;·&nbsp; ДВФУ &nbsp;·&nbsp; ДЕЛАЙ ПРЕДСКАЗАНИЯ &nbsp;·&nbsp; ВЫИГРЫВАЙ ОЧКИ &nbsp;·&nbsp;
            ЛЕТНИЙ КУБОК ПО ЛАПТЕ 2026 &nbsp;·&nbsp; ДВФУ &nbsp;·&nbsp; ДЕЛАЙ ПРЕДСКАЗАНИЯ &nbsp;·&nbsp; ВЫИГРЫВАЙ ОЧКИ &nbsp;·&nbsp;
            ЛЕТНИЙ КУБОК ПО ЛАПТЕ 2026 &nbsp;·&nbsp; ДВФУ &nbsp;·&nbsp; ДЕЛАЙ ПРЕДСКАЗАНИЯ &nbsp;·&nbsp; ВЫИГРЫВАЙ ОЧКИ &nbsp;·&nbsp;
          </span>
          <span className="lp-marquee-text">
            ЛЕТНИЙ КУБОК ПО ЛАПТЕ 2026 &nbsp;·&nbsp; ДВФУ &nbsp;·&nbsp; ДЕЛАЙ ПРЕДСКАЗАНИЯ &nbsp;·&nbsp; ВЫИГРЫВАЙ ОЧКИ &nbsp;·&nbsp;
            ЛЕТНИЙ КУБОК ПО ЛАПТЕ 2026 &nbsp;·&nbsp; ДВФУ &nbsp;·&nbsp; ДЕЛАЙ ПРЕДСКАЗАНИЯ &nbsp;·&nbsp; ВЫИГРЫВАЙ ОЧКИ &nbsp;·&nbsp;
            ЛЕТНИЙ КУБОК ПО ЛАПТЕ 2026 &nbsp;·&nbsp; ДВФУ &nbsp;·&nbsp; ДЕЛАЙ ПРЕДСКАЗАНИЯ &nbsp;·&nbsp; ВЫИГРЫВАЙ ОЧКИ &nbsp;·&nbsp;
            ЛЕТНИЙ КУБОК ПО ЛАПТЕ 2026 &nbsp;·&nbsp; ДВФУ &nbsp;·&nbsp; ДЕЛАЙ ПРЕДСКАЗАНИЯ &nbsp;·&nbsp; ВЫИГРЫВАЙ ОЧКИ &nbsp;·&nbsp;
          </span>
        </div>
      </div>
    </div>
  )
}

function MatchCard({ match }: { match: PublicMatch }) {
  const isLive      = match.status === 'live'
  const accentColor = isLive ? 'var(--lp-primary)' : 'var(--lp-secondary)'

  return (
    <div style={{
      background: 'white',
      borderRadius: 10,
      overflow: 'hidden',
      boxShadow: '0 4px 24px rgba(0,0,0,0.10)',
      border: '1.5px solid var(--lp-cream-dark)',
      display: 'flex',
      flexDirection: 'column',
      minHeight: 0,
    }}>
      {/* Top accent stripe */}
      <div style={{ height: 6, background: accentColor, flexShrink: 0 }} />

      {/* Status */}
      <div style={{ padding: 'clamp(12px, 1.5vw, 20px) 0 0', textAlign: 'center', flexShrink: 0 }}>
        <span style={{
          fontFamily: "'Oswald', sans-serif",
          fontWeight: 700,
          fontSize: 'clamp(12px, 1.2vw, 18px)',
          letterSpacing: '0.1em',
          background: accentColor,
          color: 'white',
          padding: '5px 20px',
          borderRadius: 3,
          display: 'inline-block',
        }}>
          {isLive ? '🔴 LIVE — МАТЧ ИДЁТ' : '🟢 OPEN — ПРИНИМАЕМ ПРЕДСКАЗАНИЯ'}
        </span>
      </div>

      {/* Teams + odds — main content, fills remaining space */}
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        padding: 'clamp(16px, 2vw, 32px) clamp(20px, 3vw, 48px)',
        gap: 'clamp(12px, 2vw, 32px)',
        minHeight: 0,
      }}>
        {/* Team 1 */}
        <div style={{ flex: 1, textAlign: 'right', minWidth: 0 }}>
          <p style={{
            fontFamily: "'Russo One', sans-serif",
            fontSize: 'clamp(16px, 2.2vw, 36px)',
            color: 'var(--lp-text)',
            lineHeight: 1.2,
            marginBottom: 'clamp(4px, 0.8vw, 12px)',
            wordBreak: 'break-word',
          }}>{match.team1_name}</p>
          <p style={{
            fontFamily: "'Russo One', sans-serif",
            fontSize: 'clamp(48px, 9vw, 140px)',
            lineHeight: 1,
            color: 'var(--lp-primary)',
          }}>×{match.odds_team1}</p>
        </div>

        {/* VS */}
        <div style={{
          width: 'clamp(44px, 5vw, 80px)',
          height: 'clamp(44px, 5vw, 80px)',
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
            fontSize: 'clamp(11px, 1.2vw, 18px)',
            color: 'var(--lp-muted)',
            letterSpacing: '0.05em',
          }}>VS</span>
        </div>

        {/* Team 2 */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{
            fontFamily: "'Russo One', sans-serif",
            fontSize: 'clamp(16px, 2.2vw, 36px)',
            color: 'var(--lp-text)',
            lineHeight: 1.2,
            marginBottom: 'clamp(4px, 0.8vw, 12px)',
            wordBreak: 'break-word',
          }}>{match.team2_name}</p>
          <p style={{
            fontFamily: "'Russo One', sans-serif",
            fontSize: 'clamp(48px, 9vw, 140px)',
            lineHeight: 1,
            color: 'var(--lp-secondary)',
          }}>×{match.odds_team2}</p>
        </div>
      </div>

      {/* Pool info */}
      <div style={{
        background: 'var(--lp-bg)',
        borderTop: '1px solid var(--lp-cream-dark)',
        padding: 'clamp(8px, 1vw, 14px) clamp(20px, 2.5vw, 40px)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 'clamp(12px, 2vw, 32px)',
        flexShrink: 0,
      }}>
        <span style={{
          fontFamily: "'Oswald', sans-serif",
          fontSize: 'clamp(12px, 1.2vw, 18px)',
          fontWeight: 700,
          color: 'var(--lp-muted)',
          letterSpacing: '0.06em',
          whiteSpace: 'nowrap',
        }}>
          👥 {match.bets_count} предсказаний
        </span>
        <span style={{
          width: 4,
          height: 4,
          borderRadius: '50%',
          background: 'var(--lp-cream-dark)',
          flexShrink: 0,
        }} />
        <span style={{
          fontFamily: "'Oswald', sans-serif",
          fontSize: 'clamp(12px, 1.2vw, 18px)',
          fontWeight: 700,
          color: 'var(--lp-muted)',
          letterSpacing: '0.06em',
          whiteSpace: 'nowrap',
        }}>
          💰 {match.total_bets} очков в пуле
        </span>
      </div>
    </div>
  )
}
