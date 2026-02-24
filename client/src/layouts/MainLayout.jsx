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
  const isChat = pathname.startsWith('/chat')

  // Scroll to top on every route change (not for chat — it manages its own scroll)
  useEffect(() => {
    if (!isChat) window.scrollTo({ top: 0, behavior: 'instant' })
  }, [pathname])

  return (
    <div style={{
      background: 'var(--bg)',
      minHeight: '100dvh',
      height: isChat ? '100dvh' : undefined,
      display: 'flex',
      flexDirection: 'column',
      transition: 'background var(--transition)',
    }}>

      {/* Sticky navbar with glass blur */}
      <Navbar />

      {/* Spacer to push content below the fixed navbar on chat pages.
          Other pages handle their own top padding via their layout classes. */}
      {isChat && <div className="navbar-spacer" />}

      {/* Page content — Outlet renders the matched child route */}
      <main style={{
        flex: 1,
        minHeight: 0,
        display: isChat ? 'flex' : undefined,
        flexDirection: isChat ? 'column' : undefined,
      }}>
        <Outlet />
      </main>

      {/* Footer — hidden on chat page so chat fills the full viewport */}
      {!isChat && <Footer />}

    </div>
  )
}
