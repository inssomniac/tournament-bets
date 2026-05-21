import { useEffect, useState } from 'react'
import { api } from '../../api/client'

interface User {
  id: number
  telegram_id: number
  full_name: string
  balance: number
  registered_at: string
  bets_count: number
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('ru-RU', {
    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
  })
}

function UserCardSkeleton() {
  return (
    <div className="tg-card flex flex-col gap-2">
      <div className="flex justify-between items-start">
        <div className="flex flex-col gap-1.5 flex-1 pr-2">
          <div className="sk rounded-md h-4 w-40" />
          <div className="sk rounded-md h-3 w-24" />
        </div>
        <div className="flex flex-col gap-1.5 items-end shrink-0">
          <div className="sk rounded-md h-4 w-20" />
          <div className="sk rounded-md h-3 w-6" />
        </div>
      </div>
      <div className="flex gap-4">
        <div className="sk rounded-md h-3 w-16" />
        <div className="sk rounded-md h-3 w-24" />
      </div>
    </div>
  )
}

export default function UserList() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    api.get('/api/admin/users').then(({ data }) => setUsers(data)).finally(() => setLoading(false))
  }, [])

  const filtered = users.filter((u) =>
    u.full_name.toLowerCase().includes(search.toLowerCase()) ||
    String(u.telegram_id).includes(search)
  )

  return (
    <div className="pt-2">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-lg font-bold text-tg-text">Участники</h1>
        {!loading && <span className="text-sm text-tg-hint">{users.length} чел.</span>}
      </div>

      <input
        type="text"
        placeholder="Поиск по имени или Telegram ID..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="tg-input mb-4"
      />

      {loading && (
        <div className="flex flex-col gap-3">
          <UserCardSkeleton />
          <UserCardSkeleton />
          <UserCardSkeleton />
          <UserCardSkeleton />
        </div>
      )}

      {!loading && filtered.length === 0 && (
        <p className="text-tg-hint text-center mt-10">Участников не найдено</p>
      )}

      {!loading && (
        <div className="flex flex-col gap-3">
          {filtered.map((u, i) => (
            <div key={u.id} className="tg-card">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-semibold text-tg-text text-sm">{u.full_name}</p>
                  <p className="text-xs text-tg-hint mt-0.5">TG: {u.telegram_id}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-tg-link text-sm">{u.balance} очков</p>
                  <p className="text-xs text-tg-hint">#{i + 1}</p>
                </div>
              </div>
              <div className="flex gap-4 mt-2 text-xs text-tg-hint">
                <span>Ставок: {u.bets_count}</span>
                <span>{formatDate(u.registered_at)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
