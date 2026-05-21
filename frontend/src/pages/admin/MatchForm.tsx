import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { api } from '../../api/client'

interface FormData {
  team1_name: string
  team2_name: string
  odds_team1: string
  odds_team2: string
  bet_deadline: string
}

const emptyForm: FormData = {
  team1_name: '',
  team2_name: '',
  odds_team1: '1.50',
  odds_team2: '2.00',
  bet_deadline: '',
}

export default function MatchForm() {
  const { id } = useParams()
  const isEdit = Boolean(id)
  const navigate = useNavigate()

  const [form, setForm] = useState<FormData>(emptyForm)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!isEdit) return
    api.get('/api/admin/matches').then(({ data }) => {
      const match = data.find((m: any) => m.id === Number(id))
      if (!match) return
      const deadline = new Date(match.bet_deadline)
      const local = new Date(deadline.getTime() - deadline.getTimezoneOffset() * 60000)
        .toISOString().slice(0, 16)
      setForm({
        team1_name: match.team1_name,
        team2_name: match.team2_name,
        odds_team1: String(match.odds_team1),
        odds_team2: String(match.odds_team2),
        bet_deadline: local,
      })
    })
  }, [id])

  const set = (field: keyof FormData) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [field]: e.target.value }))

  const handleSubmit = async () => {
    setLoading(true)
    setError('')
    try {
      const payload = {
        team1_name: form.team1_name,
        team2_name: form.team2_name,
        odds_team1: parseFloat(form.odds_team1),
        odds_team2: parseFloat(form.odds_team2),
        bet_deadline: new Date(form.bet_deadline).toISOString(),
      }
      if (isEdit) {
        await api.put(`/api/admin/matches/${id}`, payload)
      } else {
        await api.post('/api/admin/matches', payload)
      }
      navigate('/admin/matches')
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const isValid =
    form.team1_name.trim() &&
    form.team2_name.trim() &&
    parseFloat(form.odds_team1) >= 1.01 &&
    parseFloat(form.odds_team2) >= 1.01 &&
    form.bet_deadline

  return (
    <div className="pt-2">
      <div className="flex items-center gap-3 mb-4">
        <button onClick={() => navigate(-1)} className="text-tg-link text-sm">← Назад</button>
        <h1 className="text-lg font-bold text-tg-text">
          {isEdit ? 'Редактировать матч' : 'Новый матч'}
        </h1>
      </div>

      <div className="tg-card flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-tg-hint">Команда 1</label>
          <input className="tg-input" placeholder="Лаптевцы" value={form.team1_name} onChange={set('team1_name')} />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-tg-hint">Коэффициент команды 1</label>
          <input type="number" step="0.01" min="1.01" max="10" className="tg-input" value={form.odds_team1} onChange={set('odds_team1')} />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-tg-hint">Команда 2</label>
          <input className="tg-input" placeholder="Медведи" value={form.team2_name} onChange={set('team2_name')} />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-tg-hint">Коэффициент команды 2</label>
          <input type="number" step="0.01" min="1.01" max="10" className="tg-input" value={form.odds_team2} onChange={set('odds_team2')} />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-tg-hint">Ставки принимаются до</label>
          <input type="datetime-local" className="tg-input" value={form.bet_deadline} onChange={set('bet_deadline')} />
        </div>

        {error && <p className="text-tg-destructive text-sm">{error}</p>}

        <div className="flex gap-3 mt-1">
          <button
            onClick={() => navigate(-1)}
            className="flex-1 tg-card text-tg-hint font-medium text-sm py-3 text-center active:scale-95 transition-transform rounded-xl"
          >
            Отмена
          </button>
          <button
            onClick={handleSubmit}
            disabled={!isValid || loading}
            className="flex-1 tg-btn py-3 rounded-xl text-sm"
          >
            {loading ? 'Сохранение...' : 'Сохранить'}
          </button>
        </div>
      </div>
    </div>
  )
}
