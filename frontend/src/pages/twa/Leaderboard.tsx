import { useEffect, useRef, useState } from 'react'
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

  // scroll to current user row on first load
  useEffect(() => {
    if (data && myRowRef.current) {
      myRowRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, [data])

  const myEntry = data?.leaderboard.find((e) => e.is_current_user)
  const myInTop = myEntry !== undefined

  return (
    <div className="flex flex-col min-h-screen pb-tabbar pt-tg-header bg-tg-bg">
      <div className="p-4">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-xl font-bold text-tg-text">📊 Рейтинг</h1>
          {data && (
            <span className="text-sm text-tg-hint">{data.total_players} участников</span>
          )}
        </div>

        {loading && <Spinner />}

        <div className="flex flex-col gap-2">
          {data?.leaderboard.map((entry) => (
            <div
              key={entry.rank}
              ref={entry.is_current_user ? myRowRef : undefined}
              className={`flex items-center gap-3 p-3 rounded-xl ${
                entry.is_current_user
                  ? 'ring-2 ring-tg-link bg-tg-sbg'
                  : 'bg-tg-sbg'
              }`}
            >
              <span className="text-base font-bold w-8 text-center shrink-0 text-tg-text">
                {rankMedal(entry.rank)}
              </span>
              <span className={`flex-1 text-sm font-medium truncate ${
                entry.is_current_user ? 'text-tg-link' : 'text-tg-text'
              }`}>
                {entry.full_name}
                {entry.is_current_user && ' 👈'}
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

      {/* Pinned row for users outside top list */}
      {!loading && data && !myInTop && data.current_user_rank && (
        <div
          className="fixed left-0 right-0 px-4 py-2"
          style={{
            bottom: 'calc(4rem + env(safe-area-inset-bottom, 0px))',
            background: 'var(--tg-theme-secondary-bg-color)',
            borderTop: '1px solid var(--tg-separator)',
          }}
        >
          <div className="flex items-center gap-3 p-2 rounded-xl ring-2 ring-tg-link bg-tg-bg">
            <span className="text-base font-bold w-8 text-center shrink-0 text-tg-text">
              #{data.current_user_rank}
            </span>
            <span className="flex-1 text-sm font-medium text-tg-link truncate">
              Вы 👈
              </span>
          </div>
        </div>
      )}

      <TabBar />
    </div>
  )
}
