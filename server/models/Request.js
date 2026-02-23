/**
 * models/Request.js
 * Rental request sent from a renter to an item owner.
 */
const mongoose = require('mongoose')

const requestSchema = new mongoose.Schema(
  {
    item: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'Item',
      required: true,
    },
    requester: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'User',
      required: true,
    },
    owner: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'User',
      required: true,
    },
    // ── Rental period ─────────────────────────────────────────────────
    startDate: { type: Date, required: true },
    endDate:   { type: Date, required: true },
    // ── Cost snapshot (calculated at request time) ────────────────────
    totalDays: { type: Number, required: true, min: 1 },
    totalCost: { type: Number, required: true, min: 0 },
    deposit:   { type: Number, default: 0 },
    // ── Message from renter ───────────────────────────────────────────
    message: {
      type:      String,
      maxlength: [500, 'Message cannot exceed 500 characters'],
      default:   '',
    },
    // ── Lifecycle status ──────────────────────────────────────────────
    status: {
      type:    String,
      enum:    ['pending', 'accepted', 'rejected', 'cancelled', 'completed'],
      default: 'pending',
    },
    // ── Payment (Stripe) ─────────────────────────────────────────────
    paymentStatus: {
      type:    String,
      enum:    ['unpaid', 'paid', 'refunded'],
      default: 'unpaid',
    },
    stripePaymentIntentId: { type: String },
    // ── Rejection reason ─────────────────────────────────────────────
    rejectionReason: { type: String, default: '' },
  },
  { timestamps: true }
)

// ── Index for fast lookup by user ─────────────────────────────────────────────
requestSchema.index({ requester: 1, status: 1 })
requestSchema.index({ owner: 1, status: 1 })

module.exports = mongoose.model('Request', requestSchema)
