import { useEffect, useState } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import { api, setAuthToken } from '../api/client'
import { useAppStore } from '../store/useAppStore'

function getInitData(): string {
  // Реальный TWA
  if (window.Telegram?.WebApp?.initData) {
    return window.Telegram.WebApp.initData
  }
  // Dev bypass — подставь свой telegram_id
  const devId = import.meta.env.VITE_DEV_TG_ID || '0'
  return `dev:${devId}`
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
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-500">Загрузка...</p>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <p className="text-red-500 text-center">⚠️ {errorMsg}</p>
      </div>
    )
  }

  return <Outlet />
}
