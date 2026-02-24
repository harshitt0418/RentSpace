/**
 * models/ChatRoom.js
 * A conversation thread between two users, optionally tied to a rental request.
 */
const mongoose = require('mongoose')

const chatRoomSchema = new mongoose.Schema(
  {
    // Exactly two participants
    participants: [
      { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    ],
    // Optionally linked to a rental request
    request: {
      type: mongoose.Schema.Types.ObjectId,
      ref:  'Request',
    },
    // Denormalised for fast room-list rendering
    lastMessage:   { type: String,  default: '' },
    lastMessageAt: { type: Date,    default: Date.now },
    // Users who have "deleted" this conversation from their view
    deletedFor:    [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  },
  { timestamps: true }
)

// ── Ensure we don't create duplicate rooms for the same pair ──────────────────
chatRoomSchema.index({ participants: 1 })

module.exports = mongoose.model('ChatRoom', chatRoomSchema)
