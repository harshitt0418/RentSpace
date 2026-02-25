/**
 * controllers/requestController.js
 * Rental request lifecycle: send → accept/reject → cancel/complete.
 */
const Request = require('../models/Request')
const Item = require('../models/Item')
const User = require('../models/User')
const Notification = require('../models/Notification')
const ApiError = require('../utils/ApiError')
const paginate = require('../utils/pagination')

/* helper — diff in days (inclusive) */
const daysBetween = (start, end) =>
  Math.ceil((new Date(end) - new Date(start)) / (1000 * 60 * 60 * 24)) + 1

/* helper — create in-app notification */
const notify = (userId, type, title, message, link, extra = {}) =>
  Notification.create({ user: userId, type, title, message, link, ...extra })
    .catch((err) => console.error('[notify] Failed to create notification:', err.message))

/* ─────────────────────────────────────────────────────────────
   POST /api/requests
   Body: { itemId, startDate, endDate, message }
──────────────────────────────────────────────────────────────── */
exports.sendRequest = async (req, res, next) => {
  try {
    const { itemId, startDate, endDate, message } = req.body

    const item = await Item.findById(itemId)
    if (!item || item.status !== 'active') return next(new ApiError('Item not available', 404))
    if (item.owner.toString() === req.user._id.toString()) {
      return next(new ApiError('You cannot rent your own item', 400))
    }

    const start = new Date(startDate)
    const end = new Date(endDate)
    if (start >= end) return next(new ApiError('End date must be after start date', 400))

    // Check for date conflicts
    const conflict = await Request.findOne({
      item: itemId,
      status: { $in: ['pending', 'accepted'] },
      $or: [{ startDate: { $lte: end }, endDate: { $gte: start } }],
    })
    if (conflict) return next(new ApiError('Item is not available for the selected dates', 409))

    const totalDays = daysBetween(start, end)
    const totalCost = totalDays * item.pricePerDay
    const deposit = item.deposit || 0

    const request = await Request.create({
      item: itemId,
      requester: req.user._id,
      owner: item.owner,
      startDate: start,
      endDate: end,
      totalDays,
      totalCost,
      deposit,
      message,
    })

    await notify(
      item.owner,
      'request_received',
      'New rental request',
      `${req.user.name} wants to rent "${item.title}"`,
      `/dashboard`,
      { relatedRequest: request._id, relatedItem: item._id }
    )

    // Push real-time notification via Socket.io
    try {
      const { getIO } = require('../config/socket')
      getIO().to(`user_${item.owner.toString()}`).emit('notification', {
        type: 'request_received',
        title: 'New rental request',
        message: `${req.user.name} wants to rent "${item.title}"`,
        link: '/dashboard',
      })
    } catch (_) { /* socket not ready */ }

    res.status(201).json({ success: true, request })
  } catch (err) {
    next(err)
  }
}

/* ─────────────────────────────────────────────────────────────
   GET /api/requests/received   — requests I received as owner
   GET /api/requests/sent       — requests I sent as requester
──────────────────────────────────────────────────────────────── */
exports.getReceived = async (req, res, next) => {
  try {
    const { status, page, limit } = req.query
    const filter = { owner: req.user._id }
    if (status) filter.status = status

    const result = await paginate(Request, filter, {
      page, limit,
      sort: { createdAt: -1 },
      populate: [
        { path: 'item', select: 'title images pricePerDay category' },
        { path: 'requester', select: 'name avatar rating' },
      ],
    })

    res.status(200).json({ success: true, ...result })
  } catch (err) {
    next(err)
  }
}

exports.getSent = async (req, res, next) => {
  try {
    const { status, page, limit } = req.query
    const filter = { requester: req.user._id }
    if (status) filter.status = status

    const result = await paginate(Request, filter, {
      page, limit,
      sort: { createdAt: -1 },
      populate: [
        { path: 'item', select: 'title images pricePerDay category' },
        { path: 'owner', select: 'name avatar rating' },
      ],
    })

    res.status(200).json({ success: true, ...result })
  } catch (err) {
    next(err)
  }
}

/* ─────────────────────────────────────────────────────────────
   PATCH /api/requests/:id/accept
──────────────────────────────────────────────────────────────── */
exports.acceptRequest = async (req, res, next) => {
  try {
    const request = await Request.findById(req.params.id).populate('item requester', 'name title')
    if (!request) return next(new ApiError('Request not found', 404))
    if (request.owner.toString() !== req.user._id.toString()) {
      return next(new ApiError('Not authorised', 403))
    }
    if (request.status !== 'pending') {
      return next(new ApiError(`Cannot accept a ${request.status} request`, 400))
    }

    request.status = 'accepted'
    await request.save()

    // Credit earnings to owner (totalCost = days × pricePerDay, excludes deposit)
    await User.findByIdAndUpdate(request.owner, {
      $inc: { totalEarnings: request.totalCost },
    })

    // Block dates on item & auto-pause until the rental ends
    await Item.findByIdAndUpdate(request.item._id, {
      $push: { bookedDates: { startDate: request.startDate, endDate: request.endDate } },
      $set: { status: 'paused', pausedUntil: request.endDate },
    })

    await notify(
      request.requester._id,
      'request_accepted',
      'Request accepted!',
      `Your request for "${request.item.title}" was accepted`,
      `/dashboard`,
      { relatedRequest: request._id, relatedItem: request.item._id }
    )

    try {
      const { getIO } = require('../config/socket')
      getIO().to(`user_${request.requester._id.toString()}`).emit('notification', {
        type: 'request_accepted',
        title: 'Request accepted!',
        message: `Your request for "${request.item.title}" was accepted`,
        link: '/dashboard',
      })
    } catch (_) { }

    res.status(200).json({ success: true, request })
  } catch (err) {
    next(err)
  }
}

