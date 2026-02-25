/**
 * config/socket.js
 * Socket.io server setup with full real-time chat.
 */
const { Server } = require('socket.io')

let io

// userId -> Set of socketIds (handles multiple tabs / devices)
const onlineUsers = new Map()

const addOnline = (userId, socketId) => {
  if (!onlineUsers.has(userId)) onlineUsers.set(userId, new Set())
  onlineUsers.get(userId).add(socketId)
}

const removeOnline = (userId, socketId) => {
  if (!onlineUsers.has(userId)) return false
  onlineUsers.get(userId).delete(socketId)
  if (onlineUsers.get(userId).size === 0) {
    onlineUsers.delete(userId)
    return true // fully offline
  }
  return false
}

/**
 * Attach Socket.io to the HTTP server.
 * Call once at startup — io instance is exported for use in controllers.
 */
const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: (origin, callback) => {
        // Allow: no origin (curl/Postman), any localhost port in dev,
        // and the configured CLIENT_URL (Vercel domain) in production
        if (
          !origin ||
          /^http:\/\/localhost:\d+$/.test(origin) ||
          origin === process.env.CLIENT_URL
        ) {
          callback(null, true)
        } else {
          callback(new Error('Not allowed by Socket.io CORS'))
        }
      },
      credentials: true,
    },
    pingTimeout: 60000,
    pingInterval: 25000,
  })

  io.on('connection', (socket) => {
    console.log(`🔌 Socket connected: ${socket.id}`)
    let registeredUserId = null

    // ── Register user + broadcast online ─────────────────────────────────
    socket.on('register_user', (userId) => {
      if (!userId) return
      registeredUserId = userId
      socket.join(`user_${userId}`)
      const wasOffline = !onlineUsers.has(userId)
      addOnline(userId, socket.id)
      if (wasOffline) {
        // Tell everyone this user just came online
        io.emit('user_online', { userId })
      }
      // Send the current online list back to this socket only
      socket.emit('online_users', { userIds: [...onlineUsers.keys()] })
      console.log(`   ↳ ${socket.id} registered as user_${userId}`)
    })

    // ── Send current online list when explicitly requested ───────────────
    socket.on('get_online_users', () => {
      socket.emit('online_users', { userIds: [...onlineUsers.keys()] })
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
      if (registeredUserId) {
        const fullyOffline = removeOnline(registeredUserId, socket.id)
        if (fullyOffline) {
          io.emit('user_offline', { userId: registeredUserId })
        }
      }
    })
  })

  return io
}

/** Returns true if a userId currently has at least one active socket */
const isUserOnline = (userId) => onlineUsers.has(userId?.toString())

/** Get the io instance (used inside controllers) */
const getIO = () => {
  if (!io) throw new Error('Socket.io not initialised')
  return io
}

module.exports = { initSocket, getIO, isUserOnline }
