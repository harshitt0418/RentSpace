/**
 * controllers/authController.js
 * Handles register, login, logout, token refresh, getMe,
 * email OTP verification, forgot/reset password.
 */
const crypto  = require('crypto')
const User    = require('../models/User')
const ApiError = require('../utils/ApiError')
const { generateAccessToken, generateRefreshToken, sendTokens } = require('../utils/generateToken')
const { sendOTPEmail, sendPasswordResetEmail } = require('../utils/sendEmail')
const jwt     = require('jsonwebtoken')

/* ───────── helpers ───────── */
const clearRefreshCookie = (res) =>
  res.clearCookie('refreshToken', { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production' })

const setRefreshCookie = (res, token) => {
  res.cookie('refreshToken', token, {
    httpOnly: true,
    secure:   process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge:   7 * 24 * 60 * 60 * 1000,
  })
}

/** Generate a 6-digit OTP */
const generateOTP = () => String(Math.floor(100000 + Math.random() * 900000))

/* ─────────────────────────────────────────────────────────────
   POST /api/auth/register
   Body: { name, email, password }
   Creates user (unverified) and sends OTP email.
──────────────────────────────────────────────────────────────── */
exports.register = async (req, res, next) => {
  try {
    const { name, email, password, location } = req.body

    const existing = await User.findOne({ email }).select('+otp +otpExpiry')
    if (existing && existing.isVerified) {
      return next(new ApiError('Email already in use', 400))
    }

    // Generate OTP
    const otp       = generateOTP()
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000) // 10 min

    let user
    if (existing && !existing.isVerified) {
      // Update existing unverified user
      existing.name     = name
      existing.password = password
      existing.location = location || ''
      existing.otp      = otp
      existing.otpExpiry = otpExpiry
      await existing.save()
      user = existing
    } else {
      user = await User.create({ name, email, password, location: location || '', otp, otpExpiry })
    }

    // Send OTP email (skip in dev if SMTP fails)
    let emailSent = false
    try {
      await sendOTPEmail(email, otp)
      emailSent = true
    } catch (emailErr) {
      console.log('⚠️  Email send failed:', emailErr.message)
      if (process.env.NODE_ENV === 'production') {
        return next(new ApiError('Failed to send verification email. Please try again.', 500))
      }
      console.log(`📧 [DEV] OTP for ${email}: ${otp}`)
    }

    const response = {
      success: true,
      message: emailSent
        ? 'OTP sent to your email. Please verify to complete registration.'
        : 'Email delivery failed — use the OTP shown below (dev mode).',
      email,
    }
    // In dev mode, include OTP in response so flow is testable without SMTP
    if (process.env.NODE_ENV !== 'production') {
      response.devOtp = otp
    }
    res.status(200).json(response)
  } catch (err) {
    next(err)
  }
}

/* ─────────────────────────────────────────────────────────────
   POST /api/auth/verify-otp
   Body: { email, otp }
   Verifies OTP and logs the user in.
──────────────────────────────────────────────────────────────── */
exports.verifyOTP = async (req, res, next) => {
  try {
    const { email, otp } = req.body

    const user = await User.findOne({ email }).select('+otp +otpExpiry')
    if (!user) return next(new ApiError('User not found', 404))

    if (user.isVerified) return next(new ApiError('Email already verified', 400))

    if (!user.otp || !user.otpExpiry) {
      return next(new ApiError('No OTP found. Please register again.', 400))
    }

    if (Date.now() > user.otpExpiry.getTime()) {
      return next(new ApiError('OTP has expired. Please request a new one.', 400))
    }

    if (user.otp !== otp) {
      return next(new ApiError('Invalid OTP', 400))
    }

    // Mark verified, clear OTP
    user.isVerified = true
    user.otp        = undefined
    user.otpExpiry  = undefined
    await user.save({ validateBeforeSave: false })

    sendTokens(res, user, 201)
  } catch (err) {
    next(err)
  }
}

/* ─────────────────────────────────────────────────────────────
   POST /api/auth/resend-otp
   Body: { email }
   Resends OTP for unverified users.
──────────────────────────────────────────────────────────────── */
exports.resendOTP = async (req, res, next) => {
  try {
    const { email } = req.body

    const user = await User.findOne({ email }).select('+otp +otpExpiry')
    if (!user) return next(new ApiError('User not found', 404))

    if (user.isVerified) return next(new ApiError('Email already verified', 400))

    const otp       = generateOTP()
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000)

    user.otp       = otp
    user.otpExpiry = otpExpiry
    await user.save({ validateBeforeSave: false })

    try {
      await sendOTPEmail(email, otp)
    } catch (emailErr) {
      console.log('⚠️  Email send failed:', emailErr.message)
      if (process.env.NODE_ENV === 'production') {
        return next(new ApiError('Failed to send email. Please try again.', 500))
      }
      console.log(`📧 [DEV] Resend OTP for ${email}: ${otp}`)
    }

    const response = { success: true, message: 'OTP resent to your email.' }
    if (process.env.NODE_ENV !== 'production') {
      response.devOtp = otp
    }
    res.status(200).json(response)
  } catch (err) {
    next(err)
  }
}

