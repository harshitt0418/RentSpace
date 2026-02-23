/**
 * SignupPage.jsx — Modern redesign with Google OAuth
 */
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useRegister } from '@/hooks/useAuth'

const GOOGLE_AUTH_URL = 'http://localhost:5000/api/auth/google'

export default function SignupPage() {
  const [form, setForm]   = useState({ firstName: '', lastName: '', email: '', password: '', city: '' })
  const [showPw, setShowPw] = useState(false)
  const [error, setError] = useState('')
  const { mutate: register, isPending: loading } = useRegister()

  const set = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }))

  const handleSubmit = (e) => {
    e.preventDefault()
    setError('')
    if (!form.firstName || !form.email || !form.password) {
      setError('Please fill in all required fields.')
      return
    }
    if (form.password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    register({
      name: `${form.firstName} ${form.lastName}`.trim(),
      email: form.email,
      password: form.password,
      location: form.city,
    }, { onError: (err) => setError(err.response?.data?.message || 'Registration failed') })
  }

  return (
    <div className="auth-layout">
      {/* ── Left visual panel ── */}
      <div className="auth-panel-left">
        <div className="auth-orb auth-orb-1" />
        <div className="auth-orb auth-orb-2" />
        <div className="auth-orb auth-orb-3" />

        <div className="auth-panel-left-content">
          <div className="auth-panel-eyebrow">🚀 Free to join — forever</div>
          <h1 className="auth-panel-headline">
            Join the<br /><span>community.</span>
          </h1>
          <p className="auth-panel-sub">
            2,400+ items available. Start renting or earning today.
          </p>

          <div className="auth-stats">
            <div className="auth-stat">
              <div className="auth-stat-num">10K+</div>
              <div className="auth-stat-label">Members</div>
            </div>
            <div className="auth-stat">
              <div className="auth-stat-num">₹0</div>
              <div className="auth-stat-label">Listing fee</div>
            </div>
            <div className="auth-stat">
              <div className="auth-stat-num">50+</div>
              <div className="auth-stat-label">Cities</div>
            </div>
          </div>

          <div className="auth-features">
            <div className="auth-feature"><div className="auth-feature-check">✓</div>Free to join, zero listing fees</div>
            <div className="auth-feature"><div className="auth-feature-check">✓</div>Verified profiles &amp; secure payments</div>
            <div className="auth-feature"><div className="auth-feature-check">✓</div>Built-in insurance &amp; damage protection</div>
            <div className="auth-feature"><div className="auth-feature-check">✓</div>Real-time chat with renters/owners</div>
          </div>
        </div>
      </div>

      {/* ── Right form panel ── */}
      <div className="auth-panel-right">
        <div className="auth-card">
          <div className="auth-card-logo">RentSpace</div>
          <h1 className="auth-title">Create your account</h1>
          <p className="auth-sub">
            Already have one?{' '}
            <Link to="/login" className="auth-link">Sign in →</Link>
          </p>

          {/* Google OAuth — primary CTA */}
          <a href={GOOGLE_AUTH_URL} className="auth-google-btn">
            <GoogleIcon />
            Sign up with Google
          </a>

          <div className="auth-divider">
            <div className="auth-divider-line" />
            <div className="auth-divider-text">or sign up with email</div>
            <div className="auth-divider-line" />
          </div>

          {error && <div className="auth-error">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="form-group">
                <label className="form-label">First name *</label>
                <input className="form-input" type="text" name="firstName" value={form.firstName} onChange={set} placeholder="Alex" />
              </div>
              <div className="form-group">
                <label className="form-label">Last name</label>
                <input className="form-input" type="text" name="lastName" value={form.lastName} onChange={set} placeholder="Sharma" />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Email address *</label>
              <input className="form-input" type="email" name="email" value={form.email} onChange={set} placeholder="you@example.com" autoComplete="email" />
            </div>
            <div className="form-group">
              <label className="form-label">Password *</label>
              <div style={{ position: 'relative' }}>
                <input
                  className="form-input"
                  type={showPw ? 'text' : 'password'}
                  name="password" value={form.password} onChange={set}
                  placeholder="Min. 8 characters" style={{ paddingRight: 44 }}
                />
                <button
                  type="button" onClick={() => setShowPw((v) => !v)}
                  style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', fontSize: 16, padding: 4 }}
                >
                  {showPw ? '🙈' : '👁️'}
                </button>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Your city</label>
              <input className="form-input" type="text" name="city" value={form.city} onChange={set} placeholder="Dehradun, Uttarakhand" />
            </div>
            <button className="auth-submit" type="submit" style={{ marginTop: 4 }} disabled={loading}>
              {loading ? 'Creating account…' : "Create Account — It's free →"}
            </button>
          </form>

          <p style={{ textAlign: 'center', fontSize: 12, color: 'var(--text-3)', marginTop: 14 }}>
            By creating an account you agree to our{' '}
            <Link to="/terms" className="auth-link" style={{ fontSize: 12 }}>Terms</Link>{' '}&amp;{' '}
            <Link to="/privacy" className="auth-link" style={{ fontSize: 12 }}>Privacy Policy</Link>
          </p>
        </div>
      </div>
    </div>
  )
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
      <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
    </svg>
  )
}
