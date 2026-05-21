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
    <div className="flex flex-col min-h-screen p-5 gap-6 bg-tg-bg pt-tg-header">
      <div>
        <h1 className="text-2xl font-bold text-tg-text mb-2">
          Летний Кубок по лапте 2026
        </h1>
        <p className="text-tg-hint text-sm leading-relaxed">
          Твой стартовый банк — <strong className="text-tg-text">1100 очков</strong>.
          Делай ставки на матчи, набирай очки и попади в топ рейтинга для получения призов!
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-tg-hint">Введите ФИО</label>
        <input
          className="tg-input"
          placeholder="Иванов Иван Иванович"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && isValid && handleSubmit()}
        />
        {error && <p className="text-tg-destructive text-sm">{error}</p>}
        <p className="text-tg-hint text-xs">Укажите полное имя — оно будет видно в рейтинге</p>
      </div>

      <button
        className="tg-btn mt-auto"
        onClick={handleSubmit}
        disabled={!isValid || loading}
      >
        {loading ? 'Регистрация...' : 'Зарегистрироваться'}
      </button>
    </div>
  )
}
