import { useNavigate, useLocation } from 'react-router-dom'

const TABS = [
  { path: '/home',        icon: '🏠', label: 'ДОМ' },
  { path: '/matches',     icon: '🏆', label: 'МАТЧИ' },
  { path: '/balance',     icon: '💰', label: 'БАЛАНС' },
  { path: '/bonuses',     icon: '🎁', label: 'БОНУСЫ' },
  { path: '/leaderboard', icon: '📊', label: 'РЕЙТИНГ' },
]

export default function TabBar() {
  const navigate = useNavigate()
  const { pathname } = useLocation()

  return (
    <div className="lp-tabbar">
      {TABS.map((tab) => (
        <div
          key={tab.path}
          className={`lp-tab ${pathname === tab.path ? 'lp-tab--active' : ''}`}
          onClick={() => navigate(tab.path)}
        >
          <span className="lp-tab-icon">{tab.icon}</span>
          <span className="lp-tab-label">{tab.label}</span>
        </div>
      ))}
    </div>
  )
}
