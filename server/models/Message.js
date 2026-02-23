/**
 * models/Message.js
 * Individual messages inside a ChatRoom.
 */
const mongoose = require('mongoose')

const messageSchema = new mongoose.Schema(
  {
    room: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'ChatRoom',
      required: true,
    },
    sender: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'User',
      required: true,
    },
    content: {
      type:      String,
      required:  [true, 'Message content is required'],
      maxlength: [2000, 'Message too long'],
    },
    type: {
      type:    String,
      enum:    ['text', 'image'],
      default: 'text',
    },
    // Track who has read this message
    readBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  },
  { timestamps: true }
)

messageSchema.index({ room: 1, createdAt: -1 })

module.exports = mongoose.model('Message', messageSchema)
