/**
 * api/reviewApi.js
 */
import api from './axios'

export const createReview = (data) =>
  api.post('/reviews', data).then((r) => r.data)

export const getItemReviews = (itemId, params) =>
  api.get(`/reviews/item/${itemId}`, { params }).then((r) => r.data)

export const getUserReviews = (userId, params) =>
  api.get(`/reviews/user/${userId}`, { params }).then((r) => r.data)

export const getMyRequestReviews = (requestId) =>
  api.get(`/reviews/request/${requestId}/mine`).then((r) => r.data)
