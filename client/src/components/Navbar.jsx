/**
 * Navbar.jsx — Responsive with hamburger menu + theme toggle
 */
import { useState, useEffect, useRef } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { LayoutDashboard, LogOut, User, Sun, Moon, Menu, X, Bell, Check, Heart, MessageCircle, Plus, Search, Trash2 } from 'lucide-react'

import useAuthStore from '@/store/authStore'
import useThemeStore from '@/store/themeStore'
import { useLogout } from '@/hooks/useAuth'
import useNotificationStore from '@/store/notificationStore'
import { useNotifications, useMarkAllRead, useClearAllNotifications } from '@/hooks/useNotifications'

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchFocused, setSearchFocused] = useState(false)
  const navigate = useNavigate()
  const mobileRef = useRef(null)
  const notifRef = useRef(null)
  const searchRef = useRef(null)

  const user = useAuthStore((s) => s.user)
  const isAuthenticated = useAuthStore((s) => !!s.user && !!s.accessToken)
  const unreadCount = useNotificationStore((s) => s.unreadCount)
  const { mutate: logout, isPending: loggingOut } = useLogout()
  const { theme, toggleTheme } = useThemeStore()
  const { data: notifData } = useNotifications({ limit: 8 })
  const { mutate: markAllRead } = useMarkAllRead()
  const { mutate: clearAll, isPending: clearing } = useClearAllNotifications()
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

  const handleSearch = (e) => {
    e.preventDefault()
    const q = searchQuery.trim()
    if (!q) return
    setSearchQuery('')
    setSearchFocused(false)
    searchRef.current?.blur()
    navigate(`/browse?q=${encodeURIComponent(q)}`)
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
        {/* Left — Logo + Nav links */}
        <div className="nav-left">
          <div className="nav-logo" onClick={() => go('/')} style={{ cursor: 'pointer' }}>
            RentSpace
          </div>
          <div className="nav-links">
            <NavLink to="/browse" className="nav-link">Browse</NavLink>
            <NavLink to="/how-it-works" className="nav-link">How It Works</NavLink>
            <NavLink to="/community" className="nav-link">Community</NavLink>
          </div>
        </div>

        {/* Center — Search bar only */}
        <form onSubmit={handleSearch} className={`nav-search-form ${searchFocused ? 'focused' : ''}`}>
          <Search size={14} className="nav-search-icon" />
          <input
            ref={searchRef}
            type="text"
            className="nav-search-input"
            placeholder="Search cameras, tools, bikes…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
          />
        </form>

        {/* Right actions */}
        <div className="nav-actions">
          {/* Theme toggle */}
          <button className="icon-btn theme-toggle" onClick={toggleTheme} aria-label="Toggle theme"
            title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}>
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          </button>

          {isAuthenticated ? (
            <>
              {/* Messages */}
              <div className="icon-btn hide-mobile" onClick={() => go('/chat')} title="Messages" style={{ position: 'relative' }}>
                <MessageCircle size={16} />
              </div>

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
                        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                          {unreadCount > 0 && (
                            <button className="notif-mark-all" onClick={() => markAllRead()}>
                              <Check size={13} /> Mark all read
                            </button>
                          )}
                          {notifications.length > 0 && (
                            <button
                              className="notif-mark-all notif-clear-all"
                              onClick={() => clearAll()}
                              disabled={clearing}
                              title="Clear all notifications"
                            >
                              <Trash2 size={13} /> Clear all
                            </button>
                          )}
                        </div>
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
                      <div className="user-dropdown-profile">
                        <div className="user-dropdown-avatar">
                          {user?.avatar
                            ? <img src={user.avatar} alt={user.name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                            : user?.name?.[0]?.toUpperCase() ?? 'U'
                          }
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.name}</div>
                          <div style={{ fontSize: 11, color: 'var(--text-3)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.email}</div>
                        </div>
                      </div>
                      <div className="divider" style={{ margin: '4px 0' }} />
                      <DropItem icon={<LayoutDashboard size={15} />} label="Dashboard" onClick={() => { setUserMenuOpen(false); go('/dashboard') }} />
                      <DropItem icon={<MessageCircle size={15} />} label="Messages" onClick={() => { setUserMenuOpen(false); go('/chat') }} />
                      <DropItem icon={<Heart size={15} />} label="Wishlist" onClick={() => { setUserMenuOpen(false); go('/wishlist') }} />
                      <DropItem icon={<User size={15} />} label="Profile" onClick={() => { setUserMenuOpen(false); go(`/profile/${user?._id}`) }} />
                      <div className="divider" />
                      <button className="nav-list-btn" style={{ width: '100%', borderRadius: 8, justifyContent: 'center', marginBottom: 4 }}
                        onClick={() => { setUserMenuOpen(false); go('/list-item') }}>
                        <Plus size={14} /> List an Item
                      </button>
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
                {/* Mobile Search */}
                <form className="mobile-search-form" onSubmit={(e) => { handleSearch(e); setMobileOpen(false) }}>
                  <Search size={15} style={{ color: 'var(--text-3)', flexShrink: 0 }} />
                  <input
                    type="search"
                    className="mobile-search-input"
                    placeholder="Search rentals…"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    autoComplete="off"
                  />
                </form>
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
