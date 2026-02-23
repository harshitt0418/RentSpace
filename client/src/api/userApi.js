/**
 * api/userApi.js
 */
import api from './axios'

export const getProfile = (id) =>
  api.get(`/users/${id}`).then((r) => r.data)

export const getMyListings = (params) =>
  api.get('/users/me/listings', { params }).then((r) => r.data)

export const updateProfile = (data) =>
  api.patch('/users/me', data).then((r) => r.data)

export const uploadAvatar = (file) => {
  const form = new FormData()
  form.append('avatar', file)
  return api.patch('/users/me/avatar', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }).then((r) => r.data)
}

// ── Wishlist ─────────────────────────────────────────────────────────
export const getWishlist = () =>
  api.get('/users/me/wishlist').then((r) => r.data)

export const getWishlistIds = () =>
  api.get('/users/me/wishlist/ids').then((r) => r.data)

export const toggleWishlist = (itemId) =>
  api.post(`/users/me/wishlist/${itemId}`).then((r) => r.data)
