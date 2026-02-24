/**
 * controllers/userController.js
 * Public profile, update profile, upload avatar.
 */
const User     = require('../models/User')
const Item     = require('../models/Item')
const Review   = require('../models/Review')
const ApiError  = require('../utils/ApiError')
const { uploadImage, deleteImage } = require('../services/cloudinaryService')

/* ─────────────────────────────────────────────────────────────
   GET /api/users/:id
   Public — no auth required
──────────────────────────────────────────────────────────────── */
exports.getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id)
    if (!user) return next(new ApiError('User not found', 404))

    const [listings, reviews] = await Promise.all([
      Item.find({ owner: user._id, status: 'active' })
        .sort({ createdAt: -1 })
        .limit(6)
        .select('title images pricePerDay rating totalReviews location'),
      Review.find({ reviewee: user._id, type: 'user' })
        .populate('reviewer', 'name avatar')
        .sort({ createdAt: -1 })
        .limit(5),
    ])

    res.status(200).json({
      success: true,
      user: user.toPublicProfile(),
      listings,
      reviews,
    })
  } catch (err) {
    next(err)
  }
}

/* ─────────────────────────────────────────────────────────────
   PATCH /api/users/me
   Requires: protect  |  Body: { name, bio, location }
──────────────────────────────────────────────────────────────── */
exports.updateProfile = async (req, res, next) => {
  try {
    const allowed = ['name', 'bio', 'location']
    const updates = {}
    allowed.forEach((key) => { if (req.body[key] !== undefined) updates[key] = req.body[key] })

    const user = await User.findByIdAndUpdate(req.user._id, updates, {
      new: true,
      runValidators: true,
    })

    res.status(200).json({ success: true, user: user.toPublicProfile() })
  } catch (err) {
    next(err)
  }
}

/* ─────────────────────────────────────────────────────────────
   PATCH /api/users/me/avatar
   Requires: protect  |  Multipart: avatar file (via uploadAvatar middleware)
──────────────────────────────────────────────────────────────── */
exports.uploadAvatar = async (req, res, next) => {
  try {
    if (!req.file) return next(new ApiError('No image provided', 400))

    // Remove old Cloudinary asset
    const currentUser = await User.findById(req.user._id).select('avatar')
    if (currentUser.avatar && currentUser.avatar.includes('cloudinary')) {
      const publicId = currentUser.avatar.split('/').slice(-2).join('/').split('.')[0]
      await deleteImage(publicId).catch(() => {}) // non-fatal
    }

    const { url } = await uploadImage(req.file.buffer, 'rentspace/avatars', {
      transformation: [{ width: 300, height: 300, crop: 'fill', gravity: 'face' }],
    })

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { avatar: url },
      { new: true }
    )

    res.status(200).json({ success: true, avatar: user.avatar, user: user.toPublicProfile() })
  } catch (err) {
    next(err)
  }
}

/* ─────────────────────────────────────────────────────────────
   GET /api/users
   Public — list community members
──────────────────────────────────────────────────────────────── */
exports.getUsers = async (req, res, next) => {
  try {
    const Review = require('../models/Review')
    const limit = Math.min(parseInt(req.query.limit) || 30, 50)
    const users = await User.find()
      .sort({ createdAt: -1 })
      .limit(limit)
      .select('name avatar bio rating totalReviews createdAt')

    // Count listings per user
    const userIds = users.map((u) => u._id)
    const listingCounts = await Item.aggregate([
      { $match: { owner: { $in: userIds }, status: 'active' } },
      { $group: { _id: '$owner', count: { $sum: 1 } } },
    ])
    const countMap = Object.fromEntries(listingCounts.map((l) => [l._id.toString(), l.count]))

    // Compute live average ratings from Review collection (single aggregate for all users)
    // This is the fallback for users whose stored `rating` is still 0 due to stale data
    const liveRatings = await Review.aggregate([
      { $match: { reviewee: { $in: userIds }, type: 'user' } },
      { $group: { _id: '$reviewee', avg: { $avg: '$rating' }, count: { $sum: 1 } } },
    ])
    const ratingMap = Object.fromEntries(
      liveRatings.map((r) => [r._id.toString(), { avg: Math.round(r.avg * 10) / 10, count: r.count }])
    )

    const data = users.map((u) => {
      const live = ratingMap[u._id.toString()]
      const rating = (u.rating && u.rating > 0) ? u.rating : (live?.avg || 0)
      const totalReviews = u.totalReviews || live?.count || 0
      return {
        _id: u._id,
        name: u.name,
        avatar: u.avatar || null,
        bio: u.bio,
        rating,
        totalReviews,
        totalListings: countMap[u._id.toString()] || 0,
        createdAt: u.createdAt,
      }
    })

    res.status(200).json({ success: true, data })
  } catch (err) {
    next(err)
  }
}

/* ─────────────────────────────────────────────────────────────
   POST /api/users/me/wishlist/:itemId
   Toggle item in wishlist (add if absent, remove if present)
──────────────────────────────────────────────────────────────── */
exports.toggleWishlist = async (req, res, next) => {
  try {
    const { itemId } = req.params
    const user = await User.findById(req.user._id)

    const idx = user.wishlist.indexOf(itemId)
    if (idx === -1) {
      user.wishlist.push(itemId)
    } else {
      user.wishlist.splice(idx, 1)
    }
    await user.save({ validateBeforeSave: false })

    res.status(200).json({
      success: true,
      added: idx === -1,
      wishlist: user.wishlist,
    })
  } catch (err) {
    next(err)
  }
}

/* ─────────────────────────────────────────────────────────────
   GET /api/users/me/wishlist
   Get user's wishlist items (populated)
──────────────────────────────────────────────────────────────── */
exports.getWishlist = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).populate({
      path: 'wishlist',
      select: 'title images pricePerDay category location averageRating owner status',
      populate: { path: 'owner', select: 'name avatar' },
    })

    // Filter out deleted/inactive items
    const items = (user.wishlist || []).filter((item) => item && item.status === 'active')

    res.status(200).json({ success: true, data: items, ids: items.map((i) => i._id) })
  } catch (err) {
    next(err)
  }
}

/* ─────────────────────────────────────────────────────────────
   GET /api/users/me/wishlist/ids
   Just get the list of wishlisted item IDs (lightweight)
──────────────────────────────────────────────────────────────── */
exports.getWishlistIds = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('wishlist')
    res.status(200).json({ success: true, ids: user.wishlist || [] })
  } catch (err) {
    next(err)
  }
}

/* ─────────────────────────────────────────────────────────────
   GET /api/users/me/listings
   Requires: protect
──────────────────────────────────────────────────────────────── */
exports.getMyListings = async (req, res, next) => {
  try {
    const listings = await Item.find({ owner: req.user._id })
      .sort({ createdAt: -1 })
      .select('title images pricePerDay status rating totalReviews location')

    res.status(200).json({ success: true, count: listings.length, listings })
  } catch (err) {
    next(err)
  }
}
