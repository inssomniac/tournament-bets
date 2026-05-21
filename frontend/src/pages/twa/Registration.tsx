import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../../api/client'
import { useAppStore } from '../../store/useAppStore'

export default function Registration() {
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { setUser } = useAppStore()
  const navigate = useNavigate()

  const isValid = name.trim().split(/\s+/).length >= 2

  const handleSubmit = async () => {
    setLoading(true)
    setError('')
    try {
      const { data } = await api.post('/api/users/register', { full_name: name.trim() })
      setUser(data)
      navigate('/home', { replace: true })
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col min-h-screen p-5 gap-5">
      <div className="mt-8">
        <h1 className="text-2xl font-bold mb-2">🏏 Летний Кубок по лапте 2026</h1>
        <p className="text-gray-600 text-sm leading-relaxed">
          Твой стартовый банк — <strong>1100 очков</strong>. Делай ставки на матчи,
          набирай очки и попади в топ рейтинга для получения призов!
        </p>
      </div>

      <div className="flex flex-col gap-3">
        <label className="text-sm font-medium text-gray-700">Введите ФИО</label>
        <input
          className="border border-gray-300 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-400"
          placeholder="Иванов Иван Иванович"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && isValid && handleSubmit()}
        />
        {error && <p className="text-red-500 text-sm">{error}</p>}
      </div>

      <button
        className="bg-blue-500 text-white rounded-xl py-4 font-semibold text-base disabled:opacity-40 mt-auto"
        onClick={handleSubmit}
        disabled={!isValid || loading}
      >
        {loading ? 'Регистрация...' : 'Зарегистрироваться'}
      </button>
    </div>
  )
}
