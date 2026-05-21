import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../../api/client'
import TabBar from '../../components/TabBar'

interface UserBet {
  team_choice: number
  amount: number
  potential_win: number
  status: string
}

interface Match {
  id: number
  team1_name: string
  team2_name: string
  odds_team1: number
  odds_team2: number
  bet_deadline: string
  status: string
  is_deadline_passed: boolean
  user_bet: UserBet | null
}

function formatDeadline(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleString('ru-RU', {
    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
  })
}

export default function Matches() {
  const [matches, setMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    api.get('/api/matches/').then(({ data }) => setMatches(data)).finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="p-5 text-gray-400">Загрузка...</div>

  return (
    <div className="flex flex-col min-h-screen pb-16">
      <div className="p-5">
        <h1 className="text-xl font-bold mb-4">🏆 Матчи</h1>

        {matches.length === 0 && (
          <p className="text-gray-400 text-center mt-10">Активных матчей нет</p>
        )}

        <div className="flex flex-col gap-4">
          {matches.map((match) => (
            <div key={match.id} className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
              <div className="flex justify-between items-start mb-3">
                <h2 className="font-semibold text-base">
                  {match.team1_name} vs {match.team2_name}
                </h2>
                <span className={`text-xs px-2 py-1 rounded-full ${
                  match.is_deadline_passed ? 'bg-gray-100 text-gray-400' : 'bg-green-100 text-green-600'
                }`}>
                  {match.is_deadline_passed ? 'Закрыто' : 'Открыто'}
                </span>
              </div>

              <div className="flex gap-2 text-sm text-gray-500 mb-3">
                <span>⏰ до {formatDeadline(match.bet_deadline)}</span>
              </div>

              <div className="flex gap-2 text-sm text-gray-500 mb-4">
                <span className="bg-blue-50 text-blue-600 px-2 py-1 rounded-lg">
                  {match.team1_name} × {match.odds_team1}
                </span>
                <span className="bg-blue-50 text-blue-600 px-2 py-1 rounded-lg">
                  {match.team2_name} × {match.odds_team2}
                </span>
              </div>

              {match.user_bet ? (
                <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-sm">
                  <p className="text-green-700 font-medium">
                    ✅ Ставка: {match.user_bet.team_choice === 1 ? match.team1_name : match.team2_name}
                  </p>
                  <p className="text-green-600">
                    {match.user_bet.amount} → потенциально {match.user_bet.potential_win} очков
                  </p>
                </div>
              ) : match.is_deadline_passed ? (
                <p className="text-gray-400 text-sm text-center">Ставки закрыты</p>
              ) : (
                <div className="flex gap-2">
                  <button
                    onClick={() => navigate(`/matches/${match.id}`, { state: { match, teamChoice: 1 } })}
                    className="flex-1 bg-blue-500 text-white rounded-xl py-2 text-sm font-medium active:scale-95 transition-transform"
                  >
                    За {match.team1_name}
                  </button>
                  <button
                    onClick={() => navigate(`/matches/${match.id}`, { state: { match, teamChoice: 2 } })}
                    className="flex-1 bg-blue-500 text-white rounded-xl py-2 text-sm font-medium active:scale-95 transition-transform"
                  >
                    За {match.team2_name}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
      <TabBar />
    </div>
  )
}
