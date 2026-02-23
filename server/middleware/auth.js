/**
 * middleware/auth.js
 * JWT authentication middleware.
 *
 * protect      — verifies access token, attaches req.user
 * restrictTo   — role-based access guard
 * optionalAuth — attaches user if token present, or continues as guest
 */
const jwt  = require('jsonwebtoken')
const User = require('../models/User')
const ApiError = require('../utils/ApiError')

// ── Protect: require a valid access token ────────────────────────────────────
const protect = async (req, res, next) => {
  try {
    // Token can come from Authorization header or httpOnly cookie
    let token

    if (req.headers.authorization?.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1]
    } else if (req.cookies?.accessToken) {
      token = req.cookies.accessToken
    }

    if (!token) {
      return next(new ApiError('Not authenticated. Please sign in.', 401))
    }

    // Verify token signature and expiry
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET)

    // Attach fresh user data (exclude password)
    const user = await User.findById(decoded.id).select('-password -refreshToken')
    if (!user) {
      return next(new ApiError('User belonging to this token no longer exists.', 401))
    }

    if (user.isBanned) {
      return next(new ApiError('Your account has been suspended. Contact support.', 403))
    }

    req.user = user
    next()
  } catch (err) {
    if (err.name === 'JsonWebTokenError')  return next(new ApiError('Invalid token.', 401))
    if (err.name === 'TokenExpiredError') return next(new ApiError('Token expired. Please sign in again.', 401))
    next(err)
  }
}

// ── Restrict: role-based guard (use after protect) ────────────────────────────
const restrictTo = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return next(new ApiError('You do not have permission to perform this action.', 403))
  }
  next()
}

// ── Optional auth: attach user if token present, don't fail if not ───────────
const optionalAuth = async (req, res, next) => {
  try {
    let token
    if (req.headers.authorization?.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1]
    }
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET)
      req.user = await User.findById(decoded.id).select('-password -refreshToken')
    }
  } catch {
    // Silently ignore token errors for optional auth
  }
  next()
}

module.exports = { protect, restrictTo, optionalAuth }
