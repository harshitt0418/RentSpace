/**
 * ChatPage.jsx — demoui-matched design
 */
import { useState, useRef, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useChatRooms, useMessages, useSendMessage } from '@/hooks/useChat'
import useAuthStore from '@/store/authStore'
import { joinRoom, leaveRoom, emitTyping, emitStopTyping } from '@/services/socket'

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

  useEffect(() => {
    if (!activeRoom && rooms.length > 0) setActiveRoom(rooms[0]._id)
  }, [rooms, activeRoom])

  useEffect(() => {
    if (!activeRoom) return
    joinRoom(activeRoom)
    return () => leaveRoom(activeRoom)
  }, [activeRoom])

  const { data: messagesData, isLoading: loadingMessages } = useMessages(activeRoom)
  const { mutate: sendMsg, isPending: sending } = useSendMessage(activeRoom)
  const messages = messagesData?.messages || []

  // Scroll to bottom when messages change or room switches
  const messagesContainerRef = useRef(null)
  useEffect(() => {
    // Use requestAnimationFrame to ensure DOM has updated
    requestAnimationFrame(() => {
      if (messagesContainerRef.current) {
        messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight
      }
    })
  }, [messages, activeRoom])

  const currentRoom = rooms.find((r) => r._id === activeRoom)
  const getOther = (room) => room?.participants?.find((p) => p._id !== currentUser?._id)

  const sendMessage = () => {
    if (!input.trim() || !activeRoom) return
    const text = input.trim()
    setInput('')
    sendMsg({ content: text })
  }

  const filteredRooms = rooms.filter((r) => {
    const other = getOther(r)
    return (
      other?.name?.toLowerCase().includes(search.toLowerCase()) ||
      r.item?.title?.toLowerCase().includes(search.toLowerCase())
    )
  })

  return (
    <div className="chat-layout">
      {/* Mobile chat sidebar toggle */}
      <button className="mobile-chat-btn icon-btn" onClick={() => setChatSidebarOpen((v) => !v)}
        style={{ position: 'fixed', top: 78, left: 12, zIndex: 800 }}>
        💬
      </button>
      {chatSidebarOpen && <div className="mobile-overlay" onClick={() => setChatSidebarOpen(false)} style={{ zIndex: 899 }} />}

      {/* Sidebar */}
      <div className={`chat-sidebar ${chatSidebarOpen ? 'open' : ''}`}>
        <div className="chat-sidebar-header">
          <div className="chat-sidebar-title">Messages</div>
          <input
            className="chat-search"
            placeholder="Search conversations…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="chat-list">
          {loadingRooms ? (
            <div style={{ color: 'var(--text-3)', textAlign: 'center', padding: '32px 0', fontSize: 14 }}>Loading…</div>
          ) : filteredRooms.length === 0 ? (
            <div style={{ color: 'var(--text-3)', textAlign: 'center', padding: '32px 0', fontSize: 14 }}>No conversations</div>
          ) : (
            filteredRooms.map((room) => {
              const other = getOther(room)
              return (
                <div
                  key={room._id}
                  className={`chat-item ${activeRoom === room._id ? 'active' : ''}`}
                  onClick={() => {
                    setActiveRoom(room._id)
                    setChatSidebarOpen(false)
                    navigate(`/chat/${room._id}`, { replace: true })
                  }}
                >
                  <div className="chat-item-avatar">
                    {other?.name?.[0] || '?'}
                    {room.online && <div className="online-dot" />}
                  </div>
                  <div className="chat-item-body">
                    <div className="chat-item-name">
                      {other?.name || 'Unknown'}
                      {room.lastMessage?.createdAt && (
                        <span className="chat-item-time">
                          {new Date(room.lastMessage.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      )}
                    </div>
                    <div className="chat-item-preview">
                      {room.lastMessage?.content?.substring(0, 30) || room.item?.title || 'No messages yet'}
                      {room.unreadCount > 0 && <span className="unread-badge">{room.unreadCount}</span>}
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>

      {/* Main chat area */}
      <div className="chat-main">
        {!activeRoom ? (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-3)' }}>
            Select a conversation to start chatting.
          </div>
        ) : (
          <>
            {/* Header */}
            {currentRoom && (() => {
              const other = getOther(currentRoom)
              return (
                <div className="chat-header">
                  <div className="chat-header-left">
                    <div className="chat-header-avatar">{other?.name?.[0] || '?'}</div>
                    <div>
                      <div className="chat-header-name">{other?.name || 'Unknown'}</div>
                      <div className="chat-header-status">
                        <div style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--success)' }} />
                        Online
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <div className="icon-btn">📋</div>
                    <div className="icon-btn">⋮</div>
                  </div>
                </div>
              )
            })()}

            {/* Messages */}
            <div className="chat-messages" ref={messagesContainerRef}>
              {loadingMessages ? (
                <div style={{ color: 'var(--text-3)', textAlign: 'center', padding: '32px 0' }}>Loading messages…</div>
              ) : (
                messages.map((msg) => {
                  const isMe = msg.sender?._id === currentUser?._id || msg.sender === currentUser?._id
                  return (
                    <div key={msg._id} className={`msg msg-${isMe ? 'sent' : 'received'}`}>
                      <div className="msg-bubble">{msg.content}</div>
                      <div className="msg-time">
                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  )
                })
              )}
            </div>

            {/* Input */}
            <div className="chat-input-area">
              <div className="icon-btn">📎</div>
              <input
                className="chat-input"
                placeholder="Type a message…"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') sendMessage()
                }}
                onFocus={() => emitTyping(activeRoom)}
                onBlur={() => emitStopTyping(activeRoom)}
              />
              <button className="chat-send" onClick={sendMessage} disabled={!input.trim() || sending}>
                ➤
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
