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
          try {
            await updateProfile({ location: city })
          } catch {
            // silently ignore — non-critical
          }
        }
        resolve()
      },
      () => resolve(), // denied or error — silent
      { timeout: 8000 }
    )
  })
}

export default function AuthCallbackPage() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const setAuth = useAuthStore((s) => s.setAuth)

  useEffect(() => {
    // React 18 StrictMode runs effects twice — this flag prevents double execution
    let cancelled = false

    const token = params.get('token')
    if (!token) {
      toast.error('Authentication failed — no token received', { id: 'auth-error' })
      navigate('/login')
      return
    }

    // Temporarily inject token so the axios interceptor can use it
    useAuthStore.setState({ accessToken: token })

    getMe()
      .then(async (data) => {
        if (cancelled) return
        setAuth(data.user, token)
        toast.success(`Welcome${data.user.name ? ', ' + data.user.name.split(' ')[0] : ''}! 🎉`, { id: 'auth-welcome' })

        // If user has no location (e.g. brand-new Google sign-up), auto-detect it silently
        if (!data.user.location) {
          await autoSetLocation()
        }

        navigate('/dashboard')
      })
      .catch(() => {
        if (cancelled) return
        toast.error('Could not load your profile — please try again', { id: 'auth-error' })
        navigate('/login')
      })

    return () => { cancelled = true }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', height: '100vh', gap: 16,
      background: 'var(--bg)', color: 'var(--text-2)',
    }}>
      <div style={{ fontSize: 40 }}>🔐</div>
      <div style={{ fontSize: 18, fontWeight: 600, color: 'var(--text-1)' }}>Completing sign in…</div>
      <div style={{ fontSize: 14 }}>You'll be redirected in a moment.</div>
    </div>
  )
}
