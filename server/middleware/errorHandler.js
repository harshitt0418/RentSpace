/**
 * middleware/errorHandler.js
 * Centralised Express error handling middleware.
 * Catches all errors passed via next(err) and returns clean JSON responses.
 */
const ApiError = require('../utils/ApiError')

const errorHandler = (err, req, res, next) => {
  // Clone to avoid mutating original error
  let error = { ...err, message: err.message, name: err.name }

  // ── Mongoose: invalid ObjectId ───────────────────────────────────────────
  if (err.name === 'CastError') {
    error = new ApiError(`Resource not found with id: ${err.value}`, 404)
  }

  // ── Mongoose: duplicate key ──────────────────────────────────────────────
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0]
    error = new ApiError(`${field} already exists`, 400)
  }

  // ── Mongoose: validation error ───────────────────────────────────────────
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((e) => e.message)
    error = new ApiError(messages.join('. '), 400)
  }

  // ── JWT errors ───────────────────────────────────────────────────────────
  if (err.name === 'JsonWebTokenError') {
    error = new ApiError('Invalid token', 401)
  }
  if (err.name === 'TokenExpiredError') {
    error = new ApiError('Token expired', 401)
  }

  const statusCode = error.statusCode || 500
  const message    = error.message    || 'Internal Server Error'

  // Log stack trace in development only
  if (process.env.NODE_ENV === 'development') {
    console.error('🔴 Error:', err.stack)
  }

  res.status(statusCode).json({
    success: false,
    message,
    // Include stack in development for easier debugging
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  })
}

module.exports = errorHandler
