/**
 * utils/sendEmail.js
 * Nodemailer helper — sends transactional emails (OTP, password reset, etc.)
 */
const nodemailer = require('nodemailer')

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: Number(process.env.EMAIL_PORT) || 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
})

/**
 * Send an email
 * @param {Object} options
 * @param {string} options.to      - Recipient email
 * @param {string} options.subject - Email subject
 * @param {string} options.html    - HTML body
 */
const sendEmail = async ({ to, subject, html }) => {
  // If email is not configured (no credentials), log to console and skip
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.log('────────────────────────────────────────────')
    console.log(`📧  [DEV MODE] Email not sent — no credentials`)
    console.log(`   To:      ${to}`)
    console.log(`   Subject: ${subject}`)
    // Extract OTP from HTML if present (matches 6 consecutive digits)
    const otpMatch = html.match(/\b(\d{6})\b/)
    if (otpMatch) console.log(`   OTP CODE: ${otpMatch[1]}`)
    console.log('────────────────────────────────────────────')
    return   // pretend it succeeded
  }

  await transporter.sendMail({
    from: `"RentSpace" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html,
  })
}

/**
 * Send OTP verification email
 */
const sendOTPEmail = async (email, otp) => {
  await sendEmail({
    to: email,
    subject: 'RentSpace — Verify your email',
    html: `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; background: #f8fafc; border-radius: 12px;">
        <div style="text-align: center; margin-bottom: 24px;">
          <h1 style="color: #6366f1; margin: 0; font-size: 28px;">RentSpace</h1>
        </div>
        <div style="background: #fff; padding: 32px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
          <h2 style="margin: 0 0 8px; color: #1e293b; font-size: 20px;">Verify your email</h2>
          <p style="color: #64748b; margin: 0 0 24px; font-size: 14px;">
            Use the code below to complete your registration. It expires in <strong>10 minutes</strong>.
          </p>
          <div style="text-align: center; margin: 24px 0;">
            <div style="display: inline-block; background: #6366f1; color: #fff; font-size: 32px; font-weight: 700; letter-spacing: 8px; padding: 16px 32px; border-radius: 8px;">
              ${otp}
            </div>
          </div>
          <p style="color: #94a3b8; font-size: 12px; margin: 0; text-align: center;">
            If you didn't request this, you can safely ignore this email.
          </p>
        </div>
      </div>
    `,
  })
}

/**
 * Send password-reset OTP email
 */
const sendPasswordResetEmail = async (email, otp) => {
  await sendEmail({
    to: email,
    subject: 'RentSpace — Reset your password',
    html: `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; background: #f8fafc; border-radius: 12px;">
        <div style="text-align: center; margin-bottom: 24px;">
          <h1 style="color: #6366f1; margin: 0; font-size: 28px;">RentSpace</h1>
        </div>
        <div style="background: #fff; padding: 32px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
          <h2 style="margin: 0 0 8px; color: #1e293b; font-size: 20px;">Reset your password</h2>
          <p style="color: #64748b; margin: 0 0 24px; font-size: 14px;">
            Use the code below to reset your password. It expires in <strong>10 minutes</strong>.
          </p>
          <div style="text-align: center; margin: 24px 0;">
            <div style="display: inline-block; background: #ef4444; color: #fff; font-size: 32px; font-weight: 700; letter-spacing: 8px; padding: 16px 32px; border-radius: 8px;">
              ${otp}
            </div>
          </div>
          <p style="color: #94a3b8; font-size: 12px; margin: 0; text-align: center;">
            If you didn't request a password reset, you can safely ignore this email.
          </p>
        </div>
      </div>
    `,
  })
}

module.exports = { sendEmail, sendOTPEmail, sendPasswordResetEmail }
