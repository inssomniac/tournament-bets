import { useEffect, useState } from 'react'
import { api } from '../../api/client'
import TabBar from '../../components/TabBar'
import Spinner from '../../components/Spinner'

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

const rankMedal = (rank: number) => {
  if (rank === 1) return '🥇'
  if (rank === 2) return '🥈'
  if (rank === 3) return '🥉'
  return `#${rank}`
}

export default function Leaderboard() {
  const [data, setData] = useState<LeaderboardData | null>(null)
  const [loading, setLoading] = useState(true)

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

  return (
    <div className="flex flex-col min-h-screen pb-16 bg-tg-bg">
      <div className="p-5">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-xl font-bold text-tg-text">📊 Лидерборд</h1>
          {data && (
            <span className="text-sm text-tg-hint">{data.total_players} участников</span>
          )}
        </div>

        {data?.current_user_rank && (
          <div className="tg-card mb-4 text-sm font-medium text-tg-link">
            Ваша позиция: #{data.current_user_rank}
          </div>
        )}

        {loading && <div className="flex justify-center py-8"><Spinner inline /></div>}

        <div className="flex flex-col gap-2">
          {data?.leaderboard.map((entry) => (
            <div
              key={entry.rank}
              className={`flex items-center gap-3 p-3 rounded-xl ${
                entry.is_current_user ? 'bg-tg-sbg ring-2 ring-tg-link' : 'bg-tg-sbg'
              }`}
            >
              <span className="text-lg font-bold w-8 text-center shrink-0 text-tg-text">
                {rankMedal(entry.rank)}
              </span>
              <span className={`flex-1 text-sm font-medium truncate ${
                entry.is_current_user ? 'text-tg-link' : 'text-tg-text'
              }`}>
                {entry.full_name}
                {entry.is_current_user && ' (вы)'}
              </span>
              <span className={`text-sm font-bold shrink-0 ${
                entry.is_current_user ? 'text-tg-link' : 'text-tg-hint'
              }`}>
                {entry.balance} 🪙
              </span>
            </div>
          ))}
        </div>
      </div>
      <TabBar />
    </div>
  )
}
