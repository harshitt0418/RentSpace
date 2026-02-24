/**
 * ChatPage.jsx — clean redesign with emoji picker + delete chat
 */
import { useState, useRef, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { useParams, useNavigate } from 'react-router-dom'
import { useChatRooms, useMessages, useSendMessage, useDeleteRoom } from '@/hooks/useChat'
import useAuthStore from '@/store/authStore'
import { joinRoom, leaveRoom, emitTyping, emitStopTyping, getSocket } from '@/services/socket'
import { MessageCircle, Smile, Send, ChevronLeft, MoreVertical, Trash2, User as UserIcon, X,
  Menu, Home, Package, ClipboardList, CheckCircle, Clock, Star, Plus } from 'lucide-react'

const DASH_TABS = [
  { key: 'overview',  icon: Home,          label: 'Overview' },
  { key: 'listings',  icon: Package,        label: 'My Listings' },
  { key: 'requests',  icon: ClipboardList,  label: 'Requests' },
  { key: 'accepted',  icon: CheckCircle,    label: 'Accepted Requests' },
  { key: 'history',   icon: Clock,          label: 'History' },
  { key: 'reviews',   icon: Star,           label: 'Reviews' },
]
import EmojiPicker from 'emoji-picker-react'

/* ── helpers ── */
function formatTime(date) {
  return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}
function formatDateLabel(date) {
  const d = new Date(date)
  const today = new Date(); today.setHours(0,0,0,0)
  const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1)
  d.setHours(0,0,0,0)
  if (d.getTime() === today.getTime()) return 'Today'
  if (d.getTime() === yesterday.getTime()) return 'Yesterday'
  return new Date(date).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })
}
function isSameDay(a, b) {
  const da = new Date(a), db = new Date(b)
  return da.getFullYear() === db.getFullYear() && da.getMonth() === db.getMonth() && da.getDate() === db.getDate()
}

