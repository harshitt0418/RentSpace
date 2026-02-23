/**
 * routes/chatRoutes.js
 */
const router = require('express').Router()
const { body } = require('express-validator')

const {
  getRooms,
  getMessages,
  createRoom,
  sendMessage,
} = require('../controllers/chatController')

const { protect } = require('../middleware/auth')
const validate    = require('../middleware/validate')

router.use(protect) // all chat routes require auth

router.get ('/rooms',                  getRooms)
router.post('/rooms',                  [body('recipientId').notEmpty().isMongoId()], validate, createRoom)
router.get ('/rooms/:roomId/messages', getMessages)
router.post('/rooms/:roomId/messages', [body('content').notEmpty()], validate, sendMessage)

module.exports = router
