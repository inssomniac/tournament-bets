import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../../api/client'
import { useAppStore } from '../../store/useAppStore'
import TabBar from '../../components/TabBar'

export default function Home() {
  const { user, setUser } = useAppStore()
  const navigate = useNavigate()

  useEffect(() => {
    api.get('/api/users/me').then(({ data }) => setUser(data)).catch(() => {})
  }, [])

  return (
    <div className="flex flex-col min-h-screen pb-16">
      <div className="p-5 flex flex-col gap-6">
        <div className="mt-4">
          <h1 className="text-xl font-bold">🏏 Летний Кубок по лапте 2026</h1>
          {user && (
            <p className="text-gray-600 mt-1">
              Привет, <strong>{user.full_name.split(' ')[1] || user.full_name}</strong>!
            </p>
          )}
        </div>

        <div className="bg-blue-50 rounded-2xl p-5 flex items-center gap-4">
          <span className="text-4xl">💰</span>
          <div>
            <p className="text-sm text-gray-500">Ваш баланс</p>
            <p className="text-2xl font-bold text-blue-600">
              {user?.balance ?? '...'} <span className="text-base font-normal">очков</span>
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {[
            { icon: '🏆', label: 'Матчи', path: '/matches' },
            { icon: '💰', label: 'Баланс', path: '/balance' },
            { icon: '🎁', label: 'Бонусы', path: '/bonuses' },
            { icon: '📊', label: 'Рейтинг', path: '/leaderboard' },
          ].map((item) => (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className="bg-white border border-gray-200 rounded-2xl p-5 flex flex-col items-center gap-2 shadow-sm active:scale-95 transition-transform"
            >
              <span className="text-3xl">{item.icon}</span>
              <span className="font-medium text-gray-700">{item.label}</span>
            </button>
          ))}
        </div>
      </div>
      <TabBar />
    </div>
  )
}
