/**
 * middleware/upload.js
 * Multer configuration for image uploads.
 * Files are stored in memory buffer then pushed to Cloudinary.
 */
const multer  = require('multer')
const ApiError = require('../utils/ApiError')

// ── Use in-memory storage (no disk writes) ────────────────────────────────────
const storage = multer.memoryStorage()

// ── File filter: images only ─────────────────────────────────────────────────
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true)
  } else {
    cb(new ApiError('Only image files are allowed', 400), false)
  }
}

// ── Single image (avatar) ────────────────────────────────────────────────────
const uploadAvatar = multer({
  storage,
  fileFilter,
  limits: { fileSize: 3 * 1024 * 1024 }, // 3 MB
}).single('avatar')

// ── Multiple images (item listing — up to 5) ─────────────────────────────────
const uploadItemImages = multer({
  storage,
  fileFilter,
  limits: { fileSize: 8 * 1024 * 1024, files: 5 }, // 8 MB each, max 5
}).array('images', 5)

// ── Proper Express middleware wrapper for multer ──────────────────────────────
const handleUpload = (multerFn) => (req, res, next) => {
  multerFn(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      return next(new ApiError(`Upload error: ${err.message}`, 400))
    } else if (err) {
      return next(err)
    }
    next()
  })
}

module.exports = { uploadAvatar, uploadItemImages, handleUpload }
