/**
 * hooks/useChat.js
 * React Query hooks for chat rooms and message history.
 * Real-time new messages are injected via useSocket (see services/socket.js).
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import * as chatApi from '@/api/chatApi'
import useAuthStore from '@/store/authStore'

export const chatKeys = {
  rooms:    ['chat', 'rooms'],
  messages: (roomId) => ['chat', 'messages', roomId],
}

export const useChatRooms = () => {
  const accessToken = useAuthStore((s) => s.accessToken)
  return useQuery({
    queryKey: chatKeys.rooms,
    queryFn:  chatApi.getRooms,
    enabled:  !!accessToken,
    staleTime: 10_000,
  })
}

export const useMessages = (roomId) =>
  useQuery({
    queryKey: chatKeys.messages(roomId),
    queryFn:  () => chatApi.getMessages(roomId),
    enabled:  !!roomId,
    staleTime: 5_000,
  })

export const useCreateRoom = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ recipientId, participantId, requestId, itemId }) =>
      chatApi.createRoom(recipientId || participantId, requestId || itemId),
    onSuccess: () => qc.invalidateQueries({ queryKey: chatKeys.rooms }),
    onError: (err) => toast.error(err.response?.data?.message || 'Could not open chat'),
  })
}

export const useSendMessage = (roomId) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ content, type }) => chatApi.sendMessage(roomId, content, type),
    onSuccess: (data) => {
      qc.setQueryData(chatKeys.messages(roomId), (old) => {
        if (!old) return old
        return { ...old, messages: [...(old.messages || []), data.message] }
      })
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Message failed to send'),
  })
}

export const useDeleteRoom = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (roomId) => chatApi.deleteRoom(roomId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: chatKeys.rooms })
      toast.success('Conversation deleted')
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Could not delete conversation'),
  })
}
