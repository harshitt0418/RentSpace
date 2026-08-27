/**
 * utils/sendEmail.js
 * Email helper — sends transactional emails (OTP, password reset, etc.)
 *
 * Priority: Resend HTTP API → SMTP (local only) → Console fallback
 *
 * On Render/cloud: use RESEND_API_KEY (port 587 is blocked by Render).
 * Locally: set EMAIL_USER + EMAIL_PASS for SMTP, or just use Resend.
 */
const nodemailer = require('nodemailer')

/* ─── Feature flags ──────────────────────────────────────────────────────── */
const RESEND_CONFIGURED = !!process.env.RESEND_API_KEY

// SMTP is only used when Resend is NOT configured AND real credentials exist
const _emailUser = process.env.EMAIL_USER || ''
const _emailPass = process.env.EMAIL_PASS || ''
const _isPlaceholder = !_emailUser || !_emailPass ||
  _emailUser.includes('placeholder') || _emailPass.includes('placeholder')
// Don't even create an SMTP transporter if Resend is already handling emails
const SMTP_CONFIGURED = !RESEND_CONFIGURED && !_isPlaceholder

/* ─── SMTP transporter — created silently, NO startup verify call ─────── */
// transporter.verify() is intentionally removed: Render blocks outbound port
// 587 causing a connection timeout error on every deploy. SMTP is only used
// locally as a fallback when Resend is not configured.
let transporter = null
if (SMTP_CONFIGURED) {
  transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: Number(process.env.EMAIL_PORT) || 587,
    secure: false,
    auth: { user: _emailUser, pass: _emailPass },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000,
  })
}

/* ─── Startup log (one clean line, no SMTP timeout noise) ─────────────── */
if (RESEND_CONFIGURED) {
  console.log('✅ Resend API key configured — using HTTP API for emails')
} else if (SMTP_CONFIGURED) {
  console.log('✅ SMTP configured — emails enabled for:', _emailUser)
} else {
  console.log('⚠️  No email provider configured — OTPs will be logged to console')
}

/* ─── Send via Resend HTTP API (no SMTP ports needed) ────────────────── */
const sendViaResend = async ({ to, subject, html }) => {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: process.env.RESEND_FROM || 'RentSpace <onboarding@resend.dev>',
      to: [to],
      subject,
      html,
    }),
  })

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Resend API error (${res.status}): ${body}`)
  }

  console.log(`📧 Email sent via Resend to: ${to}`)
}

/* ─── Send via SMTP (Nodemailer) with timeout ────────────────────────── */
const sendViaSMTP = async ({ to, subject, html }) => {
  const SEND_TIMEOUT = 20000
  const mailPromise = transporter.sendMail({
    from: `"RentSpace" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html,
  })
  const timeoutPromise = new Promise((_, reject) =>
    setTimeout(() => reject(new Error('SMTP timed out after 20s')), SEND_TIMEOUT)
  )

  await Promise.race([mailPromise, timeoutPromise])
  console.log(`📧 Email sent via SMTP to: ${to}`)
}

/* ─── Console fallback ───────────────────────────────────────────────── */
const logToConsole = ({ to, subject, html }) => {
  const otpMatch = html.match(/\b(\d{6})\b/)
  console.log('\n────────────────────────────────────────────')
  console.log(`📧  [FALLBACK] No email provider — logging instead`)
  console.log(`   To:      ${to}`)
  console.log(`   Subject: ${subject}`)
  if (otpMatch) console.log(`   ⭐ OTP CODE: ${otpMatch[1]} ⭐`)
  console.log('────────────────────────────────────────────\n')
}

/* ─── Main send function ─────────────────────────────────────────────── */
const sendEmail = async ({ to, subject, html }) => {
  // 1. Try Resend (HTTP API — works on Render)
  if (RESEND_CONFIGURED) {
    return sendViaResend({ to, subject, html })
  }

  // 2. Try SMTP (works locally or on hosts that allow port 587)
  if (SMTP_CONFIGURED && transporter) {
    return sendViaSMTP({ to, subject, html })
  }

  // 3. Console fallback (dev only)
  logToConsole({ to, subject, html })
}

/* ─── OTP verification email ─────────────────────────────────────────── */
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

/* ─── Password-reset OTP email ───────────────────────────────────────── */
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
