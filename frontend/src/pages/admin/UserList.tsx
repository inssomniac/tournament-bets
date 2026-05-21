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
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Участники</h1>
        <span className="text-sm text-gray-500">{users.length} чел.</span>
      </div>

      <input
        type="text"
        placeholder="Поиск по имени или Telegram ID..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm mb-4"
      />

      {loading && <p className="text-gray-400">Загрузка...</p>}
      {!loading && filtered.length === 0 && (
        <p className="text-gray-400 text-center mt-10">Участников не найдено</p>
      )}

      <div className="flex flex-col gap-3">
        {filtered.map((u, i) => (
          <div key={u.id} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <div className="flex justify-between items-start">
              <div>
                <p className="font-semibold">{u.full_name}</p>
                <p className="text-xs text-gray-400 mt-0.5">TG: {u.telegram_id}</p>
              </div>
              <div className="text-right">
                <p className="font-bold text-blue-600">{u.balance} очков</p>
                <p className="text-xs text-gray-400">#{i + 1} по регистрации</p>
              </div>
            </div>
            <div className="flex gap-4 mt-3 text-sm text-gray-500">
              <span>Ставок: {u.bets_count}</span>
              <span>Зарегистрирован: {formatDate(u.registered_at)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
