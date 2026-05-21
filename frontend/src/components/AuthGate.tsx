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
    <div className="flex flex-col items-center justify-center min-h-screen gap-6 bg-tg-bg pt-tg-header pb-tabbar">
      {/* Заголовок */}
      <div className="flex flex-col items-center gap-2">
        <div className="sk rounded-2xl w-16 h-16" />
        <div className="sk rounded-md w-48 h-5 mt-2" />
        <div className="sk rounded-md w-32 h-3" />
      </div>
      {/* Статы */}
      <div className="grid grid-cols-3 gap-2 w-full px-6">
        {[0, 1, 2].map((i) => (
          <div key={i} className="tg-card text-center py-3 flex flex-col items-center gap-2">
            <div className="sk rounded-lg h-6 w-8" />
            <div className="sk rounded-md h-3 w-10" />
          </div>
        ))}
      </div>
      {/* Кнопка */}
      <div className="w-full px-6">
        <div className="sk rounded-xl h-14 w-full" />
      </div>
    </div>
  )
}

export default function AuthGate() {
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')
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
        setErrorMsg(e.message || 'Ошибка авторизации')
        setStatus('error')
      }
    }
    init()
  }, [])

  if (status === 'loading') {
    return <AuthLoadingScreen />
  }

  if (status === 'error') {
    return (
      <div className="flex items-center justify-center min-h-screen p-4 bg-tg-bg">
        <p className="text-tg-destructive text-center">⚠️ {errorMsg}</p>
      </div>
    )
  }

  return <Outlet />
}
