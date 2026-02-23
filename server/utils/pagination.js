/**
 * utils/pagination.js
 * Generic paginated-query helper for Mongoose models.
 *
 * Usage:
 *   const result = await paginate(Item, filter, { page, limit, sort, populate, select })
 *
 * Returns:
 *   { data, total, page, pages, hasNext, hasPrev }
 */

/**
 * @param {import('mongoose').Model} Model  - Mongoose model to query
 * @param {object}  filter                  - Mongoose query filter
 * @param {object}  options
 * @param {number}  [options.page=1]        - 1-based page number
 * @param {number}  [options.limit=12]      - Documents per page
 * @param {object}  [options.sort]          - Mongoose sort object, e.g. { createdAt: -1 }
 * @param {string|string[]} [options.populate] - Field(s) to populate
 * @param {string}  [options.select]        - Fields to include/exclude
 * @returns {Promise<{data: any[], total: number, page: number, pages: number, hasNext: boolean, hasPrev: boolean}>}
 */
const paginate = async (Model, filter = {}, options = {}) => {
  const page  = Math.max(1, parseInt(options.page)  || 1)
  const limit = Math.min(100, Math.max(1, parseInt(options.limit) || 12))
  const skip  = (page - 1) * limit
  const sort  = options.sort || { createdAt: -1 }

  // Build the base query
  let query = Model.find(filter).sort(sort).skip(skip).limit(limit)

  if (options.select)   query = query.select(options.select)
  if (options.populate) query = query.populate(options.populate)

  const [data, total] = await Promise.all([
    query.lean(),
    Model.countDocuments(filter),
  ])

  const pages   = Math.ceil(total / limit) || 1
  const hasNext = page < pages
  const hasPrev = page > 1

  return { data, total, page, pages, hasNext, hasPrev }
}

module.exports = paginate