/* ─────────────────────────────────────────────────────────────
   POST /api/auth/forgot-password
   Body: { email }
   Sends password-reset OTP.
──────────────────────────────────────────────────────────────── */
exports.forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body

    const user = await User.findOne({ email })
    if (!user) {
      // Don't reveal whether the email exists
      return res.status(200).json({ success: true, message: 'If that email is registered, an OTP has been sent.' })
    }

    // Google-only accounts can't reset password
    if (user.googleId && !user.password) {
      return next(new ApiError('This account uses Google sign-in. Please use "Continue with Google".', 400))
    }

    const otp       = generateOTP()
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000)

    user.resetOtp       = otp
    user.resetOtpExpiry = otpExpiry
    await user.save({ validateBeforeSave: false })

    let emailSent = false
    try {
      await sendPasswordResetEmail(email, otp)
      emailSent = true
    } catch (emailErr) {
      console.log('⚠️  Email send failed:', emailErr.message)
      if (process.env.NODE_ENV === 'production') {
        return next(new ApiError('Failed to send reset email. Please try again.', 500))
      }
      console.log(`📧 [DEV] Reset OTP for ${email}: ${otp}`)
    }

    const response = {
      success: true,
      message: emailSent
        ? 'If that email is registered, an OTP has been sent.'
        : 'Email delivery failed — use the OTP shown below (dev mode).',
    }
    if (process.env.NODE_ENV !== 'production') {
      response.devOtp = otp
    }
    res.status(200).json(response)
  } catch (err) {
    next(err)
  }
}

/* ─────────────────────────────────────────────────────────────
   POST /api/auth/reset-password
   Body: { email, otp, newPassword }
   Resets password after OTP verification.
──────────────────────────────────────────────────────────────── */
exports.resetPassword = async (req, res, next) => {
  try {
    const { email, otp, newPassword } = req.body

    const user = await User.findOne({ email }).select('+resetOtp +resetOtpExpiry')
    if (!user) return next(new ApiError('User not found', 404))

    if (!user.resetOtp || !user.resetOtpExpiry) {
      return next(new ApiError('No reset OTP found. Please request again.', 400))
    }

    if (Date.now() > user.resetOtpExpiry.getTime()) {
      return next(new ApiError('OTP has expired. Please request a new one.', 400))
    }

    if (user.resetOtp !== otp) {
      return next(new ApiError('Invalid OTP', 400))
    }

    user.password       = newPassword
    user.resetOtp       = undefined
    user.resetOtpExpiry = undefined
    await user.save()

    res.status(200).json({ success: true, message: 'Password reset successful. You can now log in.' })
  } catch (err) {
    next(err)
  }
}

/* ─────────────────────────────────────────────────────────────
   POST /api/auth/login
   Body: { email, password }
──────────────────────────────────────────────────────────────── */
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body

    const user = await User.findOne({ email }).select('+password')
    if (!user || !(await user.comparePassword(password))) {
      // Give a specific hint if the account was created via Google
      if (user?.googleId && !user?.password) {
        return next(new ApiError('This account uses Google sign-in. Please click "Continue with Google".', 401))
      }
      return next(new ApiError('Invalid credentials', 401))
    }

    if (!user.isVerified) {
      return next(new ApiError('Please verify your email first. Check your inbox for the OTP.', 403))
    }

    if (user.isBanned) {
      return next(new ApiError('Your account has been suspended', 403))
    }

    // Persist refresh token on the user document
    const refreshToken = generateRefreshToken(user._id)
    user.refreshToken  = refreshToken
    await user.save({ validateBeforeSave: false })

    sendTokens(res, user)
  } catch (err) {
    next(err)
  }
}

/* ─────────────────────────────────────────────────────────────
   POST /api/auth/logout
──────────────────────────────────────────────────────────────── */
exports.logout = async (req, res, next) => {
  try {
    // Invalidate stored refresh token
    if (req.user) {
      await User.findByIdAndUpdate(req.user._id, { refreshToken: null })
    }

    clearRefreshCookie(res)
    res.status(200).json({ success: true, message: 'Logged out successfully' })
  } catch (err) {
    next(err)
  }
}

/* ─────────────────────────────────────────────────────────────
   POST /api/auth/refresh
   Reads refresh token from httpOnly cookie
──────────────────────────────────────────────────────────────── */
exports.refreshToken = async (req, res, next) => {
  try {
    const token = req.cookies?.refreshToken
    if (!token) return next(new ApiError('No refresh token', 401))

    let decoded
    try {
      decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET)
    } catch {
      clearRefreshCookie(res)
      return next(new ApiError('Invalid or expired refresh token', 401))
    }

    const user = await User.findById(decoded.id).select('+refreshToken')
    if (!user || user.refreshToken !== token) {
      clearRefreshCookie(res)
      return next(new ApiError('Token reuse detected — please log in again', 401))
    }

    // Rotate: issue new pair
    const newRefresh    = generateRefreshToken(user._id)
    user.refreshToken   = newRefresh
    await user.save({ validateBeforeSave: false })

    sendTokens(res, user)
  } catch (err) {
    next(err)
  }
}

/* ─────────────────────────────────────────────────────────────
   GET /api/auth/me
   Requires: protect middleware
──────────────────────────────────────────────────────────────── */
exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id)
    res.status(200).json({ success: true, user: user.toPublicProfile() })
  } catch (err) {
    next(err)
  }
}

/* ─────────────────────────────────────────────────────────────
   GET /api/auth/google/callback
   Called by Passport after Google verifies the user.
──────────────────────────────────────────────────────────────── */
exports.googleCallback = async (req, res, next) => {
  try {
    const user = req.user          // set by passport strategy
    const refreshToken = generateRefreshToken(user._id)
    user.refreshToken  = refreshToken
    await user.save({ validateBeforeSave: false })

    setRefreshCookie(res, refreshToken)

    const accessToken = generateAccessToken(user._id)
    const clientURL   = process.env.CLIENT_URL || 'http://localhost:5173'
    res.redirect(`${clientURL}/auth/callback?token=${accessToken}`)
  } catch (err) {
    next(err)
  }
}
