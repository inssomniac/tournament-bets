import { Routes, Route, Navigate, NavLink } from 'react-router-dom'
import AdminAuthGate from '../../components/AdminAuthGate'
import Dashboard from './Dashboard'
import MatchList from './MatchList'
import MatchForm from './MatchForm'
import MatchResult from './MatchResult'
import UserList from './UserList'
import PromoAdmin from './PromoAdmin'

function AdminTabBar() {
  const tabs = [
    { to: '/home',          label: '🏠', text: 'Главная',   end: false },
    { to: '/admin',         label: '📊', text: 'Дашборд',   end: true  },
    { to: '/admin/matches', label: '🏆', text: 'Матчи',     end: false },
    { to: '/admin/users',   label: '👥', text: 'Участники', end: false },
    { to: '/admin/promo',   label: '🎟', text: 'Коды',      end: false },
  ]
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
          key={tab.to}
          to={tab.to}
          end={tab.end}
          className={({ isActive }) =>
            `flex-1 flex flex-col items-center py-2 text-xs gap-1 transition-colors ${
              isActive ? 'text-tg-link' : 'text-tg-hint'
            }`
          }
        >
          <span className="text-xl">{tab.label}</span>
          <span>{tab.text}</span>
        </NavLink>
      ))}
    </nav>
  )
}

export default function AdminApp() {
  return (
    <AdminAuthGate>
      <div className="min-h-screen bg-tg-bg pt-tg-header pb-tabbar">
        <div className="p-4 max-w-2xl mx-auto">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/matches" element={<MatchList />} />
            <Route path="/matches/new" element={<MatchForm />} />
            <Route path="/matches/:id/edit" element={<MatchForm />} />
            <Route path="/matches/:id/result" element={<MatchResult />} />
            <Route path="/users" element={<UserList />} />
            <Route path="/promo" element={<PromoAdmin />} />
            <Route path="*" element={<Navigate to="/admin" replace />} />
          </Routes>
        </div>
        <AdminTabBar />
      </div>
    </AdminAuthGate>
  )
}