export default function ChatPage() {
  const { roomId: routeRoomId } = useParams()
  const navigate = useNavigate()
  const currentUser = useAuthStore((s) => s.user)

  const { data: roomsData, isLoading: loadingRooms } = useChatRooms()
  const rooms = roomsData?.rooms || []

  const [activeRoom, setActiveRoom] = useState(routeRoomId || null)
  const [input, setInput] = useState('')
  const [search, setSearch] = useState('')
  const [chatSidebarOpen, setChatSidebarOpen] = useState(false)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  const [showNavMenu, setShowNavMenu] = useState(false)
  const [navMenuPos, setNavMenuPos] = useState({ top: 0, left: 0 })
  const [onlineUsers, setOnlineUsers] = useState(new Set())

  // helper
  const isOnline = (userId) => !!userId && onlineUsers.has(userId.toString())

  // ── Listen for online/offline presence events ──────────────────────────
  useEffect(() => {
    const socket = getSocket()
    if (!socket) return
    const onList    = ({ userIds })  => setOnlineUsers(new Set(userIds.map(String)))
    const onOnline  = ({ userId })   => setOnlineUsers(prev => new Set([...prev, String(userId)]))
    const onOffline = ({ userId })   => setOnlineUsers(prev => { const s = new Set(prev); s.delete(String(userId)); return s })
    socket.on('online_users', onList)
    socket.on('user_online',  onOnline)
    socket.on('user_offline', onOffline)
    // Request current snapshot in case we missed the initial broadcast
    socket.emit('get_online_users')
    return () => {
      socket.off('online_users', onList)
      socket.off('user_online',  onOnline)
      socket.off('user_offline', onOffline)
    }
  }, [])

  const inputRef = useRef(null)
  const emojiRef = useRef(null)
  const menuRef = useRef(null)
  const navMenuRef = useRef(null)
  const navBtnRef = useRef(null)

  // Close emoji picker / menu on outside click
  useEffect(() => {
    const handler = (e) => {
      if (emojiRef.current && !emojiRef.current.contains(e.target)) setShowEmojiPicker(false)
      if (menuRef.current && !menuRef.current.contains(e.target)) setShowMenu(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Auto-select first room once loaded
  const hasAutoSelected = useRef(false)
  useEffect(() => {
    if (!hasAutoSelected.current && rooms.length > 0 && !routeRoomId) {
      hasAutoSelected.current = true
      if (window.innerWidth > 900) setActiveRoom(rooms[0]._id)
    }
  }, [rooms.length]) // eslint-disable-line

  useEffect(() => {
    if (!activeRoom) return
    joinRoom(activeRoom)
    return () => leaveRoom(activeRoom)
  }, [activeRoom])

  const { data: messagesData, isLoading: loadingMessages } = useMessages(activeRoom)
  const { mutate: sendMsg, isPending: sending } = useSendMessage(activeRoom)
  const { mutate: deleteRoom } = useDeleteRoom()
  const messages = messagesData?.messages || []

  const messagesEndRef = useRef(null)
  const isInitialLoad = useRef(true)
  useEffect(() => {
    requestAnimationFrame(() => {
      if (!messagesEndRef.current) return
      messagesEndRef.current.scrollIntoView({ behavior: isInitialLoad.current ? 'instant' : 'smooth' })
      isInitialLoad.current = false
    })
  }, [messages, activeRoom])

  // Reset initial-load flag when room changes
  useEffect(() => { isInitialLoad.current = true }, [activeRoom])

  const currentRoom = rooms.find((r) => r._id === activeRoom)
  const getOther = useCallback((room) => room?.participants?.find((p) => p._id !== currentUser?._id), [currentUser])

  const sendMessage = () => {
    const text = input.trim()
    if (!text || !activeRoom) return
    setInput('')
    setShowEmojiPicker(false)
    sendMsg({ content: text })
  }

  const handleEmojiClick = (emojiData) => {
    setInput((prev) => prev + emojiData.emoji)
    inputRef.current?.focus()
  }

  const handleDeleteRoom = () => {
    setShowMenu(false)
    if (!window.confirm('Delete this conversation? This cannot be undone.')) return
    deleteRoom(activeRoom, {
      onSuccess: () => {
        setActiveRoom(null)
        navigate('/chat', { replace: true })
      },
    })
  }

  const selectRoom = (roomId) => {
    setActiveRoom(roomId)
    setChatSidebarOpen(false)
    setShowEmojiPicker(false)
    navigate(`/chat/${roomId}`, { replace: true })
  }

  const filteredRooms = rooms.filter((r) => {
    const other = getOther(r)
    return (
      other?.name?.toLowerCase().includes(search.toLowerCase()) ||
      r.item?.title?.toLowerCase().includes(search.toLowerCase())
    )
  })

  return (
    <div className={`chat-layout${activeRoom ? ' chat-active' : ''}`}>
      {/* ─── Sidebar ─────────────────────────────────────────── */}
      {chatSidebarOpen && (
        <div className="mobile-overlay" onClick={() => setChatSidebarOpen(false)} style={{ zIndex: 899 }} />
      )}

      <div className={`chat-sidebar ${chatSidebarOpen ? 'open' : ''}`}>

        <div className="chat-sidebar-header">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            {/* ── Hamburger LEFT of title ── */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div ref={navMenuRef}>
                <button
                  ref={navBtnRef}
                  onClick={() => {
                    const rect = navBtnRef.current.getBoundingClientRect()
                    setNavMenuPos({ top: rect.bottom + 8, left: rect.left })
                    setShowNavMenu(v => !v)
                  }}
                  title="Navigate"
                  style={{
                    background: showNavMenu ? 'var(--accent)' : 'rgba(255,255,255,0.12)',
                    border: 'none', cursor: 'pointer', padding: '6px 8px', borderRadius: 8,
                    color: '#fff', display: 'flex', alignItems: 'center',
                    transition: 'background 0.15s', boxShadow: '0 1px 4px rgba(0,0,0,0.3)'
                  }}
                >
                  <Menu size={17} />
                </button>
              </div>
              <div className="chat-sidebar-title" style={{ marginBottom: 0 }}>Messages</div>
            </div>
            <span style={{ fontSize: 12, color: 'var(--text-3)', fontWeight: 500 }}>
              {filteredRooms.length} chat{filteredRooms.length !== 1 ? 's' : ''}
            </span>
            {showNavMenu && createPortal(
              <>
                {/* blur backdrop */}
                <div
                  style={{ position: 'fixed', inset: 0, zIndex: 9998, backdropFilter: 'blur(3px)', WebkitBackdropFilter: 'blur(3px)', background: 'rgba(0,0,0,0.25)' }}
                  onClick={() => setShowNavMenu(false)}
                />
                <div style={{
                  position: 'fixed', top: navMenuPos.top, left: navMenuPos.left, zIndex: 9999,
                  background: '#0d0f1a',
                  border: '1px solid rgba(255,255,255,0.12)',
                  borderRadius: 12, boxShadow: '0 16px 48px rgba(0,0,0,0.7)',
                  minWidth: 220, padding: '6px 0',
                }}>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', padding: '4px 14px 8px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Navigate</div>
                  {DASH_TABS.map(({ key, icon: Icon, label }) => (
                    <div
                      key={key}
                      onClick={() => { navigate(`/dashboard?tab=${key}`); setShowNavMenu(false) }}
                      style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 14px', cursor: 'pointer', fontSize: 13, color: 'rgba(255,255,255,0.9)', transition: 'background 0.12s' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <Icon size={14} style={{ opacity: 0.7 }} /> {label}
                    </div>
                  ))}
                  <div style={{ height: 1, background: 'rgba(255,255,255,0.1)', margin: '5px 0' }} />
                  <div
                    onClick={() => { navigate('/list-item'); setShowNavMenu(false) }}
                    style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 14px', cursor: 'pointer', fontSize: 13, color: 'var(--accent)', fontWeight: 600, transition: 'background 0.12s' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(99,102,241,0.15)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <Plus size={14} /> List New Item
                  </div>
                </div>
              </>,
              document.body
            )}
          </div>
          <div style={{ position: 'relative' }}>
            <input
              className="chat-search"
              placeholder="Search conversations…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ paddingLeft: 36 }}
            />
            <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)', pointerEvents: 'none' }}>
              🔍
            </span>
          </div>
        </div>

        <div className="chat-list">
          {loadingRooms ? (
            <div style={{ color: 'var(--text-3)', textAlign: 'center', padding: '40px 0', fontSize: 13 }}>
              Loading…
            </div>
          ) : filteredRooms.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px 16px', color: 'var(--text-3)' }}>
              <MessageCircle size={32} style={{ marginBottom: 10, opacity: 0.4 }} />
              <div style={{ fontSize: 13, fontWeight: 600 }}>No conversations yet</div>
              <div style={{ fontSize: 12, marginTop: 4, textAlign: 'center' }}>
                Start a chat from any item listing or accepted request.
              </div>
            </div>
          ) : (
            filteredRooms.map((room) => {
              const other = getOther(room)
              const isActive = activeRoom === room._id
              return (
                <div
                  key={room._id}
                  className={`chat-item ${isActive ? 'active' : ''}`}
                  onClick={() => selectRoom(room._id)}
                >
                  <div className="chat-item-avatar" style={{ overflow: 'hidden', position: 'relative' }}>
                    {other?.avatar
                      ? <img src={other.avatar} alt={other.name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                      : <span style={{ fontSize: 16, fontWeight: 700 }}>{other?.name?.[0] || '?'}</span>
                    }
                    {isOnline(other?._id) && <div className="online-dot" />}
                  </div>
                  <div className="chat-item-body">
                    <div className="chat-item-name">
                      <span>{other?.name || 'Unknown'}</span>
                      {room.lastMessage && (
                        <span className="chat-item-time">
                          {room.lastMessageAt ? formatTime(room.lastMessageAt) : ''}
                        </span>
                      )}
                    </div>
                    <div className="chat-item-preview">
                      <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {room.lastMessage?.substring(0, 36) || room.item?.title || 'Start a conversation'}
                      </span>
                      {room.unreadCount > 0 && (
                        <span className="unread-badge">{room.unreadCount}</span>
                      )}
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>

      {/* ─── Main chat area ───────────────────────────────────── */}
      <div className="chat-main">
        {!activeRoom ? (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-3)', gap: 14 }}>
            <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'var(--bg-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border)' }}>
              <MessageCircle size={32} style={{ color: 'var(--accent)', opacity: 0.7 }} />
            </div>
            <div style={{ fontSize: 18, fontWeight: 700 }}>Your messages</div>
            <div style={{ fontSize: 13, maxWidth: 240, textAlign: 'center', lineHeight: 1.6 }}>
              Select a conversation from the list or start one from an item page.
            </div>
          </div>
        ) : (
          <>
            {/* ── Chat Header ── */}
            {currentRoom && (() => {
              const other = getOther(currentRoom)
              return (
                <div className="chat-header">
                  <div className="chat-header-left">
                    <button
                      className="icon-btn chat-back-btn"
                      onClick={() => { setActiveRoom(null); setChatSidebarOpen(true) }}
                      aria-label="Back"
                    >
                      <ChevronLeft size={20} />
                    </button>
                    <div
                      className="chat-header-avatar"
                      style={{ overflow: 'hidden', cursor: 'pointer' }}
                      onClick={() => other?._id && navigate(`/profile/${other._id}`)}
                    >
                      {other?.avatar
                        ? <img src={other.avatar} alt={other.name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                        : <span style={{ fontSize: 15, fontWeight: 700 }}>{other?.name?.[0] || '?'}</span>
                      }
                    </div>
                    <div>
                      <div
                        className="chat-header-name"
                        style={{ cursor: 'pointer' }}
                        onClick={() => other?._id && navigate(`/profile/${other._id}`)}
                      >
                        {other?.name || 'Unknown'}
                      </div>
                      <div className="chat-header-status" style={{ color: isOnline(other?._id) ? 'inherit' : '#ef4444' }}>
                        <div style={{ width: 7, height: 7, borderRadius: '50%', background: isOnline(other?._id) ? 'var(--success)' : '#ef4444' }} />
                        {isOnline(other?._id) ? 'Active' : 'Offline'}
                      </div>
                    </div>
                  </div>

                  {/* Kebab menu */}
                  <div style={{ position: 'relative' }} ref={menuRef}>
                    <button
                      className="icon-btn"
                      onClick={() => setShowMenu((v) => !v)}
                      aria-label="Options"
                    >
                      <MoreVertical size={18} />
                    </button>
                    {showMenu && (
                      <div className="chat-dropdown">
                        <button
                          className="chat-dropdown-item"
                          onClick={() => { setShowMenu(false); other?._id && navigate(`/profile/${other._id}`) }}
                        >
                          <UserIcon size={15} /> View profile
                        </button>
                        <div className="chat-dropdown-divider" />
                        <button
                          className="chat-dropdown-item chat-dropdown-danger"
                          onClick={handleDeleteRoom}
                        >
                          <Trash2 size={15} /> Delete conversation
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )
            })()}

            {/* ── Messages ── */}
            <div className="chat-messages">
              {loadingMessages ? (
                <div style={{ color: 'var(--text-3)', textAlign: 'center', padding: '40px 0', fontSize: 13 }}>
                  Loading messages…
                </div>
              ) : messages.length === 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, color: 'var(--text-3)', gap: 8 }}>
                  <MessageCircle size={28} style={{ opacity: 0.35 }} />
                  <div style={{ fontSize: 13 }}>No messages yet. Say hello! 👋</div>
                </div>
              ) : (
                messages.map((msg, i) => {
                  const isMe = msg.sender?._id === currentUser?._id || msg.sender === currentUser?._id
                  const prev = messages[i - 1]
                  const prevIsMe = prev && (prev.sender?._id === currentUser?._id || prev.sender === currentUser?._id)
                  const showDate = !prev || !isSameDay(prev.createdAt, msg.createdAt)
                  const grouped = prev && prevIsMe === isMe && !showDate
                  return (
                    <div
                      key={msg._id}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: isMe ? 'flex-end' : 'flex-start',
                      }}
                    >
                      {showDate && (
                        <div className="chat-date-divider" style={{ alignSelf: 'center', width: '100%' }}>
                          <span>{formatDateLabel(msg.createdAt)}</span>
                        </div>
                      )}
                      <div className={`msg msg-${isMe ? 'sent' : 'received'}${grouped ? ' msg-grouped' : ''}`}>
                        <div className="msg-bubble">{msg.content}</div>
                        <div className="msg-time">{formatTime(msg.createdAt)}</div>
                      </div>
                    </div>
                  )
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* ── Emoji Picker ── */}
            {showEmojiPicker && (
              <div className="emoji-picker-wrapper" ref={emojiRef}>
                <EmojiPicker
                  onEmojiClick={handleEmojiClick}
                  theme="dark"
                  skinTonesDisabled
                  height={380}
                  width="100%"
                  searchDisabled={false}
                  previewConfig={{ showPreview: false }}
                />
              </div>
            )}

            {/* ── Input area ── */}
            <div className="chat-input-area">
              <button
                className={`icon-btn emoji-toggle-btn${showEmojiPicker ? ' active' : ''}`}
                onClick={() => setShowEmojiPicker((v) => !v)}
                aria-label="Emoji"
                title="Add emoji"
              >
                {showEmojiPicker ? <X size={18} /> : <Smile size={18} />}
              </button>
              <input
                ref={inputRef}
                className="chat-input"
                placeholder="Type a message…"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() } }}
                onFocus={() => emitTyping(activeRoom)}
                onBlur={() => emitStopTyping(activeRoom)}
              />
              <button
                className="chat-send"
                onClick={sendMessage}
                disabled={!input.trim() || sending}
                aria-label="Send"
              >
                <Send size={16} />
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
