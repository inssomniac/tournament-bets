import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { api } from '../../api/client'
import { useAppStore } from '../../store/useAppStore'

const PRESETS = [50, 100, 250, 500]
const MIN = 50
const STEP = 50

export default function BetFlow() {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, updateBalance } = useAppStore()

  const { match, teamChoice } = location.state || {}

  const [amount, setAmount] = useState(100)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  if (!match || !teamChoice) {
    navigate('/matches')
    return null
  }

  const teamName = teamChoice === 1 ? match.team1_name : match.team2_name
  const odds = teamChoice === 1 ? match.odds_team1 : match.odds_team2
  const maxAllowed = user?.balance ?? 0
  const potentialWin = Math.floor(amount * odds)
  const isValid = amount >= MIN && amount <= maxAllowed

  const adjust = (delta: number) => {
    setAmount((prev) => Math.max(MIN, Math.min(maxAllowed, prev + delta)))
  }

  const handleConfirm = async () => {
    setLoading(true)
    setError('')
    try {
      await api.post('/api/bets/', { match_id: match.id, team_choice: teamChoice, amount })
      updateBalance((user?.balance ?? 0) - amount)
      setSuccess(true)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="flex flex-col min-h-screen p-5 gap-5 bg-tg-bg items-center justify-center text-center pt-tg-header">
        <div className="text-6xl">✅</div>
        <div>
          <h2 className="text-xl font-bold text-tg-text">Ставка принята!</h2>
          <p className="text-tg-hint mt-1 text-sm">
            {amount} очков на{' '}
            <span className="font-semibold text-tg-text">{teamName}</span>
          </p>
        </div>
        <div className="tg-card w-full text-center">
          <p className="text-tg-hint text-sm">Потенциальный выигрыш</p>
          <p className="text-3xl font-bold text-tg-link">{potentialWin} 🪙</p>
        </div>
        <button onClick={() => navigate('/matches', { replace: true })} className="tg-btn w-full">
          К матчам
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen p-5 gap-5 bg-tg-bg pt-tg-header">
      <button onClick={() => navigate(-1)} className="text-tg-link text-sm self-start">
        ← Назад
      </button>

      <div>
        <p className="text-tg-hint text-xs">{match.team1_name} vs {match.team2_name}</p>
        <h1 className="text-xl font-bold text-tg-text mt-0.5">
          За <span className="text-tg-link">{teamName}</span>
        </h1>
        <p className="text-tg-hint text-sm">Коэффициент × {odds}</p>
      </div>

      <div className="tg-card flex justify-between items-center">
        <span className="text-tg-hint text-sm">Ваш баланс</span>
        <span className="font-bold text-tg-text">{user?.balance ?? '…'} очков</span>
      </div>

      <div className="tg-card flex flex-col items-center gap-4 py-6">
        <p className="text-tg-hint text-xs uppercase tracking-wide">Сумма ставки</p>
        <div className="flex items-center gap-6">
          <button
            onClick={() => adjust(-STEP)}
            disabled={amount <= MIN}
            className="w-12 h-12 rounded-full text-2xl font-bold disabled:opacity-30 active:scale-90 transition-transform"
            style={{ background: 'var(--tg-theme-bg-color)', color: 'var(--tg-theme-text-color)' }}
          >
            −
          </button>
          <span className="text-5xl font-bold text-tg-text w-32 text-center tabular-nums">
            {amount}
          </span>
          <button
            onClick={() => adjust(+STEP)}
            disabled={amount >= maxAllowed}
            className="w-12 h-12 rounded-full text-2xl font-bold disabled:opacity-30 active:scale-90 transition-transform"
            style={{ background: 'var(--tg-theme-bg-color)', color: 'var(--tg-theme-text-color)' }}
          >
            +
          </button>
        </div>

        <div className="flex gap-2 w-full">
          {PRESETS.filter((v) => v <= maxAllowed).map((v) => (
            <button
              key={v}
              onClick={() => setAmount(v)}
              className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all active:scale-95 ${
                amount === v ? 'bg-tg-btn text-tg-btn-text' : 'bg-tg-bg text-tg-hint'
              }`}
            >
              {v}
            </button>
          ))}
          <button
            onClick={() => setAmount(maxAllowed)}
            className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all active:scale-95 ${
              amount === maxAllowed ? 'bg-tg-btn text-tg-btn-text' : 'bg-tg-bg text-tg-link'
            }`}
          >
            All-in
          </button>
        </div>
      </div>

      <div className="tg-card flex justify-between items-center">
        <span className="text-tg-hint text-sm">Потенциальный выигрыш</span>
        <span className="text-xl font-bold text-tg-link">{potentialWin} 🪙</span>
      </div>

      {error && <p className="text-tg-destructive text-sm text-center">{error}</p>}

      <button
        onClick={handleConfirm}
        disabled={!isValid || loading}
        className="tg-btn mt-auto"
      >
        {loading ? 'Отправка...' : `Поставить ${amount} очков`}
      </button>
    </div>
  )
}
