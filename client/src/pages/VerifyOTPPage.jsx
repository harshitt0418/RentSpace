/**
 * VerifyOTPPage.jsx — 6-digit OTP input after registration
 */
import { useState, useRef, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useVerifyOTP, useResendOTP } from '@/hooks/useAuth'
import useAuthStore from '@/store/authStore'

export default function VerifyOTPPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const hasHydrated = useAuthStore((s) => s.hasHydrated)
  // Check: router state → auth store → sessionStorage (survives page refresh)
  const email = location.state?.email || user?.email || sessionStorage.getItem('otp-pending-email')

  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [error, setError] = useState('')
  const [countdown, setCountdown] = useState(60)
  const inputRefs = useRef([])

  const { mutate: verifyOTP, isPending: verifying } = useVerifyOTP()
  const { mutate: resendOTP, isPending: resending } = useResendOTP()

  // Only redirect to /signup if there is genuinely no email from any source.
  // sessionStorage fallback handles the page-refresh case.
  useEffect(() => {
    if (!hasHydrated) return
    if (!email) {
      sessionStorage.removeItem('otp-pending-email')
      navigate('/signup', { replace: true })
    }
  }, [email, hasHydrated, navigate])

  // Countdown timer for resend
  useEffect(() => {
    if (countdown <= 0) return
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000)
    return () => clearTimeout(t)
  }, [countdown])

  const handleChange = (i, value) => {
    if (!/^\d*$/.test(value)) return // only digits
    const next = [...otp]
    next[i] = value.slice(-1)
    setOtp(next)

    // Auto-focus next
    if (value && i < 5) {
      inputRefs.current[i + 1]?.focus()
    }
  }

  const handleKeyDown = (i, e) => {
    if (e.key === 'Backspace' && !otp[i] && i > 0) {
      inputRefs.current[i - 1]?.focus()
    }
  }

  const handlePaste = (e) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (!pasted) return
    const next = [...otp]
    for (let i = 0; i < 6; i++) next[i] = pasted[i] || ''
    setOtp(next)
    const focusIdx = Math.min(pasted.length, 5)
    inputRefs.current[focusIdx]?.focus()
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    setError('')
    const code = otp.join('')
    if (code.length !== 6) {
      setError('Please enter all 6 digits.')
      return
    }
    verifyOTP({ email, otp: code }, {
      onError: (err) => setError(err.response?.data?.message || 'Verification failed'),
    })
  }

  const handleResend = () => {
    if (countdown > 0 || resending) return
    resendOTP({ email })
    setCountdown(60)
  }

  if (!email) return null

  return (
    <div className="auth-layout">
      {/* ── Left visual panel ── */}
      <div className="auth-panel-left">
        <div className="auth-orb auth-orb-1" />
        <div className="auth-orb auth-orb-2" />
        <div className="auth-orb auth-orb-3" />
        <div className="auth-panel-left-content">
          <div className="auth-panel-eyebrow">📧 Almost there!</div>
          <h1 className="auth-panel-headline">
            Verify your<br /><span>email.</span>
          </h1>
          <p className="auth-panel-sub">
            We've sent a 6-digit code to your email. Enter it below to activate your account.
          </p>

          <div className="auth-features">
            <div className="auth-feature"><div className="auth-feature-check">✓</div>Check your inbox (and spam folder)</div>
            <div className="auth-feature"><div className="auth-feature-check">✓</div>Code expires in 10 minutes</div>
            <div className="auth-feature"><div className="auth-feature-check">✓</div>Didn't get it? Click resend below</div>
          </div>
        </div>
      </div>

      {/* ── Right form panel ── */}
      <div className="auth-panel-right">
        <div className="auth-card">
          <div className="auth-card-logo">RentSpace</div>
          <h1 className="auth-title">Enter verification code</h1>
          <p className="auth-sub">
            We sent a code to <strong>{email}</strong>
          </p>

          {error && <div className="auth-error">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="otp-row" style={{ margin: '28px 0' }}>
              {otp.map((digit, i) => (
                <input
                  key={i}
                  ref={(el) => (inputRefs.current[i] = el)}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleChange(i, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(i, e)}
                  onPaste={i === 0 ? handlePaste : undefined}
                  className="form-input otp-box"
                  autoFocus={i === 0}
                />
              ))}
            </div>

            <button className="auth-submit" type="submit" disabled={verifying}>
              {verifying ? 'Verifying…' : 'Verify Email →'}
            </button>
          </form>

          <div style={{ textAlign: 'center', marginTop: 20 }}>
            <p style={{ fontSize: 14, color: 'var(--text-3)', margin: 0 }}>
              Didn't receive the code?{' '}
              {countdown > 0 ? (
                <span style={{ color: 'var(--text-3)' }}>Resend in {countdown}s</span>
              ) : (
                <button
                  onClick={handleResend}
                  disabled={resending}
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: 'var(--primary)', fontWeight: 600, fontSize: 14,
                    padding: 0, textDecoration: 'underline',
                  }}
                >
                  {resending ? 'Sending…' : 'Resend OTP'}
                </button>
              )}
            </p>
          </div>

          <p style={{ textAlign: 'center', marginTop: 24 }}>
            <Link to="/signup" className="auth-link" style={{ fontSize: 13 }}>
              ← Back to Sign Up
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
