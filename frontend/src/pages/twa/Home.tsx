import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../../api/client'
import { useAppStore } from '../../store/useAppStore'
import TabBar from '../../components/TabBar'

interface MyStats {
  bets_won: number
  bets_lost: number
  bets_pending: number
  rank: number | null
  total_players: number
}

export default function Home() {
  const { user, setUser, isAdmin } = useAppStore()
  const navigate = useNavigate()
  const [stats, setStats] = useState<MyStats | null>(null)

  useEffect(() => {
    api.get('/api/users/me').then(({ data }) => setUser(data)).catch(() => {})
    api.get('/api/leaderboard/').then(({ data }) => {
      const rank = data.current_user_rank ?? null
      const total = data.total_players ?? 0
      api.get('/api/bets/my').then(({ data: bets }) => {
        setStats({
          bets_won:     bets.filter((b: any) => b.status === 'won').length,
          bets_lost:    bets.filter((b: any) => b.status === 'lost').length,
          bets_pending: bets.filter((b: any) => b.status === 'pending').length,
          rank,
          total_players: total,
        })
      }).catch(() => {
        setStats({ bets_won: 0, bets_lost: 0, bets_pending: 0, rank, total_players: total })
      })
    }).catch(() => {})
  }, [])

  const firstName = user?.full_name.split(' ')[1] || user?.full_name.split(' ')[0] || ''

  return (
    <div className="lp-page">
      {/* Diagonal red header */}
      <div className="lp-hdr lp-hdr--red lp-hdr--lg">
        <div className="lp-hdr-inner">
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 3 }}>
            <p className="russo" style={{ fontSize: 54, color: 'white', lineHeight: 1 }}>
              {user?.balance ?? '…'}
            </p>
            <p style={{ color: 'rgba(242,230,216,0.5)', fontSize: 14 }}>очков</p>
          </div>
          {stats?.rank ? (
            <p style={{ color: 'rgba(242,230,216,0.8)', fontSize: 13 }}>
              #{stats.rank} из {stats.total_players} в рейтинге
            </p>
          ) : (
            <div className="lp-sk" style={{ height: 16, width: 140, borderRadius: 4 }} />
          )}
        </div>
      </div>

      {/* Content */}
      <div className="lp-scroll" style={{ marginTop: -10, padding: '20px 16px 24px' }}>
        {/* Stats grid */}
        {stats ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, marginBottom: 16 }}>
            {[
              { value: stats.bets_won,     label: 'Выиграно',  color: 'var(--lp-secondary)', top: 'var(--lp-secondary)' },
              { value: stats.bets_pending, label: 'В игре',    color: 'var(--lp-text)',      top: 'var(--lp-muted)' },
              { value: stats.bets_lost,    label: 'Проиграно', color: 'var(--lp-primary)',   top: 'var(--lp-primary)' },
            ].map(({ value, label, color, top }) => (
              <div key={label} className="lp-card" style={{ padding: '14px 6px', textAlign: 'center' }}>
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: top }} />
                <p className="russo" style={{ fontSize: 36, color, lineHeight: 1 }}>{value}</p>
                <p style={{ fontSize: 10, color: 'var(--lp-muted)', marginTop: 2 }}>{label}</p>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, marginBottom: 16 }}>
            {[0,1,2].map(i => (
              <div key={i} className="lp-sk" style={{ height: 72, borderRadius: 6 }} />
            ))}
          </div>
        )}

        <button className="lp-btn" onClick={() => navigate('/matches')} style={{ marginBottom: 16 }}>
          СДЕЛАТЬ СТАВКУ
        </button>

        {/* Marquee */}
        <div className="lp-marquee" style={{ margin: '0 -16px 16px' }}>
          <div className="lp-marquee-track">
            <span className="lp-marquee-text">СТАВКИ &nbsp;·&nbsp; МАТЧИ &nbsp;·&nbsp; ОЧКИ &nbsp;·&nbsp; ЛАПТА &nbsp;·&nbsp; ПОБЕДА &nbsp;·&nbsp; СТАВКИ &nbsp;·&nbsp; МАТЧИ &nbsp;·&nbsp; ОЧКИ &nbsp;·&nbsp; ЛАПТА &nbsp;·&nbsp; ПОБЕДА &nbsp;·&nbsp; СТАВКИ &nbsp;·&nbsp; МАТЧИ &nbsp;·&nbsp; ОЧКИ &nbsp;·&nbsp; ЛАПТА &nbsp;·&nbsp; ПОБЕДА &nbsp;·&nbsp; СТАВКИ &nbsp;·&nbsp; МАТЧИ &nbsp;·&nbsp; ОЧКИ &nbsp;·&nbsp; ЛАПТА &nbsp;·&nbsp; ПОБЕДА &nbsp;·&nbsp; </span>
            <span className="lp-marquee-text">СТАВКИ &nbsp;·&nbsp; МАТЧИ &nbsp;·&nbsp; ОЧКИ &nbsp;·&nbsp; ЛАПТА &nbsp;·&nbsp; ПОБЕДА &nbsp;·&nbsp; СТАВКИ &nbsp;·&nbsp; МАТЧИ &nbsp;·&nbsp; ОЧКИ &nbsp;·&nbsp; ЛАПТА &nbsp;·&nbsp; ПОБЕДА &nbsp;·&nbsp; СТАВКИ &nbsp;·&nbsp; МАТЧИ &nbsp;·&nbsp; ОЧКИ &nbsp;·&nbsp; ЛАПТА &nbsp;·&nbsp; ПОБЕДА &nbsp;·&nbsp; СТАВКИ &nbsp;·&nbsp; МАТЧИ &nbsp;·&nbsp; ОЧКИ &nbsp;·&nbsp; ЛАПТА &nbsp;·&nbsp; ПОБЕДА &nbsp;·&nbsp; </span>
          </div>
        </div>

        {/* Admin shortcut */}
        {isAdmin && (
          <button
            className="lp-card"
            onClick={() => navigate('/admin')}
            style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12,
              cursor: 'pointer', border: 'none', textAlign: 'left', marginBottom: 12 }}
          >
            <span style={{ fontSize: 24 }}>⚙️</span>
            <div>
              <p className="oswald" style={{ fontSize: 14, color: 'var(--lp-text)', letterSpacing: '0.04em' }}>
                ПАНЕЛЬ АДМИНИСТРАТОРА
              </p>
              <p style={{ fontSize: 11, color: 'var(--lp-muted)', marginTop: 2 }}>Управление матчами и участниками</p>
            </div>
          </button>
        )}

        {/* Tournament card */}
        <div style={{ background: 'var(--lp-primary)', borderRadius: 6, padding: 16, textAlign: 'center' }}>
          <p className="russo" style={{ fontSize: 18, color: 'white', lineHeight: 1.25 }}>
            ЛЕТНИЙ КУБОК<br />ПО ЛАПТЕ 2026
          </p>
          <p className="oswald" style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', letterSpacing: '0.07em', marginTop: 6 }}>
            ДВФУ · ИЮНЬ 2026
          </p>
        </div>
      </div>

      <TabBar />
    </div>
  )
}
