/**
 * utils/sendEmail.js
 * Nodemailer helper — sends transactional emails (OTP, password reset, etc.)
 */
const nodemailer = require('nodemailer')

const EMAIL_CONFIGURED = !!(process.env.EMAIL_USER && process.env.EMAIL_PASS)

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: Number(process.env.EMAIL_PORT) || 587,
  secure: false,   // false = STARTTLS (correct for port 587)
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  // NOTE: no tls override — Gmail needs its real certificate to be verified
})

// Verify SMTP at startup so misconfiguration is caught early
if (EMAIL_CONFIGURED) {
  transporter.verify((err) => {
    if (err) {
      console.error('❌ SMTP connection failed:', err.message)
      console.error('   → Emails will be logged to console as fallback')
    } else {
      console.log('✅ SMTP ready — emails enabled for:', process.env.EMAIL_USER)
    }
  })
}

/**
 * Log OTP to console (dev fallback when SMTP is unavailable or fails)
 */
const logToConsole = ({ to, subject, html }) => {
  const otpMatch = html.match(/\b(\d{6})\b/)
  console.log('\n────────────────────────────────────────────')
  console.log(`📧  [EMAIL FALLBACK] Could not send via SMTP`)
  console.log(`   To:      ${to}`)
  console.log(`   Subject: ${subject}`)
  if (otpMatch) console.log(`   ⭐ OTP CODE: ${otpMatch[1]} ⭐`)
  console.log('────────────────────────────────────────────\n')
}

/**
 * Send an email — logs to console if email is unconfigured (dev only)
 */
const sendEmail = async ({ to, subject, html }) => {
  if (!EMAIL_CONFIGURED) {
    // Dev fallback: no email credentials — print OTP to console
    const otpMatch = html.match(/\b(\d{6})\b/)
    console.log('\n────────────────────────────────────────────')
    console.log(`📧  [DEV] No SMTP credentials — logging email instead`)
    console.log(`   To:      ${to}`)
    console.log(`   Subject: ${subject}`)
    if (otpMatch) console.log(`   ⭐ OTP CODE: ${otpMatch[1]} ⭐`)
    console.log('────────────────────────────────────────────\n')
    return
  }

  // Credentials are set — let any SMTP error propagate so it's visible in logs
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
