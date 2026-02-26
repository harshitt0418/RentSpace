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
  const page = Math.max(1, parseInt(options.page) || 1)
  const limit = Math.min(100, Math.max(1, parseInt(options.limit) || 12))
  const skip = (page - 1) * limit
  // null = no sort (let MongoDB use natural / $nearSphere distance order)
  const sort = options.sort === null ? null : (options.sort || { createdAt: -1 })

  // Build the base query
  let query = Model.find(filter).skip(skip).limit(limit)
  if (sort !== null) query = query.sort(sort)

  if (options.select) query = query.select(options.select)
  if (options.populate) query = query.populate(options.populate)

  // countDocuments doesn't support $near / $nearSphere — fall back to data length when it fails
  let data, total
  try {
    ;[data, total] = await Promise.all([
      // Use clone() so the original query object isn't marked as executed if countDocuments throws
      query.clone().lean(),
      Model.countDocuments(filter),
    ])
  } catch (e) {
    // If countDocuments failed (e.g. due to geo search), we can still execute the original query
    data = await query.lean()
    total = data.length
  }

  const pages = Math.ceil(total / limit) || 1
  const hasNext = page < pages
  const hasPrev = page > 1

  return { data, total, page, pages, hasNext, hasPrev }
}

module.exports = paginate
