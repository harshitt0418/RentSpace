/**
 * controllers/itemController.js
 * CRUD + image upload for rental listings.
 */
const Item = require('../models/Item')
const ApiError = require('../utils/ApiError')
const paginate = require('../utils/pagination')
const { uploadImage, deleteImage, uploadMany } = require('../services/cloudinaryService')

/* ─────────────────────────────────────────────────────────────
   GET /api/items
   Query: page, limit, category, q (text search), minPrice, maxPrice, sort,
          lat, lng, radius (km, default 50) — geo proximity filter
──────────────────────────────────────────────────────────────── */
exports.getItems = async (req, res, next) => {
  try {
    const { page = 1, limit = 12, category, q, minPrice, maxPrice, sort, owner, excludeOwner, lat, lng, radius = 50, city } = req.query

    // Auto-resume items whose pausedUntil date has passed
    await Item.updateMany(
      { status: 'paused', pausedUntil: { $lte: new Date() } },
      { $set: { status: 'active', pausedUntil: null } }
    )

    // When viewing your own listings (dashboard), show active + paused but not deleted.
    // When browsing publicly (no owner filter, or someone else's profile), show only active.
    const isOwnItems = owner && req.user && owner === req.user._id.toString()
    const filter = isOwnItems
      ? { owner, status: { $ne: 'deleted' } }
      : { status: 'active' }
    if (owner && !isOwnItems) filter.owner = owner   // public profile — still active-only

    // excludeOwner — hide a specific user's items (e.g. landing page hides your own listings)
    if (excludeOwner) filter.owner = { $ne: excludeOwner }

    if (category) filter.category = category

    // Geo proximity filter: lat + lng provided → find items within radius km
    // NOTE: $nearSphere is incompatible with $text, so when geo is active we use regex for search
    // Only items with coordinates stored are eligible; add coordinates existence check
    const hasGeo = lat && lng
    if (hasGeo) {
      // Query using GeoJSON $nearSphere on the indexed location.coordinates field
      filter['location.coordinates'] = {
        $nearSphere: {
          $geometry: { type: 'Point', coordinates: [parseFloat(lng), parseFloat(lat)] },
          $maxDistance: parseFloat(radius) * 1000, // convert km → metres
        },
      }
      // Fallback text search via regex (can't combine $text + $nearSphere)
      if (q) {
        const re = new RegExp(q.split(' ').map((w) => `(?=.*${w})`).join(''), 'i')
        filter.$or = [{ title: re }, { description: re }]
      }
    } else {
      // City name text filter — regex match on location.city
      if (city) filter['location.city'] = { $regex: city.trim(), $options: 'i' }
      if (q) filter.$text = { $search: q }
    }

    if (minPrice || maxPrice) {
      filter.pricePerDay = {}
      if (minPrice) filter.pricePerDay.$gte = Number(minPrice)
      if (maxPrice) filter.pricePerDay.$lte = Number(maxPrice)
    }

    const sortMap = {
      newest: { createdAt: -1 },
      oldest: { createdAt: 1 },
      price_asc: { pricePerDay: 1 },
      price_desc: { pricePerDay: -1 },
      rating: { rating: -1 },
    }

    // $nearSphere returns results already sorted by distance; let that take precedence unless explicit sort chosen
    const chosenSort = hasGeo && !sort ? null : sortMap[sort] || { createdAt: -1 }

    const result = await paginate(Item, filter, {
      page,
      limit,
      sort: chosenSort,
      populate: { path: 'owner', select: 'name avatar rating' },
      select: 'title images pricePerDay deposit minRentalDays description tags category location rating totalReviews owner status pausedUntil',
    })

    res.status(200).json({ success: true, ...result })
  } catch (err) {
    next(err)
  }
}

/* ─────────────────────────────────────────────────────────────
   GET /api/items/:id
──────────────────────────────────────────────────────────────── */
exports.getItem = async (req, res, next) => {
  try {
    const item = await Item.findById(req.params.id)
      .populate('owner', 'name avatar rating totalReviews bio location createdAt')

    if (!item || item.status === 'deleted') {
      return next(new ApiError('Item not found', 404))
    }

    res.status(200).json({ success: true, data: item })
  } catch (err) {
    next(err)
  }
}

