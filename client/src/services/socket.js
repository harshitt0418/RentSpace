/**
 * services/socket.js
 * Socket.io singleton — connect once, reuse everywhere via useSocket hook.
 * Auth token is passed as a query param so the server can identify the user.
 */
import { io } from 'socket.io-client'
import useAuthStore from '@/store/authStore'

let socket = null

export const getSocket = () => socket

export const connectSocket = () => {
  // Reuse if already connected or actively connecting
  if (socket && (socket.connected || socket.active)) return socket

  // Clean up any stale disconnected socket first
  if (socket) {
    socket.removeAllListeners()
    socket.disconnect()
    socket = null
  }

  const token = useAuthStore.getState().accessToken

  socket = io(import.meta.env.VITE_API_URL || '/', {
    path:            '/socket.io',
    withCredentials: true,
    auth:            { token },
    transports:      ['websocket', 'polling'],
    reconnectionAttempts: 5,
    reconnectionDelay:    2000,
  })

  socket.on('connect',       () => console.log('[Socket] connected:', socket.id))
  socket.on('disconnect',    (r) => console.log('[Socket] disconnected:', r))
  socket.on('connect_error', (e) => console.warn('[Socket] error:', e.message))

  return socket
}

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect()
    socket = null
  }
}

export const joinRoom  = (roomId) => socket?.emit('join_room', { roomId })
export const leaveRoom = (roomId) => socket?.emit('leave_room', { roomId })

export const emitTyping     = (roomId) => socket?.emit('typing',      { roomId })
export const emitStopTyping = (roomId) => socket?.emit('stop_typing', { roomId })
