import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { api } from '../../api/client'
import { useAppStore } from '../../store/useAppStore'

const PRESETS = [50, 100, 250, 500]
const MIN = 50
const STEP = 50

export default function BetFlow() {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, updateBalance } = useAppStore()

  const { match, teamChoice, isTopUp } = location.state || {}

  const [amount, setAmount] = useState(100)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  if (!match || !teamChoice) {
    navigate('/matches')
    return null
  }

  const teamName = teamChoice === 1 ? match.team1_name : match.team2_name
  const odds = teamChoice === 1 ? match.odds_team1 : match.odds_team2
  const maxAllowed = user?.balance ?? 0
  const potentialWin = Math.floor(amount * odds)

  const setAmountSafe = (v: number) => {
    const clamped = Math.max(MIN, Math.min(maxAllowed, Math.round(v / STEP) * STEP))
    setAmount(clamped)
  }

  const handleBet = async () => {
    setLoading(true)
    setError('')
    try {
      const { data } = await api.post('/api/bets/', { match_id: match.id, team_choice: teamChoice, amount })
      updateBalance(data.new_balance)
      setSuccess(true)
      setTimeout(() => navigate('/matches'), 1500)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="lp-page" style={{ alignItems: 'center', justifyContent: 'center' }}>
        <p className="russo" style={{ fontSize: 48, textAlign: 'center' }}>✅</p>
        <p className="russo" style={{ fontSize: 28, color: 'var(--lp-secondary)', textAlign: 'center' }}>
          СТАВКА ПРИНЯТА
        </p>
      </div>
    )
  }

  return (
    <div className="lp-page">
      {/* Flat diagonal header with back button */}
      <div className="lp-hdr-flat lp-hdr-flat--red">
        <div className="lp-hdr-inner" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            onClick={() => navigate(-1)}
            style={{ background: 'none', border: 'none', color: 'white', fontSize: 22, cursor: 'pointer', padding: '0 4px' }}
          >←</button>
          <p className="oswald" style={{ fontSize: 20, color: 'white', letterSpacing: '0.07em' }}>
            {isTopUp ? 'ДОДЕП' : 'СТАВКА НА МАТЧ'}
          </p>
        </div>
      </div>

      <div className="lp-scroll" style={{ marginTop: -16, padding: '14px 16px 32px' }}>
        <span className="lp-label">МАТЧ</span>
        <p className="russo" style={{ fontSize: 20, color: 'var(--lp-text)', marginBottom: 16 }}>
          {match.team1_name} vs {match.team2_name}
        </p>

        {/* Selected team card */}
        <div style={{
          background: 'var(--lp-secondary)', borderRadius: 6,
          padding: '14px 16px', marginBottom: 16, position: 'relative', overflow: 'hidden',
        }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: 'rgba(255,255,255,0.25)' }} />
          <span className="lp-label lp-label--dk">
            {isTopUp ? 'ДОДЕП НА' : 'СТАВКА НА'}
          </span>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <p className="russo" style={{ fontSize: 24, color: 'white' }}>{teamName}</p>
            <p className="russo" style={{ fontSize: 30, color: 'white' }}>×{odds}</p>
          </div>
        </div>

        {/* Existing bet info (dodep) */}
        {isTopUp && match.user_bet && (
          <div style={{
            background: 'rgba(27,101,166,0.08)', border: '1px solid rgba(27,101,166,0.2)',
            borderRadius: 4, padding: '10px 12px', marginBottom: 16,
          }}>
            <p className="oswald" style={{ fontSize: 11, color: 'var(--lp-secondary)', letterSpacing: '0.07em', marginBottom: 3 }}>
              ТЕКУЩАЯ СТАВКА
            </p>
            <p className="oswald" style={{ fontSize: 12, color: 'var(--lp-text)', letterSpacing: '0.04em' }}>
              {match.user_bet.amount} → {match.user_bet.potential_win} ОЧ
              {match.user_bet.bets_count > 1 && ` (${match.user_bet.bets_count} ставки)`}
            </p>
          </div>
        )}

        <span className="lp-label">СУММА СТАВКИ</span>
        <input
          className="lp-inp"
          type="number"
          value={amount}
          min={MIN}
          max={maxAllowed}
          step={STEP}
          onChange={(e) => setAmountSafe(Number(e.target.value))}
          style={{ fontFamily: "'Russo One', sans-serif", fontSize: 32, textAlign: 'center', marginBottom: 10 }}
        />

        {/* Quick presets */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 20 }}>
          {PRESETS.map((p) => (
            <button
              key={p}
              onClick={() => setAmountSafe(p)}
              className={amount === p ? 'lp-btn-outline lp-btn-outline--red' : 'lp-btn-outline'}
              style={{ flex: 1, padding: '8px 4px', fontSize: 12,
                background: amount === p ? 'rgba(217,13,50,0.06)' : 'transparent' }}
            >{p}</button>
          ))}
          <button
            onClick={() => setAmountSafe(maxAllowed)}
            className="lp-btn-outline"
            style={{ flex: 1, padding: '8px 4px', fontSize: 12 }}
          >MAX</button>
        </div>

        {/* Potential win block */}
        <div className="lp-win" style={{ marginBottom: 20 }}>
          <span className="lp-label lp-label--dk">ПОТЕНЦИАЛЬНЫЙ ВЫИГРЫШ</span>
          <p className="russo" style={{ fontSize: 52, color: 'white', lineHeight: 1 }}>{potentialWin}</p>
          <p className="oswald" style={{ fontSize: 13, color: 'rgba(242,230,216,0.55)', letterSpacing: '0.07em' }}>ОЧКОВ</p>
          <div style={{ marginTop: 10, padding: '6px 12px', background: 'rgba(255,255,255,0.08)', borderRadius: 4, display: 'inline-block' }}>
            <p className="oswald" style={{ fontSize: 10, color: 'rgba(242,230,216,0.6)', letterSpacing: '0.04em' }}>
              ⚡ КОЭФ ДИНАМИЧЕСКИЙ — ФИКСИРУЕТСЯ ПРИ ПОДТВЕРЖДЕНИИ
            </p>
          </div>
        </div>

        {error && (
          <p style={{ fontSize: 13, color: 'var(--lp-primary)', marginBottom: 12 }}>{error}</p>
        )}

        <button
          className="lp-btn"
          onClick={handleBet}
          disabled={loading || amount < MIN || amount > maxAllowed}
        >
          {loading ? 'ОБРАБОТКА...' : `${isTopUp ? 'ДОДЕПНУТЬ' : 'ПОСТАВИТЬ'} ${amount} ОЧКОВ`}
        </button>
      </div>
    </div>
  )
}
