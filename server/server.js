/**
 * server.js — Application entry point
 * ─────────────────────────────────────────────────────────────────
 * Responsibilities:
 *  1. Load environment variables
 *  2. Connect to MongoDB
 *  3. Bootstrap Express with middleware stack
 *  4. Mount all route modules
 *  5. Attach Socket.io for real-time chat
 *  6. Start HTTP server
 */

require('dotenv').config()

const express = require('express')
const http = require('http')
const cors = require('cors')
const helmet = require('helmet')
const morgan = require('morgan')
const cookieParser = require('cookie-parser')

const connectDB = require('./config/db')
const { initSocket } = require('./config/socket')
const errorHandler = require('./middleware/errorHandler')
const { globalLimiter } = require('./middleware/rateLimiter')
require('./config/passport')   // register Google OAuth strategy
const passport = require('passport')

// ── Route modules ─────────────────────────────────────────────────────────────
const Item = require('./models/Item')
const User = require('./models/User')
const authRoutes = require('./routes/authRoutes')
const userRoutes = require('./routes/userRoutes')
const itemRoutes = require('./routes/itemRoutes')
const requestRoutes = require('./routes/requestRoutes')
const reviewRoutes = require('./routes/reviewRoutes')
const chatRoutes = require('./routes/chatRoutes')
const notificationRoutes = require('./routes/notificationRoutes')

// ── Connect MongoDB ────────────────────────────────────────────────────────────
connectDB()

// ── Express app ───────────────────────────────────────────────────────────────
const app = express()

// ── Trust proxy (required on Render / any reverse-proxy host) ─────────────────
app.set('trust proxy', 1)

// ── Security headers ──────────────────────────────────────────────────────────
app.use(helmet())

// ── CORS — allow frontend origins ────────────────────────────────────────────
const allowedOrigin = (origin, callback) => {
  // Allow any localhost port in development; lock down in production
  if (!origin || /^http:\/\/localhost:\d+$/.test(origin) || origin === process.env.CLIENT_URL) {
    callback(null, true)
  } else {
    callback(new Error('Not allowed by CORS'))
  }
}
app.use(cors({ origin: allowedOrigin, credentials: true }))

// ── Passport (stateless JWT, no session needed) ───────────────────────────────
app.use(passport.initialize())

// ── Request parsing ───────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))
app.use(cookieParser())

// ── HTTP request logger (dev only) ────────────────────────────────────────────
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'))
}

// ── Global rate limiter (100 req / 15 min per IP) ─────────────────────────────
app.use('/api', globalLimiter)

// ── Health check endpoint ─────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    env: process.env.NODE_ENV,
    time: new Date().toISOString(),
  })
})

// ── API routes ────────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes)
app.use('/api/users', userRoutes)
app.use('/api/items', itemRoutes)
app.use('/api/requests', requestRoutes)
app.use('/api/reviews', reviewRoutes)
app.use('/api/chat', chatRoutes)
app.use('/api/notifications', notificationRoutes)

// ── Public platform stats ────────────────────────────────────────────────────
app.get('/api/stats', async (req, res) => {
  try {
    const [totalItems, totalUsers, cities] = await Promise.all([
      Item.countDocuments({ status: 'active' }),
      User.countDocuments(),
      Item.distinct('location.city', { status: 'active' }),
    ])
    res.json({
      success: true,
      totalItems,
      totalUsers,
      totalCities: cities.filter(Boolean).length,
    })
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch stats' })
  }
})

// ── 404 handler for unknown API routes ───────────────────────────────────────
app.use('/api/*', (req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` })
})

// ── Centralised error handler (must be last middleware) ───────────────────────
app.use(errorHandler)

// ── HTTP server + Socket.io ───────────────────────────────────────────────────
const server = http.createServer(app)
initSocket(server)

// ── Start server ──────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000
server.listen(PORT, () => {
  console.log(`\n🚀 RentSpace server running on port ${PORT}`)
  console.log(`   Environment : ${process.env.NODE_ENV}`)
  console.log(`   Health check: http://localhost:${PORT}/health\n`)
})

// ── Graceful shutdown ─────────────────────────────────────────────────────────
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Promise Rejection:', err.message)
  server.close(() => process.exit(1))
})
