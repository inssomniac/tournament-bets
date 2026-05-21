import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

if (window.Telegram?.WebApp) {
  const twa = window.Telegram.WebApp as any

  twa.ready()

  // Bot API 8.0+: fullscreen убирает хедер с именем бота
  if (typeof twa.requestFullscreen === 'function') {
    twa.requestFullscreen()
  } else {
    twa.expand()
  }

  // Читаем insets из JS API и пишем в CSS-переменные вручную —
  // надёжнее чем ждать пока Telegram сам их поставит
  const applyInsets = () => {
    const sa  = twa.safeAreaInset        ?? { top: 0, bottom: 0, left: 0, right: 0 }
    const csa = twa.contentSafeAreaInset ?? { top: 0, bottom: 0, left: 0, right: 0 }
    const root = document.documentElement.style
    root.setProperty('--tg-safe-area-inset-top',          `${sa.top}px`)
    root.setProperty('--tg-safe-area-inset-bottom',       `${sa.bottom}px`)
    root.setProperty('--tg-content-safe-area-inset-top',  `${csa.top}px`)
    root.setProperty('--tg-content-safe-area-inset-bottom',`${csa.bottom}px`)
  }

  applyInsets()
  // Telegram может изменить insets при повороте экрана / разворачивании
  twa.onEvent?.('safeAreaChanged',        applyInsets)
  twa.onEvent?.('contentSafeAreaChanged', applyInsets)
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
