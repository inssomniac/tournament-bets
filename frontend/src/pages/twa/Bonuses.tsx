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

function ChannelCardSkeleton() {
  return (
    <div className="tg-card flex flex-col gap-3">
      <div className="flex justify-between items-center">
        <div className="flex flex-col gap-2">
          <div className="sk rounded-md h-5 w-36" />
          <div className="sk rounded-md h-4 w-20" />
        </div>
      </div>
      <div className="flex gap-2">
        <div className="sk rounded-xl flex-1 h-10" />
        <div className="sk rounded-xl flex-1 h-10" />
      </div>
    </div>
  )
}

// ── Промокод ──────────────────────────────────────────────────────────────────

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
    <div className="tg-card mb-5">
      <p className="font-semibold text-tg-text text-sm mb-3">🎟 Промокод</p>
      <div className="flex gap-2">
        <input
          ref={inputRef}
          className="tg-input flex-1 font-mono tracking-widest text-center text-lg uppercase"
          placeholder="AB1C2"
          value={code}
          maxLength={5}
          onChange={(e) => handleChange(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && code.length === 5 && handleRedeem()}
        />
        <button
          onClick={handleRedeem}
          disabled={code.length !== 5 || state === 'loading'}
          className="tg-btn w-auto px-4 py-3 text-sm rounded-xl disabled:opacity-40"
        >
          {state === 'loading' ? '...' : 'Активировать'}
        </button>
      </div>
      {message && (
        <p className={`text-sm mt-2 ${state === 'success' ? 'text-green-600 font-medium' : 'text-tg-destructive'}`}>
          {message}
        </p>
      )}
    </div>
  )
}

// ── Главная страница ───────────────────────────────────────────────────────────

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
      setChannels((prev) =>
        prev.map((ch) => ch.id === channel.id ? { ...ch, is_claimed: true } : ch)
      )
      setMessages((m) => ({ ...m, [channel.id]: `+${data.bonus_points} очков получено!` }))
    } catch (e: any) {
      setMessages((m) => ({ ...m, [channel.id]: e.message }))
    } finally {
      setClaiming(null)
    }
  }

  return (
    <div className="flex flex-col min-h-screen pb-tabbar pt-tg-header bg-tg-bg">
      <div className="p-5">
        <h1 className="text-xl font-bold text-tg-text mb-1">🎁 Бонусы</h1>
        <p className="text-sm text-tg-hint mb-5">
          Подпишитесь на каналы или введите промокод
        </p>

        {/* Промокод — всегда сверху */}
        <PromoSection />

        {/* Каналы */}
        {loading && (
          <div className="flex flex-col gap-4">
            <ChannelCardSkeleton />
            <ChannelCardSkeleton />
          </div>
        )}

        {!loading && channels.length === 0 && (
          <p className="text-tg-hint text-center mt-6">Бонусных каналов нет</p>
        )}

        {!loading && (
          <div className="flex flex-col gap-4">
            {channels.map((ch) => (
              <div key={ch.id} className="tg-card">
                <div className="flex justify-between items-center mb-3">
                  <div>
                    <p className="font-semibold text-tg-text">{ch.channel_name}</p>
                    <p className="text-tg-link font-bold text-sm">+{ch.bonus_points} 🪙</p>
                  </div>
                  {ch.is_claimed && (
                    <span className="text-green-600 text-sm font-medium">✅ Получено</span>
                  )}
                </div>

                {!ch.is_claimed && (
                  <div className="flex gap-2">
                    <a
                      href={ch.channel_url}
                      target="_blank"
                      rel="noreferrer"
                      className="flex-1 text-center tg-btn-outline py-2"
                    >
                      Подписаться
                    </a>
                    <button
                      onClick={() => handleClaim(ch)}
                      disabled={claiming === ch.id}
                      className="flex-1 tg-btn py-2 text-sm rounded-xl disabled:opacity-50"
                    >
                      {claiming === ch.id ? '...' : 'Получить'}
                    </button>
                  </div>
                )}

                {messages[ch.id] && (
                  <p className={`text-sm mt-2 ${
                    messages[ch.id].startsWith('+') ? 'text-green-600' : 'text-tg-destructive'
                  }`}>
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
