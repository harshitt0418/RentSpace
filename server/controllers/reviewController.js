/**
 * controllers/reviewController.js
 * Create and fetch reviews for items and users.
 */
const Review   = require('../models/Review')
const Request  = require('../models/Request')
const ApiError = require('../utils/ApiError')
const paginate = require('../utils/pagination')

/* ─────────────────────────────────────────────────────────────
   POST /api/reviews
   Body: { requestId, rating, comment, type ('item' | 'user'), revieweeId }
   A review is only valid if the request is completed and the
   reviewer was a participant.
──────────────────────────────────────────────────────────────── */
exports.createReview = async (req, res, next) => {
  try {
    const { requestId, rating, comment, type, revieweeId } = req.body

    const request = await Request.findById(requestId)
    if (!request) return next(new ApiError('Request not found', 404))
    if (request.status !== 'completed') {
      return next(new ApiError('You can only review after the rental is completed', 400))
    }

    const isParticipant =
      request.requester.toString() === req.user._id.toString() ||
      request.owner.toString()     === req.user._id.toString()
    if (!isParticipant) return next(new ApiError('Not authorised', 403))

    // Prevent duplicate review
    const existing = await Review.findOne({ reviewer: req.user._id, request: requestId, type })
    if (existing) return next(new ApiError('You have already submitted this review', 400))

    const review = await Review.create({
      reviewer: req.user._id,
      reviewee: revieweeId,
      item:     request.item,
      request:  requestId,
      rating,
      comment,
      type,
    })

    // Recalculate target's average rating
    const targetModel = type === 'item' ? 'Item' : 'User'
    const targetId    = type === 'item' ? request.item : revieweeId
    await Review.updateRating(targetId, targetModel)

    res.status(201).json({ success: true, review })
  } catch (err) {
    next(err)
  }
}

/* ─────────────────────────────────────────────────────────────
   GET /api/reviews/item/:itemId
──────────────────────────────────────────────────────────────── */
exports.getItemReviews = async (req, res, next) => {
  try {
    const result = await paginate(
      Review,
      { item: req.params.itemId, type: 'item' },
      {
        page:     req.query.page,
        limit:    req.query.limit || 10,
        sort:     { createdAt: -1 },
        populate: { path: 'reviewer', select: 'name avatar' },
      }
    )
    res.status(200).json({ success: true, ...result })
  } catch (err) {
    next(err)
  }
}

/* ─────────────────────────────────────────────────────────────
   GET /api/reviews/user/:userId
──────────────────────────────────────────────────────────────── */
exports.getUserReviews = async (req, res, next) => {
  try {
    const result = await paginate(
      Review,
      { reviewee: req.params.userId, type: 'user' },
      {
        page:     req.query.page,
        limit:    req.query.limit || 10,
        sort:     { createdAt: -1 },
        populate: { path: 'reviewer', select: 'name avatar' },
      }
    )
    res.status(200).json({ success: true, ...result })
  } catch (err) {
    next(err)
  }
}

/* ─────────────────────────────────────────────────────────────
   GET /api/reviews/request/:requestId/mine
   Returns reviews the current user submitted for this request.
──────────────────────────────────────────────────────────────── */
exports.getMyRequestReviews = async (req, res, next) => {
  try {
    const reviews = await Review.find({
      reviewer: req.user._id,
      request:  req.params.requestId,
    }).lean()
    // Return as a map: { item: reviewObj|null, user: reviewObj|null }
    const map = { item: null, user: null }
    reviews.forEach((r) => { if (r.type === 'item' || r.type === 'user') map[r.type] = r })
    res.status(200).json({ success: true, data: map })
  } catch (err) {
    next(err)
  }
}
