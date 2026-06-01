import axios from 'axios'

export const api = axios.create({
  baseURL: '',
  timeout: 10000,
})

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const detail = err.response?.data?.detail
    const status = err.response?.status ?? 0
    let message = 'Ошибка сети'
    if (detail) {
      if (typeof detail === 'string') {
        message = detail
      } else if (Array.isArray(detail)) {
        // FastAPI 422: array of {loc, msg, type}
        message = detail.map((e: any) => e.msg ?? JSON.stringify(e)).join('; ')
      } else {
        message = JSON.stringify(detail)
      }
    }
    const error = new Error(message) as Error & { status: number; detail: unknown }
    error.status = status
    error.detail = detail
    return Promise.reject(error)
  }
)

export function setAuthToken(token: string) {
  api.defaults.headers.common['Authorization'] = `Bearer ${token}`
}
