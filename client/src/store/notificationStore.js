/**
 * store/notificationStore.js
 * Tracks unread notification count (updated via polling or socket events).
 */
import { create } from 'zustand'

const useNotificationStore = create((set) => ({
  unreadCount: 0,
  setUnreadCount: (count) => set({ unreadCount: count }),
  increment: () => set((s) => ({ unreadCount: s.unreadCount + 1 })),
  reset: () => set({ unreadCount: 0 }),
}))

export default useNotificationStore
