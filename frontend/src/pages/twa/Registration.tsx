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
    <div className="lp-page">
      {/* Diagonal red header */}
      <div className="lp-hdr lp-hdr--red lp-hdr--lg">
        <div className="lp-hdr-inner">
          <p className="oswald" style={{ color: 'rgba(242,230,216,0.6)', fontSize: 12, letterSpacing: '0.1em', marginBottom: 4 }}>
            ЛЕТНИЙ КУБОК
          </p>
          <p className="russo" style={{ fontSize: 40, lineHeight: 1, color: 'white', marginBottom: 2 }}>
            ПО ЛАПТЕ
          </p>
          <p className="russo" style={{ fontSize: 40, lineHeight: 1, color: 'rgba(255,255,255,0.55)' }}>
            2026
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="lp-scroll" style={{ marginTop: -10, padding: '20px 16px 32px' }}>
        <div style={{ marginBottom: 22 }}>
          <p className="oswald" style={{ color: 'var(--lp-muted)', fontSize: 12, letterSpacing: '0.07em', marginBottom: 5 }}>СТАРТОВЫЙ БАНК</p>
          <p className="russo" style={{ fontSize: 58, color: 'var(--lp-primary)', lineHeight: 1 }}>1 100</p>
          <p className="oswald" style={{ fontSize: 16, color: 'var(--lp-muted)', letterSpacing: '0.08em' }}>ОЧКОВ</p>
        </div>

        <p className="oswald" style={{ fontSize: 13, color: 'var(--lp-muted)', lineHeight: 1.65, letterSpacing: '0.03em', marginBottom: 28 }}>
          Делай предсказания на матчи, набирай очки и попади в топ рейтинга для получения призов!
        </p>

        <span className="lp-label">ВВЕДИТЕ ФИО</span>
        <input
          className="lp-inp"
          placeholder="Иванов Иван Иванович"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && isValid && handleSubmit()}
          style={{ marginBottom: 8 }}
        />
        <p className="oswald" style={{ fontSize: 11, color: 'var(--lp-muted)', marginBottom: 22, letterSpacing: '0.04em' }}>
          Укажите полное имя — оно будет видно в рейтинге
        </p>

        {error && (
          <p style={{ fontSize: 13, color: 'var(--lp-primary)', marginBottom: 12 }}>{error}</p>
        )}

        <button
          className="lp-btn"
          onClick={handleSubmit}
          disabled={!isValid || loading}
        >
          {loading ? 'РЕГИСТРАЦИЯ...' : 'ЗАРЕГИСТРИРОВАТЬСЯ'}
        </button>
      </div>
    </div>
  )
}
