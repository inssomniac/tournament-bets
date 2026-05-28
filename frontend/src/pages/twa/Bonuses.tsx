import { useRef, useState } from 'react'
import { api } from '../../api/client'
import { useAppStore } from '../../store/useAppStore'
import TabBar from '../../components/TabBar'

type RedeemState = 'idle' | 'loading' | 'success' | 'error'

export default function Bonuses() {
  const [code, setCode]       = useState('')
  const [state, setState]     = useState<RedeemState>('idle')
  const [message, setMessage] = useState('')
  const { updateBalance }     = useAppStore()
  const inputRef              = useRef<HTMLInputElement>(null)

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

  return (
    <div className="lp-page">
      <div className="lp-hdr lp-hdr--blue lp-hdr--sm">
        <div className="lp-hdr-inner">
          <p className="russo" style={{ fontSize: 32, color: 'white', lineHeight: 1 }}>БОНУСЫ</p>
          <p className="oswald" style={{ fontSize: 11, color: 'rgba(242,230,216,0.55)', letterSpacing: '0.07em', marginTop: 4 }}>
            Введи промокод — получи очки
          </p>
        </div>
      </div>

      <div className="lp-scroll" style={{ marginTop: -16, padding: '20px 16px 32px' }}>

        <div className="lp-card lp-card--blue" style={{ marginBottom: 20 }}>
          <p className="russo" style={{ fontSize: 16, color: 'var(--lp-text)', marginBottom: 14 }}>
            🎟 АКТИВИРОВАТЬ ПРОМОКОД
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

        <div className="lp-marquee" style={{ margin: '0 -16px 24px' }}>
          <div className="lp-marquee-inner">
            <span className="lp-marquee-text">
              ПРОМОКОД · ОЧКИ · СТАВКИ · ПОБЕДА ·
              ПРОМОКОД · ОЧКИ · СТАВКИ · ПОБЕДА ·
            </span>
          </div>
        </div>

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
