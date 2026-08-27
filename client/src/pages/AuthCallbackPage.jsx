/**
 * AuthCallbackPage.jsx
 * Handles the redirect from Google OAuth. Reads the token from the URL,
 * restores auth state, auto-detects location for new users, then navigates.
 */
import { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import useAuthStore from '@/store/authStore'
import { getMe } from '@/api/authApi'
import { updateProfile } from '@/api/userApi'

/* ── Reverse-geocode via OpenStreetMap Nominatim (free, no key needed) ── */
async function getCityFromCoords(lat, lng) {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1`,
      { headers: { 'Accept-Language': 'en' } }
    )
    const data = await res.json()
    const a = data.address || {}
    return a.city || a.town || a.village || a.county || a.state_district || ''
  } catch {
    return ''
  }
}

/* ── Silently get location & save to profile if user has none ─────────── */
async function autoSetLocation() {
  if (!navigator.geolocation) return
  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        const city = await getCityFromCoords(coords.latitude, coords.longitude)
        if (city) {
          try { await updateProfile({ location: city }) } catch { /* non-critical */ }
        }
        resolve()
      },
      () => resolve(),
      { timeout: 8000 }
    )
  })
}

export default function AuthCallbackPage() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const setAuth = useAuthStore((s) => s.setAuth)

  useEffect(() => {
    let cancelled = false

    const token = params.get('token')
    if (!token) {
      toast.error('Authentication failed — no token received', { id: 'auth-error' })
      navigate('/login')
      return
    }

    // Inject token into store so the axios interceptor attaches it as Bearer on getMe()
    useAuthStore.setState({ accessToken: token })

    getMe()
      .then(async (data) => {
        if (cancelled) return
        setAuth(data.user, token)
        toast.success(
          `Welcome${data.user.name ? ', ' + data.user.name.split(' ')[0] : ''}! 🎉`,
          { id: 'auth-welcome' }
        )
        if (!data.user.location) await autoSetLocation()
        navigate('/dashboard')
      })
      .catch((err) => {
        if (cancelled) return
        console.error('[AuthCallback] getMe failed:', err?.response?.data || err.message)
        toast.error('Sign-in failed — please try again', { id: 'auth-error' })
        useAuthStore.setState({ accessToken: null })
        navigate('/login')
      })

    return () => { cancelled = true }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', height: '100vh', gap: 16,
      background: 'var(--bg, #0f0f1a)', color: 'var(--text-2, #94a3b8)',
    }}>
      <div style={{
        width: 48, height: 48, borderRadius: '50%',
        border: '3px solid rgba(99,102,241,0.2)',
        borderTop: '3px solid #6366f1',
        animation: 'spin 0.8s linear infinite',
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <div style={{ fontSize: 18, fontWeight: 600, color: 'var(--text-1, #f1f5f9)' }}>
        Completing sign in…
      </div>
      <div style={{ fontSize: 14 }}>You'll be redirected in a moment.</div>
    </div>
  )
}
