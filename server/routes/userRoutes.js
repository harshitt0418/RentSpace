/**
 * routes/userRoutes.js
 */
const router = require('express').Router()
const { body } = require('express-validator')

const {
  getProfile,
  getUsers,
  updateProfile,
  uploadAvatar,
  getMyListings,
  toggleWishlist,
  getWishlist,
  getWishlistIds,
} = require('../controllers/userController')

const { protect }         = require('../middleware/auth')
const { handleUpload, uploadAvatar: avatarMw } = require('../middleware/upload')
const validate            = require('../middleware/validate')

const updateRules = [
  body('name').optional().trim().notEmpty().isLength({ max: 50 }),
  body('bio').optional().trim().isLength({ max: 300 }),
]

router.get ('/',            getUsers)
router.get ('/me/listings',        protect, getMyListings)
router.get ('/me/wishlist',        protect, getWishlist)
router.get ('/me/wishlist/ids',    protect, getWishlistIds)
router.post('/me/wishlist/:itemId', protect, toggleWishlist)
router.patch('/me',         protect, updateRules, validate, updateProfile)
router.patch('/me/avatar',  protect, handleUpload(avatarMw), uploadAvatar)
router.get ('/:id',         getProfile)

module.exports = router
