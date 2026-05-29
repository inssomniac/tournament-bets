import { useEffect, useRef, useState } from 'react'
import { api } from '../../api/client'
import TabBar from '../../components/TabBar'

interface Entry {
  rank: number
  full_name: string
  balance: number
  is_current_user: boolean
}

interface LeaderboardData {
  leaderboard: Entry[]
  current_user_rank: number | null
  total_players: number
}

export default function Leaderboard() {
  const [data, setData] = useState<LeaderboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const myRowRef = useRef<HTMLDivElement>(null)

  const fetchData = () => {
    api.get('/api/leaderboard/')
      .then(({ data }) => setData(data))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 30_000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (data && myRowRef.current) {
      myRowRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, [data])

  const top3    = data?.leaderboard.slice(0, 3) ?? []
  const rest    = data?.leaderboard.slice(3) ?? []
  const myEntry = data?.leaderboard.find((e) => e.is_current_user)
  const myInTop = !!myEntry

  const podiumOrder = top3.length >= 3
    ? [top3[1], top3[0], top3[2]]   // silver, gold, bronze
    : top3

  const podiumHeights = [64, 90, 44]
  const podiumColors  = ['var(--lp-secondary)', 'var(--lp-primary)', 'var(--lp-muted)']
  const podiumMedals  = ['🥈', '🥇', '🥉']

  return (
    <div className="lp-page">
      {/* Diagonal blue header */}
      <div className="lp-hdr lp-hdr--blue lp-hdr--lg">
        <div className="lp-hdr-inner">
          <p className="russo" style={{ fontSize: 36, color: 'white', lineHeight: 1 }}>РЕЙТИНГ</p>
          {!loading && data && (
            <p className="oswald" style={{ fontSize: 11, color: 'rgba(242,230,216,0.5)', letterSpacing: '0.07em', marginTop: 4 }}>
              {data.total_players} УЧАСТНИКОВ
            </p>
          )}
        </div>
      </div>

      <div className="lp-scroll" style={{ marginTop: -8, padding: '24px 16px 24px' }}>
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[0,1,2,3,4,5].map(i => (
              <div key={i} className="lp-sk" style={{ height: 40, borderRadius: 5 }} />
            ))}
          </div>
        ) : (
          <>
            {/* Podium top-3 */}
            {top3.length >= 3 && (
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 5, marginBottom: 18 }}>
                {podiumOrder.map((entry, i) => (
                  <div key={entry.rank} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
                    <p className="oswald" style={{ fontSize: 10, color: 'var(--lp-text)', textAlign: 'center', marginBottom: 2, whiteSpace: 'normal', lineHeight: 1.2, wordBreak: 'break-word', width: '100%', padding: '0 2px' }}>
                      {entry.full_name.split(' ').slice(0,2).join(' ')}
                    </p>
                    <p className="russo" style={{ fontSize: 10, color: podiumColors[i], textAlign: 'center', marginBottom: 3 }}>
                      {entry.balance} 🪙
                    </p>
                    <div style={{
                      width: '100%', background: podiumColors[i], height: podiumHeights[i],
                      borderRadius: '4px 4px 0 0',
                      display: 'flex', alignItems: 'flex-end', justifyContent: 'center', paddingBottom: 5,
                      fontSize: 20,
                    }}>{podiumMedals[i]}</div>
                  </div>
                ))}
              </div>
            )}

            {/* Rows from 4th */}
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {rest.map((entry) => (
                <div
                  key={entry.rank}
                  ref={entry.is_current_user ? myRowRef : undefined}
                  className={`lp-lb-row ${entry.is_current_user ? 'lp-lb-row--me' : ''}`}
                >
                  <span className="russo" style={{ fontSize: 16, color: entry.is_current_user ? 'var(--lp-primary)' : 'var(--lp-muted)', width: 28, textAlign: 'center', flexShrink: 0 }}>
                    #{entry.rank}
                  </span>
                  <span className="oswald" style={{ flex: 1, fontSize: 13, color: entry.is_current_user ? 'var(--lp-primary)' : 'var(--lp-text)', letterSpacing: '0.02em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {entry.full_name}{entry.is_current_user && ' 👈'}
                  </span>
                  <span className={entry.is_current_user ? 'russo' : ''} style={{ fontSize: entry.is_current_user ? 14 : 13, fontWeight: 700, color: entry.is_current_user ? 'var(--lp-primary)' : 'var(--lp-muted)', flexShrink: 0 }}>
                    {entry.balance} 🪙
                  </span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Floating bar when user not in visible list */}
      {!loading && data && !myInTop && data.current_user_rank && (
        <div style={{
          position: 'fixed', left: 0, right: 0,
          bottom: 'calc(60px + env(safe-area-inset-bottom, 0px))',
          padding: '8px 16px',
          background: 'rgba(242,230,216,0.95)',
          borderTop: '1px solid var(--lp-cream-dark)',
          backdropFilter: 'blur(8px)',
        }}>
          <div className="lp-lb-row lp-lb-row--me" style={{ background: 'white' }}>
            <span className="russo" style={{ fontSize: 16, color: 'var(--lp-primary)', width: 28, textAlign: 'center' }}>
              #{data.current_user_rank}
            </span>
            <span className="oswald" style={{ flex: 1, fontSize: 13, color: 'var(--lp-primary)', letterSpacing: '0.04em' }}>ВЫ 👈</span>
          </div>
        </div>
      )}

      <TabBar />
    </div>
  )
}
