/**
 * routes/authRoutes.js
 */
const router   = require('express').Router()
const { body } = require('express-validator')
const passport = require('passport')

const {
  register,
  verifyOTP,
  resendOTP,
  login,
  logout,
  refreshToken,
  getMe,
  googleCallback,
  forgotPassword,
  resetPassword,
} = require('../controllers/authController')

const { protect }    = require('../middleware/auth')
const { authLimiter } = require('../middleware/rateLimiter')
const validate       = require('../middleware/validate')

// Validation rules
const registerRules = [
  body('name').trim().notEmpty().withMessage('Name is required').isLength({ max: 50 }),
  body('email').trim().isEmail().withMessage('Valid email required').normalizeEmail(),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
]

const loginRules = [
  body('email').trim().isEmail().withMessage('Valid email required').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
]

const otpRules = [
  body('email').trim().isEmail().withMessage('Valid email required').normalizeEmail(),
  body('otp').trim().isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits'),
]

const emailRule = [
  body('email').trim().isEmail().withMessage('Valid email required').normalizeEmail(),
]

const resetRules = [
  body('email').trim().isEmail().withMessage('Valid email required').normalizeEmail(),
  body('otp').trim().isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits'),
  body('newPassword').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
]

router.post('/register',        authLimiter, registerRules, validate, register)
router.post('/verify-otp',      authLimiter, otpRules,      validate, verifyOTP)
router.post('/resend-otp',      authLimiter, emailRule,     validate, resendOTP)
router.post('/login',           authLimiter, loginRules,    validate, login)
router.post('/logout',          protect, logout)
router.post('/refresh',         refreshToken)
router.get ('/me',              protect, getMe)
router.post('/forgot-password', authLimiter, emailRule,     validate, forgotPassword)
router.post('/reset-password',  authLimiter, resetRules,    validate, resetPassword)

// ── Google OAuth ─────────────────────────────────────────────────────────────
router.get('/google',
  passport.authenticate('google', { scope: ['profile', 'email'], session: false, prompt: 'select_account' })
)
router.get('/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: '/login' }),
  googleCallback
)

module.exports = router
