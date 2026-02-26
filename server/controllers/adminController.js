/**
 * controllers/adminController.js
 * Admin-only endpoints: stats, list/delete users, items, reviews.
 */
const User = require('../models/User')
const Item = require('../models/Item')
const Review = require('../models/Review')
const Request = require('../models/Request')
const ApiError = require('../utils/ApiError')

/* ─────────────────────────────────────────────────────────────
   GET /api/admin/stats
   Returns totals for the admin overview dashboard.
──────────────────────────────────────────────────────────────── */
exports.getStats = async (req, res, next) => {
    try {
        const [totalUsers, totalItems, totalReviews, totalRequests] = await Promise.all([
            User.countDocuments(),
            Item.countDocuments(),
            Review.countDocuments(),
            Request.countDocuments(),
        ])
        res.json({ success: true, totalUsers, totalItems, totalReviews, totalRequests })
    } catch (err) {
        next(err)
    }
}

/* ─────────────────────────────────────────────────────────────
   GET /api/admin/users?page=1&limit=20&search=
   List all users (paginated).
──────────────────────────────────────────────────────────────── */
exports.getUsers = async (req, res, next) => {
    try {
        const page = Math.max(1, parseInt(req.query.page) || 1)
        const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 20))
        const skip = (page - 1) * limit

        const filter = {}
        if (req.query.search) {
            const re = new RegExp(req.query.search, 'i')
            filter.$or = [{ name: re }, { email: re }]
        }

        const [users, total] = await Promise.all([
            User.find(filter)
                .select('name email role avatar location isVerified isBanned createdAt')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            User.countDocuments(filter),
        ])

        res.json({ success: true, users, total, page, pages: Math.ceil(total / limit) })
    } catch (err) {
        next(err)
    }
}

/* ─────────────────────────────────────────────────────────────
   DELETE /api/admin/users/:id
   Permanently delete a user and cascade-delete their items.
──────────────────────────────────────────────────────────────── */
exports.deleteUser = async (req, res, next) => {
    try {
        const user = await User.findById(req.params.id)
        if (!user) return next(new ApiError('User not found', 404))
        if (user.role === 'admin') return next(new ApiError('Cannot delete admin account', 400))

        // Cascade: remove user's items, reviews, and requests
        await Promise.all([
            Item.deleteMany({ owner: user._id }),
            Review.deleteMany({ $or: [{ reviewer: user._id }, { reviewee: user._id }] }),
            Request.deleteMany({ $or: [{ requester: user._id }, { owner: user._id }] }),
        ])
        await User.findByIdAndDelete(user._id)

        res.json({ success: true, message: 'User and related data deleted' })
    } catch (err) {
        next(err)
    }
}

/* ─────────────────────────────────────────────────────────────
   GET /api/admin/items?page=1&limit=20&search=
   List all items (paginated).
──────────────────────────────────────────────────────────────── */
exports.getItems = async (req, res, next) => {
    try {
        const page = Math.max(1, parseInt(req.query.page) || 1)
        const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 20))
        const skip = (page - 1) * limit

        const filter = {}
        if (req.query.search) {
            filter.title = new RegExp(req.query.search, 'i')
        }

        const [items, total] = await Promise.all([
            Item.find(filter)
                .populate('owner', 'name email')
                .select('title category pricePerDay status images location createdAt')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            Item.countDocuments(filter),
        ])

        res.json({ success: true, items, total, page, pages: Math.ceil(total / limit) })
    } catch (err) {
        next(err)
    }
}

/* ─────────────────────────────────────────────────────────────
   DELETE /api/admin/items/:id
   Permanently delete any item.
──────────────────────────────────────────────────────────────── */
exports.deleteItem = async (req, res, next) => {
    try {
        const item = await Item.findById(req.params.id)
        if (!item) return next(new ApiError('Item not found', 404))

        // Also remove related reviews and requests
        await Promise.all([
            Review.deleteMany({ item: item._id }),
            Request.deleteMany({ item: item._id }),
        ])
        await Item.findByIdAndDelete(item._id)

        res.json({ success: true, message: 'Item and related data deleted' })
    } catch (err) {
        next(err)
    }
}

/* ─────────────────────────────────────────────────────────────
   GET /api/admin/reviews?page=1&limit=20
   List all reviews (paginated).
──────────────────────────────────────────────────────────────── */
exports.getReviews = async (req, res, next) => {
    try {
        const page = Math.max(1, parseInt(req.query.page) || 1)
        const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 20))
        const skip = (page - 1) * limit

        const [reviews, total] = await Promise.all([
            Review.find()
                .populate('reviewer', 'name email')
                .populate('item', 'title')
                .select('rating comment type createdAt')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            Review.countDocuments(),
        ])

        res.json({ success: true, reviews, total, page, pages: Math.ceil(total / limit) })
    } catch (err) {
        next(err)
    }
}

/* ─────────────────────────────────────────────────────────────
   DELETE /api/admin/reviews/:id
   Delete any review.
──────────────────────────────────────────────────────────────── */
exports.deleteReview = async (req, res, next) => {
    try {
        const review = await Review.findById(req.params.id)
        if (!review) return next(new ApiError('Review not found', 404))

        await Review.findByIdAndDelete(review._id)

        // Recalculate ratings after deletion
        if (review.type === 'item' && review.item) {
            await Review.updateRating(review.item, 'Item')
        } else if (review.type === 'user' && review.reviewee) {
            await Review.updateRating(review.reviewee, 'User')
        }

        res.json({ success: true, message: 'Review deleted' })
    } catch (err) {
        next(err)
    }
}
