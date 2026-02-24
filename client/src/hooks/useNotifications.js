/**
 * hooks/useNotifications.js
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import * as notifApi from '@/api/notificationApi'
import useNotificationStore from '@/store/notificationStore'

export const notifKeys = {
  all:  ['notifications'],
  list: (p) => ['notifications', 'list', p],
}

export const useNotifications = (params = {}) => {
  const setUnreadCount = useNotificationStore((s) => s.setUnreadCount)

  return useQuery({
    queryKey: notifKeys.list(params),
    queryFn:  async () => {
      const data = await notifApi.getNotifications(params)
      setUnreadCount(data.unreadCount ?? 0)
      return data
    },
    staleTime: 30_000,
    refetchInterval: 60_000, // poll every minute as a lightweight fallback
  })
}

export const useMarkRead = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: notifApi.markRead,
    onSuccess: () => qc.invalidateQueries({ queryKey: notifKeys.all }),
  })
}

export const useMarkAllRead = () => {
  const qc             = useQueryClient()
  const setUnreadCount = useNotificationStore((s) => s.setUnreadCount)
  return useMutation({
    mutationFn: notifApi.markAllRead,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: notifKeys.all })
      setUnreadCount(0)
    },
  })
}

export const useDeleteNotification = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: notifApi.deleteNotification,
    onSuccess: () => qc.invalidateQueries({ queryKey: notifKeys.all }),
  })
}

export const useClearAllNotifications = () => {
  const qc             = useQueryClient()
  const setUnreadCount = useNotificationStore((s) => s.setUnreadCount)
  return useMutation({
    mutationFn: notifApi.clearAllNotifications,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: notifKeys.all })
      setUnreadCount(0)
      toast.success('All notifications cleared')
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to clear notifications'),
  })
}
