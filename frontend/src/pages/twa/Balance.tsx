import { useEffect, useState } from 'react'
import { api } from '../../api/client'
import { useAppStore } from '../../store/useAppStore'
import TabBar from '../../components/TabBar'

interface BetItem {
  id: number
  match_id: number
  team1_name: string
  team2_name: string
  team_choice: number
  amount: number
  potential_win: number
  status: string
  created_at: string
}

const statusConfig: Record<string, { icon: string; label: string; cls: string }> = {
  won:     { icon: '✅', label: 'Выиграл',  cls: 'bg-green-100 text-green-700' },
  lost:    { icon: '❌', label: 'Проиграл', cls: 'bg-red-100 text-red-700' },
  pending: { icon: '⏳', label: 'Ожидание', cls: 'bg-yellow-100 text-yellow-700' },
}

function BetCardSkeleton() {
  return (
    <div className="tg-card flex flex-col gap-3">
      <div className="flex justify-between items-start">
        <div className="flex-1 pr-2 flex flex-col gap-2">
          <div className="sk rounded-md h-4 w-3/4" />
          <div className="sk rounded-md h-3 w-1/2" />
        </div>
        <div className="sk rounded-full h-6 w-20 shrink-0" />
      </div>
      <div className="sk rounded-md h-4 w-1/3" />
    </div>
  )
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
    <div className="flex flex-col min-h-screen pb-tabbar pt-tg-header bg-tg-bg">
      <div className="p-5">
        <h1 className="text-xl font-bold text-tg-text mb-4">💰 Баланс</h1>

        <div className="tg-card flex items-center gap-4 mb-6">
          <span className="text-4xl">💰</span>
          <div>
            <p className="text-sm text-tg-hint">Текущий баланс</p>
            <p className="text-2xl font-bold text-tg-link">
              {user?.balance ?? '…'}{' '}
              <span className="text-base font-normal text-tg-hint">очков</span>
            </p>
          </div>
        </div>

        <h2 className="font-semibold text-tg-hint text-sm mb-3 uppercase tracking-wide">
          История ставок
        </h2>

        {loading && (
          <div className="flex flex-col gap-3">
            <BetCardSkeleton />
            <BetCardSkeleton />
            <BetCardSkeleton />
          </div>
        )}

        {!loading && bets.length === 0 && (
          <p className="text-tg-hint text-center mt-6">Ставок ещё нет</p>
        )}

        {!loading && (
          <div className="flex flex-col gap-3">
            {bets.map((bet, idx) => {
              const teamName = bet.team_choice === 1 ? bet.team1_name : bet.team2_name
              const cfg = statusConfig[bet.status] ?? statusConfig.pending
              const isTopUp = idx > 0 && bets[idx - 1].match_id === bet.match_id
              return (
                <div key={bet.id} className="tg-card">
                  <div className="flex justify-between items-start">
                    <div className="flex-1 pr-2">
                      <p className="font-medium text-tg-text text-sm">
                        {bet.team1_name} vs {bet.team2_name}
                      </p>
                      <p className="text-tg-hint text-sm">
                      {isTopUp ? '+ Додеп: ' : 'Ставка на: '}{teamName}
                    </p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full shrink-0 ${cfg.cls}`}>
                      {cfg.icon} {cfg.label}
                    </span>
                  </div>
                  <div className="mt-2 text-sm">
                    {bet.status === 'won' && (
                      <span className="text-green-600 font-medium">+{bet.potential_win} очков</span>
                    )}
                    {bet.status === 'lost' && (
                      <span className="text-red-500 font-medium">-{bet.amount} очков</span>
                    )}
                    {bet.status === 'pending' && (
                      <span className="text-tg-hint">
                        {bet.amount} очков → {bet.potential_win} потенциально
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
      <TabBar />
    </div>
  )
}
