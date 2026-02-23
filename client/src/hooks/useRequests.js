/**
 * hooks/useRequests.js
 * React Query hooks for rental request lifecycle.
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import * as requestApi from '@/api/requestApi'
import * as authApi from '@/api/authApi'
import useAuthStore from '@/store/authStore'

export const requestKeys = {
  all:      ['requests'],
  received: (p) => ['requests', 'received', p],
  sent:     (p) => ['requests', 'sent', p],
}

export const useReceivedRequests = (params = {}) =>
  useQuery({
    queryKey: requestKeys.received(params),
    queryFn:  () => requestApi.getReceived(params),
    staleTime: 30_000,
  })

export const useSentRequests = (params = {}) =>
  useQuery({
    queryKey: requestKeys.sent(params),
    queryFn:  () => requestApi.getSent(params),
    staleTime: 30_000,
  })

export const useSendRequest = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: requestApi.sendRequest,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: requestKeys.all })
      toast.success('Rental request sent!')
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Could not send request'),
  })
}

export const useAcceptRequest = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: requestApi.acceptRequest,
    onSuccess: async () => {
      qc.invalidateQueries({ queryKey: requestKeys.all })
      toast.success('Request accepted!')
      // Refresh cached user so totalEarnings updates immediately
      try {
        const data = await authApi.getMe()
        useAuthStore.getState().setUser(data.user)
      } catch (_) {}
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Could not accept'),
  })
}

export const useRejectRequest = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, reason }) => requestApi.rejectRequest(id, reason),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: requestKeys.all })
      toast.success('Request declined')
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Could not reject'),
  })
}

export const useCancelRequest = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: requestApi.cancelRequest,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: requestKeys.all })
      toast.success('Request cancelled')
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Could not cancel'),
  })
}

export const useCompleteRequest = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: requestApi.completeRequest,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: requestKeys.all })
      qc.invalidateQueries({ queryKey: ['items'] })
      toast.success('Rental marked as complete!')
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Could not complete'),
  })
}
