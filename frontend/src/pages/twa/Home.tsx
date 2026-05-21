import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../../api/client'
import { useAppStore } from '../../store/useAppStore'
import TabBar from '../../components/TabBar'

export default function Home() {
  const { user, setUser, isAdmin } = useAppStore()
  const navigate = useNavigate()

  useEffect(() => {
    api.get('/api/users/me').then(({ data }) => setUser(data)).catch(() => {})
  }, [])

  const navItems = [
    { icon: '🏆', label: 'Матчи',   path: '/matches' },
    { icon: '💰', label: 'Баланс',  path: '/balance' },
    { icon: '🎁', label: 'Бонусы',  path: '/bonuses' },
    { icon: '📊', label: 'Рейтинг', path: '/leaderboard' },
  ]

  return (
    <div className="flex flex-col min-h-screen pb-16 bg-tg-bg">
      <div className="p-5 flex flex-col gap-5">
        <div className="mt-4">
          <h1 className="text-xl font-bold text-tg-text">🏏 Летний Кубок по лапте 2026</h1>
          {user && (
            <p className="text-tg-hint mt-1">
              Привет,{' '}
              <span className="font-semibold text-tg-text">
                {user.full_name.split(' ')[1] || user.full_name}
              </span>
              !
            </p>
          )}
        </div>

        {/* Balance card */}
        <div className="tg-card flex items-center gap-4">
          <span className="text-4xl">💰</span>
          <div>
            <p className="text-sm text-tg-hint">Ваш баланс</p>
            <p className="text-2xl font-bold text-tg-link">
              {user?.balance ?? '…'}{' '}
              <span className="text-base font-normal text-tg-hint">очков</span>
            </p>
          </div>
        </div>

        {/* Nav grid */}
        <div className="grid grid-cols-2 gap-3">
          {navItems.map((item) => (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className="tg-card flex flex-col items-center gap-2 py-5 active:scale-95 transition-transform"
            >
              <span className="text-3xl">{item.icon}</span>
              <span className="font-medium text-tg-text text-sm">{item.label}</span>
            </button>
          ))}
        </div>

        {/* Admin panel link — visible only to admins */}
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
      </div>
      <TabBar />
    </div>
  )
}
