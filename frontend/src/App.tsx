import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import AuthGate from './components/AuthGate'
import AdminApp from './pages/admin/AdminApp'
import Registration from './pages/twa/Registration'
import Home from './pages/twa/Home'
import Matches from './pages/twa/Matches'
import BetFlow from './pages/twa/BetFlow'
import Balance from './pages/twa/Balance'
import Bonuses from './pages/twa/Bonuses'
import Leaderboard from './pages/twa/Leaderboard'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Admin panel — no AuthGate, AdminApp has its own AdminAuthGate */}
        <Route path="/admin/*" element={<AdminApp />} />

        {/* TWA */}
        <Route element={<AuthGate />}>
          <Route path="/register" element={<Registration />} />
          <Route path="/home" element={<Home />} />
          <Route path="/matches" element={<Matches />} />
          <Route path="/matches/:id" element={<BetFlow />} />
          <Route path="/balance" element={<Balance />} />
          <Route path="/bonuses" element={<Bonuses />} />
          <Route path="/leaderboard" element={<Leaderboard />} />
          <Route path="*" element={<Navigate to="/home" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
