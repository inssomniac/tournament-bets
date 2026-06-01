import { useEffect, useState } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import { api, setAuthToken } from '../api/client'
import { useAppStore } from '../store/useAppStore'

function getInitData(): string {
  if (window.Telegram?.WebApp?.initData) {
    return window.Telegram.WebApp.initData
  }
  const devId = import.meta.env.VITE_DEV_TG_ID || '0'
  return `dev:${devId}`
}

function AuthLoadingScreen() {
  return (
    <div className="lp-page" style={{ alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ padding: '0 32px', textAlign: 'center' }}>
        <div className="lp-sk" style={{ width: 64, height: 64, borderRadius: '50%', margin: '0 auto 16px' }} />
        <div className="lp-sk" style={{ height: 20, width: 180, borderRadius: 4, margin: '0 auto 8px' }} />
        <div className="lp-sk" style={{ height: 14, width: 120, borderRadius: 4, margin: '0 auto' }} />
      </div>
    </div>
  )
}

function NotSubscribedScreen({ channelUrl }: { channelUrl: string }) {
  return (
    <div className="lp-page">
      {/* Diagonal red header */}
      <div className="lp-hdr lp-hdr--red lp-hdr--lg">
        <div className="lp-hdr-inner">
          <p className="oswald" style={{ color: 'rgba(242,230,216,0.6)', fontSize: 12, letterSpacing: '0.1em', marginBottom: 4 }}>
            ЛЕТНИЙ КУБОК ПО ЛАПТЕ 2026
          </p>
          <p className="russo" style={{ fontSize: 36, lineHeight: 1, color: 'white' }}>
            ДОСТУП
          </p>
          <p className="russo" style={{ fontSize: 36, lineHeight: 1, color: 'rgba(255,255,255,0.45)' }}>
            ЗАКРЫТ
          </p>
        </div>
      </div>

      <div className="lp-scroll" style={{ marginTop: -10, padding: '28px 20px 40px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        {/* Icon */}
        <div style={{
          width: 72, height: 72, borderRadius: '50%',
          background: 'white', border: '2px solid var(--lp-cream-dark)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 36, marginBottom: 20,
          boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
        }}>
          📢
        </div>

        <p className="russo" style={{ fontSize: 22, color: 'var(--lp-text)', textAlign: 'center', marginBottom: 10 }}>
          НУЖНА ПОДПИСКА
        </p>
        <p className="oswald" style={{ fontSize: 13, color: 'var(--lp-muted)', textAlign: 'center', lineHeight: 1.6, letterSpacing: '0.03em', marginBottom: 32 }}>
          ЧТОБЫ УЧАСТВОВАТЬ В СТАВКАХ,<br />ПОДПИШИСЬ НА КАНАЛ ТУРНИРА
        </p>

        {/* Subscribe button */}
        <a
          href={channelUrl}
          target="_blank"
          rel="noreferrer"
          style={{ width: '100%', textDecoration: 'none', display: 'block', marginBottom: 12 }}
        >
          <button className="lp-btn" style={{ width: '100%' }}>
            ПОДПИСАТЬСЯ НА КАНАЛ
          </button>
        </a>

        {/* Retry button */}
        <button
          className="lp-btn-outline"
          style={{ width: '100%', fontSize: 13 }}
          onClick={() => window.location.reload()}
        >
          УЖЕ ПОДПИСАЛСЯ — ВОЙТИ
        </button>

        {/* Marquee */}
        <div className="lp-marquee" style={{ margin: '32px -20px 0', width: 'calc(100% + 40px)' }}>
          <div className="lp-marquee-track">
            <span className="lp-marquee-text">ПОДПИШИСЬ &nbsp;·&nbsp; СТАВКИ &nbsp;·&nbsp; ПОБЕДА &nbsp;·&nbsp; ЛАПТА 2026 &nbsp;·&nbsp; ПОДПИШИСЬ &nbsp;·&nbsp; СТАВКИ &nbsp;·&nbsp; ПОБЕДА &nbsp;·&nbsp; ЛАПТА 2026 &nbsp;·&nbsp; ПОДПИШИСЬ &nbsp;·&nbsp; СТАВКИ &nbsp;·&nbsp; ПОБЕДА &nbsp;·&nbsp; ЛАПТА 2026 &nbsp;·&nbsp; </span>
            <span className="lp-marquee-text">ПОДПИШИСЬ &nbsp;·&nbsp; СТАВКИ &nbsp;·&nbsp; ПОБЕДА &nbsp;·&nbsp; ЛАПТА 2026 &nbsp;·&nbsp; ПОДПИШИСЬ &nbsp;·&nbsp; СТАВКИ &nbsp;·&nbsp; ПОБЕДА &nbsp;·&nbsp; ЛАПТА 2026 &nbsp;·&nbsp; ПОДПИШИСЬ &nbsp;·&nbsp; СТАВКИ &nbsp;·&nbsp; ПОБЕДА &nbsp;·&nbsp; ЛАПТА 2026 &nbsp;·&nbsp; </span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function AuthGate() {
  const [status, setStatus] = useState<'loading' | 'ready' | 'not_subscribed' | 'error'>('loading')
  const [channelUrl, setChannelUrl] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const { setToken, setUser, setAdmin } = useAppStore()
  const navigate = useNavigate()

  useEffect(() => {
    const init = async () => {
      try {
        const initData = getInitData()
        const { data: auth } = await api.post('/api/auth/validate', { init_data: initData })

        setToken(auth.access_token)
        setAdmin(auth.is_admin)
        setAuthToken(auth.access_token)

        if (!auth.is_registered) {
          navigate('/register', { replace: true })
        } else {
          const { data: user } = await api.get('/api/users/me')
          setUser(user)
          navigate('/home', { replace: true })
        }
        setStatus('ready')
      } catch (e: any) {
        // Парсим detail из JSON-строки (интерцептор axios stringify-ит объект)
        let parsedDetail: Record<string, string> = {}
        try { parsedDetail = JSON.parse(e.message) } catch { /* не JSON */ }

        const notSubscribed =
          e.status === 403 ||
          (e as any).response?.status === 403 ||
          parsedDetail?.code === 'not_subscribed'

        if (notSubscribed) {
          const url = (e.detail as any)?.channel_url || parsedDetail?.channel_url || 'https://t.me/'
          setChannelUrl(url)
          setStatus('not_subscribed')
          return
        }
        setErrorMsg(e.message || 'Ошибка авторизации')
        setStatus('error')
      }
    }
    init()
  }, [])

  if (status === 'loading') return <AuthLoadingScreen />

  if (status === 'not_subscribed') return <NotSubscribedScreen channelUrl={channelUrl} />

  if (status === 'error') {
    return (
      <div className="lp-page" style={{ alignItems: 'center', justifyContent: 'center' }}>
        <p className="oswald" style={{ color: 'var(--lp-primary)', textAlign: 'center', padding: '0 24px', letterSpacing: '0.04em' }}>
          ⚠️ {errorMsg}
        </p>
      </div>
    )
  }

  return <Outlet />
}
