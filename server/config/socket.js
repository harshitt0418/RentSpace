/**
 * config/socket.js
 * Socket.io server setup with full real-time chat.
 */
const { Server } = require('socket.io')

let io

/**
 * Attach Socket.io to the HTTP server.
 * Call once at startup — io instance is exported for use in controllers.
 */
const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: (origin, callback) => {
        if (!origin || /^http:\/\/localhost:\d+$/.test(origin)) callback(null, true)
        else callback(new Error('Not allowed'))
      },
      credentials: true,
    },
    // Auto-reconnect ping interval
    pingTimeout:  60000,
    pingInterval: 25000,
  })

  io.on('connection', (socket) => {
    console.log(`🔌 Socket connected: ${socket.id}`)

    // ── Auto-join user to a personal notification room ────────────────────
    socket.on('register_user', (userId) => {
      if (userId) {
        socket.join(`user_${userId}`)
        console.log(`   ↳ ${socket.id} registered as user_${userId}`)
      }
    })

    // ── Join a chat room ────────────────────────────────────────────────
    socket.on('join_room', (data) => {
      const roomId = typeof data === 'string' ? data : data?.roomId
      if (!roomId) return
      socket.join(roomId)
      console.log(`   ↳ ${socket.id} joined room ${roomId}`)
    })

    // ── Leave a chat room ───────────────────────────────────────────────
    socket.on('leave_room', (data) => {
      const roomId = typeof data === 'string' ? data : data?.roomId
      if (!roomId) return
      socket.leave(roomId)
    })

    // ── Typing indicator ────────────────────────────────────────────────
    socket.on('typing', ({ roomId, userId }) => {
      socket.to(roomId).emit('user_typing', { roomId, userId })
    })

    socket.on('stop_typing', ({ roomId, userId }) => {
      socket.to(roomId).emit('user_stop_typing', { roomId, userId })
    })

    socket.on('disconnect', () => {
      console.log(`🔌 Socket disconnected: ${socket.id}`)
    })
  })

  return io
}

/** Get the io instance (used inside controllers) */
const getIO = () => {
  if (!io) throw new Error('Socket.io not initialised')
  return io
}

module.exports = { initSocket, getIO }
