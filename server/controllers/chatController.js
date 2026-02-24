/**
 * controllers/chatController.js
 * Chat rooms and message history (REST layer).
 * Real-time messaging is handled via Socket.io (config/socket.js).
 */
const ChatRoom     = require('../models/ChatRoom')
const Message      = require('../models/Message')
const Notification = require('../models/Notification')
const ApiError     = require('../utils/ApiError')

/* ─────────────────────────────────────────────────────────────
   GET /api/chat/rooms
   Returns all chat rooms the authenticated user is part of.
──────────────────────────────────────────────────────────────── */
exports.getRooms = async (req, res, next) => {
  try {
    const rooms = await ChatRoom.find({
      participants: req.user._id,
      deletedFor: { $ne: req.user._id },
    })
      .populate('participants', 'name avatar')
      .populate('request', 'status startDate endDate')
      .sort({ lastMessageAt: -1 })

    // Attach unread count per room
    const roomsWithUnread = await Promise.all(
      rooms.map(async (room) => {
        const unread = await Message.countDocuments({
          room: room._id,
          sender: { $ne: req.user._id },
          readBy: { $ne: req.user._id },
        })
        return { ...room.toObject(), unreadCount: unread }
      })
    )

    res.status(200).json({ success: true, count: rooms.length, rooms: roomsWithUnread })
  } catch (err) {
    next(err)
  }
}

/* ─────────────────────────────────────────────────────────────
   GET /api/chat/rooms/:roomId/messages
   Query: page, limit (default 30, newest first then reversed)
──────────────────────────────────────────────────────────────── */
exports.getMessages = async (req, res, next) => {
  try {
    const room = await ChatRoom.findById(req.params.roomId)
    if (!room) return next(new ApiError('Chat room not found', 404))

    const isParticipant = room.participants.some(
      (p) => p.toString() === req.user._id.toString()
    )
    if (!isParticipant) return next(new ApiError('Not authorised', 403))

    const page  = Math.max(1, parseInt(req.query.page)  || 1)
    const limit = Math.min(50, parseInt(req.query.limit) || 30)
    const skip  = (page - 1) * limit

    const [messages, total] = await Promise.all([
      Message.find({ room: req.params.roomId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('sender', 'name avatar'),
      Message.countDocuments({ room: req.params.roomId }),
    ])

    // Mark as read
    await Message.updateMany(
      { room: req.params.roomId, readBy: { $ne: req.user._id } },
      { $addToSet: { readBy: req.user._id } }
    )

    res.status(200).json({
      success: true,
      messages: messages.reverse(), // chronological order
      total,
      page,
      pages: Math.ceil(total / limit),
    })
  } catch (err) {
    next(err)
  }
}

/* ─────────────────────────────────────────────────────────────
   POST /api/chat/rooms
   Body: { recipientId, requestId? }
   Creates or returns an existing room between the two users.
──────────────────────────────────────────────────────────────── */
exports.createRoom = async (req, res, next) => {
  try {
    const { recipientId, requestId } = req.body
    if (!recipientId) return next(new ApiError('recipientId is required', 400))
    if (recipientId === req.user._id.toString()) {
      return next(new ApiError('Cannot create a chat with yourself', 400))
    }

    // Return existing room if one already exists between these two users
    let room = await ChatRoom.findOne({
      participants: { $all: [req.user._id, recipientId], $size: 2 },
    }).populate('participants', 'name avatar')

    if (!room) {
      room = await ChatRoom.create({
        participants: [req.user._id, recipientId],
        request: requestId || undefined,
      })
      room = await room.populate('participants', 'name avatar')
    }

    res.status(200).json({ success: true, room })
  } catch (err) {
    next(err)
  }
}

/* ─────────────────────────────────────────────────────────────
   POST /api/chat/rooms/:roomId/messages
   Body: { content, type? }
   Persists a message (Socket.io also handles real-time broadcast).
──────────────────────────────────────────────────────────────── */
/* ─────────────────────────────────────────────────────────────
   DELETE /api/chat/rooms/:roomId
   Soft-deletes a room for the requesting user.
──────────────────────────────────────────────────────────────── */
exports.deleteRoom = async (req, res, next) => {
  try {
    const room = await ChatRoom.findById(req.params.roomId)
    if (!room) return next(new ApiError('Chat room not found', 404))
    const isParticipant = room.participants.some(
      (p) => p.toString() === req.user._id.toString()
    )
    if (!isParticipant) return next(new ApiError('Not authorised', 403))

    // Mark deleted for this user
    await ChatRoom.findByIdAndUpdate(req.params.roomId, {
      $addToSet: { deletedFor: req.user._id },
    })

    // If all participants deleted → purge messages + room
    const updated = await ChatRoom.findById(req.params.roomId)
    const remaining = updated.participants.filter(
      (p) => !updated.deletedFor.map((d) => d.toString()).includes(p.toString())
    )
    if (remaining.length === 0) {
      await Message.deleteMany({ room: room._id })
      await ChatRoom.findByIdAndDelete(room._id)
    }

    res.status(200).json({ success: true, message: 'Conversation deleted' })
  } catch (err) {
    next(err)
  }
}

exports.sendMessage = async (req, res, next) => {
  try {
    const room = await ChatRoom.findById(req.params.roomId)
    if (!room) return next(new ApiError('Chat room not found', 404))

    const isParticipant = room.participants.some(
      (p) => p.toString() === req.user._id.toString()
    )
    if (!isParticipant) return next(new ApiError('Not authorised', 403))

    const message = await Message.create({
      room:    req.params.roomId,
      sender:  req.user._id,
      content: req.body.content,
      type:    req.body.type || 'text',
      readBy:  [req.user._id],
    })

    // Update room's last message summary
    await ChatRoom.findByIdAndUpdate(req.params.roomId, {
      lastMessage:   req.body.content,
      lastMessageAt: new Date(),
    })

    const populated = await message.populate('sender', 'name avatar')

    // Broadcast to all participants in the room via Socket.io
    try {
      const { getIO } = require('../config/socket')
      const io = getIO()
      io.to(req.params.roomId).emit('receive_message', populated.toObject())

      // Create notifications for other participants & push via socket
      const recipients = room.participants.filter(
        (p) => p.toString() !== req.user._id.toString()
      )
      for (const recipientId of recipients) {
        const notif = await Notification.create({
          user:    recipientId,
          type:    'new_message',
          title:   'New message',
          message: `${req.user.name}: ${req.body.content.substring(0, 80)}`,
          link:    `/chat/${req.params.roomId}`,
        })
        io.to(`user_${recipientId.toString()}`).emit('notification', notif.toObject())
      }
    } catch (_) { /* socket not ready */ }

    res.status(201).json({ success: true, message: populated })
  } catch (err) {
    next(err)
  }
}
