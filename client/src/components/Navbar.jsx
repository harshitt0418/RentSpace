/**
 * Navbar.jsx — Responsive with hamburger menu + theme toggle
 */
import { useState, useEffect, useRef } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { LayoutDashboard, LogOut, User, Sun, Moon, Menu, X, Bell, Check, Heart } from 'lucide-react'

import useAuthStore from '@/store/authStore'
import useThemeStore from '@/store/themeStore'
import { useLogout } from '@/hooks/useAuth'
import useNotificationStore from '@/store/notificationStore'
import { useNotifications, useMarkAllRead } from '@/hooks/useNotifications'

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const navigate = useNavigate()
  const mobileRef = useRef(null)
  const notifRef = useRef(null)

  const user = useAuthStore((s) => s.user)
  const isAuthenticated = useAuthStore((s) => !!s.user && !!s.accessToken)
  const unreadCount = useNotificationStore((s) => s.unreadCount)
  const { mutate: logout, isPending: loggingOut } = useLogout()
  const { theme, toggleTheme } = useThemeStore()
  const { data: notifData } = useNotifications({ limit: 8 })
  const { mutate: markAllRead } = useMarkAllRead()
  const notifications = notifData?.notifications || []

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 60)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const go = (path) => {
    setMobileOpen(false)
    setUserMenuOpen(false)
    navigate(path)
  }

  // Close mobile menu on outside click
  useEffect(() => {
    if (!mobileOpen) return
    const handler = (e) => {
      if (mobileRef.current && !mobileRef.current.contains(e.target)) setMobileOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [mobileOpen])

  // Close notification dropdown on outside click
  useEffect(() => {
    if (!notifOpen) return
    const handler = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [notifOpen])

  // Lock body scroll when mobile menu open
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [mobileOpen])

  return (
    <>
      <nav className={`navbar ${isScrolled ? 'scrolled' : ''}`}>
        {/* Logo */}
        <div className="nav-logo" onClick={() => go('/')} style={{ cursor: 'pointer' }}>
          RentSpace
        </div>

        {/* Center links — desktop only */}
        <div className="nav-links">
          <NavLink to="/browse" className="nav-link">Browse</NavLink>
          <NavLink to="/how-it-works" className="nav-link">How It Works</NavLink>
          <NavLink to="/community" className="nav-link">Community</NavLink>
        </div>

        {/* Right actions */}
        <div className="nav-actions">
          {/* Theme toggle */}
          <button className="icon-btn theme-toggle" onClick={toggleTheme} aria-label="Toggle theme"
            title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}>
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          </button>

          {isAuthenticated ? (
            <>
              {/* Wishlist icon */}
              <div className="icon-btn hide-mobile" onClick={() => go('/wishlist')} title="Wishlist" style={{ position: 'relative' }}>
                <Heart size={16} />
              </div>

              <div style={{ position: 'relative' }} className="hide-mobile" ref={notifRef}>
                <div className="icon-btn" onClick={() => {
                  setNotifOpen((v) => {
                    if (!v && unreadCount > 0) markAllRead()
                    return !v
                  })
                  setUserMenuOpen(false)
                }}
                  style={{ position: 'relative' }}>
                  <Bell size={16} />
                  {unreadCount > 0 && <div className="notif-dot" />}
                </div>

                <AnimatePresence>
                  {notifOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -8, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -6, scale: 0.96 }}
                      transition={{ duration: 0.18 }}
                      className="notif-dropdown"
                    >
                      <div className="notif-dropdown-header">
                        <span style={{ fontWeight: 700, fontSize: 14 }}>Notifications</span>
                        {unreadCount > 0 && (
                          <button className="notif-mark-all" onClick={() => markAllRead()}>
                            <Check size={13} /> Mark all read
                          </button>
                        )}
                      </div>
                      <div className="notif-dropdown-body">
                        {notifications.length === 0 ? (
                          <div style={{ padding: '24px 16px', textAlign: 'center', color: 'var(--text-3)', fontSize: 13 }}>
                            No notifications yet
                          </div>
                        ) : (
                          notifications.map((n) => (
                            <div key={n._id} className={`notif-item ${n.isRead ? '' : 'unread'}`}
                              style={{ cursor: 'pointer' }}
                              onClick={() => {
                                setNotifOpen(false)
                                navigate(getNotifLink(n))
                              }}>
                              <div className="notif-item-icon">{getNotifIcon(n.type)}</div>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div className="notif-item-title" style={{ fontWeight: 600, fontSize: 13 }}>{n.title}</div>
                                <div className="notif-item-msg">{n.message}</div>
                                <div className="notif-item-time">{timeAgo(n.createdAt)}</div>
                              </div>
                              {!n.isRead && <div className="notif-unread-dot" />}
                            </div>
                          ))
                        )}
                      </div>
                      <div className="notif-dropdown-footer" onClick={() => { setNotifOpen(false); go('/dashboard') }}>
                        View all activity
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div style={{ position: 'relative' }} className="hide-mobile">
                <div className="nav-avatar" onClick={() => { setUserMenuOpen((v) => !v); setNotifOpen(false) }} style={{ overflow: 'hidden' }}>
                  {user?.avatar
                    ? <img src={user.avatar} alt={user.name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                    : user?.name?.[0]?.toUpperCase() ?? 'U'
                  }
                </div>

                <AnimatePresence>
                  {userMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -8, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -6, scale: 0.96 }}
                      transition={{ duration: 0.18 }}
                      className="user-dropdown"
                    >
                      <DropItem icon={<LayoutDashboard size={15} />} label="Dashboard" onClick={() => { setUserMenuOpen(false); go('/dashboard') }} />
                      <DropItem icon={<Heart size={15} />} label="Wishlist" onClick={() => { setUserMenuOpen(false); go('/wishlist') }} />
                      <DropItem icon={<User size={15} />} label="Profile" onClick={() => { setUserMenuOpen(false); go(`/profile/${user?._id}`) }} />
                      <div className="divider" />
                      <button onClick={() => { setUserMenuOpen(false); logout() }} disabled={loggingOut}
                        className="user-dropdown-logout">
                        <LogOut size={15} />
                        {loggingOut ? 'Signing out…' : 'Sign out'}
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </>
          ) : (
            <div className="hide-mobile" style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <button className="btn-ghost" onClick={() => go('/login')}>Log In</button>
              <button className="btn-primary" onClick={() => go('/signup')}>Get Started</button>
            </div>
          )}

          {/* Hamburger — mobile only */}
          <button className="icon-btn hamburger-btn" onClick={() => setMobileOpen((v) => !v)} aria-label="Menu">
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </nav>

      {/* Mobile menu overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div className="mobile-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              exit={{ opacity: 0 }} transition={{ duration: 0.2 }} onClick={() => setMobileOpen(false)} />
            <motion.div ref={mobileRef} className="mobile-menu"
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}>
              <div className="mobile-menu-header">
                <div className="nav-logo">RentSpace</div>
                <button className="icon-btn" onClick={() => setMobileOpen(false)}><X size={20} /></button>
              </div>
              <div className="mobile-menu-body">
                <button className="mobile-nav-link" onClick={() => go('/browse')}>🔍 Browse</button>
                <button className="mobile-nav-link" onClick={() => go('/how-it-works')}>📋 How It Works</button>
                <button className="mobile-nav-link" onClick={() => go('/community')}>👥 Community</button>
                {isAuthenticated ? (
                  <>
                    <div className="divider" />
                    <button className="mobile-nav-link" onClick={() => go('/dashboard')}>🏠 Dashboard</button>
                    <button className="mobile-nav-link" onClick={() => go('/wishlist')}>❤️ Wishlist</button>
                    <button className="mobile-nav-link" onClick={() => go('/list-item')}>➕ List Item</button>
                    <button className="mobile-nav-link" onClick={() => go('/chat')}>💬 Messages</button>
                    <button className="mobile-nav-link" onClick={() => go(`/profile/${user?._id}`)}>👤 Profile</button>
                    <div className="divider" />
                    <button className="mobile-nav-link" style={{ color: 'var(--danger)' }}
                      onClick={() => { setMobileOpen(false); logout() }} disabled={loggingOut}>
                      🚪 {loggingOut ? 'Signing out…' : 'Sign Out'}
                    </button>
                  </>
                ) : (
                  <>
                    <div className="divider" />
                    <button className="mobile-nav-link" onClick={() => go('/login')}>🔑 Log In</button>
                    <button className="btn-primary" style={{ width: '100%', marginTop: 8 }} onClick={() => go('/signup')}>
                      Get Started
                    </button>
                  </>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}

function DropItem({ icon, label, onClick }) {
  return (
    <button onClick={onClick} className="user-dropdown-item">
      <span style={{ color: 'var(--text-3)' }}>{icon}</span>
      {label}
    </button>
  )
}

function getNotifIcon(type) {
  const map = {
    request_received:  '📋',
    request_accepted:  '✅',
    request_rejected:  '❌',
    request_cancelled: '🚫',
    new_message:       '💬',
    new_review:        '⭐',
    review_reminder:   '⭐',
    system:            '🔔',
  }
  return map[type] || '🔔'
}

function getNotifLink(n) {
  // Route based on notification type, falling back to the stored link
  if (n.type === 'new_message') return n.link?.startsWith('/chat') ? n.link : '/chat'
  if (n.type?.startsWith('request_')) return '/dashboard'
  if (n.type === 'new_review' || n.type === 'review_reminder') return n.link || '/dashboard'
  return n.link || '/dashboard'
}

function timeAgo(dateStr) {
  if (!dateStr) return ''
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 7) return `${days}d ago`
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}
