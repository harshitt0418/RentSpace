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
import {
  MapPin, Star, Heart, MessageCircle, AlertTriangle, FileText, Edit2,
  Camera, Monitor, Wrench, Tent, Music, Car, Building2, Bike, Package, X as XIcon, Image
} from 'lucide-react'

/* Format a date-string into "Mar 10, 2026" */
const fmtDate = (d) => d
  ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  : null

/* Today and tomorrow as YYYY-MM-DD minimums */
const todayStr = () => new Date().toISOString().split('T')[0]
const tomorrowStr = () => { const d = new Date(); d.setDate(d.getDate() + 1); return d.toISOString().split('T')[0] }

const THUMB_FALLBACK_ICON = Image

function getCategoryIcon(cat) {
  const map = { Photography: Camera, Cameras: Camera, Electronics: Monitor, 'Tools & DIY': Wrench, Tools: Wrench,
    Outdoor: Tent, Sports: Bike, Music: Music, Vehicles: Car, 'Home & Garden': Building2, Spaces: Building2 }
  const Icon = map[cat] || Package
  return <Icon size={52} style={{ color: 'var(--text-3)' }} />
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
  const [dateError, setDateError]   = useState('')
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [termsError, setTermsError]  = useState(false)
  const [showTermsModal, setShowTermsModal] = useState(false)

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
  const minRentalDays = item?.minRentalDays || 1
  const days      = startDate && endDate ? Math.max(1, Math.ceil((new Date(endDate) - new Date(startDate)) / 86400000)) : minRentalDays
  const subtotal  = item ? days * item.pricePerDay : 0
  const deposit   = item?.deposit || 100
  const serviceFee = Math.round(subtotal * 0.1)
  const total     = subtotal + deposit + serviceFee

  /* ── Minimum checkout date based on check-in + owner's min rental days ── */
  const minCheckoutStr = (checkIn) => {
    if (!checkIn) return tomorrowStr()
    const d = new Date(checkIn)
    d.setDate(d.getDate() + minRentalDays)
    return d.toISOString().split('T')[0]
  }

  const handleRequest = () => {
    if (!currentUser) { navigate('/login'); return }
    if (!startDate || !endDate) {
      setDateError('Please select both check-in and check-out dates to continue.')
      return
    }
    const daysDiff = Math.ceil((new Date(endDate) - new Date(startDate)) / 86400000)
    if (daysDiff < minRentalDays) {
      setDateError(`This item requires a minimum rental of ${minRentalDays} day${minRentalDays > 1 ? 's' : ''}.`)
      return
    }
    if (!termsAccepted) {
      setTermsError(true)
      return
    }
    if (!item) return
    setDateError('')
    setTermsError(false)
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

  const emoji  = getCategoryIcon(item.category)
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
              <Edit2 size={13} /> Edit Listing
            </button>
          )}
        </div>
        <div className="detail-meta">
          <span><Star size={14} fill="#f59e0b" color="#f59e0b" style={{display:'inline',verticalAlign:'middle',marginRight:3}} /> {(item.rating > 0) ? item.rating.toFixed(1) : 'New'} · {item.totalReviews || reviews.length || 0} {(item.totalReviews || reviews.length || 0) === 1 ? 'review' : 'reviews'}</span>
          <span><MapPin size={14} style={{display:'inline',verticalAlign:'middle',marginRight:3}} /> {item.location?.address || [item.location?.city, item.location?.state].filter(Boolean).join(', ') || item.location || 'Unknown'}</span>
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
                : getCategoryIcon(item.category)
              }
              {/* Wishlist heart */}
              <button
                className={`detail-wish-btn ${isLiked ? 'liked' : ''}`}
                onClick={() => currentUser ? toggleWish(item._id) : navigate('/login')}
              >
                <Heart size={18} fill={isLiked ? 'currentColor' : 'none'} />
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
                    : <THUMB_FALLBACK_ICON size={24} style={{ color: 'var(--text-3)' }} />
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
              <div
                className="owner-card-avatar"
                onClick={() => navigate(`/profile/${item.owner._id}`)}
                style={{ cursor: 'pointer', flexShrink: 0 }}
                title="View profile"
              >
                {item.owner.avatar
                  ? <img src={item.owner.avatar} alt="" style={{ width:'100%', height:'100%', objectFit:'cover', borderRadius:'50%' }} />
                  : item.owner.name?.[0] || '?'
                }
              </div>
              <div
                style={{ flex:1, cursor: 'pointer' }}
                onClick={() => navigate(`/profile/${item.owner._id}`)}
                title="View profile"
              >
                <div className="owner-card-name" style={{ textDecoration: 'underline', textDecorationColor: 'var(--text-3)' }}>{item.owner.name}</div>
                <div className="owner-card-stat"><Star size={13} fill="#f59e0b" color="#f59e0b" style={{display:'inline',verticalAlign:'middle',marginRight:3}} /> {item.owner.rating?.toFixed(1) || '—'} · Member</div>
              </div>
              {currentUser && !isOwner && (
                <button className="btn-ghost" onClick={handleMessage}>Message</button>
              )}
            </div>
          )}

          {/* Action Buttons (below details, left column — hidden on mobile, widget shows first) */}
          {!isOwner && (
            <div className="detail-left-actions" style={{ display:'flex', flexDirection:'column', gap:10, marginTop:32 }}>
              <button className="booking-btn" onClick={handleRequest} disabled={requesting}>
                {requesting ? 'Sending…' : currentUser ? 'Request to Rent' : 'Sign in to Rent'}
              </button>
              {currentUser && (
                <button className="booking-btn-ghost" onClick={handleMessage}><MessageCircle size={16} style={{display:'inline',verticalAlign:'middle',marginRight:6}} /> Message Owner</button>
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
                    <div className="review-stars" style={{ display:'flex', gap:2 }}>
                      {Array.from({ length: Math.min(r.rating, 5) }).map((_, i) => <Star key={i} size={14} fill="#f59e0b" color="#f59e0b" />)}
                    </div>
                  </div>
                  <div className="review-text">{r.comment}</div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* ════ RIGHT — Booking Widget ════ */}
        <div className="detail-right">
          <div className="booking-widget">
            <div className="booking-price">₹{item.pricePerDay} <span>/ day</span></div>
            <div className="booking-rating"><Star size={14} fill="#f59e0b" color="#f59e0b" style={{display:'inline',verticalAlign:'middle',marginRight:3}} /> {(item.rating > 0) ? item.rating.toFixed(1) : 'New'} · {item.totalReviews || reviews.length || 0} {(item.totalReviews || reviews.length || 0) === 1 ? 'review' : 'reviews'}</div>

            {/* Date pickers */}
            <div className="date-grid">
              <div className="date-field">
                <div className="date-field-label">Check-In</div>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value)
                    setDateError('')
                    // if existing endDate is now before the new minimum, clear it
                    if (endDate && endDate < minCheckoutStr(e.target.value)) setEndDate('')
                  }}
                  min={todayStr()}
                  className="date-native"
                  style={dateError && !startDate ? { borderColor: 'var(--danger)' } : {}}
                />
              </div>
              <div className="date-field">
                <div className="date-field-label">
                  Check-Out
                  {minRentalDays > 1 && (
                    <span style={{ fontSize: 9, color: 'var(--accent)', fontWeight: 700, marginLeft: 5, letterSpacing: '0.04em' }}>
                      MIN {minRentalDays}d
                    </span>
                  )}
                </div>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => { setEndDate(e.target.value); setDateError('') }}
                  min={minCheckoutStr(startDate)}
                  className="date-native"
                  style={dateError && !endDate ? { borderColor: 'var(--danger)' } : {}}
                />
              </div>
            </div>
            {minRentalDays > 1 && (
              <div style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{ color: 'var(--accent)', fontSize: 13 }}>&#9432;</span>
                Minimum rental: <strong style={{ color: 'var(--text-2)', marginLeft: 3 }}>{minRentalDays} days</strong>
              </div>
            )}

            {/* Date validation error */}
            {dateError && (
              <div style={{
                color: 'var(--danger)', fontSize: 12, fontWeight: 500,
                padding: '8px 12px', borderRadius: 8, marginBottom: 4,
                background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)',
                display: 'flex', alignItems: 'center', gap: 6,
              }}>
                <AlertTriangle size={14} style={{display:'inline',verticalAlign:'middle',marginRight:4}} /> {dateError}
              </div>
            )}

            {/* Price breakdown */}
            <div className="booking-breakdown">
              <div className="breakdown-row"><span>₹{item.pricePerDay} × {days} days</span><span>₹{subtotal}</span></div>
              <div className="breakdown-row"><span>Refundable deposit</span><span>₹{deposit}</span></div>
              <div className="breakdown-row"><span>Service fee</span><span>₹{serviceFee}</span></div>
              <div className="breakdown-row total"><span>Total</span><span>₹{total}</span></div>
            </div>

            {!isOwner && (
              <>
                {/* Terms & Conditions checkbox */}
                <div style={{
                  border: termsError ? '1px solid var(--danger)' : '1px solid var(--border)',
                  borderRadius: 10, padding: '10px 14px', marginBottom: 10,
                  background: termsError ? 'rgba(239,68,68,0.05)' : 'var(--card)',
                  transition: 'border-color 0.2s',
                }}>
                  <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={termsAccepted}
                      onChange={(e) => { setTermsAccepted(e.target.checked); setTermsError(false) }}
                      style={{ marginTop: 2, accentColor: 'var(--accent)', width: 16, height: 16, flexShrink: 0, cursor: 'pointer' }}
                    />
                    <span style={{ fontSize: 12, color: 'var(--text-2)', lineHeight: 1.5 }}>
                      I agree to the{' '}
                      <span
                        onClick={() => setShowTermsModal(true)}
                        style={{ color: 'var(--accent)', textDecoration: 'underline', cursor: 'pointer', fontWeight: 600 }}
                      >
                        Rental Terms &amp; Conditions
                      </span>
                      . I understand that any damage to the item will result in full or partial deduction from my refundable deposit.
                    </span>
                  </label>
                  {termsError && (
                    <div style={{ fontSize: 11, color: 'var(--danger)', marginTop: 6, marginLeft: 26 }}>
                      <AlertTriangle size={11} style={{display:'inline',verticalAlign:'middle',marginRight:4}} /> You must accept the terms to continue.
                    </div>
                  )}
                </div>

                <button className="booking-btn" onClick={handleRequest} disabled={requesting}>
                  {requesting ? 'Sending…' : currentUser ? 'Request to Rent' : 'Sign in to Rent'}
                </button>
                {currentUser && (
                  <button className="booking-btn-ghost" onClick={handleMessage}><MessageCircle size={16} style={{display:'inline',verticalAlign:'middle',marginRight:6}} /> Message Owner</button>
                )}
              </>
            )}

            {/* Terms & Conditions Modal */}
            {showTermsModal && (
              <div
                onClick={() => setShowTermsModal(false)}
                style={{
                  position: 'fixed', inset: 0, zIndex: 9999,
                  background: 'rgba(0,0,0,0.88)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
                }}
              >
                <div
                  onClick={(e) => e.stopPropagation()}
                  style={{
                    background: '#0f0f1a', borderRadius: 16, padding: '28px 24px',
                    width: '100%', maxWidth: 520, maxHeight: '85vh', overflowY: 'auto',
                    border: '1px solid rgba(99,102,241,0.25)',
                    boxShadow: '0 24px 64px rgba(0,0,0,0.7)',
                    color: 'var(--text-1)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                    <h2 style={{ fontSize: 18, fontWeight: 700 }}><FileText size={18} style={{display:'inline',verticalAlign:'middle',marginRight:6}} /> Rental Terms &amp; Conditions</h2>
                    <button onClick={() => setShowTermsModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-3)', fontSize: 20, cursor: 'pointer' }}><XIcon size={20} /></button>
                  </div>

                  {[
                    {
                      title: '1. Acceptance of Terms',
                      body: 'By submitting a rental request on RentSpace, you acknowledge that you have read, understood, and agree to be bound by these Rental Terms & Conditions. These terms form a legally binding agreement between you (the renter) and the item owner.',
                    },
                    {
                      title: '2. Refundable Security Deposit',
                      body: 'A refundable security deposit is collected at the time of booking. This deposit is held as security against any damage, loss, or breach of these terms. The full deposit will be refunded within 5 business days of the rental end date, provided the item is returned in its original condition.',
                    },
                    {
                      title: '3. Damage & Liability',
                      body: 'The renter is fully responsible for any damage, loss, theft, or destruction of the rented item during the rental period. Any damage — whether accidental or intentional — will result in a full or partial deduction from the security deposit, at the owner’s reasonable assessment. If repair or replacement costs exceed the deposit, the renter agrees to cover the remaining balance.',
                    },
                    {
                      title: '4. Item Care & Usage',
                      body: 'The renter agrees to use the item only for its intended purpose, handle it with reasonable care, not sublet or lend it to third parties, and return it in the same condition it was received (fair wear and tear accepted).',
                    },
                    {
                      title: '5. Rental Period',
                      body: 'The item must be returned by the agreed check-out date. Late returns may incur additional daily charges at the owner’s listed rate and may result in partial forfeiture of the deposit.',
                    },
                    {
                      title: '6. Cancellation Policy',
                      body: 'Cancellations made more than 48 hours before the check-in date may be eligible for a full refund of the rental fee. Cancellations within 48 hours of check-in are non-refundable. The security deposit is always fully refundable if the rental request has not yet been accepted by the owner.',
                    },
                    {
                      title: '7. Dispute Resolution',
                      body: 'In case of a dispute regarding damage or deposit deduction, both parties agree to first attempt resolution through RentSpace’s dispute support channel. RentSpace reserves the right to mediate and make a final determination based on evidence provided by both parties.',
                    },
                    {
                      title: '8. Platform Liability',
                      body: 'RentSpace acts solely as a marketplace platform and is not a party to the rental agreement between owners and renters. RentSpace is not liable for any loss, damage, or disputes arising from rental transactions.',
                    },
                  ].map((section) => (
                    <div key={section.title} style={{ marginBottom: 18 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent)', marginBottom: 6 }}>{section.title}</div>
                      <div style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.65 }}>{section.body}</div>
                    </div>
                  ))}

                  <div style={{ borderTop: '1px solid var(--border)', paddingTop: 16, marginTop: 4, display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                    <button
                      onClick={() => setShowTermsModal(false)}
                      style={{ padding: '10px 18px', borderRadius: 10, border: '1px solid var(--border)', background: 'none', color: 'var(--text-2)', cursor: 'pointer', fontSize: 13 }}
                    >Close</button>
                    <button
                      onClick={() => { setTermsAccepted(true); setTermsError(false); setShowTermsModal(false) }}
                      style={{ padding: '10px 22px', borderRadius: 10, border: 'none', background: 'var(--accent)', color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 700 }}
                    >I Accept</button>
                  </div>
                </div>
              </div>
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
