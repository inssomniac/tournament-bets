import { Routes, Route, Navigate, NavLink } from 'react-router-dom'
import AdminAuthGate from '../../components/AdminAuthGate'
import Dashboard from './Dashboard'
import MatchList from './MatchList'
import MatchForm from './MatchForm'
import MatchResult from './MatchResult'
import UserList from './UserList'

function AdminNav() {
  const links = [
    { to: '/admin', label: '📊 Дашборд', end: true },
    { to: '/admin/matches', label: '🏆 Матчи' },
    { to: '/admin/users', label: '👥 Участники' },
  ]
  return (
    <nav className="flex gap-1 p-3 items-center" style={{ background: 'var(--tg-theme-secondary-bg-color)', borderBottom: '1px solid var(--tg-separator)' }}>
      <NavLink
        to="/home"
        className="text-tg-hint text-xs px-2 py-2 rounded-lg hover:text-tg-link transition-colors shrink-0"
        title="На главную"
      >
        🏠
      </NavLink>
      {links.map((l) => (
        <NavLink
          key={l.to}
          to={l.to}
          end={l.end}
          className={({ isActive }) =>
            `flex-1 text-center text-xs px-2 py-2 rounded-lg transition-colors font-medium ${
              isActive
                ? 'bg-tg-btn text-tg-btn-text'
                : 'text-tg-hint'
            }`
          }
        >
          {l.label}
        </NavLink>
      ))}
    </nav>
  )
}

export default function AdminApp() {
  return (
    <AdminAuthGate>
      <div className="min-h-screen bg-tg-bg">
        <AdminNav />
        <div className="p-4 max-w-2xl mx-auto">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/matches" element={<MatchList />} />
            <Route path="/matches/new" element={<MatchForm />} />
            <Route path="/matches/:id/edit" element={<MatchForm />} />
            <Route path="/matches/:id/result" element={<MatchResult />} />
            <Route path="/users" element={<UserList />} />
            <Route path="*" element={<Navigate to="/admin" replace />} />
          </Routes>
        </div>
      </div>
    </AdminAuthGate>
  )
}
