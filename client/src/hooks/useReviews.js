/**
 * hooks/useReviews.js
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import * as reviewApi from '@/api/reviewApi'

export const useItemReviews = (itemId, params = {}) =>
  useQuery({
    queryKey: ['reviews', 'item', itemId, params],
    queryFn:  () => reviewApi.getItemReviews(itemId, params),
    enabled:  !!itemId,
    staleTime: 60_000,
  })

export const useUserReviews = (userId, params = {}) =>
  useQuery({
    queryKey: ['reviews', 'user', userId, params],
    queryFn:  () => reviewApi.getUserReviews(userId, params),
    enabled:  !!userId,
    staleTime: 60_000,
  })

export const useMyRequestReviews = (requestId) =>
  useQuery({
    queryKey: ['reviews', 'request', requestId, 'mine'],
    queryFn:  () => reviewApi.getMyRequestReviews(requestId),
    enabled:  !!requestId,
    staleTime: 30_000,
  })

export const useCreateReview = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: reviewApi.createReview,
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['reviews'] })
      qc.invalidateQueries({ queryKey: ['items'] })
      qc.invalidateQueries({ queryKey: ['users'] })
      toast.success('Review submitted!')
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Could not submit review'),
  })
}
