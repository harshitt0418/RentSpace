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
const adminRoutes = require('./routes/adminRoutes')

// ── Connect MongoDB ────────────────────────────────────────────────────────────
connectDB()

// ── Seed admin account ────────────────────────────────────────────────────────
const ADMIN_EMAIL = 'admin@rentspace.app'
const ADMIN_PASSWORD = '@AIaiAI2004'

async function seedAdmin() {
  try {
    const exists = await User.findOne({ email: ADMIN_EMAIL })
    if (!exists) {
      await User.create({
        name: 'Admin',
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
        role: 'admin',
        isVerified: true,
        location: 'System',
      })
      console.log('✅ Admin account seeded: admin@rentspace.app')
    } else {
      // Always sync the password in case it was changed in code
      exists.password = ADMIN_PASSWORD
      await exists.save()
      console.log('✅ Admin account password synced.')
    }
  } catch (err) {
    console.error('⚠️  Admin seed error:', err.message)
  }
}
seedAdmin()

// ── Migrate old coordinate format to GeoJSON ──────────────────────────────────
async function migrateCoordinates() {
  try {
    // Drop the old 2dsphere index on raw coordinates if it exists
    try {
      await Item.collection.dropIndex('location.coordinates_2dsphere')
      console.log('🔄 Dropped old 2dsphere index')
    } catch { /* index doesn't exist — fine */ }

    // Find items with old-format coordinates (plain [lng, lat] array instead of GeoJSON)
    const oldItems = await Item.find({
      'location.coordinates': { $exists: true },
      'location.coordinates.type': { $exists: false },
    })

    if (oldItems.length > 0) {
      for (const item of oldItems) {
        const raw = item.location.coordinates
        if (Array.isArray(raw) && raw.length === 2) {
          item.location.coordinates = { type: 'Point', coordinates: raw }
          await item.save({ validateBeforeSave: false })
        }
      }
      console.log(`🔄 Migrated ${oldItems.length} items to GeoJSON coordinates`)
    }

    // Ensure the new 2dsphere index exists
    await Item.collection.createIndex({ 'location.coordinates': '2dsphere' })
    console.log('✅ 2dsphere index ready')
  } catch (err) {
    console.error('⚠️  Coordinate migration error:', err.message)
  }
}
migrateCoordinates()

// ── Express app ───────────────────────────────────────────────────────────────
const app = express()

// ── Trust proxy (required on Render / any reverse-proxy host) ─────────────────
app.set('trust proxy', 1)

// ── Security headers ──────────────────────────────────────────────────────────
app.use(helmet())

// ── CORS — allow all origins ────────────────────────────────────────────────
app.use(cors({ origin: true, credentials: true }))

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
app.use('/api/admin', adminRoutes)

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
