import { useEffect, useState } from 'react'
import { api } from '../../api/client'
import { useAppStore } from '../../store/useAppStore'
import TabBar from '../../components/TabBar'

interface BetItem {
  id: number
  team1_name: string
  team2_name: string
  team_choice: number
  amount: number
  potential_win: number
  status: string
  created_at: string
}

const statusIcon: Record<string, string> = {
  won: '✅',
  lost: '❌',
  pending: '⏳',
}

const statusLabel: Record<string, string> = {
  won: 'Выиграл',
  lost: 'Проиграл',
  pending: 'Ожидание',
}

export default function Balance() {
  const { user, setUser } = useAppStore()
  const [bets, setBets] = useState<BetItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api.get('/api/users/me').then(({ data }) => setUser(data)),
      api.get('/api/bets/my').then(({ data }) => setBets(data)),
    ]).finally(() => setLoading(false))
  }, [])

  return (
    <div className="flex flex-col min-h-screen pb-16">
      <div className="p-5">
        <h1 className="text-xl font-bold mb-4">💰 Баланс</h1>

        <div className="bg-blue-50 rounded-2xl p-5 flex items-center gap-4 mb-6">
          <span className="text-4xl">💰</span>
          <div>
            <p className="text-sm text-gray-500">Текущий баланс</p>
            <p className="text-2xl font-bold text-blue-600">
              {user?.balance ?? '...'} <span className="text-base font-normal">очков</span>
            </p>
          </div>
        </div>

        <h2 className="font-semibold text-gray-700 mb-3">История ставок</h2>

        {loading && <p className="text-gray-400">Загрузка...</p>}

        {!loading && bets.length === 0 && (
          <p className="text-gray-400 text-center mt-6">Ставок ещё нет</p>
        )}

        <div className="flex flex-col gap-3">
          {bets.map((bet) => {
            const teamName = bet.team_choice === 1 ? bet.team1_name : bet.team2_name
            return (
              <div key={bet.id} className="bg-white border border-gray-200 rounded-xl p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium text-sm">{bet.team1_name} vs {bet.team2_name}</p>
                    <p className="text-gray-500 text-sm">Ставка на: {teamName}</p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    bet.status === 'won' ? 'bg-green-100 text-green-700' :
                    bet.status === 'lost' ? 'bg-red-100 text-red-700' :
                    'bg-yellow-100 text-yellow-700'
                  }`}>
                    {statusIcon[bet.status]} {statusLabel[bet.status]}
                  </span>
                </div>
                <div className="mt-2 text-sm text-gray-600">
                  {bet.status === 'won' && <span className="text-green-600 font-medium">+{bet.potential_win} очков</span>}
                  {bet.status === 'lost' && <span className="text-red-500 font-medium">−{bet.amount} очков</span>}
                  {bet.status === 'pending' && <span className="text-yellow-600">{bet.amount} очков → {bet.potential_win} потенциально</span>}
                </div>
              </div>
            )
          })}
        </div>
      </div>
      <TabBar />
    </div>
  )
}
