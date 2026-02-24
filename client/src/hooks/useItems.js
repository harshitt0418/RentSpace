/**
 * hooks/useItems.js
 * React Query hooks for rental item operations.
 */
import { useQuery, useMutation, useInfiniteQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import * as itemApi from '@/api/itemApi'

/* ── Query keys (centralised to avoid typos) ────────────────────────── */
export const itemKeys = {
  all:    ['items'],
  list:   (filters) => ['items', 'list', filters],
  detail: (id)      => ['items', 'detail', id],
}

/* ── GET /items (paginated) ─────────────────────────────────────────── */
export const useItems = (filters = {}, options = {}) =>
  useQuery({
    queryKey: itemKeys.list(filters),
    queryFn:  () => itemApi.getItems(filters),
    staleTime: 0,
    refetchOnWindowFocus: true,
    ...options,
  })

/* ── GET /items/:id ─────────────────────────────────────────────────── */
export const useItem = (id) =>
  useQuery({
    queryKey: itemKeys.detail(id),
    queryFn:  () => itemApi.getItem(id),
    enabled:  !!id,
    staleTime: 30_000,
  })

/* ── POST /items ────────────────────────────────────────────────────── */
export const useCreateItem = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: itemApi.createItem,
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: itemKeys.all })
      toast.success('Listing created!')
      return data
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to create listing'),
  })
}

/* ── PATCH /items/:id ───────────────────────────────────────────────── */
export const useUpdateItem = (id) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data) => itemApi.updateItem(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: itemKeys.detail(id) })
      qc.invalidateQueries({ queryKey: itemKeys.all })
      toast.success('Listing updated')
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Update failed'),
  })
}

/* ── Toggle item status (pause / resume) ────────────────────────────── */
export const useToggleItemStatus = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, status }) => itemApi.updateItem(id, { status }),
    onSuccess: (_data, { status }) => {
      qc.invalidateQueries({ queryKey: itemKeys.all })
      toast.success(status === 'paused' ? 'Listing paused' : 'Listing resumed')
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Status update failed'),
  })
}

/* ── DELETE /items/:id ──────────────────────────────────────────────── */
export const useDeleteItem = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: itemApi.deleteItem,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: itemKeys.all })
      toast.success('Listing removed')
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Could not delete'),
  })
}

/* ── POST /items/:id/images ─────────────────────────────────────────── */
export const useUploadItemImages = (id) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (files) => itemApi.uploadItemImages(id, files),
    onSuccess: () => qc.invalidateQueries({ queryKey: itemKeys.detail(id) }),
    onError: (err) => toast.error(err.response?.data?.message || 'Image upload failed'),
  })
}
