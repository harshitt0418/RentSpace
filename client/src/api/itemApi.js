/**
 * api/itemApi.js
 */
import api from './axios'

export const getItems = (params) =>
  api.get('/items', { params }).then((r) => r.data)

export const getItem = (id) =>
  api.get(`/items/${id}`).then((r) => r.data)

export const createItem = (data) => {
  // If FormData (multipart with images), let axios set the correct content-type automatically
  const isFormData = data instanceof FormData
  return api.post('/items', data, isFormData ? { headers: { 'Content-Type': 'multipart/form-data' } } : {}).then((r) => r.data)
}

export const updateItem = (id, data) =>
  api.patch(`/items/${id}`, data).then((r) => r.data)

export const deleteItem = (id) =>
  api.delete(`/items/${id}`).then((r) => r.data)

export const uploadItemImages = (id, files) => {
  const form = new FormData()
  files.forEach((f) => form.append('images', f))
  return api.post(`/items/${id}/images`, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }).then((r) => r.data)
}

export const deleteItemImage = (id, imageUrl) =>
  api.delete(`/items/${id}/images`, { data: { imageUrl } }).then((r) => r.data)
