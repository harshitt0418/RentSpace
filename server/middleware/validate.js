/**
 * middleware/validate.js
 * express-validator result checker.
 * Place after validation chains to return 400 on invalid input.
 */
const { validationResult } = require('express-validator')
const ApiError = require('../utils/ApiError')

const validate = (req, res, next) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    const messages = errors.array().map((e) => e.msg)
    return next(new ApiError(messages.join('. '), 400))
  }
  next()
}

module.exports = validate
