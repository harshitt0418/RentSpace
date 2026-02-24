/**
 * routes/notificationRoutes.js
 */
const router = require('express').Router()

const {
  getNotifications,
  markRead,
  markAllRead,
  deleteNotification,
  clearAllNotifications,
} = require('../controllers/notificationController')

const { protect } = require('../middleware/auth')

router.use(protect) // all notification routes require auth

router.get   ('/',             getNotifications)
router.patch ('/read-all',     markAllRead)
router.delete('/clear-all',    clearAllNotifications)
router.patch ('/:id/read',     markRead)
router.delete('/:id',          deleteNotification)

module.exports = router
