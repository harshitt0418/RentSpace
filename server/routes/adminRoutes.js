/**
 * routes/adminRoutes.js
 * All routes require admin role — guarded by protect + restrictTo('admin').
 */
const router = require('express').Router()

const {
    getStats,
    getUsers,
    deleteUser,
    getItems,
    deleteItem,
    getReviews,
    deleteReview,
} = require('../controllers/adminController')

const { protect, restrictTo } = require('../middleware/auth')

// Every route in this module requires authentication + admin role
router.use(protect, restrictTo('admin'))

router.get('/stats', getStats)
router.get('/users', getUsers)
router.delete('/users/:id', deleteUser)
router.get('/items', getItems)
router.delete('/items/:id', deleteItem)
router.get('/reviews', getReviews)
router.delete('/reviews/:id', deleteReview)

module.exports = router
