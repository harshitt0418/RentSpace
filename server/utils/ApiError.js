/**
 * utils/ApiError.js
 * Custom error class that carries an HTTP status code.
 * Used throughout controllers and middleware for clean error passing.
 *
 * Usage:
 *   throw new ApiError('Item not found', 404)
 *   next(new ApiError('Unauthorized', 401))
 */
class ApiError extends Error {
  constructor(message, statusCode = 500) {
    super(message)
    this.statusCode = statusCode
    this.status = statusCode >= 400 && statusCode < 500 ? 'fail' : 'error'
    this.isOperational = true // Distinguishes known errors from bugs
    Error.captureStackTrace(this, this.constructor)
  }
}

module.exports = ApiError
