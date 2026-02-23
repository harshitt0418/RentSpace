/**
 * models/Notification.js
 * In-app notifications for rental events and messages.
 */
const mongoose = require('mongoose')

const notificationSchema = new mongoose.Schema(
  {
    user: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'User',
      required: true,
    },
    type: {
      type:    String,
      enum:    ['request_received', 'request_accepted', 'request_rejected', 'request_cancelled', 'new_message', 'new_review', 'review_reminder', 'system'],
      required: true,
    },
    title:   { type: String, required: true },
    message: { type: String, required: true },
    // Deep-link inside the app
    link:    { type: String, default: '/' },
    isRead:  { type: Boolean, default: false },
    // Optional related entity refs
    relatedRequest: { type: mongoose.Schema.Types.ObjectId, ref: 'Request' },
    relatedItem:    { type: mongoose.Schema.Types.ObjectId, ref: 'Item' },
  },
  { timestamps: true }
)

notificationSchema.index({ user: 1, isRead: 1, createdAt: -1 })

module.exports = mongoose.model('Notification', notificationSchema)
