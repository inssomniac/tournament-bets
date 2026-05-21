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

function StatsGridSkeleton() {
  return (
    <div className="grid grid-cols-3 gap-2">
      {[0, 1, 2].map((i) => (
        <div key={i} className="tg-card text-center py-3 flex flex-col items-center gap-2">
          <div className="sk rounded-lg h-7 w-8" />
          <div className="sk rounded-md h-3 w-10" />
        </div>
      ))}
    </div>
  )
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
          bets_won: bets.filter((b: any) => b.status === 'won').length,
          bets_lost: bets.filter((b: any) => b.status === 'lost').length,
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
    <div className="flex flex-col min-h-screen pb-tabbar pt-tg-header bg-tg-bg">
      <div className="p-5 flex flex-col gap-4">

        {/* Greeting + balance */}
        <div className="mt-3">
          <p className="text-tg-hint text-sm">
            {firstName ? `Привет, ${firstName}! 👋` : '👋 Добро пожаловать!'}
          </p>
          <div className="flex items-end gap-2 mt-1">
            <span className="text-4xl font-bold text-tg-text">
              {user?.balance ?? '…'}
            </span>
            <span className="text-tg-hint mb-1">очков</span>
          </div>

          {/* Фиксированная высота — skeleton пока данные грузятся, реальный текст после */}
          <div className="mt-1" style={{ minHeight: '1.25rem' }}>
            {stats === null && <div className="sk rounded-md h-4 w-36" />}
            {stats !== null && stats.rank && (
              <p className="text-tg-link text-sm">
                #{stats.rank} из {stats.total_players} в рейтинге
              </p>
            )}
          </div>
        </div>

        {/* Bet stats or skeleton */}
        {stats ? (
          <div className="grid grid-cols-3 gap-2">
            <div className="tg-card text-center py-3">
              <p className="text-xl font-bold text-green-600">{stats.bets_won}</p>
              <p className="text-xs text-tg-hint">Выиграно</p>
            </div>
            <div className="tg-card text-center py-3">
              <p className="text-xl font-bold text-tg-hint">{stats.bets_pending}</p>
              <p className="text-xs text-tg-hint">В игре</p>
            </div>
            <div className="tg-card text-center py-3">
              <p className="text-xl font-bold text-red-500">{stats.bets_lost}</p>
              <p className="text-xs text-tg-hint">Проиграно</p>
            </div>
          </div>
        ) : (
          <StatsGridSkeleton />
        )}

        {/* CTA */}
        <button
          onClick={() => navigate('/matches')}
          className="tg-btn mt-1"
        >
          🏆 Сделать ставку
        </button>

        {/* Admin */}
        {isAdmin && (
          <button
            onClick={() => navigate('/admin')}
            className="tg-card flex items-center gap-3 active:scale-95 transition-transform"
          >
            <span className="text-2xl">⚙️</span>
            <div className="text-left">
              <p className="font-semibold text-tg-text text-sm">Панель администратора</p>
              <p className="text-tg-hint text-xs">Управление матчами и участниками</p>
            </div>
          </button>
        )}

        {/* Tournament info */}
        <div className="tg-card text-center py-4">
          <p className="text-2xl mb-1">🏏</p>
          <p className="font-semibold text-tg-text text-sm">Летний Кубок по лапте 2026</p>
          <p className="text-tg-hint text-xs mt-1">Университетский турнир</p>
        </div>

      </div>
      <TabBar />
    </div>
  )
}
