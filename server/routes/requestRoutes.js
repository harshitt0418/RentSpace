/**
 * routes/requestRoutes.js
 */
const router = require('express').Router()
const { body } = require('express-validator')

const {
  sendRequest,
  getReceived,
  getSent,
  acceptRequest,
  rejectRequest,
  cancelRequest,
  completeRequest,
} = require('../controllers/requestController')

const { protect } = require('../middleware/auth')
const validate    = require('../middleware/validate')

const requestRules = [
  body('itemId').notEmpty().isMongoId(),
  body('startDate').isISO8601().toDate(),
  body('endDate').isISO8601().toDate(),
]

router.use(protect) // all request routes require auth

router.post  ('/',              requestRules, validate, sendRequest)
router.get   ('/received',      getReceived)
router.get   ('/sent',          getSent)
router.patch ('/:id/accept',    acceptRequest)
router.patch ('/:id/reject',    rejectRequest)
router.patch ('/:id/cancel',    cancelRequest)
router.patch ('/:id/complete',  completeRequest)

module.exports = router
