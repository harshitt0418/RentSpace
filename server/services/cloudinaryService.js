/**
 * services/cloudinaryService.js
 * Cloudinary upload / delete helpers.
 *
 * Wraps cloudinary's upload_stream in a Promise so it can be
 * used with async/await alongside multer's memoryStorage buffers.
 */
const cloudinary = require('cloudinary').v2
const { Readable } = require('stream')

// Configure once at import time (env vars loaded by server.js → dotenv)
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

// Check if Cloudinary is properly configured (not placeholder)
const isCloudinaryConfigured = () =>
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_CLOUD_NAME !== 'placeholder' &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_KEY !== 'placeholder'

// Generic placeholder returned when Cloudinary is not configured
const PLACEHOLDER_IMAGE = 'https://placehold.co/800x600/e2e8f0/94a3b8?text=Item+Image'

/**
 * Upload a Buffer to Cloudinary.
 *
 * @param {Buffer} buffer       - File buffer from multer memoryStorage
 * @param {string} folder       - Cloudinary folder, e.g. 'rentspace/items'
 * @param {object} [overrides]  - Extra cloudinary upload options
 * @returns {Promise<{url: string, publicId: string, width: number, height: number}>}
 */
const uploadImage = (buffer, folder = 'rentspace', overrides = {}) => {
  // If Cloudinary is not configured, return a placeholder image
  if (!isCloudinaryConfigured()) {
    return Promise.resolve({
      url:      PLACEHOLDER_IMAGE,
      publicId: 'placeholder',
      width:    800,
      height:   600,
    })
  }

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: 'image',
        allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
        transformation: [{ quality: 'auto', fetch_format: 'auto' }],
        ...overrides,
      },
      (error, result) => {
        if (error) return reject(error)
        resolve({
          url:      result.secure_url,
          publicId: result.public_id,
          width:    result.width,
          height:   result.height,
        })
      }
    )

    // Convert buffer → readable stream → pipe to Cloudinary
    Readable.from(buffer).pipe(uploadStream)
  })
}

/**
 * Delete an image from Cloudinary by its public_id.
 *
 * @param {string} publicId - Cloudinary public_id to remove
 * @returns {Promise<{result: string}>}
 */
const deleteImage = (publicId) => {
  if (!isCloudinaryConfigured() || publicId === 'placeholder') {
    return Promise.resolve({ result: 'ok' })
  }
  return cloudinary.uploader.destroy(publicId)
}

/**
 * Upload multiple buffers concurrently.
 *
 * @param {Buffer[]} buffers  - Array of file buffers
 * @param {string}   folder   - Cloudinary folder
 * @returns {Promise<Array>}
 */
const uploadMany = (buffers, folder) =>
  Promise.all(buffers.map((buf) => uploadImage(buf, folder)))

module.exports = { uploadImage, deleteImage, uploadMany }
