/**
 * ItemDetailPage.jsx
 */
import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useItem } from '@/hooks/useItems'
import { useItemReviews } from '@/hooks/useReviews'
import { useSendRequest } from '@/hooks/useRequests'
import { useCreateRoom } from '@/hooks/useChat'
import { useWishlistIds, useToggleWishlist } from '@/hooks/useWishlist'
import useAuthStore from '@/store/authStore'
import EditItemModal from '@/components/EditItemModal'

/* Format a date-string into "Mar 10, 2026" */
const fmtDate = (d) => d
  ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  : null

/* Today and tomorrow as YYYY-MM-DD minimums */
const todayStr = () => new Date().toISOString().split('T')[0]
const tomorrowStr = () => { const d = new Date(); d.setDate(d.getDate() + 1); return d.toISOString().split('T')[0] }

const THUMB_FALLBACK = ['📷', '🎞️', '🔭', '📦']

function getCategoryEmoji(cat) {
  const map = { Photography: '📷', Cameras: '📷', Electronics: '🎮', 'Tools & DIY': '🔧', Tools: '🔧',
    Outdoor: '🏕️', Sports: '🚴', Music: '🎸', Vehicles: '🚗', 'Home & Garden': '🏠', Spaces: '🏠' }
  return map[cat] || '📦'
}

