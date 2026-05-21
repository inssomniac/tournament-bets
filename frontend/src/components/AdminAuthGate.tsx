import { useEffect, useState, ReactNode } from 'react'
import { api, setAuthToken } from '../api/client'
import { useAppStore } from '../store/useAppStore'

function getInitData(): string {
  if (window.Telegram?.WebApp?.initData) return window.Telegram.WebApp.initData
  const devId = import.meta.env.VITE_DEV_TG_ID || '0'
  return `dev:${devId}`
}

export default function AdminAuthGate({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<'loading' | 'ok' | 'forbidden'>('loading')
  const { setToken, setAdmin } = useAppStore()

  useEffect(() => {
    const init = async () => {
      try {
        const { data } = await api.post('/api/auth/validate', { init_data: getInitData() })
        if (!data.is_admin) { setStatus('forbidden'); return }
        setToken(data.access_token)
        setAdmin(true)
        setAuthToken(data.access_token)
        setStatus('ok')
      } catch {
        setStatus('forbidden')
      }
    }
    init()
  }, [])

  if (status === 'loading') return <div className="p-8 text-gray-400">Проверка доступа...</div>
  if (status === 'forbidden') return (
    <div className="flex items-center justify-center min-h-screen">
      <p className="text-red-500 text-center text-lg">⛔ Доступ запрещён</p>
    </div>
  )
  return <>{children}</>
}
