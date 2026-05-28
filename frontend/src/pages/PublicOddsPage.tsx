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

function MatchSkeleton() {
  return (
    <div style={{ background: 'white', border: '1.5px solid var(--lp-cream-dark)', borderRadius: 6, overflow: 'hidden', marginBottom: 14 }}>
      <div style={{ background: 'var(--lp-primary)', padding: '8px 14px', opacity: 0.3 }}>
        <div className="lp-sk" style={{ width: 72, height: 20, borderRadius: 3 }} />
      </div>
      <div style={{ padding: 16, display: 'flex', gap: 12 }}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
          <div className="lp-sk" style={{ width: 100, height: 16, borderRadius: 4 }} />
          <div className="lp-sk" style={{ width: 60, height: 36, borderRadius: 4 }} />
        </div>
        <div className="lp-sk" style={{ width: 36, height: 36, borderRadius: '50%', flexShrink: 0 }} />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div className="lp-sk" style={{ width: 100, height: 16, borderRadius: 4 }} />
          <div className="lp-sk" style={{ width: 60, height: 36, borderRadius: 4 }} />
        </div>
      </div>
    </div>
  )
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

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--lp-bg)', display: 'flex', flexDirection: 'column' }}>
      {/* Red diagonal header */}
      <div style={{
        background: 'var(--lp-primary)',
        clipPath: 'polygon(0 0, 100% 0, 100% 82%, 0 100%)',
        padding: '28px 20px 52px',
        textAlign: 'center',
        position: 'relative',
        flexShrink: 0,
      }}>
        <p style={{ fontFamily: "'Russo One',sans-serif", fontSize: 22, color: 'white', lineHeight: 1.2, marginBottom: 8 }}>
          ЛЕТНИЙ КУБОК<br />ПО ЛАПТЕ 2026
        </p>
        <p style={{ fontFamily: "'Oswald',sans-serif", fontWeight: 700, fontSize: 11, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.08em' }}>
          Обновлено: {formatTime(updatedAt)}
        </p>
      </div>

      {/* Content */}
      <div style={{ flex: 1, padding: '4px 16px 24px', marginTop: -24 }}>
        {loading ? (
          <><MatchSkeleton /><MatchSkeleton /></>
        ) : matches.length === 0 ? (
          <p style={{ textAlign: 'center', color: 'var(--lp-muted)', marginTop: 40, fontFamily: "'Oswald',sans-serif", fontWeight: 700, fontSize: 14 }}>
            НЕТ АКТИВНЫХ МАТЧЕЙ
          </p>
        ) : (
          <>
            {live.length > 0 && (
              <>
                <span style={{ fontFamily: "'Oswald',sans-serif", fontWeight: 700, fontSize: 11, letterSpacing: '0.1em', color: 'var(--lp-muted)', display: 'block', marginBottom: 10 }}>
                  ИДУТ МАТЧИ
                </span>
                {live.map((m) => <PublicMatchCard key={m.id} match={m} />)}
              </>
            )}
            {open.length > 0 && (
              <>
                {live.length > 0 && (
                  <div style={{ height: 1, background: 'var(--lp-cream-dark)', margin: '4px 0 14px' }} />
                )}
                <span style={{ fontFamily: "'Oswald',sans-serif", fontWeight: 700, fontSize: 11, letterSpacing: '0.1em', color: 'var(--lp-muted)', display: 'block', marginBottom: 10 }}>
                  ПРИНИМАЕМ СТАВКИ
                </span>
                {open.map((m) => <PublicMatchCard key={m.id} match={m} />)}
              </>
            )}
          </>
        )}
      </div>

      {/* Bottom marquee */}
      <div className="lp-marquee" style={{ marginTop: 'auto' }}>
        <div className="lp-marquee-track">
          <span className="lp-marquee-text">ЛЕТНИЙ КУБОК ПО ЛАПТЕ 2026 &nbsp;·&nbsp; DVFU &nbsp;·&nbsp; ДЕЛАЙ СТАВКИ &nbsp;·&nbsp; ВЫИГРЫВАЙ ОЧКИ &nbsp;·&nbsp; ЛЕТНИЙ КУБОК ПО ЛАПТЕ 2026 &nbsp;·&nbsp; DVFU &nbsp;·&nbsp; ДЕЛАЙ СТАВКИ &nbsp;·&nbsp; ВЫИГРЫВАЙ ОЧКИ &nbsp;·&nbsp; </span>
          <span className="lp-marquee-text">ЛЕТНИЙ КУБОК ПО ЛАПТЕ 2026 &nbsp;·&nbsp; DVFU &nbsp;·&nbsp; ДЕЛАЙ СТАВКИ &nbsp;·&nbsp; ВЫИГРЫВАЙ ОЧКИ &nbsp;·&nbsp; ЛЕТНИЙ КУБОК ПО ЛАПТЕ 2026 &nbsp;·&nbsp; DVFU &nbsp;·&nbsp; ДЕЛАЙ СТАВКИ &nbsp;·&nbsp; ВЫИГРЫВАЙ ОЧКИ &nbsp;·&nbsp; </span>
        </div>
      </div>
    </div>
  )
}

