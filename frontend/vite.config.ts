import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,  // слушать на 0.0.0.0 (нужно для cloudflared/tunnels)
    proxy: {
      '/api': 'http://localhost:8000',
    },
    allowedHosts: ['all', '.loca.lt', '.trycloudflare.com'],
    cors: true,
  },
})
