import { useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { api } from '../../api/client'

interface ResultData {
  bets_processed: number
  winners_count: number
  losers_count: number
  total_paid_out: number
}

export default function MatchResult() {
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const match = location.state?.match

  const [winner, setWinner] = useState<1 | 2 | null>(null)
  const [confirming, setConfirming] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState<ResultData | null>(null)

  const handleConfirm = async () => {
    if (!winner) return
    setLoading(true)
    setError('')
    try {
      const { data } = await api.post(`/api/admin/matches/${id}/result`, { winner })
      setResult(data)
    } catch (e: any) {
      setError(e.message)
      setConfirming(false)
    } finally {
      setLoading(false)
    }
  }

  // Success screen
  if (result) {
    return (
      <div className="pt-2 flex flex-col gap-4">
        <div className="tg-card text-center py-6">
          <p className="text-4xl mb-3">✅</p>
          <h2 className="text-lg font-bold text-tg-text mb-1">Результат записан!</h2>
          <p className="text-tg-hint text-sm">
            Победа: {winner === 1 ? match?.team1_name : match?.team2_name}
          </p>
        </div>
        <div className="tg-card flex flex-col gap-2 text-sm">
          <div className="flex justify-between">
            <span className="text-tg-hint">Обработано предсказаний</span>
            <span className="font-semibold text-tg-text">{result.bets_processed}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-tg-hint">Победителей</span>
            <span className="font-semibold text-green-600">+{result.total_paid_out} очков → {result.winners_count} чел.</span>
          </div>
          <div className="flex justify-between">
            <span className="text-tg-hint">Проигравших</span>
            <span className="font-semibold text-tg-destructive">{result.losers_count} чел.</span>
          </div>
        </div>
        <button onClick={() => navigate('/admin/matches')} className="tg-btn">
          К списку матчей
        </button>
      </div>
    )
  }

  // Confirmation screen
  if (confirming) {
    const winnerName = winner === 1 ? match?.team1_name : match?.team2_name
    return (
      <div className="pt-2 flex flex-col gap-4">
        <div className="tg-card text-center py-5">
          <p className="text-3xl mb-2">⚠️</p>
          <h2 className="text-base font-bold text-tg-text mb-1">Подтвердите результат</h2>
          <p className="text-tg-hint text-sm">
            Победа: <span className="font-semibold text-tg-text">{winnerName}</span>
          </p>
          <p className="text-tg-hint text-xs mt-2">
            Это действие необратимо — балансы {match?.bets_count} участников будут пересчитаны.
          </p>
        </div>

        {error && <p className="text-tg-destructive text-sm text-center">{error}</p>}

        <div className="flex gap-3">
          <button
            onClick={() => setConfirming(false)}
            className="flex-1 tg-card text-tg-hint font-medium text-sm py-3 text-center active:scale-95 transition-transform rounded-xl"
          >
            Отмена
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading}
            className="flex-1 bg-red-500 text-white rounded-xl py-3 font-semibold text-sm disabled:opacity-40 active:scale-95 transition-transform"
          >
            {loading ? 'Обработка...' : 'Подтвердить'}
          </button>
        </div>
      </div>
    )
  }

  // Selection screen
  return (
    <div className="pt-2 flex flex-col gap-4">
      <div className="flex items-center gap-3 mb-2">
        <button onClick={() => navigate(-1)} className="text-tg-link text-sm">← Назад</button>
        <h1 className="text-lg font-bold text-tg-text">🏁 Результат матча</h1>
      </div>

      {match && (
        <div className="tg-card">
          <h2 className="font-semibold text-tg-text text-sm mb-1">
            {match.team1_name} vs {match.team2_name}
          </h2>
          <p className="text-xs text-tg-hint">
            Ставок: {match.bets_count} ({match.total_bet_amount} очков)
          </p>
        </div>
      )}

      <p className="font-medium text-tg-text text-sm">Кто победил?</p>

      <div className="flex flex-col gap-3">
        {[1, 2].map((choice) => {
          const name = choice === 1 ? match?.team1_name : match?.team2_name
          const odds = choice === 1 ? match?.odds_team1 : match?.odds_team2
          return (
            <button
              key={choice}
              onClick={() => setWinner(choice as 1 | 2)}
              className={`w-full p-4 rounded-xl text-left transition-all active:scale-95 ${
                winner === choice
                  ? 'ring-2 ring-tg-link bg-tg-sbg'
                  : 'bg-tg-sbg'
              }`}
            >
              <span className="font-semibold text-tg-text">{name}</span>
              <span className="text-tg-hint text-sm ml-2">×{odds}</span>
              {winner === choice && <span className="float-right text-tg-link">✓</span>}
            </button>
          )
        })}
      </div>

      <button
        onClick={() => setConfirming(true)}
        disabled={!winner}
        className="tg-btn"
        style={{ background: winner ? 'var(--tg-theme-destructive-text-color, #cc2929)' : undefined }}
      >
        Записать результат →
      </button>
    </div>
  )
}
