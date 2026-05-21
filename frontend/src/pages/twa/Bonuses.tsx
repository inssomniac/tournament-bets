import { useEffect, useState } from 'react'
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
    <div className="flex flex-col min-h-screen pb-16 bg-tg-bg">
      <div className="p-5">
        <h1 className="text-xl font-bold text-tg-text mb-1">🎁 Бонусы</h1>
        <p className="text-sm text-tg-hint mb-5">
          Подпишитесь на каналы и получите дополнительные очки
        </p>

        {loading && <p className="text-tg-hint">Загрузка...</p>}

        {!loading && channels.length === 0 && (
          <p className="text-tg-hint text-center mt-10">Бонусных каналов нет</p>
        )}

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
      </div>
      <TabBar />
    </div>
  )
}
