/**
 * hooks/useWishlist.js
 * React Query hooks for wishlist operations.
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import * as userApi from '@/api/userApi'
import useAuthStore from '@/store/authStore'

export const wishlistKeys = {
  all:   ['wishlist'],
  items: ['wishlist', 'items'],
  ids:   ['wishlist', 'ids'],
}

/** Get full wishlist items (for WishlistPage) */
export const useWishlist = () => {
  const isAuth = useAuthStore((s) => !!s.user && !!s.accessToken)
  return useQuery({
    queryKey: wishlistKeys.items,
    queryFn: userApi.getWishlist,
    enabled: isAuth,
    staleTime: 30_000,
  })
}

/** Get just the IDs (lightweight, for heart icon state) */
export const useWishlistIds = () => {
  const isAuth = useAuthStore((s) => !!s.user && !!s.accessToken)
  return useQuery({
    queryKey: wishlistKeys.ids,
    queryFn: userApi.getWishlistIds,
    enabled: isAuth,
    staleTime: 30_000,
  })
}

/** Toggle item in wishlist */
export const useToggleWishlist = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: userApi.toggleWishlist,
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: wishlistKeys.all })
      toast.success(data.added ? 'Added to wishlist ❤️' : 'Removed from wishlist')
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Could not update wishlist')
    },
  })
}
