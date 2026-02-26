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
      user: null,
      accessToken: null,
      pendingEmail: null,  // email awaiting OTP — persisted so refresh doesn't lose it
      isLoading: false,
      isRestoring: true,
      hasHydrated: false,

      /* ── Setters ───────────────────────────────────────────────────── */
      setUser: (user) => set({ user }),
      setAuth: (user, accessToken) => set({ user, accessToken }),
      setAccessToken: (accessToken) => set({ accessToken }),
      setLoading: (isLoading) => set({ isLoading }),
      setRestoring: (isRestoring) => set({ isRestoring }),
      setHasHydrated: (v) => set({ hasHydrated: v }),
      setPendingEmail: (email) => set({ pendingEmail: email }),
      clearAuth: () => set({ user: null, accessToken: null, pendingEmail: null }),

      /* ── Derived ───────────────────────────────────────────────────── */
      isAuthenticated: () => !!get().user && !!get().accessToken,
    }),
    {
      name: 'rentspace-auth',
      // Persist user and pendingEmail — NOT the access token (security)
      partialize: (state) => ({ user: state.user, pendingEmail: state.pendingEmail }),
      // Signal when rehydration from localStorage is complete
      onRehydrateStorage: () => (state) => {
        if (state) state.setHasHydrated(true)
      },
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