/* ─────────────────────────────────────────────────────────────
   POST /api/items
   Requires: protect  |  Body: item fields (text only, images separate)
──────────────────────────────────────────────────────────────── */
exports.createItem = async (req, res, next) => {
  try {
    const { title, description, category, pricePerDay, deposit, location, tags, minRentalDays } = req.body

    // location may arrive as a JSON string (from FormData) or a plain object (from JSON body)
    let parsedLocation = location
    if (typeof location === 'string') {
      try { parsedLocation = JSON.parse(location) } catch { parsedLocation = { city: location } }
    }

    const item = await Item.create({
      owner: req.user._id,
      title,
      description,
      category,
      pricePerDay,
      deposit,
      minRentalDays: minRentalDays ? Math.max(1, parseInt(minRentalDays, 10)) : 1,
      location: parsedLocation,
      tags: tags ? (Array.isArray(tags) ? tags : tags.split(',').map((t) => t.trim())) : [],
      images: [],
    })

    // Upload any images that were sent in the same multipart request
    if (req.files?.length > 0) {
      try {
        const buffers = req.files.map((f) => f.buffer)
        const uploaded = await uploadMany(buffers, 'rentspace/items')
        item.images = uploaded.map((u) => u.url)
        await item.save()
      } catch (uploadErr) {
        // Non-fatal — item was created; log but don't fail the request
        console.error('Image upload error (item still created):', uploadErr.message)
      }
    }

    res.status(201).json({ success: true, item })
  } catch (err) {
    next(err)
  }
}

/* ─────────────────────────────────────────────────────────────
   PATCH /api/items/:id
   Requires: protect + owner
──────────────────────────────────────────────────────────────── */
exports.updateItem = async (req, res, next) => {
  try {
    const item = await Item.findById(req.params.id)
    if (!item) return next(new ApiError('Item not found', 404))
    if (item.owner.toString() !== req.user._id.toString()) {
      return next(new ApiError('Not authorised to update this item', 403))
    }

    const allowed = ['title', 'description', 'category', 'pricePerDay', 'deposit', 'minRentalDays', 'location', 'tags', 'status']
    allowed.forEach((key) => { if (req.body[key] !== undefined) item[key] = req.body[key] })

    await item.save()
    res.status(200).json({ success: true, item })
  } catch (err) {
    next(err)
  }
}

/* ─────────────────────────────────────────────────────────────
   DELETE /api/items/:id
   Soft-delete: sets status to 'deleted'
──────────────────────────────────────────────────────────────── */
exports.deleteItem = async (req, res, next) => {
  try {
    const item = await Item.findById(req.params.id)
    if (!item) return next(new ApiError('Item not found', 404))

    const isOwner = item.owner.toString() === req.user._id.toString()
    const isAdmin = req.user.role === 'admin'
    if (!isOwner && !isAdmin) {
      return next(new ApiError('Not authorised', 403))
    }

    item.status = 'deleted'
    await item.save()

    res.status(200).json({ success: true, message: 'Item removed' })
  } catch (err) {
    next(err)
  }
}

/* ─────────────────────────────────────────────────────────────
   POST /api/items/:id/images
   Requires: protect + owner  |  Multipart: up to 5 images
──────────────────────────────────────────────────────────────── */
exports.uploadImages = async (req, res, next) => {
  try {
    const item = await Item.findById(req.params.id)
    if (!item) return next(new ApiError('Item not found', 404))
    if (item.owner.toString() !== req.user._id.toString()) {
      return next(new ApiError('Not authorised', 403))
    }
    if (!req.files?.length) return next(new ApiError('No images provided', 400))

    const remaining = 5 - item.images.length
    if (remaining <= 0) return next(new ApiError('Maximum 5 images already uploaded', 400))

    const buffers = req.files.slice(0, remaining).map((f) => f.buffer)
    const uploaded = await uploadMany(buffers, 'rentspace/items')

    item.images.push(...uploaded.map((u) => u.url))
    await item.save()

    res.status(200).json({ success: true, images: item.images })
  } catch (err) {
    next(err)
  }
}

/* ─────────────────────────────────────────────────────────────
   DELETE /api/items/:id/images
   Body: { imageUrl }
──────────────────────────────────────────────────────────────── */
exports.deleteImage = async (req, res, next) => {
  try {
    const { imageUrl } = req.body
    const item = await Item.findById(req.params.id)
    if (!item) return next(new ApiError('Item not found', 404))
    if (item.owner.toString() !== req.user._id.toString()) {
      return next(new ApiError('Not authorised', 403))
    }

    const publicId = imageUrl.split('/').slice(-2).join('/').split('.')[0]
    await deleteImage(publicId).catch(() => { })

    item.images = item.images.filter((img) => img !== imageUrl)
    await item.save()

    res.status(200).json({ success: true, images: item.images })
  } catch (err) {
    next(err)
  }
}
