/**
 * components/ProtectedRoute.jsx
 * Wraps routes that require authentication.
 * Redirects unauthenticated users to /login with a return path saved in state.
 *
 * On page refresh the accessToken is gone (intentionally not persisted) while
 * App.jsx re-fetches /auth/me to restore it. We wait for `isRestoring` to be
 * false before deciding to redirect — this prevents the bounce-to-login race.
 */
import { Navigate, useLocation } from 'react-router-dom'
import useAuthStore from '@/store/authStore'
import PageLoader from '@/components/ui/PageLoader'

const ProtectedRoute = ({ children, roles }) => {
  const user = useAuthStore((s) => s.user)
  const accessToken = useAuthStore((s) => s.accessToken)
  const isRestoring = useAuthStore((s) => s.isRestoring)
  const location = useLocation()

  // Still restoring session from refresh cookie — wait, don't redirect yet
  if (isRestoring) {
    return <PageLoader />
  }

  // Not logged in → redirect to login, preserve intended destination
  if (!user || !accessToken) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // Role guard (optional) — e.g. <ProtectedRoute roles={['admin']}>
  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/" replace />
  }

  return children
}

export default ProtectedRoute

