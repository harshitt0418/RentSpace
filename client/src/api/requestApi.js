/**
 * api/requestApi.js
 */
import api from './axios'

export const sendRequest = (data) =>
  api.post('/requests', data).then((r) => r.data)

export const getReceived = (params) =>
  api.get('/requests/received', { params }).then((r) => r.data)

export const getSent = (params) =>
  api.get('/requests/sent', { params }).then((r) => r.data)

export const acceptRequest = (id) =>
  api.patch(`/requests/${id}/accept`).then((r) => r.data)

export const rejectRequest = (id, rejectionReason) =>
  api.patch(`/requests/${id}/reject`, { rejectionReason }).then((r) => r.data)

export const cancelRequest = (id) =>
  api.patch(`/requests/${id}/cancel`).then((r) => r.data)

export const completeRequest = (id) =>
  api.patch(`/requests/${id}/complete`).then((r) => r.data)
