/**
 * ForgotPasswordPage.jsx — Enter email to receive reset OTP
 */
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForgotPassword } from '@/hooks/useAuth'
import toast from 'react-hot-toast'

export default function ForgotPasswordPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const { mutate: forgotPw, isPending: loading } = useForgotPassword()

  const handleSubmit = (e) => {
    e.preventDefault()
    setError('')
    if (!email) { setError('Please enter your email.'); return }
    forgotPw({ email }, {
      onSuccess: () => {
        toast.success('OTP sent! Check your email.')
        navigate('/reset-password', { state: { email } })
      },
      onError: (err) => {
        const status = err.response?.status
        const message = err.response?.data?.message || 'Something went wrong'
        if (status === 404) {
          toast.error(message)
          navigate('/signup', { state: { warningEmail: email } })
        } else {
          setError(message)
        }
      },
    })
  }

  return (
    <div className="auth-layout">
      {/* ── Left visual panel ── */}
      <div className="auth-panel-left">
        <div className="auth-orb auth-orb-1" />
        <div className="auth-orb auth-orb-2" />
        <div className="auth-orb auth-orb-3" />
        <div className="auth-panel-left-content">
          <div className="auth-panel-eyebrow">🔐 Don't worry</div>
          <h1 className="auth-panel-headline">
            Reset your<br /><span>password.</span>
          </h1>
          <p className="auth-panel-sub">
            Happens to the best of us. Enter your email and we'll send you a code to reset your password.
          </p>

          <div className="auth-features">
            <div className="auth-feature"><div className="auth-feature-check">✓</div>Enter your registered email</div>
            <div className="auth-feature"><div className="auth-feature-check">✓</div>Receive a 6-digit code</div>
            <div className="auth-feature"><div className="auth-feature-check">✓</div>Set a new password</div>
          </div>
        </div>
      </div>

      {/* ── Right form panel ── */}
      <div className="auth-panel-right">
        <div className="auth-card">
          <div className="auth-card-logo">RentSpace</div>
          <h1 className="auth-title">Forgot password?</h1>
          <p className="auth-sub">
            Enter the email associated with your account and we'll send a reset code.
          </p>

          {error && <div className="auth-error">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Email address</label>
              <input
                className="form-input"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
                autoFocus
              />
            </div>
            <button className="auth-submit" type="submit" disabled={loading} style={{ marginTop: 4 }}>
              {loading ? 'Sending…' : 'Send Reset Code →'}
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
