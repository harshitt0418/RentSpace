/**
 * hooks/useAuth.js
 * React Query mutations + Zustand integration for auth flows.
 */
import { useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import * as authApi from '@/api/authApi'
import useAuthStore from '@/store/authStore'

/* ── Restore session on app load ───────────────────────────────────────── */
// Called once in App.jsx — if a user is persisted in localStorage but there's
// no access token in memory (e.g. after a page refresh), this fetches /auth/me.
// The axios 401 interceptor will transparently use the refresh cookie to obtain
// a new access token, then retry the request — so by the time onSuccess fires
// the store already has the fresh access token.
export const useRestoreAuth = () => {
  const user = useAuthStore((s) => s.user)
  const accessToken = useAuthStore((s) => s.accessToken)
  const { setAuth, setRestoring } = useAuthStore()

  const query = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: authApi.getMe,
    // Only attempt restore if user is persisted but token is missing (page refresh)
    enabled: !!user && !accessToken,
    retry: false,
    staleTime: 30_000,
  })

  // Mark restore complete once query settles (success or error)
  useEffect(() => {
    // If no user in localStorage, no restore needed — clear the flag immediately
    if (!user) {
      setRestoring(false)
      return
    }
    // If token already in memory (e.g. freshly logged in), no restore needed
    if (accessToken) {
      setRestoring(false)
      return
    }
    // Otherwise wait for the query to settle
    if (query.isSuccess || query.isError) {
      setRestoring(false)
    }
  }, [user, accessToken, query.isSuccess, query.isError]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (query.data) {
      // By now the interceptor has already set the new access token in the store
      setAuth(query.data.user, useAuthStore.getState().accessToken)
    }
  }, [query.data]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (query.error) {
      useAuthStore.getState().clearAuth()
    }
  }, [query.error]) // eslint-disable-line react-hooks/exhaustive-deps

  return query
}


/* ── Register ──────────────────────────────────────────────────────────── */
// Registration either sends OTP (→ /verify-otp) or auto-verifies (→ /dashboard)
export const useRegister = () => {
  const navigate = useNavigate()
  const setAuth = useAuthStore((s) => s.setAuth)

  return useMutation({
    mutationFn: authApi.register,
    onSuccess: (data) => {
      if (data.accessToken && data.user) {
        // Auto-verified (email config unavailable) — log in directly
        setAuth(data.user, data.accessToken)
        toast.success(`Welcome, ${data.user.name?.split(' ')[0] || ''}! 🎉`, { id: 'auth-welcome' })
        navigate('/dashboard')
      } else {
        // Normal OTP verification flow
        toast.success('OTP sent to your email!', { id: 'auth-otp' })
        navigate('/verify-otp', { state: { email: data.email } })
      }
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Registration failed')
    },
  })
}

/* ── Verify OTP (completes registration) ──────────────────────────────── */
export const useVerifyOTP = () => {
  const { setAuth } = useAuthStore()
  const navigate = useNavigate()

  return useMutation({
    mutationFn: authApi.verifyOTP,
    onSuccess: (data) => {
      setAuth(data.user, data.accessToken)
      toast.success(`Welcome to RentSpace, ${data.user.name}! 🎉`, { id: 'auth-welcome' })
      navigate('/dashboard')
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Verification failed')
    },
  })
}

/* ── Resend OTP ───────────────────────────────────────────────────────── */
export const useResendOTP = () => {
  return useMutation({
    mutationFn: authApi.resendOTP,
    onSuccess: () => {
      toast.success('New OTP sent!', { id: 'auth-resend' })
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to resend OTP')
    },
  })
}

/* ── Forgot Password ──────────────────────────────────────────────────── */
export const useForgotPassword = () => {
  return useMutation({
    mutationFn: authApi.forgotPassword,
  })
}

/* ── Reset Password ───────────────────────────────────────────────────── */
export const useResetPassword = () => {
  const navigate = useNavigate()

  return useMutation({
    mutationFn: authApi.resetPassword,
    onSuccess: () => {
      toast.success('Password reset successful! Please log in.', { id: 'auth-reset' })
      navigate('/login')
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Reset failed')
    },
  })
}

/* ── Login ─────────────────────────────────────────────────────────────── */
export const useLogin = () => {
  const { setAuth } = useAuthStore()
  const navigate = useNavigate()
  const qc = useQueryClient()

  return useMutation({
    mutationFn: authApi.login,
    onSuccess: (data) => {
      setAuth(data.user, data.accessToken)
      qc.invalidateQueries({ queryKey: ['auth'] })
      toast.success(`Welcome back, ${data.user.name}!`, { id: 'auth-welcome' })
      navigate('/dashboard')
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Invalid credentials')
    },
  })
}

/* ── Logout ────────────────────────────────────────────────────────────── */
export const useLogout = () => {
  const { clearAuth } = useAuthStore()
  const navigate = useNavigate()
  const qc = useQueryClient()

  return useMutation({
    mutationFn: authApi.logout,
    onSettled: () => {
      clearAuth()
      qc.clear()
      toast.success('Logged out successfully')
      navigate('/')
    },
  })
}
