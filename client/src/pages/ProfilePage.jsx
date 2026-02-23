/**
 * ProfilePage.jsx — demoui-matched design with edit profile & compact listings
 */
import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getProfile, updateProfile, uploadAvatar } from '@/api/userApi'
import { useItems } from '@/hooks/useItems'
import { useUserReviews } from '@/hooks/useReviews'
import { useCreateRoom } from '@/hooks/useChat'
import useAuthStore from '@/store/authStore'
import toast from 'react-hot-toast'

export default function ProfilePage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const currentUser = useAuthStore((s) => s.user)
  const setUser = useAuthStore((s) => s.setUser)
  const isOwner = currentUser?._id === id

  const [editOpen, setEditOpen] = useState(false)
  const [form, setForm] = useState({ name: '', bio: '', location: '' })
  const [avatarPreview, setAvatarPreview] = useState(null)
  const [avatarFile, setAvatarFile] = useState(null)

  const { data: profileData, isLoading: loadingProfile } = useQuery({
    queryKey: ['profile', id],
    queryFn: () => getProfile(id),
    enabled: !!id,
  })

  const { data: listingsData } = useItems({ owner: id, limit: 20 })
  const { data: reviewsData } = useUserReviews(id)
  const { mutate: createRoom } = useCreateRoom()

  const { mutate: saveProfile, isPending: saving } = useMutation({
    mutationFn: updateProfile,
    onSuccess: (res) => {
      if (res.user) {
        // Immediately update the cache — no waiting for background refetch
        qc.setQueryData(['profile', id], (old) => old ? { ...old, user: res.user } : old)
        setUser(res.user)
      }
      qc.invalidateQueries({ queryKey: ['profile', id] })
      toast.success('Profile updated!')
      setEditOpen(false)
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Update failed'),
  })

  const { mutate: saveAvatar, isPending: uploadingAvatar } = useMutation({
    mutationFn: uploadAvatar,
    onSuccess: (res) => {
      if (res.user) {
        qc.setQueryData(['profile', id], (old) => old ? { ...old, user: res.user } : old)
        setUser(res.user)
      }
      qc.invalidateQueries({ queryKey: ['profile', id] })
      setAvatarPreview(null)
      setAvatarFile(null)
      toast.success('Profile picture updated!')
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Avatar upload failed'),
  })

  const user = profileData?.user
  const items = listingsData?.data || []
  const reviews = reviewsData?.data || []

  // Compute star distribution from reviews
  const starCounts = [0, 0, 0, 0, 0] // index 0 = 1-star, index 4 = 5-star
  reviews.forEach((r) => {
    if (r.rating >= 1 && r.rating <= 5) starCounts[r.rating - 1]++
  })
  const totalReviewCount = user?.totalReviews || reviews.length || 0
  const avgRating = user?.rating || 0

  const openEdit = () => {
    setForm({ name: user?.name || '', bio: user?.bio || '', location: user?.location || '' })
    setAvatarPreview(null)
    setAvatarFile(null)
    setEditOpen(true)
  }

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 3 * 1024 * 1024) { toast.error('Image must be under 3 MB'); return }
    setAvatarFile(file)
    setAvatarPreview(URL.createObjectURL(file))
  }

  const handleSave = () => {
    if (avatarFile) saveAvatar(avatarFile)
    saveProfile({ name: form.name.trim(), bio: form.bio.trim(), location: form.location.trim() })
  }

  const handleMessage = () => {
    if (!currentUser) { navigate('/login'); return }
    if (!user?._id) return
    createRoom({ participantId: user._id }, {
      onSuccess: (res) => navigate(`/chat/${res.room._id}`),
    })
  }

  if (loadingProfile) {
    return (
      <div className="profile-layout" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <div style={{ color: 'var(--text-2)', fontSize: 16 }}>Loading profile…</div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="profile-layout" style={{ textAlign: 'center', paddingTop: 120 }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>😕</div>
        <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>User not found</div>
      </div>
    )
  }

  const memberSince = user.createdAt ? new Date(user.createdAt).getFullYear() : ''
  const memberYears = memberSince ? `${new Date().getFullYear() - memberSince}y` : '—'

  return (
    <div className="profile-layout">
      {/* ── Edit Profile Modal ── */}
      {editOpen && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 1000,
            background: 'rgba(0,0,0,0.92)', display: 'flex',
            alignItems: 'center', justifyContent: 'center', padding: 16,
          }}
          onClick={(e) => e.target === e.currentTarget && setEditOpen(false)}
        >
          <div style={{
            background: '#0f0f1a', borderRadius: 16, padding: 32,
            width: '100%', maxWidth: 460,
            border: '1px solid rgba(99,102,241,0.25)', boxShadow: '0 24px 64px rgba(0,0,0,0.7)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-1)' }}>Edit Profile</div>
              <button onClick={() => setEditOpen(false)} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: 'var(--text-3)' }}>✕</button>
            </div>

            {/* Avatar picker */}
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
              <label htmlFor="avatar-upload" style={{ cursor: 'pointer', position: 'relative', display: 'inline-block' }}
                onMouseEnter={(e) => e.currentTarget.querySelector('.avatar-overlay').style.opacity = '1'}
                onMouseLeave={(e) => e.currentTarget.querySelector('.avatar-overlay').style.opacity = '0'}
              >
                <div style={{
                  width: 88, height: 88, borderRadius: '50%',
                  background: 'var(--card)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 36, fontWeight: 800, overflow: 'hidden',
                  border: '3px solid #6366f1',
                  boxShadow: '0 0 0 4px rgba(99,102,241,0.18)',
                  position: 'relative',
                  isolation: 'isolate',
                }}>
                  {avatarPreview
                    ? <img src={avatarPreview} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : user?.avatar
                      ? <img src={user.avatar} alt={user.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : user?.name?.[0] || '?'
                  }
                  {/* Translucent hover overlay */}
                  <div className="avatar-overlay" style={{
                    position: 'absolute', inset: 0, borderRadius: '50%',
                    background: 'rgba(10,10,20,0.82)',
                    display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center',
                    opacity: 0, transition: 'opacity 0.2s',
                  }}>
                    <span style={{ fontSize: 20 }}>📷</span>
                    <span style={{ fontSize: 10, color: '#fff', fontWeight: 600, marginTop: 2, letterSpacing: 0.3 }}>CHANGE</span>
                  </div>
                </div>
                {/* Camera badge */}
                <div style={{
                  position: 'absolute', bottom: 2, right: 2,
                  width: 26, height: 26, borderRadius: '50%',
                  background: 'var(--accent)', color: '#fff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 13, border: '2px solid var(--card)',
                }}>📷</div>
                <input id="avatar-upload" type="file" accept="image/*" style={{ display: 'none' }} onChange={handleAvatarChange} />
              </label>
            </div>
            <div style={{ textAlign: 'center', fontSize: 12, color: 'var(--text-3)', marginBottom: 20, marginTop: -16 }}>Click to change photo (max 3 MB)</div>

            <div className="form-group">
              <label className="form-label">Display Name</label>
              <input
                className="form-input"
                value={form.name}
                maxLength={60}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Your name"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Bio <span style={{ color: 'var(--text-3)', fontWeight: 400 }}>({form.bio.length}/300)</span></label>
              <textarea
                className="form-input"
                value={form.bio}
                maxLength={300}
                rows={3}
                onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
                placeholder="Tell people a bit about yourself…"
                style={{ resize: 'vertical', minHeight: 80 }}
              />
            </div>

            <div className="form-group" style={{ marginBottom: 28 }}>
              <label className="form-label">Location</label>
              <input
                className="form-input"
                value={form.location}
                onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
                placeholder="City, Country"
              />
            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button className="btn-ghost" onClick={() => setEditOpen(false)} style={{ padding: '10px 20px' }}>Cancel</button>
              <button
                className="btn-primary"
                style={{ padding: '10px 24px' }}
                disabled={saving || uploadingAvatar || !form.name.trim()}
                onClick={handleSave}
              >
                {saving || uploadingAvatar ? 'Saving…' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Profile Header ── */}
      <div className="profile-header">
        <div className="profile-avatar" style={user.avatar ? { overflow: 'hidden', background: 'none', padding: 0 } : {}}>
          {user.avatar
            ? <img src={user.avatar} alt={user.name} style={{ display: 'block', width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
            : user.name?.[0] || '?'
          }
        </div>
        <div>
          <div className="profile-name">{user.name}</div>
          {user.location && (
            <div style={{ fontSize: 13, color: 'var(--text-3)', marginBottom: 4 }}>📍 {user.location}</div>
          )}
          <div className="profile-bio">{user.bio || 'No bio yet.'}</div>
          <div className="profile-stats">
            <div className="profile-stat">
              <div className="profile-stat-num">⭐ {avgRating > 0 ? avgRating.toFixed(1) : '—'}</div>
              <div className="profile-stat-label">Rating</div>
            </div>
            <div className="profile-stat">
              <div className="profile-stat-num">{totalReviewCount}</div>
              <div className="profile-stat-label">Reviews</div>
            </div>
            <div className="profile-stat">
              <div className="profile-stat-num">{items.length}</div>
              <div className="profile-stat-label">Listings</div>
            </div>
            <div className="profile-stat">
              <div className="profile-stat-num">{memberYears}</div>
              <div className="profile-stat-label">Member</div>
            </div>
          </div>
        </div>
        <div className="profile-actions">
          {isOwner ? (
            <>
              <button className="btn-primary" onClick={openEdit}>✏️ Edit Profile</button>
              <button className="btn-ghost" onClick={() => navigate('/dashboard')}>🏠 Dashboard</button>
            </>
          ) : (
            <button className="btn-primary" onClick={handleMessage}>💬 Message</button>
          )}
        </div>
      </div>

      {/* ── Profile Grid: Listings + Reviews ── */}
      <div className="profile-grid">
        {/* Compact listings */}
        <div>
          <div className="section-header">
            <div className="section-label">Listed Items ({items.length})</div>
            {isOwner && (
              <button className="btn-ghost" style={{ fontSize: 12, padding: '4px 12px' }} onClick={() => navigate('/list-item')}>
                + Add Listing
              </button>
            )}
          </div>
          {items.length === 0 ? (
            <div style={{ color: 'var(--text-3)', fontSize: 14, padding: '20px 0' }}>No listings yet.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {items.map((item) => (
                <CompactItemRow key={item._id} item={item} onClick={() => navigate(`/items/${item._id}`)} />
              ))}
            </div>
          )}
        </div>

        {/* Reviews */}
        <div>
          <div className="section-header">
            <div className="section-label">Reviews ({user.totalReviews || reviews.length})</div>
          </div>
          {reviews.length === 0 ? (
            <div style={{ color: 'var(--text-3)', fontSize: 14, padding: '20px 0' }}>No reviews yet.</div>
          ) : (
            reviews.map((r) => (
              <div className="review-card" key={r._id}>
                <div className="review-header">
                  <div className="review-user">
                    <div className="review-avatar">{r.reviewer?.name?.[0] || '?'}</div>
                    <div>
                      <div className="review-name">{r.reviewer?.name || 'Anonymous'}</div>
                      <div className="review-date">{new Date(r.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</div>
                    </div>
                  </div>
                  <div className="review-stars">{'⭐'.repeat(r.rating)}</div>
                </div>
                <div className="review-text">{r.comment}</div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

/* ── Compact one-line item row for profile ── */
function CompactItemRow({ item, onClick }) {
  const emoji = getCategoryEmoji(item.category)
  return (
    <div
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer',
        background: 'var(--card)', border: '1px solid var(--border)',
        borderRadius: 12, padding: '10px 14px',
        transition: 'border-color 0.2s, box-shadow 0.2s',
      }}
      onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--border-accent)'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(99,102,241,0.08)' }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.boxShadow = 'none' }}
    >
      {/* Thumbnail */}
      <div style={{
        width: 52, height: 52, borderRadius: 8, flexShrink: 0,
        overflow: 'hidden', background: 'var(--bg-2)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24,
      }}>
        {item.images?.[0]
          ? <img src={item.images[0]} alt={item.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : emoji}
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-1)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {item.title}
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 3, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 11, color: 'var(--text-3)' }}>
            {item.category || 'General'}
          </span>
          {item.location?.city && (
            <span style={{ fontSize: 11, color: 'var(--text-3)' }}>📍 {item.location.city}</span>
          )}
        </div>
      </div>

      {/* Price */}
      <div style={{ flexShrink: 0, textAlign: 'right' }}>
        <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--accent)' }}>${item.pricePerDay}</div>
        <div style={{ fontSize: 11, color: 'var(--text-3)' }}>/day</div>
      </div>
    </div>
  )
}

function getCategoryEmoji(cat) {
  const map = {
    Photography: '📷', Cameras: '📷', Electronics: '🎮', 'Tools & DIY': '🔧', Tools: '🔧',
    Outdoor: '🏕️', Sports: '🚲', Music: '🎸', Instruments: '🎸', Vehicles: '🚗',
    Spaces: '🏠', Other: '📦',
  }
  return map[cat] || '📦'
}
