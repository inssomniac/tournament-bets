import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

// Инициализация Telegram WebApp
if (window.Telegram?.WebApp) {
  const twa = window.Telegram.WebApp
  twa.ready()
  // Bot API 8.0+: fullscreen убирает хедер с именем бота
  if (typeof (twa as any).requestFullscreen === 'function') {
    ;(twa as any).requestFullscreen()
  } else {
    twa.expand()
  }
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
