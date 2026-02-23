/**
 * models/Item.js
 * Rental item listing schema.
 */
const mongoose = require('mongoose')

const itemSchema = new mongoose.Schema(
  {
    owner: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'User',
      required: true,
    },
    title: {
      type:      String,
      required:  [true, 'Title is required'],
      trim:      true,
      maxlength: [120, 'Title cannot exceed 120 characters'],
    },
    description: {
      type:      String,
      required:  [true, 'Description is required'],
      maxlength: [2000, 'Description cannot exceed 2000 characters'],
    },
    category: {
      type:     String,
      required: [true, 'Category is required'],
      enum:     ['Cameras', 'Bikes', 'Electronics', 'Tools', 'Instruments', 'Spaces', 'Vehicles', 'Sports', 'Other'],
    },
    // ── Images (Cloudinary URLs) ─────────────────────────────────────────
    images: {
      type:     [String],
      validate: {
        validator: (arr) => arr.length <= 5,
        message:   'Maximum 5 images allowed',
      },
      default:  [],
    },
    // ── Pricing ──────────────────────────────────────────────────────────
    pricePerDay: {
      type:     Number,
      required: [true, 'Price per day is required'],
      min:      [1, 'Price must be at least $1'],
    },
    deposit: {
      type:    Number,
      default: 0,
      min:     0,
    },
    // ── GeoJSON location (supports $near queries) ────────────────────────
    location: {
      city: { type: String, required: true },
      state: { type: String },
      address: { type: String },
      coordinates: {
        type:    [Number], // [longitude, latitude]
        index:   '2dsphere',
        default: undefined,
      },
    },
    tags: {
      type:     [String],
      default:  [],
      validate: {
        validator: (arr) => arr.length <= 10,
        message:   'Maximum 10 tags allowed',
      },
    },
    // ── Status ───────────────────────────────────────────────────────────
    status: {
      type:    String,
      enum:    ['active', 'paused', 'deleted'],
      default: 'active',
    },    // When auto-paused due to an accepted rental, stores the end date
    pausedUntil: { type: Date, default: null },    // ── Ratings (denormalised) ───────────────────────────────────────────
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
    // ── Availability blocks (dates when item is NOT available) ───────────
    bookedDates: [
      {
        startDate: { type: Date, required: true },
        endDate:   { type: Date, required: true },
        requestId: { type: mongoose.Schema.Types.ObjectId, ref: 'Request' },
      },
    ],
  },
  {
    timestamps: true,
    // Virtual fields are included when converting to JSON
    toJSON:    { virtuals: true },
    toObject:  { virtuals: true },
  }
)

// ── Text index for search ─────────────────────────────────────────────────────
itemSchema.index({ title: 'text', description: 'text', tags: 'text' })

// ── Compound index for browse filtering ──────────────────────────────────────
itemSchema.index({ category: 1, status: 1, pricePerDay: 1 })

// ── Virtual: cover image (first image) ───────────────────────────────────────
itemSchema.virtual('coverImage').get(function () {
  return this.images?.[0] || null
})

module.exports = mongoose.model('Item', itemSchema)
