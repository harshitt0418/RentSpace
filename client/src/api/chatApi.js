/**
 * api/chatApi.js
 */
import api from './axios'

export const getRooms = () =>
  api.get('/chat/rooms').then((r) => r.data)

export const createRoom = (recipientId, requestId) =>
  api.post('/chat/rooms', { recipientId, requestId }).then((r) => r.data)

export const getMessages = (roomId, params) =>
  api.get(`/chat/rooms/${roomId}/messages`, { params }).then((r) => r.data)

export const sendMessage = (roomId, content, type = 'text') =>
  api.post(`/chat/rooms/${roomId}/messages`, { content, type }).then((r) => r.data)
