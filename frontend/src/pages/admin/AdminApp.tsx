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
    <nav className="bg-gray-900 text-white px-4 py-3 flex gap-4 items-center">
      <span className="font-bold text-sm mr-2">⚙️ Организатор</span>
      {links.map((l) => (
        <NavLink
          key={l.to}
          to={l.to}
          end={l.end}
          className={({ isActive }) =>
            `text-sm px-3 py-1 rounded-lg transition-colors ${isActive ? 'bg-white text-gray-900 font-medium' : 'text-gray-300 hover:text-white'}`
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
      <div className="min-h-screen bg-gray-50">
        <AdminNav />
        <div className="p-5 max-w-4xl mx-auto">
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
