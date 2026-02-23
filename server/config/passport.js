/**
 * config/passport.js
 * Configures Passport.js Google OAuth 2.0 strategy.
 * Users are created/linked automatically on first sign-in.
 */
const passport     = require('passport')
const GoogleStrategy = require('passport-google-oauth20').Strategy
const User         = require('../models/User')

passport.use(
  new GoogleStrategy(
    {
      clientID:     process.env.GOOGLE_CLIENT_ID     || 'REPLACE_WITH_GOOGLE_CLIENT_ID',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'REPLACE_WITH_GOOGLE_CLIENT_SECRET',
      callbackURL:  process.env.GOOGLE_CALLBACK_URL  || 'http://localhost:5000/api/auth/google/callback',
      scope: ['profile', 'email'],
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email  = profile.emails?.[0]?.value
        const avatar = profile.photos?.[0]?.value || null

        // 1 — already have a Google account
        let user = await User.findOne({ googleId: profile.id })
        if (user) return done(null, user)

        // 2 — existing email account → link Google to it
        user = await User.findOne({ email })
        if (user) {
          user.googleId = profile.id
          if (!user.avatar && avatar) user.avatar = avatar
          await user.save({ validateBeforeSave: false })
          return done(null, user)
        }

        // 3 — brand-new user
        user = await User.create({
          googleId:   profile.id,
          name:       profile.displayName || email.split('@')[0],
          email,
          avatar,
          isVerified: true,   // Google has verified the email
        })

        return done(null, user)
      } catch (err) {
        return done(err, null)
      }
    }
  )
)

module.exports = passport
