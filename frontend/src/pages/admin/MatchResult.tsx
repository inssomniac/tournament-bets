import { useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { api } from '../../api/client'

export default function MatchResult() {
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const match = location.state?.match

  const [winner, setWinner] = useState<1 | 2 | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleConfirm = async () => {
    if (!winner) return
    const winnerName = winner === 1 ? match?.team1_name : match?.team2_name
    if (!window.confirm(`Подтвердить победу команды "${winnerName}"?\n\nЭто действие необратимо — балансы будут пересчитаны.`)) return

    setLoading(true)
    setError('')
    try {
      const { data } = await api.post(`/api/admin/matches/${id}/result`, { winner })
      alert(
        `✅ Готово!\n` +
        `Обработано ставок: ${data.bets_processed}\n` +
        `Победители: ${data.winners_count} (+${data.total_paid_out} очков)\n` +
        `Проигравшие: ${data.losers_count}`
      )
      navigate('/admin/matches')
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate(-1)} className="text-blue-500">← Назад</button>
        <h1 className="text-2xl font-bold">🏁 Результат матча</h1>
      </div>

      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
        {match && (
          <div className="mb-5">
            <h2 className="text-lg font-semibold mb-1">{match.team1_name} vs {match.team2_name}</h2>
            <p className="text-sm text-gray-500">Ставок: {match.bets_count} ({match.total_bet_amount} очков)</p>
          </div>
        )}

        <p className="font-medium text-gray-700 mb-4">Кто победил?</p>

        <div className="flex flex-col gap-3 mb-6">
          {[1, 2].map((choice) => {
            const name = choice === 1 ? match?.team1_name : match?.team2_name
            const odds = choice === 1 ? match?.odds_team1 : match?.odds_team2
            return (
              <button
                key={choice}
                onClick={() => setWinner(choice as 1 | 2)}
                className={`w-full p-4 rounded-xl border-2 text-left transition-colors ${
                  winner === choice
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 bg-white'
                }`}
              >
                <span className="font-medium">{name}</span>
                <span className="text-gray-400 text-sm ml-2">(коэф. ×{odds})</span>
              </button>
            )
          })}
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 mb-4 text-sm text-yellow-800">
          ⚠️ Это действие необратимо. Балансы всех участников будут пересчитаны, уведомления отправлены.
        </div>

        {error && <p className="text-red-500 text-sm mb-3">{error}</p>}

        <button
          onClick={handleConfirm}
          disabled={!winner || loading}
          className="w-full bg-red-500 text-white rounded-xl py-4 font-semibold disabled:opacity-40"
        >
          {loading ? 'Обработка...' : 'Подтвердить результат'}
        </button>
      </div>
    </div>
  )
}
