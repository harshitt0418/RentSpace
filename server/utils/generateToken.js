/**
 * utils/generateToken.js
 * JWT token generation helpers.
 *
 * Access token  — short-lived (15 min), sent in response body / Authorization header
 * Refresh token — long-lived (7 days), sent as httpOnly cookie
 */
const jwt = require('jsonwebtoken')

/**
 * Generate a short-lived JWT access token.
 * @param {string} userId - MongoDB ObjectId as string
 * @returns {string} signed JWT
 */
const generateAccessToken = (userId) =>
  jwt.sign(
    { id: userId },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: process.env.JWT_ACCESS_EXPIRE || '15m' }
  )

/**
 * Generate a long-lived JWT refresh token.
 * @param {string} userId - MongoDB ObjectId as string
 * @returns {string} signed JWT
 */
const generateRefreshToken = (userId) =>
  jwt.sign(
    { id: userId },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRE || '7d' }
  )

/**
 * Send tokens to the client:
 *  - Access token in JSON response body
 *  - Refresh token as an httpOnly cookie (XSS-safe)
 */
const sendTokens = (res, user, statusCode = 200) => {
  const accessToken = generateAccessToken(user._id)
  const refreshToken = generateRefreshToken(user._id)

  // httpOnly prevents JS access; secure flag requires HTTPS in production
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
  })

  const userData = user.toPublicProfile
    ? user.toPublicProfile()
    : { _id: user._id, name: user.name, email: user.email, role: user.role, avatar: user.avatar }

  res.status(statusCode).json({
    success: true,
    accessToken,
    user: userData,
  })
}

module.exports = { generateAccessToken, generateRefreshToken, sendTokens }
