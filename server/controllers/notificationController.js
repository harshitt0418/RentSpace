/**
 * controllers/notificationController.js
 * In-app notifications: list, mark read, delete.
 */
const Notification = require('../models/Notification')
const ApiError     = require('../utils/ApiError')

/* ─────────────────────────────────────────────────────────────
   GET /api/notifications
   Query: page, limit, unreadOnly
──────────────────────────────────────────────────────────────── */
exports.getNotifications = async (req, res, next) => {
  try {
    const page       = Math.max(1, parseInt(req.query.page)  || 1)
    const limit      = Math.min(50, parseInt(req.query.limit) || 20)
    const skip       = (page - 1) * limit
    const unreadOnly = req.query.unreadOnly === 'true'

    const filter = { user: req.user._id }
    if (unreadOnly) filter.isRead = false

    const [notifications, total, unreadCount] = await Promise.all([
      Notification.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Notification.countDocuments(filter),
      Notification.countDocuments({ user: req.user._id, isRead: false }),
    ])

    res.status(200).json({
      success:     true,
      notifications,
      total,
      unreadCount,
      page,
      pages: Math.ceil(total / limit),
    })
  } catch (err) {
    next(err)
  }
}

/* ─────────────────────────────────────────────────────────────
   PATCH /api/notifications/:id/read
──────────────────────────────────────────────────────────────── */
exports.markRead = async (req, res, next) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { isRead: true },
      { new: true }
    )
    if (!notification) return next(new ApiError('Notification not found', 404))

    res.status(200).json({ success: true, notification })
  } catch (err) {
    next(err)
  }
}

/* ─────────────────────────────────────────────────────────────
   PATCH /api/notifications/read-all
──────────────────────────────────────────────────────────────── */
exports.markAllRead = async (req, res, next) => {
  try {
    await Notification.updateMany({ user: req.user._id, isRead: false }, { isRead: true })
    res.status(200).json({ success: true, message: 'All notifications marked as read' })
  } catch (err) {
    next(err)
  }
}

/* ─────────────────────────────────────────────────────────────
   DELETE /api/notifications
   Deletes ALL notifications for the authenticated user.
──────────────────────────────────────────────────────────────── */
exports.clearAllNotifications = async (req, res, next) => {
  try {
    await Notification.deleteMany({ user: req.user._id })
    res.status(200).json({ success: true, message: 'All notifications cleared' })
  } catch (err) {
    next(err)
  }
}

/* ─────────────────────────────────────────────────────────────
   DELETE /api/notifications/:id
──────────────────────────────────────────────────────────────── */
exports.deleteNotification = async (req, res, next) => {
  try {
    const notification = await Notification.findOneAndDelete({
      _id:  req.params.id,
      user: req.user._id,
    })
    if (!notification) return next(new ApiError('Notification not found', 404))

    res.status(200).json({ success: true, message: 'Notification deleted' })
  } catch (err) {
    next(err)
  }
}