function PublicMatchCard({ match }: { match: PublicMatch }) {
  const isLive = match.status === 'live'
  const headColor = isLive ? 'var(--lp-primary)' : 'var(--lp-secondary)'

  return (
    <div style={{ background: 'white', border: '1.5px solid var(--lp-cream-dark)', borderRadius: 6, overflow: 'hidden', marginBottom: 14, position: 'relative' }}>
      {/* Top accent */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: headColor }} />
      {/* Status */}
      <div style={{ padding: '10px 14px 4px', textAlign: 'center' }}>
        <span style={{
          fontFamily: "'Oswald',sans-serif", fontWeight: 700, fontSize: 11,
          background: headColor, color: 'white',
          padding: '3px 10px', borderRadius: 3, letterSpacing: '0.07em',
        }}>
          {isLive ? '🔴 LIVE' : '🟢 OPEN'}
        </span>
      </div>
      {/* Teams + odds */}
      <div style={{ padding: '10px 16px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ flex: 1, textAlign: 'right' }}>
          <p style={{ fontFamily: "'Russo One',sans-serif", fontSize: 14, color: 'var(--lp-text)' }}>{match.team1_name}</p>
          <p style={{ fontFamily: "'Russo One',sans-serif", fontSize: 36, lineHeight: 1, color: 'var(--lp-primary)' }}>×{match.odds_team1}</p>
        </div>
        <div style={{
          width: 36, height: 36, borderRadius: '50%',
          background: 'var(--lp-bg)', border: '2px solid var(--lp-cream-dark)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          <span style={{ fontFamily: "'Oswald',sans-serif", fontWeight: 700, fontSize: 10, color: 'var(--lp-muted)', letterSpacing: '0.05em' }}>VS</span>
        </div>
        <div style={{ flex: 1 }}>
          <p style={{ fontFamily: "'Russo One',sans-serif", fontSize: 14, color: 'var(--lp-text)' }}>{match.team2_name}</p>
          <p style={{ fontFamily: "'Russo One',sans-serif", fontSize: 36, lineHeight: 1, color: 'var(--lp-secondary)' }}>×{match.odds_team2}</p>
        </div>
      </div>
      {/* Pool info */}
      {match.bets_count > 0 && (
        <div style={{ background: 'var(--lp-bg)', borderTop: '1px solid var(--lp-cream-dark)', padding: '6px 16px', display: 'flex', justifyContent: 'center', gap: 16 }}>
          <p style={{ fontFamily: "'Oswald',sans-serif", fontSize: 11, color: 'var(--lp-muted)', fontWeight: 700, letterSpacing: '0.05em' }}>{match.bets_count} ставок</p>
          <p style={{ fontFamily: "'Oswald',sans-serif", fontSize: 11, color: 'var(--lp-muted)', fontWeight: 700 }}>·</p>
          <p style={{ fontFamily: "'Oswald',sans-serif", fontSize: 11, color: 'var(--lp-muted)', fontWeight: 700, letterSpacing: '0.05em' }}>{match.total_bets} очков в пуле</p>
        </div>
      )}
    </div>
  )
}
