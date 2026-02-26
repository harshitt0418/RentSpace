/**
 * App.jsx — Root router
 * Defines all application routes and wraps them with AnimatePresence
 * for smooth page transitions. Pages are lazy-loaded by default.
 */
import { lazy, Suspense } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'

import MainLayout from '@/layouts/MainLayout'
import AuthLayout from '@/layouts/AuthLayout'
import PageLoader from '@/components/ui/PageLoader'
import ProtectedRoute from '@/components/ProtectedRoute'
import useSocket from '@/hooks/useSocket'
import { useRestoreAuth } from '@/hooks/useAuth'

// ── Lazy-loaded pages (code-split per route) ─────────────────────────────────
const LandingPage = lazy(() => import('@/pages/LandingPage'))
const LoginPage = lazy(() => import('@/pages/LoginPage'))
const SignupPage = lazy(() => import('@/pages/SignupPage'))
const Dashboard = lazy(() => import('@/pages/Dashboard'))
const BrowsePage = lazy(() => import('@/pages/BrowsePage'))
const ItemDetailPage = lazy(() => import('@/pages/ItemDetailPage'))
const ListItemPage = lazy(() => import('@/pages/ListItemPage'))
const ProfilePage = lazy(() => import('@/pages/ProfilePage'))
const ChatPage = lazy(() => import('@/pages/ChatPage'))
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage'))
const AboutPage = lazy(() => import('@/pages/AboutPage'))
const CommunityPage = lazy(() => import('@/pages/CommunityPage'))
const HowItWorksPage = lazy(() => import('@/pages/HowItWorksPage'))
const PrivacyPage = lazy(() => import('@/pages/PrivacyPage'))
const TermsPage = lazy(() => import('@/pages/TermsPage'))
const WishlistPage = lazy(() => import('@/pages/WishlistPage'))
const AuthCallbackPage = lazy(() => import('@/pages/AuthCallbackPage'))
const VerifyOTPPage = lazy(() => import('@/pages/VerifyOTPPage'))
const ForgotPasswordPage = lazy(() => import('@/pages/ForgotPasswordPage'))
const ResetPasswordPage = lazy(() => import('@/pages/ResetPasswordPage'))
const AdminPanel = lazy(() => import('@/pages/AdminPanel'))

// ── App Component ─────────────────────────────────────────────────────────────
export default function App() {
  // useLocation is required for AnimatePresence to detect route changes
  const location = useLocation()

  // Restore auth session on page refresh (user persisted, access token in memory only)
  useRestoreAuth()

  // Connect / disconnect Socket.io based on auth state
  useSocket()

  return (
    // AnimatePresence enables exit animations when a component unmounts
    <AnimatePresence mode="wait" initial={false}>
      <Suspense fallback={<PageLoader />}>
        <Routes location={location} key={location.pathname}>

          {/* ── Public routes with Navbar + Footer ── */}
          <Route element={<MainLayout />}>
            <Route index element={<LandingPage />} />
            <Route path="browse" element={<BrowsePage />} />
            <Route path="items/:id" element={<ItemDetailPage />} />
            <Route path="profile/:id" element={<ProfilePage />} />
            <Route path="about" element={<AboutPage />} />
            <Route path="community" element={<CommunityPage />} />
            <Route path="how-it-works" element={<HowItWorksPage />} />
            <Route path="privacy" element={<PrivacyPage />} />
            <Route path="terms" element={<TermsPage />} />
          </Route>

          {/* ── Auth routes (minimal layout, no navbar) ── */}
          <Route element={<AuthLayout />}>
            <Route path="login" element={<LoginPage />} />
            <Route path="signup" element={<SignupPage />} />
            <Route path="verify-otp" element={<VerifyOTPPage />} />
            <Route path="forgot-password" element={<ForgotPasswordPage />} />
            <Route path="reset-password" element={<ResetPasswordPage />} />
            <Route path="auth/callback" element={<AuthCallbackPage />} />
          </Route>

          {/* ── Protected routes (require auth) ── */}
          <Route element={<MainLayout />}>
            <Route path="dashboard" element={
              <ProtectedRoute><Dashboard /></ProtectedRoute>
            } />
            <Route path="list-item" element={
              <ProtectedRoute><ListItemPage /></ProtectedRoute>
            } />
            <Route path="wishlist" element={
              <ProtectedRoute><WishlistPage /></ProtectedRoute>
            } />
            <Route path="chat" element={
              <ProtectedRoute><ChatPage /></ProtectedRoute>
            } />
            <Route path="chat/:roomId" element={
              <ProtectedRoute><ChatPage /></ProtectedRoute>
            } />
          </Route>

          {/* ── Admin panel (standalone, no navbar/footer) ── */}
          <Route path="admin" element={
            <ProtectedRoute><AdminPanel /></ProtectedRoute>
          } />

          {/* ── 404 ── */}
          <Route path="*" element={<NotFoundPage />} />

        </Routes>
      </Suspense>
    </AnimatePresence>
  )
}
