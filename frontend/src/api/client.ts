import axios from 'axios'

export const api = axios.create({
  baseURL: '',
  timeout: 10000,
})

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const detail = err.response?.data?.detail
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
    return Promise.reject(new Error(message))
  }
)

export function setAuthToken(token: string) {
  api.defaults.headers.common['Authorization'] = `Bearer ${token}`
}
