/**
 * MainLayout.jsx
 * ─────────────────────────────────────────────────────────────────
 * Wraps all main public/authenticated pages.
 * Renders: Navbar → <main> content → Footer
 */
import { Outlet, useLocation } from 'react-router-dom'
import { useEffect } from 'react'

import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'

export default function MainLayout() {
  const { pathname } = useLocation()

  // Scroll to top on every route change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [pathname])

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100dvh', display: 'flex', flexDirection: 'column', transition: 'background var(--transition)' }}>

      {/* Sticky navbar with glass blur */}
      <Navbar />

      {/* Page content — Outlet renders the matched child route */}
      <main style={{ flex: 1 }}>
        <Outlet />
      </main>

      {/* Persistent footer */}
      <Footer />

    </div>
  )
}
