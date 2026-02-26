/**
 * api/adminApi.js
 * Admin-only API calls — all routes require admin JWT.
 */
import api from './axios'

export const getAdminStats = () => api.get('/admin/stats').then(r => r.data)
export const getAdminUsers = (params) => api.get('/admin/users', { params }).then(r => r.data)
export const deleteUser = (id) => api.delete(`/admin/users/${id}`).then(r => r.data)
export const getAdminItems = (params) => api.get('/admin/items', { params }).then(r => r.data)
export const deleteItemAdmin = (id) => api.delete(`/admin/items/${id}`).then(r => r.data)
export const getAdminReviews = (params) => api.get('/admin/reviews', { params }).then(r => r.data)
export const deleteReviewAdmin = (id) => api.delete(`/admin/reviews/${id}`).then(r => r.data)
