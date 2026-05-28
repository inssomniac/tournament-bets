import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import './styles/lapta.css'

try {
  if (window.Telegram?.WebApp) {
    const twa = window.Telegram.WebApp as any

    twa.ready()

    try {
      if (typeof twa.requestFullscreen === 'function') {
        twa.requestFullscreen()
      } else {
        twa.expand()
      }
    } catch {
      // requestFullscreen не поддерживается — не критично
      try { twa.expand() } catch { /* ignore */ }
    }

    const applyInsets = () => {
      try {
        const sa  = twa.safeAreaInset        ?? { top: 0, bottom: 0, left: 0, right: 0 }
        const csa = twa.contentSafeAreaInset ?? { top: 0, bottom: 0, left: 0, right: 0 }
        const root = document.documentElement.style
        root.setProperty('--tg-safe-area-inset-top',           `${sa.top}px`)
        root.setProperty('--tg-safe-area-inset-bottom',        `${sa.bottom}px`)
        root.setProperty('--tg-content-safe-area-inset-top',   `${csa.top}px`)
        root.setProperty('--tg-content-safe-area-inset-bottom',`${csa.bottom}px`)
      } catch { /* ignore */ }
    }

    applyInsets()
    try { twa.onEvent?.('safeAreaChanged',        applyInsets) } catch { /* ignore */ }
    try { twa.onEvent?.('contentSafeAreaChanged', applyInsets) } catch { /* ignore */ }
  }
} catch { /* если Telegram API недоступен — грузимся без него */ }

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
