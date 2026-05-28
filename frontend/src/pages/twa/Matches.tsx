import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../../api/client'
import TabBar from '../../components/TabBar'

interface UserBet {
  team_choice: number
  amount: number
  potential_win: number
  status: string
  bets_count: number
}

interface Match {
  id: number
  team1_name: string
  team2_name: string
  odds_team1: number
  odds_team2: number
  initial_odds_team1: number
  initial_odds_team2: number
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

function SkeletonCard() {
  return (
    <div className="lp-mc">
      <div className="lp-mc-head lp-mc-head--red" style={{ opacity: 0.4 }}>
        <div className="lp-sk" style={{ width: 72, height: 20, borderRadius: 3 }} />
      </div>
      <div className="lp-mc-body" style={{ display: 'flex', gap: 8 }}>
        <div className="lp-sk" style={{ flex: 1, height: 72, borderRadius: 4 }} />
        <div className="lp-sk" style={{ flex: 1, height: 72, borderRadius: 4 }} />
      </div>
    </div>
  )
}

export default function Matches() {
  const [matches, setMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const fetchMatches = () => {
    api.get('/api/matches/').then(({ data }) => {
      setMatches(data)
      setLoading(false)
    }).catch(() => setLoading(false))
  }

  useEffect(() => {
    fetchMatches()
  }, [])

  useEffect(() => {
    const hasActive = matches.some((m) => m.status === 'active')
    if (hasActive && !intervalRef.current) {
      intervalRef.current = setInterval(fetchMatches, 3000)
    } else if (!hasActive && intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    return () => {
      if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null }
    }
  }, [matches])

  const active   = matches.filter((m) => m.status === 'active')
  const live     = matches.filter((m) => m.status === 'live')
  const finished = matches.filter((m) => m.status === 'finished')
  const totalActive = active.length + live.length

  return (
    <div className="lp-page">
      {/* Diagonal red header — small */}
      <div className="lp-hdr lp-hdr--red lp-hdr--sm">
        <div className="lp-hdr-inner" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <p className="russo" style={{ fontSize: 32, color: 'white', lineHeight: 1 }}>МАТЧИ</p>
          {!loading && (
            <p className="oswald" style={{ fontSize: 11, color: 'rgba(242,230,216,0.55)', letterSpacing: '0.07em' }}>
              {totalActive > 0 ? `${totalActive} активных` : 'нет активных'}
            </p>
          )}
        </div>
      </div>

      <div className="lp-scroll" style={{ marginTop: -8, padding: '20px 16px 24px' }}>
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <SkeletonCard /><SkeletonCard /><SkeletonCard />
          </div>
        ) : matches.length === 0 ? (
          <p style={{ textAlign: 'center', color: 'var(--lp-muted)', marginTop: 40 }}>Матчей нет</p>
        ) : (
          <>
            {live.length > 0 && (
              <>
                <span className="lp-label" style={{ marginBottom: 10 }}>ИДЁТ МАТЧ</span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 16 }}>
                  {live.map((m) => <MatchCard key={m.id} match={m} navigate={navigate} />)}
                </div>
              </>
            )}
            {active.length > 0 && (
              <>
                <span className="lp-label" style={{ marginBottom: 10 }}>ПРИНИМАЕМ СТАВКИ</span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 16 }}>
                  {active.map((m) => <MatchCard key={m.id} match={m} navigate={navigate} />)}
                </div>
              </>
            )}
            {finished.length > 0 && (
              <>
                <div className="lp-marquee" style={{ margin: '0 -16px 12px' }}>
                  <div className="lp-marquee-track">
                    <span className="lp-marquee-text">ЗАВЕРШЁННЫЕ МАТЧИ &nbsp;·&nbsp; РЕЗУЛЬТАТЫ &nbsp;·&nbsp; ФИНАЛ &nbsp;·&nbsp; ЗАВЕРШЁННЫЕ МАТЧИ &nbsp;·&nbsp; РЕЗУЛЬТАТЫ &nbsp;·&nbsp; ФИНАЛ &nbsp;·&nbsp; </span>
                    <span className="lp-marquee-text">ЗАВЕРШЁННЫЕ МАТЧИ &nbsp;·&nbsp; РЕЗУЛЬТАТЫ &nbsp;·&nbsp; ФИНАЛ &nbsp;·&nbsp; ЗАВЕРШЁННЫЕ МАТЧИ &nbsp;·&nbsp; РЕЗУЛЬТАТЫ &nbsp;·&nbsp; ФИНАЛ &nbsp;·&nbsp; </span>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {finished.map((m) => <MatchCard key={m.id} match={m} navigate={navigate} />)}
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

function MatchCard({ match, navigate }: { match: Match; navigate: (p: string, o?: any) => void }) {
  const isLive     = match.status === 'live'
  const isFinished = match.status === 'finished'
  const isClosed   = isLive || isFinished
  const userBet    = match.user_bet

  const headCls = isFinished ? 'lp-mc-head--muted' : isLive ? 'lp-mc-head--red' : 'lp-mc-head--blue'

  return (
    <div className="lp-mc">
      {/* Card header */}
      <div className={`lp-mc-head ${headCls}`}>
        <span className={`lp-pill ${isFinished ? 'lp-pill--done' : isLive ? 'lp-pill--live-hd' : 'lp-pill--open-hd'}`}>
          {isFinished ? '✓ ЗАВЕРШЁН' : isLive ? '🔴 LIVE' : '🟢 OPEN'}
        </span>
        <span style={{ fontSize: 10, color: 'rgba(242,230,216,0.55)' }}>
          {isFinished ? '' : isLive ? 'Ставки закрыты' : match.bet_deadline ? formatDeadline(match.bet_deadline) : ''}
        </span>
      </div>

      <div className="lp-mc-body">
        {/* Teams row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: isClosed ? 0 : 12 }}>
          <div style={{ flex: 1 }}>
            <p className="russo" style={{ fontSize: 14, color: isFinished && userBet?.team_choice === 1 ? 'var(--lp-secondary)' : 'var(--lp-text)' }}>
              {match.team1_name}
            </p>
            <p className="russo" style={{ fontSize: 22, lineHeight: 1, color: 'var(--lp-primary)' }}>
              ×{isClosed ? (isLive ? match.odds_team1 : match.initial_odds_team1) : match.odds_team1}
            </p>
          </div>
          <span className="oswald" style={{ fontSize: 11, color: 'var(--lp-muted)', letterSpacing: '0.1em', flexShrink: 0 }}>VS</span>
          <div style={{ flex: 1, textAlign: 'right' }}>
            <p className="russo" style={{ fontSize: 14, color: isFinished && userBet?.team_choice === 2 ? 'var(--lp-secondary)' : 'var(--lp-text)', textAlign: 'right' }}>
              {match.team2_name}
            </p>
            <p className="russo" style={{ fontSize: 22, lineHeight: 1, color: 'var(--lp-secondary)', textAlign: 'right' }}>
              ×{isClosed ? (isLive ? match.odds_team2 : match.initial_odds_team2) : match.odds_team2}
            </p>
          </div>
        </div>

        {/* Buttons (active only) */}
        {!isClosed && (
          <div style={{ display: 'flex', gap: 8 }}>
            {([1, 2] as const).map((choice) => {
              const name      = choice === 1 ? match.team1_name : match.team2_name
              const isMyTeam  = userBet?.team_choice === choice
              const isOther   = userBet != null && !isMyTeam
              return (
                <div key={choice} style={{ flex: 1, position: 'relative' }}>
                  <button
                    onClick={() => { if (isOther) return; navigate(`/matches/${match.id}`, { state: { match, teamChoice: choice, isTopUp: isMyTeam } }) }}
                    disabled={isOther}
                    className={isMyTeam ? 'lp-btn-outline lp-btn-outline--red' : 'lp-btn-outline'}
                    style={{
                      width: '100%', padding: '9px 6px', fontSize: 12,
                      opacity: isOther ? 0.3 : 1,
                      cursor: isOther ? 'not-allowed' : 'pointer',
                      background: isMyTeam ? 'rgba(217,13,50,0.05)' : 'transparent',
                    }}
                  >
                    {name}
                  </button>
                  {isMyTeam && (
                    <span className="oswald" style={{
                      position: 'absolute', top: -7, right: -3,
                      background: 'var(--lp-primary)', color: 'white',
                      fontSize: 9, padding: '1px 6px', borderRadius: 2, letterSpacing: '0.05em',
                    }}>+ ДОДЕП</span>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* Existing bet summary */}
        {userBet && !isFinished && (
          <div style={{
            marginTop: 10, borderRadius: 4, padding: '8px 12px',
            background: 'rgba(27,101,166,0.08)', borderLeft: '3px solid var(--lp-secondary)',
          }}>
            <p className="oswald" style={{ fontSize: 12, color: 'var(--lp-secondary)', letterSpacing: '0.05em' }}>
              ✓ {userBet.team_choice === 1 ? match.team1_name : match.team2_name}
              {userBet.bets_count > 1 && ` (${userBet.bets_count} ставки)`}
            </p>
            <p style={{ fontSize: 11, color: 'var(--lp-muted)', marginTop: 2 }}>
              {userBet.amount} → {userBet.potential_win} очков
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
