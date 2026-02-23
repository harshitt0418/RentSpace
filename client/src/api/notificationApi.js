/**
 * api/notificationApi.js
 */
import api from './axios'

export const getNotifications = (params) =>
  api.get('/notifications', { params }).then((r) => r.data)

export const markRead = (id) =>
  api.patch(`/notifications/${id}/read`).then((r) => r.data)

export const markAllRead = () =>
  api.patch('/notifications/read-all').then((r) => r.data)

export const deleteNotification = (id) =>
  api.delete(`/notifications/${id}`).then((r) => r.data)
