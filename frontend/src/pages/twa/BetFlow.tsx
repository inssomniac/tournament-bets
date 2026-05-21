import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { api } from '../../api/client'
import { useAppStore } from '../../store/useAppStore'

export default function BetFlow() {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, updateBalance } = useAppStore()

  const { match, teamChoice } = location.state || {}

  const [amount, setAmount] = useState(100)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  if (!match || !teamChoice) {
    navigate('/matches')
    return null
  }

  const teamName = teamChoice === 1 ? match.team1_name : match.team2_name
  const odds = teamChoice === 1 ? match.odds_team1 : match.odds_team2
  const potentialWin = Math.floor(amount * odds)
  const isValid = amount >= 10 && amount <= 500 && (user?.balance ?? 0) >= amount

  const handleConfirm = async () => {
    setLoading(true)
    setError('')
    try {
      await api.post('/api/bets/', {
        match_id: match.id,
        team_choice: teamChoice,
        amount,
      })
      updateBalance((user?.balance ?? 0) - amount)
      navigate('/matches', { replace: true })
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col min-h-screen p-5 gap-5">
      <button onClick={() => navigate(-1)} className="text-blue-500 text-sm self-start">
        ← Назад
      </button>

      <div>
        <h1 className="text-xl font-bold">{match.team1_name} vs {match.team2_name}</h1>
        <p className="text-gray-500 mt-1">
          Вы выбрали: <strong>{teamName}</strong> (× {odds})
        </p>
      </div>

      <div className="bg-gray-50 rounded-2xl p-4">
        <p className="text-sm text-gray-500 mb-1">Ваш баланс</p>
        <p className="text-2xl font-bold">{user?.balance ?? '...'} очков</p>
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-gray-700">
          Сумма ставки (10 – 500 очков)
        </label>
        <input
          type="number"
          min={10}
          max={Math.min(500, user?.balance ?? 500)}
          value={amount}
          onChange={(e) => setAmount(Number(e.target.value))}
          className="border border-gray-300 rounded-xl px-4 py-3 text-xl font-bold focus:outline-none focus:ring-2 focus:ring-blue-400"
        />

        <div className="flex gap-2 mt-1">
          {[50, 100, 200, 500].map((v) => (
            <button
              key={v}
              onClick={() => setAmount(Math.min(v, user?.balance ?? v))}
              className="flex-1 text-sm bg-gray-100 rounded-lg py-2 text-gray-600 active:bg-gray-200"
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-blue-50 rounded-2xl p-4">
        <p className="text-sm text-gray-500">Потенциальный выигрыш</p>
        <p className="text-2xl font-bold text-blue-600">{potentialWin} очков</p>
      </div>

      {error && <p className="text-red-500 text-sm">{error}</p>}

      <button
        onClick={handleConfirm}
        disabled={!isValid || loading}
        className="bg-blue-500 text-white rounded-xl py-4 font-semibold text-base disabled:opacity-40 mt-auto"
      >
        {loading ? 'Отправка...' : 'Подтвердить ставку'}
      </button>
    </div>
  )
}
