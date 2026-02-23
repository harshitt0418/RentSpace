/**
 * config/db.js
 * MongoDB connection using Mongoose.
 * In development, if the configured MONGO_URI is unreachable, falls back to
 * mongodb-memory-server with a PERSISTENT data directory so data survives
 * nodemon restarts.
 */
const path    = require('path')
const fs      = require('fs')
const mongoose = require('mongoose')

const connectDB = async () => {
  // ── 1. Try the configured URI first ───────────────────────────────────────
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 15000,
    })
    console.log(`✅ MongoDB connected: ${conn.connection.host}`)
    return
  } catch (err) {
    if (process.env.NODE_ENV !== 'development') {
      console.error(`❌ MongoDB connection failed: ${err.message}`)
      process.exit(1)
    }
    console.warn('⚠️  Could not reach configured MONGO_URI — starting persistent local MongoDB...')
  }

  // ── 2. Dev fallback: embedded MongoDB with PERSISTENT storage ─────────────
  try {
    const { MongoMemoryServer } = require('mongodb-memory-server')

    // Store data in <project-root>/server/.mongodb-data so it survives restarts
    const dbPath = path.resolve(__dirname, '..', '.mongodb-data')
    if (!fs.existsSync(dbPath)) fs.mkdirSync(dbPath, { recursive: true })

    const mongod = await MongoMemoryServer.create({
      instance: {
        dbPath,
        storageEngine: 'wiredTiger',
      },
    })
    const uri = mongod.getUri()

    const conn = await mongoose.connect(uri)
    console.log(`✅ Local MongoDB started (persistent): ${conn.connection.host}`)
    console.log(`   📁 Data directory: ${dbPath}`)
    console.log('   ✅ Data persists across restarts')

    // Tear down cleanly when the process exits
    process.on('SIGINT',  async () => { await mongod.stop(); process.exit(0) })
    process.on('SIGTERM', async () => { await mongod.stop(); process.exit(0) })
  } catch (fallbackErr) {
    console.error(`❌ Local MongoDB also failed: ${fallbackErr.message}`)
    process.exit(1)
  }
}

module.exports = connectDB
