/**
 * models/User.js
 * User schema — authentication, profile, ratings.
 */
const mongoose = require('mongoose')
const bcrypt   = require('bcryptjs')

const userSchema = new mongoose.Schema(
  {
    name: {
      type:     String,
      required: [true, 'Name is required'],
      trim:     true,
      maxlength: [60, 'Name cannot exceed 60 characters'],
    },
    email: {
      type:      String,
      required:  [true, 'Email is required'],
      unique:    true,
      lowercase: true,
      trim:      true,
      match:     [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
    },
    password: {
      type:      String,
      // Not required for Google OAuth users
      minlength: [8, 'Password must be at least 8 characters'],
      select:    false, // Never return password in queries by default
    },
    avatar: {
      type:    String,
      default: null,  // Cloudinary URL
    },
    bio: {
      type:      String,
      maxlength: [300, 'Bio cannot exceed 300 characters'],
      default:   '',
    },
    location: {
      type:    String,
      default: '',
    },
    role: {
      type:    String,
      enum:    ['user', 'admin'],
      default: 'user',
    },
    // ── Ratings (denormalised for fast read) ────────────────────────────
    rating: {
      type:    Number,
      default: 0,
      min:     0,
      max:     5,
    },
    totalReviews: {
      type:    Number,
      default: 0,
    },
    // ── Account status ───────────────────────────────────────────────────
    isVerified: {
      type:    Boolean,
      default: false,
    },
    isBanned: {
      type:    Boolean,
      default: false,
    },
    // ── OTP for email verification ──────────────────────────────────────
    otp: {
      type:   String,
      select: false,
    },
    otpExpiry: {
      type:   Date,
      select: false,
    },
    // ── Password reset ──────────────────────────────────────────────────
    resetOtp: {
      type:   String,
      select: false,
    },
    resetOtpExpiry: {
      type:   Date,
      select: false,
    },
    // ── Refresh token (stored hashed) ────────────────────────────────────
    refreshToken: {
      type:   String,
      select: false,
    },    // ── Google OAuth ─────────────────────────────────────────────────────────
    googleId: {
      type:   String,
      default: null,
      index:  true,
    },    // ── Wishlist ─────────────────────────────────────────────────────────
    wishlist: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Item',
    }],
    // ── Earnings (accumulated from accepted rentals, excluding deposit) ────
    totalEarnings: {
      type:    Number,
      default: 0,
      min:     0,
    },
    // ── Payment-ready ────────────────────────────────────────────────────
    stripeCustomerId: {
      type:   String,
      select: false,
    },
  },
  {
    timestamps: true, // adds createdAt, updatedAt
  }
)

// ── Pre-save hook: hash password before storing ───────────────────────────────
userSchema.pre('save', async function (next) {
  // Only hash if password was modified (not on every save)
  if (!this.isModified('password')) return next()
  const salt = await bcrypt.genSalt(12)
  this.password = await bcrypt.hash(this.password, salt)
  next()
})

// ── Instance method: compare plain password with stored hash ──────────────────
userSchema.methods.comparePassword = async function (plainPassword) {
  // Google OAuth users have no password — reject email/password login attempts
  if (!this.password) return false
  return bcrypt.compare(plainPassword, this.password)
}

// ── Instance method: return public profile (strips sensitive fields) ──────────
userSchema.methods.toPublicProfile = function () {
  const obj = this.toObject()
  delete obj.password
  delete obj.refreshToken
  delete obj.stripeCustomerId
  delete obj.__v
  return obj
}

module.exports = mongoose.model('User', userSchema)
