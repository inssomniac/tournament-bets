import { useEffect, useState } from 'react'
import { api } from '../../api/client'

interface PromoCode {
  id: number
  code: string
  amount: number
  is_used: boolean
  used_at: string | null
}

const AMOUNTS = [100, 200, 300, 400]

function SkeletonRow() {
  return (
    <div className="flex items-center gap-3 py-2 border-b border-tg-separator">
      <div className="sk rounded h-4 w-16" />
      <div className="sk rounded h-4 w-12" />
      <div className="sk rounded-full h-5 w-20 ml-auto" />
    </div>
  )
}

export default function PromoAdmin() {
  const [codes, setCodes] = useState<PromoCode[]>([])
  const [loading, setLoading] = useState(true)
  const [genAmount, setGenAmount] = useState(100)
  const [genCount, setGenCount] = useState(500)
  const [generating, setGenerating] = useState(false)
  const [genResult, setGenResult] = useState<string | null>(null)
  const [filterAmount, setFilterAmount] = useState<number | ''>('')
  const [filterUsed, setFilterUsed] = useState<'' | 'true' | 'false'>('')

  const fetchCodes = () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (filterAmount !== '') params.set('amount', String(filterAmount))
    if (filterUsed !== '') params.set('used', filterUsed)
    api.get(`/api/admin/promo/list?${params}`)
      .then(({ data }) => setCodes(data))
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchCodes() }, [filterAmount, filterUsed])

  const handleGenerate = async () => {
    setGenerating(true)
    setGenResult(null)
    try {
      const { data } = await api.post('/api/admin/promo/generate', {
        amount: genAmount,
        count: genCount,
      })
      setGenResult(`✅ Сгенерировано ${data.generated} кодов`)
      fetchCodes()
    } catch (e: any) {
      setGenResult(`❌ ${e.message}`)
    } finally {
      setGenerating(false)
    }
  }

  const handleExport = () => {
    const params = new URLSearchParams()
    if (filterAmount !== '') params.set('amount', String(filterAmount))
    if (filterUsed !== '') params.set('used', filterUsed)
    window.open(`/api/admin/promo/export.csv?${params}`, '_blank')
  }

  const total = codes.length
  const used = codes.filter((c) => c.is_used).length

  return (
    <div className="pt-2">
      <h1 className="text-lg font-bold text-tg-text mb-4">🎟 Промокоды</h1>

      {/* Генератор */}
      <div className="tg-card mb-4">
        <p className="text-sm font-semibold text-tg-text mb-3">Сгенерировать коды</p>
        <div className="flex gap-2 mb-3">
          <div className="flex-1">
            <label className="text-xs text-tg-hint mb-1 block">Номинал</label>
            <select
              value={genAmount}
              onChange={(e) => setGenAmount(Number(e.target.value))}
              className="tg-input text-sm"
            >
              {AMOUNTS.map((a) => (
                <option key={a} value={a}>{a} очков</option>
              ))}
            </select>
          </div>
          <div className="flex-1">
            <label className="text-xs text-tg-hint mb-1 block">Количество</label>
            <input
              type="number"
              className="tg-input text-sm"
              value={genCount}
              min={1}
              max={1000}
              onChange={(e) => setGenCount(Number(e.target.value))}
            />
          </div>
        </div>
        <button
          onClick={handleGenerate}
          disabled={generating}
          className="tg-btn py-3 text-sm disabled:opacity-50"
        >
          {generating ? 'Генерирую...' : 'Сгенерировать'}
        </button>
        {genResult && (
          <p className={`text-sm mt-2 ${genResult.startsWith('✅') ? 'text-green-600' : 'text-tg-destructive'}`}>
            {genResult}
          </p>
        )}
      </div>

      {/* Фильтры + экспорт */}
      <div className="flex gap-2 mb-3 items-end">
        <div className="flex-1">
          <label className="text-xs text-tg-hint mb-1 block">Номинал</label>
          <select
            value={filterAmount}
            onChange={(e) => setFilterAmount(e.target.value === '' ? '' : Number(e.target.value))}
            className="tg-input text-sm"
          >
            <option value="">Все</option>
            {AMOUNTS.map((a) => <option key={a} value={a}>{a} оч.</option>)}
          </select>
        </div>
        <div className="flex-1">
          <label className="text-xs text-tg-hint mb-1 block">Статус</label>
          <select
            value={filterUsed}
            onChange={(e) => setFilterUsed(e.target.value as any)}
            className="tg-input text-sm"
          >
            <option value="">Все</option>
            <option value="false">Не использованы</option>
            <option value="true">Использованы</option>
          </select>
        </div>
        <button
          onClick={handleExport}
          className="tg-btn-outline text-sm py-3 shrink-0"
        >
          ⬇ CSV
        </button>
      </div>

      {/* Статистика */}
      {!loading && (
        <p className="text-xs text-tg-hint mb-3">
          Показано: {total} кодов, использовано: {used}
        </p>
      )}

      {/* Список кодов */}
      {loading ? (
        <div className="flex flex-col">
          {[...Array(6)].map((_, i) => <SkeletonRow key={i} />)}
        </div>
      ) : codes.length === 0 ? (
        <p className="text-tg-hint text-center mt-10">Кодов нет</p>
      ) : (
        <div className="tg-card p-0 overflow-hidden">
          <div className="flex text-xs text-tg-hint px-3 py-2 border-b" style={{ borderColor: 'var(--tg-separator)' }}>
            <span className="flex-1">Код</span>
            <span className="w-20 text-center">Номинал</span>
            <span className="w-24 text-right">Статус</span>
          </div>
          <div className="max-h-96 overflow-y-auto">
            {codes.map((c) => (
              <div
                key={c.id}
                className="flex items-center px-3 py-2 border-b text-sm"
                style={{ borderColor: 'var(--tg-separator)' }}
              >
                <span className="flex-1 font-mono font-semibold text-tg-text">{c.code}</span>
                <span className="w-20 text-center text-tg-hint">{c.amount} оч.</span>
                <span className="w-24 text-right">
                  {c.is_used ? (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-tg-bg text-tg-hint">Использован</span>
                  ) : (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700">Свободен</span>
                  )}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
