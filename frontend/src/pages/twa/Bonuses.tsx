import { useEffect, useRef, useState } from 'react'
import { api } from '../../api/client'
import { useAppStore } from '../../store/useAppStore'
import TabBar from '../../components/TabBar'

type RedeemState = 'idle' | 'loading' | 'success' | 'error'
type ClaimState = 'idle' | 'loading' | 'success' | 'error' | 'not_subscribed'

interface BonusChannel {
  id: number
  channel_name: string
  channel_url: string
  bonus_points: number
  is_claimed: boolean
}

export default function Bonuses() {
  const [code, setCode]       = useState('')
  const [state, setState]     = useState<RedeemState>('idle')
  const [message, setMessage] = useState('')
  const { updateBalance }     = useAppStore()
  const inputRef              = useRef<HTMLInputElement>(null)

  const [channels, setChannels]         = useState<BonusChannel[]>([])
  const [claimStates, setClaimStates]   = useState<Record<number, ClaimState>>({})
  const [claimMessages, setClaimMessages] = useState<Record<number, string>>({})

  useEffect(() => {
    api.get('/api/bonuses/channels').then(({ data }) => setChannels(data)).catch(() => {})
  }, [])

  const handleRedeem = async () => {
    if (!code.trim()) return
    setState('loading')
    setMessage('')
    try {
      const { data } = await api.post('/api/bonuses/redeem', { code: code.trim() })
      updateBalance(data.new_balance)
      setState('success')
      setMessage(`+${data.amount} очков зачислено!`)
      setCode('')
    } catch (e: any) {
      setState('error')
      setMessage(e.message || 'Неверный или уже использованный промокод')
    }
  }

  const handleChange = (v: string) => {
    setCode(v.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 5))
    if (state !== 'idle') { setState('idle'); setMessage('') }
  }

  const handleClaim = async (ch: BonusChannel) => {
    if (ch.is_claimed || claimStates[ch.id] === 'loading') return
    setClaimStates(s => ({ ...s, [ch.id]: 'loading' }))
    setClaimMessages(s => ({ ...s, [ch.id]: '' }))
    try {
      const { data } = await api.post(`/api/bonuses/claim/${ch.id}`, {})
      updateBalance(data.new_balance)
      setChannels(cs => cs.map(c => c.id === ch.id ? { ...c, is_claimed: true } : c))
      setClaimStates(s => ({ ...s, [ch.id]: 'success' }))
      setClaimMessages(s => ({ ...s, [ch.id]: `+${data.bonus_points} очков!` }))
    } catch (e: any) {
      const msg = e.message || ''
      if (msg.includes('не подписаны') || msg.includes('400')) {
        setClaimStates(s => ({ ...s, [ch.id]: 'not_subscribed' }))
        setClaimMessages(s => ({ ...s, [ch.id]: 'Сначала подпишись на канал' }))
      } else {
        setClaimStates(s => ({ ...s, [ch.id]: 'error' }))
        setClaimMessages(s => ({ ...s, [ch.id]: msg || 'Ошибка' }))
      }
    }
  }

  return (
    <div className="lp-page">
      <div className="lp-hdr lp-hdr--blue lp-hdr--sm">
        <div className="lp-hdr-inner">
          <p className="russo" style={{ fontSize: 36, color: 'white', lineHeight: 1 }}>БОНУСЫ</p>
          <p className="oswald" style={{ fontSize: 11, color: 'rgba(242,230,216,0.55)', letterSpacing: '0.07em', marginTop: 4 }}>
            Промокоды и подписки
          </p>
        </div>
      </div>

      <div className="lp-scroll" style={{ marginTop: -16, padding: '20px 16px 32px' }}>

        {/* Промокод */}
        <div className="lp-card lp-card--blue" style={{ marginBottom: 20 }}>
          <p className="russo" style={{ fontSize: 16, color: 'var(--lp-text)', marginBottom: 14 }}>
            АКТИВИРОВАТЬ ПРОМОКОД
          </p>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              ref={inputRef}
              className="lp-inp"
              placeholder="AB1C2"
              value={code}
              maxLength={5}
              onChange={(e) => handleChange(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && code.length === 5 && handleRedeem()}
              style={{
                flex: 1,
                fontFamily: 'monospace',
                fontSize: 24,
                textAlign: 'center',
                letterSpacing: '0.25em',
                fontWeight: 700,
                textTransform: 'uppercase',
              }}
            />
            <button
              className="lp-btn lp-btn--blue"
              onClick={handleRedeem}
              disabled={code.length !== 5 || state === 'loading'}
              style={{ width: 'auto', padding: '0 16px', fontSize: 13 }}
            >
              {state === 'loading' ? '...' : 'ВВЕСТИ'}
            </button>
          </div>
          {message && (
            <p
              className="oswald"
              style={{
                fontSize: 14,
                marginTop: 10,
                color: state === 'success' ? 'var(--lp-secondary)' : 'var(--lp-primary)',
                letterSpacing: '0.04em',
              }}
            >
              {state === 'success' ? '✓ ' : '✕ '}{message}
            </p>
          )}
        </div>

        <div className="lp-marquee" style={{ margin: '0 -16px 20px' }}>
          <div className="lp-marquee-track">
            <span className="lp-marquee-text">ПРОМОКОД &nbsp;·&nbsp; ОЧКИ &nbsp;·&nbsp; СТАВКИ &nbsp;·&nbsp; ПОБЕДА &nbsp;·&nbsp; ПРОМОКОД &nbsp;·&nbsp; ОЧКИ &nbsp;·&nbsp; СТАВКИ &nbsp;·&nbsp; ПОБЕДА &nbsp;·&nbsp; ПРОМОКОД &nbsp;·&nbsp; ОЧКИ &nbsp;·&nbsp; СТАВКИ &nbsp;·&nbsp; ПОБЕДА &nbsp;·&nbsp; ПРОМОКОД &nbsp;·&nbsp; ОЧКИ &nbsp;·&nbsp; СТАВКИ &nbsp;·&nbsp; ПОБЕДА &nbsp;·&nbsp; ПРОМОКОД &nbsp;·&nbsp; ОЧКИ &nbsp;·&nbsp; СТАВКИ &nbsp;·&nbsp; ПОБЕДА &nbsp;·&nbsp; ПРОМОКОД &nbsp;·&nbsp; ОЧКИ &nbsp;·&nbsp; СТАВКИ &nbsp;·&nbsp; ПОБЕДА &nbsp;·&nbsp; </span>
            <span className="lp-marquee-text">ПРОМОКОД &nbsp;·&nbsp; ОЧКИ &nbsp;·&nbsp; СТАВКИ &nbsp;·&nbsp; ПОБЕДА &nbsp;·&nbsp; ПРОМОКОД &nbsp;·&nbsp; ОЧКИ &nbsp;·&nbsp; СТАВКИ &nbsp;·&nbsp; ПОБЕДА &nbsp;·&nbsp; ПРОМОКОД &nbsp;·&nbsp; ОЧКИ &nbsp;·&nbsp; СТАВКИ &nbsp;·&nbsp; ПОБЕДА &nbsp;·&nbsp; ПРОМОКОД &nbsp;·&nbsp; ОЧКИ &nbsp;·&nbsp; СТАВКИ &nbsp;·&nbsp; ПОБЕДА &nbsp;·&nbsp; ПРОМОКОД &nbsp;·&nbsp; ОЧКИ &nbsp;·&nbsp; СТАВКИ &nbsp;·&nbsp; ПОБЕДА &nbsp;·&nbsp; ПРОМОКОД &nbsp;·&nbsp; ОЧКИ &nbsp;·&nbsp; СТАВКИ &nbsp;·&nbsp; ПОБЕДА &nbsp;·&nbsp; </span>
          </div>
        </div>

        {/* Бонусные каналы */}
        {channels.length > 0 && (
          <>
            <p className="lp-label" style={{ marginBottom: 10 }}>ПОДПИШИСЬ — ПОЛУЧИ ОЧКИ</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
              {channels.map((ch) => {
                const cs = claimStates[ch.id] || 'idle'
                const cm = claimMessages[ch.id] || ''
                const claimed = ch.is_claimed || cs === 'success'
                return (
                  <div key={ch.id} className="lp-card lp-card--none"
                    style={{ background: 'white', padding: '14px 16px' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: claimed ? 0 : 10 }}>
                      <span style={{ fontSize: 28, flexShrink: 0 }}>📢</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p className="russo" style={{ fontSize: 14, color: 'var(--lp-text)', lineHeight: 1.2 }}>
                          {ch.channel_name}
                        </p>
                        <p className="oswald" style={{ fontSize: 12, color: 'var(--lp-secondary)', letterSpacing: '0.04em', marginTop: 2 }}>
                          +{ch.bonus_points} ОЧКОВ
                        </p>
                      </div>
                      {claimed && (
                        <span className="lp-pill lp-pill--won" style={{ flexShrink: 0 }}>✓ ПОЛУЧЕНО</span>
                      )}
                    </div>

                    {!claimed && (
                      <div style={{ display: 'flex', gap: 8 }}>
                        <a
                          href={ch.channel_url}
                          target="_blank"
                          rel="noreferrer"
                          style={{ flex: 1, textDecoration: 'none' }}
                        >
                          <button className="lp-btn-outline" style={{ width: '100%', fontSize: 12, padding: '9px 8px' }}>
                            ПОДПИСАТЬСЯ
                          </button>
                        </a>
                        <button
                          className="lp-btn lp-btn--blue"
                          onClick={() => handleClaim(ch)}
                          disabled={cs === 'loading'}
                          style={{ flex: 1, fontSize: 12, padding: '9px 8px' }}
                        >
                          {cs === 'loading' ? '...' : 'ПОЛУЧИТЬ'}
                        </button>
                      </div>
                    )}

                    {cm && !claimed && (
                      <p className="oswald" style={{
                        fontSize: 11, marginTop: 8, letterSpacing: '0.04em',
                        color: cs === 'not_subscribed' || cs === 'error' ? 'var(--lp-primary)' : 'var(--lp-secondary)',
                      }}>
                        {'✕ '}{cm}
                      </p>
                    )}
                  </div>
                )
              })}
            </div>
          </>
        )}

        <div className="lp-card lp-card--none" style={{ background: 'var(--lp-bg)', border: '1.5px solid var(--lp-cream-dark)' }}>
          <p className="oswald" style={{ fontSize: 13, color: 'var(--lp-muted)', letterSpacing: '0.04em', lineHeight: 1.6 }}>
            Промокоды выдаются организаторами турнира за активность, победы и специальные события. Следи за объявлениями!
          </p>
        </div>

      </div>
      <TabBar />
    </div>
  )
}
