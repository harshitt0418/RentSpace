/**
 * EditItemModal.jsx — Reusable modal for editing an item listing.
 * Uses the same solid-bg styling as ProfilePage edit modal.
 */
import { useState, useEffect } from 'react'
import { useUpdateItem } from '@/hooks/useItems'
import LocationPicker from './LocationPicker'

const CATEGORIES = [
  { label: '📷 Photography', value: 'Cameras' },
  { label: '🔧 Tools & DIY', value: 'Tools' },
  { label: '🏕️ Outdoor & Sports', value: 'Sports' },
  { label: '🎮 Electronics', value: 'Electronics' },
  { label: '🎸 Instruments', value: 'Instruments' },
  { label: '🚗 Vehicles', value: 'Vehicles' },
  { label: '🏠 Spaces', value: 'Spaces' },
  { label: '📦 Other', value: 'Other' },
]

export default function EditItemModal({ item, onClose, onSuccess }) {
  const [form, setForm] = useState({
    title: '',
    description: '',
    category: '',
    pricePerDay: '',
    deposit: '',
    location: '',
    locationState: '',
    locationAddress: '',
    coordinates: null,
    tags: '',
    status: 'active',
  })

  const { mutate: updateItem, isPending } = useUpdateItem(item?._id)

  /* Seed form when the item changes */
  useEffect(() => {
    if (!item) return
    setForm({
      title: item.title || '',
      description: item.description || '',
      category: item.category || '',
      pricePerDay: item.pricePerDay ?? '',
      deposit: item.deposit ?? '',
      location: item.location?.city || (typeof item.location === 'string' ? item.location : ''),
      locationState: item.location?.state || '',
      locationAddress: item.location?.address || '',
      coordinates: item.location?.coordinates || null,
      tags: (item.tags || []).join(', '),
      status: item.status || 'active',
    })
  }, [item])

  if (!item) return null

  const set = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }))

  const handleSave = () => {
    const payload = {
      title: form.title.trim(),
      description: form.description.trim(),
      category: form.category,
      pricePerDay: Number(form.pricePerDay),
      deposit: Number(form.deposit) || 0,
      location: {
        city: form.location.trim(),
        ...(form.locationState ? { state: form.locationState } : {}),
        ...(form.locationAddress ? { address: form.locationAddress } : {}),
        ...(form.coordinates ? { coordinates: form.coordinates } : {}),
      },
      tags: form.tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
      status: form.status,
    }
    updateItem(payload, {
      onSuccess: () => {
        onSuccess?.()
        onClose()
      },
    })
  }

  return (
    <div
      className="modal-backdrop"
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 9000,
        background: 'rgba(0,0,0,0.92)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
    >
      <div
        className="modal-card"
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#0f0f1a',
          borderRadius: 16,
          border: '1px solid var(--border)',
          padding: 28,
          width: '95%',
          maxWidth: 520,
          maxHeight: '90vh',
          overflowY: 'auto',
          color: 'var(--text-1)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 style={{ fontSize: 20, fontWeight: 700 }}>Edit Listing</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-3)', fontSize: 22, cursor: 'pointer' }}>✕</button>
        </div>

        {/* Title */}
        <div className="form-group" style={{ marginBottom: 14 }}>
          <label className="form-label">Title</label>
          <input className="form-input" name="title" value={form.title} onChange={set} placeholder="Item title" />
        </div>

        {/* Category */}
        <div className="form-group" style={{ marginBottom: 14 }}>
          <label className="form-label">Category</label>
          <select className="form-input" name="category" value={form.category} onChange={set}>
            <option value="">Select…</option>
            {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
        </div>

        {/* Description */}
        <div className="form-group" style={{ marginBottom: 14 }}>
          <label className="form-label">Description</label>
          <textarea className="form-input" name="description" value={form.description} onChange={set} rows={4}
            style={{ resize: 'vertical' }} placeholder="Describe your item…" />
        </div>

        {/* Location */}
        <div className="form-group" style={{ marginBottom: 14 }}>
          <label className="form-label">Location</label>
          <LocationPicker
            value={form.location}
            onChange={(city, state, coords, address) => {
              setForm((p) => ({
                ...p,
                location: city,
                locationState: state || p.locationState,
                locationAddress: address || p.locationAddress,
                coordinates: coords || p.coordinates,
              }))
            }}
          />
        </div>

        {/* Price + Deposit row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
          <div className="form-group">
            <label className="form-label">Price / Day ($)</label>
            <input className="form-input" type="number" name="pricePerDay" value={form.pricePerDay} onChange={set} min="1" />
          </div>
          <div className="form-group">
            <label className="form-label">Deposit ($)</label>
            <input className="form-input" type="number" name="deposit" value={form.deposit} onChange={set} min="0" />
          </div>
        </div>

        {/* Tags */}
        <div className="form-group" style={{ marginBottom: 14 }}>
          <label className="form-label">Tags <span style={{ color: 'var(--text-3)', fontWeight: 400 }}>(comma-separated)</span></label>
          <input className="form-input" name="tags" value={form.tags} onChange={set} placeholder="e.g. camera, sony, photography" />
        </div>

        {/* Status */}
        <div className="form-group" style={{ marginBottom: 20 }}>
          <label className="form-label">Status</label>
          <select className="form-input" name="status" value={form.status} onChange={set}>
            <option value="active">Active</option>
            <option value="paused">Paused</option>
          </select>
        </div>

        {/* Buttons */}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button className="btn-secondary" onClick={onClose} style={{ padding: '10px 20px' }}>Cancel</button>
          <button className="btn-primary" onClick={handleSave} disabled={isPending}
            style={{ padding: '10px 24px' }}>
            {isPending ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  )
}