export default function ItemDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const currentUser  = useAuthStore((s) => s.user)
  const accessToken   = useAuthStore((s) => s.accessToken)

  const [activeThumb, setActiveThumb] = useState(0)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate]     = useState('')
  const [showEditModal, setShowEditModal] = useState(false)

  const { data: itemData, isLoading } = useItem(id)
  const { data: reviewsData }         = useItemReviews(id)
  const { mutate: sendRequest, isPending: requesting } = useSendRequest()
  const { mutate: createRoom }        = useCreateRoom()
  const { data: wlData }              = useWishlistIds()
  const { mutate: toggleWish }        = useToggleWishlist()

  const item    = itemData?.data
  const reviews = reviewsData?.data || []
  const isLiked = (wlData?.ids || []).includes(item?._id)
  const isOwner = currentUser && item?.owner && currentUser._id === item.owner._id

  /* ── Price math ── */
  const days      = startDate && endDate ? Math.max(1, Math.ceil((new Date(endDate) - new Date(startDate)) / 86400000)) : 3
  const subtotal  = item ? days * item.pricePerDay : 0
  const deposit   = item?.deposit || 100
  const serviceFee = Math.round(subtotal * 0.1)
  const total     = subtotal + deposit + serviceFee

  const handleRequest = () => {
    if (!currentUser) { navigate('/login'); return }
    if (!startDate || !endDate || !item) return
    sendRequest({ itemId: item._id, startDate, endDate, message: '' }, {
      onSuccess: () => navigate('/dashboard'),
    })
  }

  const handleMessage = () => {
    if (!currentUser || !accessToken) { navigate('/login'); return }
    if (!item?.owner?._id) return
    createRoom({ participantId: item.owner._id }, {
      onSuccess: (res) => navigate(`/chat/${res.room._id}`),
    })
  }

  /* ── Loading / Not found ── */
  if (isLoading) return (
    <div className="detail-layout" style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'60vh' }}>
      <div style={{ color:'var(--text-2)', fontSize:16 }}>Loading item…</div>
    </div>
  )
  if (!item) return (
    <div className="detail-layout" style={{ textAlign:'center', paddingTop:120 }}>
      <div style={{ fontSize:48, marginBottom:12 }}>😕</div>
      <div style={{ fontSize:18, fontWeight:600, marginBottom:8 }}>Item not found</div>
      <button className="btn-primary" onClick={() => navigate('/browse')}>Back to Browse</button>
    </div>
  )

  const emoji  = getCategoryEmoji(item.category)
  const images = item.images?.length > 0 ? item.images : []

  return (
    <div className="detail-layout">

      {/* ── Breadcrumb ── */}
      <div className="detail-breadcrumb" style={{ paddingTop:24, paddingBottom:4 }}>
        <span onClick={() => navigate('/browse')}>Browse</span>
        {' › '}{item.category || 'General'}
        {' › '}{item.title}
      </div>

      {/* ── Title + meta ── */}
      <div className="detail-header" style={{ paddingTop:12, paddingBottom:20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <h1 className="detail-title" style={{ margin: 0 }}>{item.title}</h1>
          {isOwner && (
            <button
              className="btn-primary"
              onClick={() => setShowEditModal(true)}
              style={{ padding: '6px 16px', fontSize: 13, display: 'inline-flex', alignItems: 'center', gap: 4 }}
            >
              ✏️ Edit Listing
            </button>
          )}
        </div>
        <div className="detail-meta">
          <span>⭐ {item.averageRating?.toFixed(1) || '4.9'} · {item.totalReviews || reviews.length || 0} reviews</span>
          <span>📍 {item.location?.address || [item.location?.city, item.location?.state].filter(Boolean).join(', ') || item.location || 'Unknown'}</span>
          <span className="tag">{item.category || 'General'}</span>
        </div>
      </div>

      {/* ── Two-column grid ── */}
      <div className="detail-grid">

        {/* ════ LEFT ════ */}
        <div>
          {/* Gallery */}
          <div className="detail-gallery">
            <div className="gallery-main">
              {images[activeThumb]
                ? <img src={images[activeThumb]} alt={item.title} style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                : <span style={{ fontSize:80 }}>{emoji}</span>
              }
              {/* Wishlist heart */}
              <button
                className={`detail-wish-btn ${isLiked ? 'liked' : ''}`}
                onClick={() => currentUser ? toggleWish(item._id) : navigate('/login')}
              >
                {isLiked ? '❤️' : '🤍'}
              </button>
            </div>

            {/* Thumbnails */}
            <div className="gallery-thumbs">
              {(images.length > 0 ? images : [null, null, null, null]).slice(0, 4).map((img, i) => (
                <div
                  key={i}
                  className={`gallery-thumb ${activeThumb === i ? 'active' : ''}`}
                  onClick={() => setActiveThumb(i)}
                >
                  {img
                    ? <img src={img} alt="" style={{ width:'100%', height:'100%', objectFit:'cover', borderRadius:8 }} />
                    : <span style={{ fontSize:24 }}>{THUMB_FALLBACK[i]}</span>
                  }
                </div>
              ))}
            </div>
          </div>

          {/* Description */}
          <div className="detail-desc">
            <div className="detail-desc-title">About this item</div>
            <div className="detail-desc-text">{item.description || 'No description provided.'}</div>
            {item.tags?.length > 0 && (
              <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginTop:16 }}>
                {item.tags.map((t) => <span className="tag" key={t}>{t}</span>)}
              </div>
            )}
          </div>

          {/* Owner card */}
          {item.owner && (
            <div className="owner-card">
              <div className="owner-card-avatar">
                {item.owner.avatar
                  ? <img src={item.owner.avatar} alt="" style={{ width:'100%', height:'100%', objectFit:'cover', borderRadius:'50%' }} />
                  : item.owner.name?.[0] || '?'
                }
              </div>
              <div style={{ flex:1 }}>
                <div className="owner-card-name">{item.owner.name}</div>
                <div className="owner-card-stat">⭐ {item.owner.rating?.toFixed(1) || '—'} · Member</div>
              </div>
              {currentUser && !isOwner && (
                <button className="btn-ghost" onClick={handleMessage}>Message</button>
              )}
            </div>
          )}

          {/* Action Buttons (below details, left column) */}
          {!isOwner && (
            <div style={{ display:'flex', flexDirection:'column', gap:10, marginTop:32 }}>
              <button className="booking-btn" onClick={handleRequest} disabled={requesting}>
                {requesting ? 'Sending…' : currentUser ? 'Request to Rent' : 'Sign in to Rent'}
              </button>
              {currentUser && (
                <button className="booking-btn-ghost" onClick={handleMessage}>💬 Message Owner</button>
              )}
            </div>
          )}

          {/* Reviews */}
          <div className="reviews-section">
            <div className="section-header">
              <div className="section-label">Reviews ({item.totalReviews || reviews.length})</div>
            </div>
            {reviews.length === 0 ? (
              <div style={{ color:'var(--text-3)', fontSize:14, padding:'20px 0' }}>No reviews yet.</div>
            ) : (
              reviews.map((r) => (
                <div className="review-card" key={r._id}>
                  <div className="review-header">
                    <div className="review-user">
                      <div className="review-avatar">{r.reviewer?.name?.[0] || '?'}</div>
                      <div>
                        <div className="review-name">{r.reviewer?.name || 'Anonymous'}</div>
                        <div className="review-date">{new Date(r.createdAt).toLocaleDateString('en-US', { month:'short', year:'numeric' })}</div>
                      </div>
                    </div>
                    <div className="review-stars">{'⭐'.repeat(Math.min(r.rating, 5))}</div>
                  </div>
                  <div className="review-text">{r.comment}</div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* ════ RIGHT — Booking Widget ════ */}
        <div>
          <div className="booking-widget">
            <div className="booking-price">${item.pricePerDay} <span>/ day</span></div>
            <div className="booking-rating">⭐ {item.averageRating?.toFixed(1) || 'New'} · {item.totalReviews || reviews.length} reviews</div>

            {/* Date pickers */}
            <div className="date-grid">
              <div className="date-field">
                <div className="date-field-label">Check-In</div>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  min={todayStr()}
                  className="date-native"
                />
              </div>
              <div className="date-field">
                <div className="date-field-label">Check-Out</div>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  min={startDate || tomorrowStr()}
                  className="date-native"
                />
              </div>
            </div>

            {/* Price breakdown */}
            <div className="booking-breakdown">
              <div className="breakdown-row"><span>${item.pricePerDay} × {days} days</span><span>${subtotal}</span></div>
              <div className="breakdown-row"><span>Refundable deposit</span><span>${deposit}</span></div>
              <div className="breakdown-row"><span>Service fee</span><span>${serviceFee}</span></div>
              <div className="breakdown-row total"><span>Total</span><span>${total}</span></div>
            </div>

            {!isOwner && (
              <>
                <button className="booking-btn" onClick={handleRequest} disabled={requesting}>
                  {requesting ? 'Sending…' : currentUser ? 'Request to Rent' : 'Sign in to Rent'}
                </button>
                {currentUser && (
                  <button className="booking-btn-ghost" onClick={handleMessage}>💬 Message Owner</button>
                )}
              </>
            )}

            <div style={{ textAlign:'center', fontSize:12, color:'var(--text-3)', marginTop:12 }}>
              You won't be charged until the owner accepts
            </div>
          </div>
        </div>

      </div>

      {/* Edit listing modal (owner only) */}
      {showEditModal && (
        <EditItemModal
          item={item}
          onClose={() => setShowEditModal(false)}
        />
      )}
    </div>
  )
}
