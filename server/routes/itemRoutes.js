/**
 * routes/itemRoutes.js
 */
const router = require('express').Router()
const { body, query } = require('express-validator')

const {
  getItems,
  getItem,
  createItem,
  updateItem,
  deleteItem,
  uploadImages,
  deleteImage,
} = require('../controllers/itemController')

const { protect, optionalAuth }                         = require('../middleware/auth')
const { handleUpload, uploadItemImages }                = require('../middleware/upload')
const { uploadLimiter }                                 = require('../middleware/rateLimiter')
const validate                                           = require('../middleware/validate')

const createRules = [
  body('title').trim().notEmpty().isLength({ max: 100 }),
  body('description').trim().notEmpty().isLength({ max: 2000 }),
  body('category').notEmpty(),
  body('pricePerDay').isFloat({ min: 1 }),
]

router.get ('/',                   optionalAuth, getItems)
router.get ('/:id',                optionalAuth, getItem)
// Images are accepted in the same multipart request as the item text fields
router.post('/',                   protect, handleUpload(uploadItemImages), createRules, validate, createItem)
router.patch('/:id',               protect, updateItem)
router.delete('/:id',              protect, deleteItem)
router.post('/:id/images',         protect, uploadLimiter, handleUpload(uploadItemImages), uploadImages)
router.delete('/:id/images',       protect, deleteImage)

module.exports = router