/* ─────────────────────────────────────────────────────────────
   PATCH /api/requests/:id/reject
   Body: { rejectionReason }
──────────────────────────────────────────────────────────────── */
exports.rejectRequest = async (req, res, next) => {
  try {
    const request = await Request.findById(req.params.id)
      .populate('item', 'title images')
      .populate('requester', 'name')
    if (!request) return next(new ApiError('Request not found', 404))
    if (request.owner.toString() !== req.user._id.toString()) {
      return next(new ApiError('Not authorised', 403))
    }
    if (request.status !== 'pending') {
      return next(new ApiError(`Cannot reject a ${request.status} request`, 400))
    }

    request.status = 'rejected'
    request.rejectionReason = req.body.rejectionReason || ''
    await request.save()

    const requesterId = request.requester?._id || request.requester
    const itemTitle = request.item?.title || 'your item'

    if (requesterId) {
      await notify(
        requesterId,
        'request_rejected',
        'Request declined',
        `Your request for "${itemTitle}" was declined`,
        `/dashboard`,
        { relatedRequest: request._id, relatedItem: request.item?._id }
      )

      try {
        const { getIO } = require('../config/socket')
        getIO().to(`user_${requesterId.toString()}`).emit('notification', {
          type: 'request_rejected',
          title: 'Request declined',
          message: `Your request for "${itemTitle}" was declined`,
          link: '/dashboard',
        })
      } catch (socketErr) {
        console.error('[socket] Failed to emit rejection notification:', socketErr.message)
      }
    }

    res.status(200).json({ success: true, request })
  } catch (err) {
    next(err)
  }
}

/* ─────────────────────────────────────────────────────────────
   PATCH /api/requests/:id/cancel
   Either party can cancel a pending/accepted request
──────────────────────────────────────────────────────────────── */
exports.cancelRequest = async (req, res, next) => {
  try {
    const request = await Request.findById(req.params.id).populate('item', 'title')
    if (!request) return next(new ApiError('Request not found', 404))

    const isOwner = request.owner.toString() === req.user._id.toString()
    const isRequester = request.requester.toString() === req.user._id.toString()
    if (!isOwner && !isRequester) return next(new ApiError('Not authorised', 403))

    if (!['pending', 'accepted'].includes(request.status)) {
      return next(new ApiError(`Cannot cancel a ${request.status} request`, 400))
    }

    // Block cancellation if check-in is less than 48 hours away
    const msUntilCheckin = new Date(request.startDate).getTime() - Date.now()
    const hoursUntilCheckin = msUntilCheckin / (1000 * 60 * 60)
    if (hoursUntilCheckin < 48) {
      return next(new ApiError('Cannot cancel within 48 hours of check-in date', 400))
    }

    const wasPreviouslyAccepted = request.status === 'accepted'
    request.status = 'cancelled'
    await request.save()

    // Remove blocked dates & resume item if was accepted
    if (wasPreviouslyAccepted) {
      await Item.findByIdAndUpdate(request.item._id, {
        $pull: { bookedDates: { startDate: request.startDate, endDate: request.endDate } },
        $set: { status: 'active', pausedUntil: null },
      })
    }

    const notifyId = isOwner ? request.requester : request.owner
    await notify(notifyId, 'request_cancelled', 'Request cancelled',
      `A rental request for "${request.item.title}" was cancelled`, `/dashboard`,
      { relatedRequest: request._id })

    try {
      const { getIO } = require('../config/socket')
      getIO().to(`user_${notifyId.toString()}`).emit('notification', {
        type: 'request_cancelled',
        title: 'Request cancelled',
        message: `A rental request for "${request.item.title}" was cancelled`,
        link: '/dashboard',
      })
    } catch (socketErr) {
      console.error('[socket] Failed to emit cancellation notification:', socketErr.message)
    }

    res.status(200).json({ success: true, request })
  } catch (err) {
    next(err)
  }
}

/* ─────────────────────────────────────────────────────────────
   PATCH /api/requests/:id/complete
   Owner marks rental as completed
──────────────────────────────────────────────────────────────── */
exports.completeRequest = async (req, res, next) => {
  try {
    const request = await Request.findById(req.params.id).populate('item requester', 'name title')
    if (!request) return next(new ApiError('Request not found', 404))
    if (request.owner.toString() !== req.user._id.toString()) {
      return next(new ApiError('Not authorised', 403))
    }
    if (request.status !== 'accepted') {
      return next(new ApiError('Only accepted requests can be completed', 400))
    }

    request.status = 'completed'
    await request.save()

    // Resume the item now that the rental is done
    await Item.findByIdAndUpdate(request.item._id, {
      $set: { status: 'active', pausedUntil: null },
    })

    await notify(
      request.requester._id,
      'review_reminder',
      'How was your rental?',
      `Your rental of "${request.item.title}" is complete. Leave a review!`,
      `/items/${request.item._id}`,
      { relatedRequest: request._id }
    )

    res.status(200).json({ success: true, request })
  } catch (err) {
    next(err)
  }
}
