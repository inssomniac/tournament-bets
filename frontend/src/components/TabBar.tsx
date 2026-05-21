import { NavLink } from 'react-router-dom'

const tabs = [
  { path: '/home',        icon: '🏠', label: 'Главная' },
  { path: '/matches',     icon: '🏆', label: 'Матчи' },
  { path: '/balance',     icon: '💰', label: 'Баланс' },
  { path: '/bonuses',     icon: '🎁', label: 'Бонусы' },
  { path: '/leaderboard', icon: '📊', label: 'Рейтинг' },
]

export default function TabBar() {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 flex z-10"
      style={{
        background: 'var(--tg-theme-secondary-bg-color)',
        borderTop: '1px solid var(--tg-separator)',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      }}
    >
      {tabs.map((tab) => (
        <NavLink
          key={tab.path}
          to={tab.path}
          className={({ isActive }) =>
            `flex-1 flex flex-col items-center py-2 text-xs gap-1 transition-colors ${
              isActive ? 'text-tg-link' : 'text-tg-hint'
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
