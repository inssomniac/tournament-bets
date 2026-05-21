import { NavLink } from 'react-router-dom'

const tabs = [
  { path: '/matches', icon: '🏆', label: 'Матчи' },
  { path: '/balance', icon: '💰', label: 'Баланс' },
  { path: '/bonuses', icon: '🎁', label: 'Бонусы' },
  { path: '/leaderboard', icon: '📊', label: 'Рейтинг' },
]

export default function TabBar() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex z-10">
      {tabs.map((tab) => (
        <NavLink
          key={tab.path}
          to={tab.path}
          className={({ isActive }) =>
            `flex-1 flex flex-col items-center py-2 text-xs gap-1 transition-colors ${
              isActive ? 'text-blue-500' : 'text-gray-400'
            }`
          }
        >
          <span className="text-xl">{tab.icon}</span>
          <span>{tab.label}</span>
        </NavLink>
      ))}
    </nav>
  )
}
