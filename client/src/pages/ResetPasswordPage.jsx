/**
 * ResetPasswordPage.jsx — Enter OTP + new password to reset
 */
import { useState, useRef, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useResetPassword } from '@/hooks/useAuth'

export default function ResetPasswordPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const email = location.state?.email

  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [password, setPassword] = useState('')
  const [confirmPw, setConfirmPw] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [error, setError] = useState('')
  const inputRefs = useRef([])

  const { mutate: resetPw, isPending: loading } = useResetPassword()

  useEffect(() => {
    if (!email) navigate('/forgot-password')
  }, [email, navigate])

  const handleChange = (i, value) => {
    if (!/^\d*$/.test(value)) return
    const next = [...otp]
    next[i] = value.slice(-1)
    setOtp(next)
    if (value && i < 5) inputRefs.current[i + 1]?.focus()
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
    if (code.length !== 6) { setError('Please enter all 6 digits.'); return }
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return }
    if (password !== confirmPw) { setError('Passwords do not match.'); return }

    resetPw({ email, otp: code, newPassword: password }, {
      onError: (err) => setError(err.response?.data?.message || 'Reset failed'),
    })
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
          <div className="auth-panel-eyebrow">🔑 Almost done</div>
          <h1 className="auth-panel-headline">
            Set your new<br /><span>password.</span>
          </h1>
          <p className="auth-panel-sub">
            Enter the code we sent to your email, then create a strong new password.
          </p>

          <div className="auth-features">
            <div className="auth-feature"><div className="auth-feature-check">✓</div>Must be at least 8 characters</div>
            <div className="auth-feature"><div className="auth-feature-check">✓</div>Use a mix of letters &amp; numbers</div>
            <div className="auth-feature"><div className="auth-feature-check">✓</div>Avoid common passwords</div>
          </div>
        </div>
      </div>

      {/* ── Right form panel ── */}
      <div className="auth-panel-right">
        <div className="auth-card">
          <div className="auth-card-logo">RentSpace</div>
          <h1 className="auth-title">Reset your password</h1>
          <p className="auth-sub">
            Enter the code sent to <strong>{email}</strong>
          </p>

          {error && <div className="auth-error">{error}</div>}

          <form onSubmit={handleSubmit}>
            {/* OTP */}
            <label className="form-label" style={{ marginBottom: 8, display: 'block' }}>Verification code</label>
            <div className="otp-row" style={{ margin: '0 0 20px' }}>
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

            {/* New password */}
            <div className="form-group">
              <label className="form-label">New password</label>
              <div style={{ position: 'relative' }}>
                <input
                  className="form-input"
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min. 8 characters"
                  style={{ paddingRight: 44 }}
                />
                <button
                  type="button" onClick={() => setShowPw((v) => !v)}
                  style={{
                    position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: 'var(--text-3)', fontSize: 16, padding: 4,
                  }}
                >
                  {showPw ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Confirm password</label>
              <input
                className="form-input"
                type={showPw ? 'text' : 'password'}
                value={confirmPw}
                onChange={(e) => setConfirmPw(e.target.value)}
                placeholder="Re-enter password"
              />
            </div>

            <button className="auth-submit" type="submit" disabled={loading} style={{ marginTop: 4 }}>
              {loading ? 'Resetting…' : 'Reset Password →'}
            </button>
          </form>

          <p style={{ textAlign: 'center', marginTop: 24 }}>
            <Link to="/login" className="auth-link" style={{ fontSize: 13 }}>
              ← Back to Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
