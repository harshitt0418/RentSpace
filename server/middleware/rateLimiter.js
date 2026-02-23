/**
 * middleware/rateLimiter.js
 * express-rate-limit configurations for different route groups.
 */
const rateLimit = require('express-rate-limit')

const isDev = process.env.NODE_ENV === 'development'

// ── Base limiter factory ──────────────────────────────────────────────────────
const createLimiter = (windowMs, max, message) =>
  rateLimit({
    windowMs,
    max,
    standardHeaders: true,  // Return rate limit info in headers
    legacyHeaders:   false,
    message: { success: false, message },
    // Skip rate limiting in test and development environments
    skip: () => isDev || process.env.NODE_ENV === 'test',
  })

// ── Global: 500 requests per 15 minutes per IP ───────────────────────────────
const globalLimiter = createLimiter(
  15 * 60 * 1000,
  500,
  'Too many requests from this IP. Please try again in 15 minutes.'
)

// ── Auth: 20 attempts per 15 minutes (prevent brute force) ───────────────────
const authLimiter = createLimiter(
  15 * 60 * 1000,
  20,
  'Too many login attempts from this IP. Please try again in 15 minutes.'
)

// ── Upload: 50 per hour ───────────────────────────────────────────────────────
const uploadLimiter = createLimiter(
  60 * 60 * 1000,
  50,
  'Upload limit reached. Please try again in an hour.'
)

module.exports = { globalLimiter, authLimiter, uploadLimiter }
