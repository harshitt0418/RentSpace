/**
 * api/axios.js
 * Configured Axios instance with:
 *  - Base URL pointing to the backend (/api proxied by Vite)
 *  - Auto-attach JWT access token from Zustand store
 *  - 401 interceptor: silently refresh token, replay failed request
 *  - On refresh failure: clear auth state and redirect to /login
 */
import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  withCredentials: true, // send httpOnly refresh-token cookie automatically
  headers: { 'Content-Type': 'application/json' },
})

/* ── Request interceptor: attach access token ─────────────────────────── */
api.interceptors.request.use((config) => {
  // Import lazily to avoid circular deps; store is a singleton
  const token = getAccessToken()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

/* ── Response interceptor: handle 401 / token refresh ────────────────── */
let isRefreshing = false
let failedQueue  = []

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => (error ? prom.reject(error) : prom.resolve(token)))
  failedQueue = []
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    // Only attempt refresh on 401, and only once per request
    // Skip auth endpoints — their 401s are real errors, not expired tokens
    const isAuthEndpoint = originalRequest.url?.match(/\/auth\/(login|register|refresh)/)
    if (error.response?.status === 401 && !originalRequest._retry && !isAuthEndpoint) {
      if (isRefreshing) {
        // Queue requests while a refresh is already in flight
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`
            return api(originalRequest)
          })
          .catch((err) => Promise.reject(err))
      }

      originalRequest._retry = true
      isRefreshing = true

      try {
        const { data } = await axios.post('/api/auth/refresh', {}, { withCredentials: true })
        setAccessToken(data.accessToken)
        processQueue(null, data.accessToken)
        originalRequest.headers.Authorization = `Bearer ${data.accessToken}`
        return api(originalRequest)
      } catch (refreshError) {
        processQueue(refreshError, null)
        clearAuth()
        window.location.href = '/login'
        return Promise.reject(refreshError)
      } finally {
        isRefreshing = false
      }
    }

    return Promise.reject(error)
  }
)

/* ── Helpers — avoid circular import from authStore ──────────────────── */
// These are set by authStore.js after it initialises
let _getAccessToken = () => null
let _setAccessToken = () => {}
let _clearAuth      = () => {}

export const registerTokenHandlers = (getter, setter, clearer) => {
  _getAccessToken = getter
  _setAccessToken = setter
  _clearAuth      = clearer
}

const getAccessToken = () => _getAccessToken()
const setAccessToken = (t) => _setAccessToken(t)
const clearAuth      = () => _clearAuth()

export default api
