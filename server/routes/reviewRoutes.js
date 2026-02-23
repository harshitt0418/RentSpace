/**
 * routes/reviewRoutes.js
 */
const router = require('express').Router()
const { body } = require('express-validator')

const {
  createReview,
  getItemReviews,
  getUserReviews,
  getMyRequestReviews,
} = require('../controllers/reviewController')

const { protect } = require('../middleware/auth')
const validate    = require('../middleware/validate')

const reviewRules = [
  body('requestId').notEmpty().isMongoId(),
  body('revieweeId').notEmpty().isMongoId(),
  body('rating').isInt({ min: 1, max: 5 }),
  body('comment').optional().trim().isLength({ max: 500 }),
  body('type').isIn(['item', 'user']),
]

router.post('/',              protect, reviewRules, validate, createReview)
router.get ('/item/:itemId',  getItemReviews)
router.get ('/user/:userId',  getUserReviews)
router.get ('/request/:requestId/mine', protect, getMyRequestReviews)

module.exports = router
