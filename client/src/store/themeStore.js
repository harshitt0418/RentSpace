/**
 * store/themeStore.js
 * Global theme state (dark / light) via Zustand with localStorage persistence.
 */
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const useThemeStore = create(
  persist(
    (set, get) => ({
      theme: 'dark', // 'dark' | 'light'

      toggleTheme: () => {
        const next = get().theme === 'dark' ? 'light' : 'dark'
        document.documentElement.setAttribute('data-theme', next)
        set({ theme: next })
      },

      setTheme: (theme) => {
        document.documentElement.setAttribute('data-theme', theme)
        set({ theme })
      },

      /** Call once on app mount to sync DOM with stored preference */
      hydrate: () => {
        const t = get().theme
        document.documentElement.setAttribute('data-theme', t)
      },
    }),
    { name: 'rentspace-theme' }
  )
)

export default useThemeStore
