import axios from 'axios'

export const api = axios.create({
  baseURL: '',
  timeout: 10000,
})

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const message = err.response?.data?.detail || 'Ошибка сети'
    return Promise.reject(new Error(message))
  }
)

export function setAuthToken(token: string) {
  api.defaults.headers.common['Authorization'] = `Bearer ${token}`
}
