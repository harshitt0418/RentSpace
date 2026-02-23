/**
 * hooks/useSocket.js
 * Initialises the Socket.io connection when the user is authenticated
 * and tears it down on logout. Also injects incoming messages directly
 * into the React Query cache so the UI updates in real-time.
 */
import { useEffect, useRef } from 'react'
import { useQueryClient }    from '@tanstack/react-query'
import useAuthStore            from '@/store/authStore'
import useNotificationStore    from '@/store/notificationStore'
import { connectSocket, disconnectSocket, getSocket } from '@/services/socket'
import { chatKeys }            from '@/hooks/useChat'
import { notifKeys }           from '@/hooks/useNotifications'

const useSocket = () => {
  const user        = useAuthStore((s) => s.user)
  const accessToken = useAuthStore((s) => s.accessToken)
  const increment   = useNotificationStore((s) => s.increment)
  const qc          = useQueryClient()
  const bound       = useRef(false)

  useEffect(() => {
    if (!user || !accessToken) {
      disconnectSocket()
      bound.current = false
      return
    }

    const socket = connectSocket()
    if (bound.current) return
    bound.current = true

    // Register for user-specific notifications
    socket.emit('register_user', user._id)

    /* ── Incoming chat message ─────────────────────────────────────── */
    socket.on('receive_message', (message) => {
      const roomId = message.room
      // Skip messages sent by the current user — they're already
      // added to the cache via the REST response (useSendMessage.onSuccess)
      const senderId = message.sender?._id || message.sender
      if (senderId === user._id) return

      qc.setQueryData(chatKeys.messages(roomId), (old) => {
        if (!old) return old
        const exists = old.messages?.some((m) => m._id === message._id)
        if (exists) return old
        return { ...old, messages: [...(old.messages ?? []), message] }
      })
      // Bump the room's lastMessage in the sidebar
      qc.invalidateQueries({ queryKey: chatKeys.rooms })
    })

    /* ── Typing indicators ─────────────────────────────────────────── */
    socket.on('user_typing',      ({ roomId, userId }) => {
      qc.setQueryData(['chat', 'typing', roomId], (old = []) =>
        [...new Set([...old, userId])]
      )
    })
    socket.on('user_stop_typing', ({ roomId, userId }) => {
      qc.setQueryData(['chat', 'typing', roomId], (old = []) =>
        (old || []).filter((id) => id !== userId)
      )
    })

    /* ── Real-time notifications ───────────────────────────────────── */
    socket.on('notification', () => {
      increment()
      qc.invalidateQueries({ queryKey: notifKeys.all })
    })

    return () => {
      // Do NOT disconnect on re-render — only on logout (handled above)
      socket.off('receive_message')
      socket.off('user_typing')
      socket.off('user_stop_typing')
      socket.off('notification')
      bound.current = false
    }
  }, [user, accessToken, qc, increment])
}

export default useSocket
