import { useEffect, useRef, useState } from 'react'
import { api } from '../../api/client'
import { useAppStore } from '../../store/useAppStore'
import TabBar from '../../components/TabBar'

interface Channel {
  id: number
  channel_name: string
  channel_url: string
  bonus_points: number
  is_claimed: boolean
}

type RedeemState = 'idle' | 'loading' | 'success' | 'error'

function PromoSection() {
  const [code, setCode] = useState('')
  const [state, setState] = useState<RedeemState>('idle')
  const [message, setMessage] = useState('')
  const { updateBalance } = useAppStore()
  const inputRef = useRef<HTMLInputElement>(null)

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
      setMessage(e.message || 'Ошибка')
    }
  }

  const handleChange = (v: string) => {
    setCode(v.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 5))
    if (state !== 'idle') { setState('idle'); setMessage('') }
  }

  return (
    <div className="lp-card lp-card--blue" style={{ marginBottom: 16 }}>
      <p className="russo" style={{ fontSize: 16, color: 'var(--lp-text)', marginBottom: 12 }}>🎟 АКТИВИРОВАТЬ ПРОМОКОД</p>
      <div style={{ display: 'flex', gap: 8 }}>
        <input
          ref={inputRef}
          className="lp-inp"
          placeholder="AB1C2"
          value={code}
          maxLength={5}
          onChange={(e) => handleChange(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && code.length === 5 && handleRedeem()}
          style={{ flex: 1, fontFamily: 'monospace', fontSize: 22, textAlign: 'center', letterSpacing: '0.2em', fontWeight: 700, textTransform: 'uppercase' }}
        />
        <button
          className="lp-btn"
          onClick={handleRedeem}
          disabled={code.length !== 5 || state === 'loading'}
          style={{ width: 'auto', padding: '0 14px', fontSize: 13 }}
        >
          {state === 'loading' ? '...' : 'ВВЕСТИ'}
        </button>
      </div>
      {message && (
        <p style={{ fontSize: 13, marginTop: 8, color: state === 'success' ? 'var(--lp-secondary)' : 'var(--lp-primary)', fontWeight: 600 }}>
          {message}
        </p>
      )}
    </div>
  )
}

export default function Bonuses() {
  const [channels, setChannels] = useState<Channel[]>([])
  const [loading, setLoading] = useState(true)
  const [claiming, setClaiming] = useState<number | null>(null)
  const [messages, setMessages] = useState<Record<number, string>>({})
  const { updateBalance } = useAppStore()

  useEffect(() => {
    api.get('/api/bonuses/channels')
      .then(({ data }) => setChannels(data))
      .finally(() => setLoading(false))
  }, [])

  const handleClaim = async (channel: Channel) => {
    setClaiming(channel.id)
    setMessages((m) => ({ ...m, [channel.id]: '' }))
    try {
      const { data } = await api.post(`/api/bonuses/claim/${channel.id}`)
      updateBalance(data.new_balance)
      setChannels((prev) => prev.map((ch) => ch.id === channel.id ? { ...ch, is_claimed: true } : ch))
      setMessages((m) => ({ ...m, [channel.id]: `+${data.bonus_points} очков получено!` }))
    } catch (e: any) {
      setMessages((m) => ({ ...m, [channel.id]: e.message }))
    } finally {
      setClaiming(null)
    }
  }

  return (
    <div className="lp-page">
      {/* Diagonal blue header */}
      <div className="lp-hdr lp-hdr--blue lp-hdr--sm">
        <div className="lp-hdr-inner" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <p className="russo" style={{ fontSize: 32, color: 'white', lineHeight: 1 }}>БОНУСЫ</p>
          <p className="oswald" style={{ fontSize: 11, color: 'rgba(242,230,216,0.55)', letterSpacing: '0.07em' }}>
            Промокоды и подписки
          </p>
        </div>
      </div>

      <div className="lp-scroll" style={{ marginTop: -22, padding: '12px 16px 24px' }}>
        <PromoSection />

        <div className="lp-marquee" style={{ margin: '0 -16px 16px' }}>
          <div className="lp-marquee-inner">
            <span className="lp-marquee-text">
              ПОДПИШИСЬ &nbsp;·&nbsp; ПОЛУЧИ ОЧКИ &nbsp;·&nbsp; ПОДПИШИСЬ &nbsp;·&nbsp; ПОЛУЧИ ОЧКИ &nbsp;·&nbsp;
              ПОДПИШИСЬ &nbsp;·&nbsp; ПОЛУЧИ ОЧКИ &nbsp;·&nbsp; ПОДПИШИСЬ &nbsp;·&nbsp; ПОЛУЧИ ОЧКИ &nbsp;·&nbsp;
            </span>
          </div>
        </div>

        {loading && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[0,1].map(i => <div key={i} className="lp-sk" style={{ height: 100, borderRadius: 6 }} />)}
          </div>
        )}

        {!loading && channels.length === 0 && (
          <p style={{ textAlign: 'center', color: 'var(--lp-muted)', marginTop: 20 }}>Бонусных каналов нет</p>
        )}

        {!loading && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {channels.map((ch) => (
              <div key={ch.id} className="lp-card" style={{ opacity: ch.is_claimed ? 0.55 : 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: ch.is_claimed ? 0 : 12 }}>
                  <div>
                    <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--lp-text)', marginBottom: 2 }}>{ch.channel_name}</p>
                    <p className="russo" style={{ fontSize: 26, color: 'var(--lp-secondary)', lineHeight: 1 }}>+{ch.bonus_points} ОЧКОВ</p>
                  </div>
                  {ch.is_claimed && (
                    <span className="lp-pill lp-pill--won">✓ ПОЛУЧЕНО</span>
                  )}
                </div>
                {!ch.is_claimed && (
                  <div style={{ display: 'flex', gap: 8 }}>
                    <a
                      href={ch.channel_url}
                      target="_blank"
                      rel="noreferrer"
                      className="lp-btn-outline"
                      style={{ flex: 1, display: 'block', textDecoration: 'none', padding: '10px 8px', fontSize: 12 }}
                    >ПОДПИСАТЬСЯ</a>
                    <button
                      className="lp-btn"
                      onClick={() => handleClaim(ch)}
                      disabled={claiming === ch.id}
                      style={{ flex: 1, padding: '10px 8px', fontSize: 12 }}
                    >
                      {claiming === ch.id ? '...' : 'ПОЛУЧИТЬ'}
                    </button>
                  </div>
                )}
                {messages[ch.id] && (
                  <p style={{ fontSize: 12, marginTop: 8, color: messages[ch.id].startsWith('+') ? 'var(--lp-secondary)' : 'var(--lp-primary)' }}>
                    {messages[ch.id]}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
      <TabBar />
    </div>
  )
}
