/**
 * components/ProtectedRoute.jsx
 * Wraps routes that require authentication.
 * Redirects unauthenticated users to /login with a return path saved in state.
 *
 * On page refresh the accessToken is gone (intentionally not persisted) while
 * App.jsx re-fetches /auth/me to restore it. During that window, show a loader
 * instead of bouncing the user to /login.
 */
import { Navigate, useLocation } from 'react-router-dom'
import useAuthStore from '@/store/authStore'
import PageLoader from '@/components/ui/PageLoader'

const ProtectedRoute = ({ children, roles }) => {
  const user        = useAuthStore((s) => s.user)
  const accessToken = useAuthStore((s) => s.accessToken)
  const location    = useLocation()

  // User persisted but token not yet restored (page refresh) — wait for restore
  if (user && !accessToken) {
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
