import { useEffect, useState } from 'react'
import { api } from '../../api/client'
import { useAppStore } from '../../store/useAppStore'
import TabBar from '../../components/TabBar'

interface BetItem {
  id: number
  match_id: number
  team1_name: string
  team2_name: string
  team_choice: number
  amount: number
  potential_win: number
  status: string
  created_at: string
}

const STATUS: Record<string, { label: string; stripe: string; textColor: string }> = {
  won:     { label: 'ВЫИГРАЛ',  stripe: 'lp-bstripe--won',     textColor: 'var(--lp-secondary)' },
  lost:    { label: 'ПРОИГРАЛ', stripe: 'lp-bstripe--lost',    textColor: 'var(--lp-primary)' },
  pending: { label: 'В ИГРЕ',   stripe: 'lp-bstripe--pending', textColor: 'var(--lp-muted)' },
}

function BetCardSkeleton() {
  return (
    <div style={{ display: 'flex', gap: 12, background: 'white', border: '1.5px solid var(--lp-cream-dark)', borderRadius: 6, padding: 14 }}>
      <div className="lp-sk" style={{ width: 4, height: 64, borderRadius: 2 }} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div className="lp-sk" style={{ height: 14, width: '70%', borderRadius: 4 }} />
        <div className="lp-sk" style={{ height: 12, width: '45%', borderRadius: 4 }} />
        <div className="lp-sk" style={{ height: 20, width: '30%', borderRadius: 4 }} />
      </div>
    </div>
  )
}

export default function Balance() {
  const { user, setUser } = useAppStore()
  const [bets, setBets] = useState<BetItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api.get('/api/users/me').then(({ data }) => setUser(data)),
      api.get('/api/bets/my').then(({ data }) => setBets(data)),
    ]).finally(() => setLoading(false))
  }, [])

  return (
    <div className="lp-page">
      {/* Diagonal blue header */}
      <div className="lp-hdr lp-hdr--blue lp-hdr--lg">
        <div className="lp-hdr-inner">
          <span className="lp-label lp-label--dk" style={{ marginBottom: 4 }}>БАЛАНС</span>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <p className="russo" style={{ fontSize: 54, color: 'white', lineHeight: 1 }}>
              {user?.balance ?? '…'}
            </p>
            <p className="oswald" style={{ color: 'rgba(242,230,216,0.5)', fontSize: 14, letterSpacing: '0.06em' }}>ОЧКОВ</p>
          </div>
        </div>
      </div>

      <div className="lp-scroll" style={{ marginTop: -10, padding: '20px 16px 24px' }}>
        <span className="lp-label">ИСТОРИЯ СТАВОК</span>

        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <BetCardSkeleton /><BetCardSkeleton /><BetCardSkeleton />
          </div>
        ) : bets.length === 0 ? (
          <p className="oswald" style={{ textAlign: 'center', color: 'var(--lp-muted)', marginTop: 40, fontSize: 14, letterSpacing: '0.06em' }}>СТАВОК ЕЩЁ НЕТ</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {bets.map((bet, idx) => {
              const cfg       = STATUS[bet.status] ?? STATUS.pending
              const isTopUp   = idx > 0 && bets[idx - 1].match_id === bet.match_id
              const teamName  = bet.team_choice === 1 ? bet.team1_name : bet.team2_name
              const pillCls   = bet.status === 'won' ? 'lp-pill--won' : bet.status === 'lost' ? 'lp-pill--lost' : 'lp-pill--pending'
              return (
                <div key={bet.id} style={{
                  display: 'flex', gap: 12, background: 'white',
                  border: '1.5px solid var(--lp-cream-dark)', borderRadius: 6, padding: 14,
                  alignItems: 'stretch',
                }}>
                  <div className={`lp-bstripe ${cfg.stripe}`} />
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 3 }}>
                      <p className="oswald" style={{ fontSize: 13, color: 'var(--lp-text)', letterSpacing: '0.03em' }}>
                        {bet.team1_name} vs {bet.team2_name}
                      </p>
                      <span className={`lp-pill ${pillCls}`} style={{ fontSize: 10, padding: '2px 7px', flexShrink: 0, marginLeft: 8 }}>
                        {cfg.label}
                      </span>
                    </div>
                    <p className="oswald" style={{ fontSize: 11, color: 'var(--lp-muted)', marginBottom: 6, letterSpacing: '0.04em' }}>
                      {isTopUp ? '↪ ДОДЕП: ' : 'СТАВКА НА: '}{teamName}
                    </p>
                    {bet.status === 'won' && (
                      <p className="russo" style={{ fontSize: 20, color: cfg.textColor }}>+{bet.potential_win} очков</p>
                    )}
                    {bet.status === 'lost' && (
                      <p className="russo" style={{ fontSize: 20, color: cfg.textColor }}>−{bet.amount} очков</p>
                    )}
                    {bet.status === 'pending' && (
                      <p className="oswald" style={{ fontSize: 12, color: cfg.textColor, letterSpacing: '0.04em' }}>
                        {bet.amount} → {bet.potential_win} ОЧ
                      </p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
      <TabBar />
    </div>
  )
}
