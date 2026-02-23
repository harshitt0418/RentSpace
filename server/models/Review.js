/**
 * models/Review.js
 * Review left by either party after a completed rental.
 */
const mongoose = require('mongoose')

const reviewSchema = new mongoose.Schema(
  {
    // Who wrote the review
    reviewer: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'User',
      required: true,
    },
    // Who/what is being reviewed
    reviewee: {
      type: mongoose.Schema.Types.ObjectId,
      ref:  'User', // null for item reviews
    },
    item: {
      type: mongoose.Schema.Types.ObjectId,
      ref:  'Item',
    },
    // The request that triggered the review
    request: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'Request',
      required: true,
    },
    rating: {
      type:     Number,
      required: true,
      min:      1,
      max:      5,
    },
    comment: {
      type:      String,
      required:  [true, 'Review comment is required'],
      maxlength: [1000, 'Comment cannot exceed 1000 characters'],
    },
    // 'item' review shows on item page; 'user' review shows on user profile
    type: {
      type:     String,
      enum:     ['item', 'user'],
      required: true,
    },
  },
  { timestamps: true }
)

// ── Prevent duplicate reviews per request ─────────────────────────────────────
reviewSchema.index({ reviewer: 1, request: 1, type: 1 }, { unique: true })

// ── After save: update average rating on the item or user ─────────────────────
reviewSchema.statics.updateRating = async function (targetId, targetModel) {
  const matchField = targetModel === 'Item' ? 'item' : 'reviewee'
  const typeFilter = targetModel === 'Item' ? 'item' : 'user'
  const result = await this.aggregate([
    { $match: { [matchField]: targetId, type: typeFilter } },
    { $group: { _id: null, avgRating: { $avg: '$rating' }, count: { $sum: 1 } } },
  ])
  const Model = require(`./${targetModel}`)
  if (result.length > 0) {
    await Model.findByIdAndUpdate(targetId, {
      rating:       Math.round(result[0].avgRating * 10) / 10,
      totalReviews: result[0].count,
    })
  } else {
    await Model.findByIdAndUpdate(targetId, { rating: 0, totalReviews: 0 })
  }
}

module.exports = mongoose.model('Review', reviewSchema)
