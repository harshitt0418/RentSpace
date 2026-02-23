/**
 * store/authStore.js
 * Global authentication state via Zustand.
 * Persists user data to localStorage; access token lives only in memory.
 */
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { registerTokenHandlers } from '@/api/axios'

const useAuthStore = create(
  persist(
    (set, get) => ({
      user:        null,
      accessToken: null,
      isLoading:   false,

      /* ── Setters ───────────────────────────────────────────────────── */
      setUser: (user) => set({ user }),

      setAuth: (user, accessToken) => set({ user, accessToken }),

      setAccessToken: (accessToken) => set({ accessToken }),

      setLoading: (isLoading) => set({ isLoading }),

      clearAuth: () => set({ user: null, accessToken: null }),

      /* ── Derived ───────────────────────────────────────────────────── */
      isAuthenticated: () => !!get().user && !!get().accessToken,
    }),
    {
      name:    'rentspace-auth',
      // Only persist user object, NOT the access token (security)
      partialize: (state) => ({ user: state.user }),
    }
  )
)

// Register token helpers with the axios interceptor (avoids circular imports)
registerTokenHandlers(
  () => useAuthStore.getState().accessToken,
  (token) => useAuthStore.getState().setAccessToken(token),
  () => useAuthStore.getState().clearAuth()
)

export default useAuthStore
