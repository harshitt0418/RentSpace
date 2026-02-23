/**
 * Dashboard.jsx — demoui-matched design with tab-based sidebar navigation
 */
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import useAuthStore from '@/store/authStore'
import { useReceivedRequests, useSentRequests, useAcceptRequest, useRejectRequest, useCompleteRequest } from '@/hooks/useRequests'
import { useCreateReview, useMyRequestReviews } from '@/hooks/useReviews'
import { useItems, useToggleItemStatus, useDeleteItem } from '@/hooks/useItems'
import { useUserReviews } from '@/hooks/useReviews'
import { useCreateRoom } from '@/hooks/useChat'
import EditItemModal from '@/components/EditItemModal'

const STATUS_CLASS = {
  pending: 'status-pending',
  accepted: 'status-accepted',
  rejected: 'status-rejected',
  cancelled: 'status-rejected',
  completed: 'status-completed',
}

const TABS = [
  { key: 'overview', icon: '🏠', label: 'Overview' },
  { key: 'listings', icon: '📦', label: 'My Listings' },
  { key: 'requests', icon: '📋', label: 'Requests' },
  { key: 'accepted', icon: '✅', label: 'Accepted Requests' },
  { key: 'messages', icon: '💬', label: 'Messages', route: '/chat' },
  { key: 'reviews', icon: '⭐', label: 'Reviews' },
]

export default function Dashboard() {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')
  const [editingItem, setEditingItem] = useState(null)
  const [reviewTarget, setReviewTarget] = useState(null) // request to review

  const { data: requestsData, isLoading: loadingRequests } = useReceivedRequests({ limit: 20 })
  const { data: sentData, isLoading: loadingSent } = useSentRequests({ limit: 50 })
  const { data: listingsData, isLoading: loadingListings } = useItems({ owner: user?._id, limit: 50 })
  const { data: reviewsData, isLoading: loadingReviews } = useUserReviews(user?._id)
  const { mutate: accept } = useAcceptRequest()
  const { mutate: reject } = useRejectRequest()
  const { mutate: createRoom } = useCreateRoom()
  const { mutate: toggleStatus } = useToggleItemStatus()
  const { mutate: deleteItem } = useDeleteItem()
  const { mutate: completeRequest } = useCompleteRequest()
  const { mutate: submitReview, isPending: submittingReview } = useCreateReview()

  const requests = requestsData?.data || []
  const sentRequests = sentData?.data || []
  const acceptedRequests = [
    ...requests.filter((r) => ['accepted', 'completed'].includes(r.status)),
    ...sentRequests.filter((r) => ['accepted', 'completed'].includes(r.status)),
  ]
  const listings = listingsData?.data || []
  const reviews = reviewsData?.data || []

  const pendingCount = requests.filter((r) => r.status === 'pending').length

  const handleTabClick = (tab) => {
    setSidebarOpen(false)
    if (tab.route) {
      navigate(tab.route)
    } else {
      setActiveTab(tab.key)
    }
  }

  return (
    <div className="dashboard-layout">
      {/* Mobile sidebar toggle */}
      <button className="mobile-sidebar-btn icon-btn" onClick={() => setSidebarOpen((v) => !v)}
        style={{ position: 'fixed', top: 78, left: 12, zIndex: 800 }}>
        ☰
      </button>
      {sidebarOpen && <div className="mobile-overlay" onClick={() => setSidebarOpen(false)} style={{ zIndex: 899 }} />}

      {/* Sidebar */}
      <aside className={`dash-sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="dash-user">
          <div className="dash-user-avatar" style={{ overflow: 'hidden' }}>
            {user?.avatar
              ? <img src={user.avatar} alt={user.name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
              : user?.name?.[0] || '?'
            }
          </div>
          <div>
            <div className="dash-user-name">{user?.name || 'User'}</div>
            <div className="dash-user-role">Owner & Renter</div>
          </div>
        </div>
        <div className="divider" style={{ marginBottom: 12 }} />

        {TABS.map((tab) => (
          <div key={tab.key}
            className={`dash-nav-item ${activeTab === tab.key && !tab.route ? 'active' : ''}`}
            onClick={() => handleTabClick(tab)}>
            <div className="dash-nav-icon">{tab.icon}</div>{tab.label}
          </div>
        ))}

        <div className="divider" style={{ margin: '12px 0' }} />
        <div className="dash-nav-item" onClick={() => { setSidebarOpen(false); navigate('/list-item') }}>
          <div className="dash-nav-icon">➕</div>List New Item
        </div>
        <div className="dash-nav-item" onClick={() => { setSidebarOpen(false); navigate(`/profile/${user?._id}`) }}>
          <div className="dash-nav-icon">👤</div>Profile
        </div>
      </aside>

      {/* Main */}
      <main className="dash-main">
        {activeTab === 'overview' && (
          <OverviewTab
            user={user} listings={listings} requests={requests} pendingCount={pendingCount}
            loadingRequests={loadingRequests} loadingListings={loadingListings}
            accept={accept} reject={reject} navigate={navigate} onEdit={setEditingItem}
            createRoom={createRoom} toggleStatus={toggleStatus} deleteItem={deleteItem}
          />
        )}
        {activeTab === 'listings' && (
          <ListingsTab listings={listings} loading={loadingListings} navigate={navigate} onEdit={setEditingItem} toggleStatus={toggleStatus} deleteItem={deleteItem} />
        )}
        {activeTab === 'requests' && (
          <RequestsTab requests={requests} loading={loadingRequests} accept={accept} reject={reject} navigate={navigate} createRoom={createRoom} />
        )}
        {activeTab === 'accepted' && (
          <AcceptedRequestsTab
            requests={acceptedRequests}
            loading={loadingRequests || loadingSent}
            navigate={navigate}
            user={user}
            completeRequest={completeRequest}
            onReview={setReviewTarget}
          />
        )}
        {activeTab === 'reviews' && (
          <ReviewsTab reviews={reviews} loading={loadingReviews} />
        )}
      </main>

      {/* Edit listing modal */}
      {editingItem && (
        <EditItemModal
          item={editingItem}
          onClose={() => setEditingItem(null)}
        />
      )}

      {/* Review modal */}
      {reviewTarget && (
        <ReviewModal
          request={reviewTarget}
          user={user}
          onSubmit={submitReview}
          submitting={submittingReview}
          onClose={() => setReviewTarget(null)}
        />
      )}
    </div>
  )
}

/* ── Overview Tab ─────────────────────────────────────────────────────── */
function OverviewTab({ user, listings, requests, pendingCount, loadingRequests, loadingListings, accept, reject, navigate, onEdit, createRoom, toggleStatus, deleteItem }) {
  return (
    <>
      <div className="dash-welcome">Good morning, {user?.name?.split(' ')[0] || 'there'}! 👋</div>
      <div className="dash-sub">Here's what's happening with your rentals today.</div>

      {/* Stats */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">📦</div>
          <div className="stat-value">{listings.length}</div>
          <div className="stat-label">Active Listings</div>
          <div className="stat-change">↑ +1 this week</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">📋</div>
          <div className="stat-value">{pendingCount}</div>
          <div className="stat-label">Pending Requests</div>
          <div className="stat-change" style={{ color: 'var(--warning)' }}>
            {pendingCount > 0 ? `${pendingCount} need your response` : 'All clear!'}
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">💰</div>
          <div className="stat-value">${user?.totalEarnings || 0}</div>
          <div className="stat-label">Total Earnings</div>
          <div className="stat-change">↑ this month</div>
        </div>
      </div>

      {/* Incoming Requests */}
      <div className="section-header">
        <div className="section-label">Incoming Requests</div>
        <div className="see-all">See all</div>
      </div>

      {loadingRequests ? (
        <div style={{ color: 'var(--text-3)', fontSize: 14, padding: '24px 0' }}>Loading requests…</div>
      ) : requests.length === 0 ? (
        <div style={{ color: 'var(--text-3)', fontSize: 14, padding: '24px 0' }}>No requests yet.</div>
      ) : (
        requests.slice(0, 5).map((req) => (
          <RequestRow key={req._id} req={req} accept={accept} reject={reject} navigate={navigate} createRoom={createRoom} />
        ))
      )}

      {/* My Active Listings */}
      <div className="section-header" style={{ marginTop: 28 }}>
        <div className="section-label">My Active Listings</div>
        <button className="btn-primary" style={{ padding: '8px 18px', fontSize: 13 }} onClick={() => navigate('/list-item')}>+ List New Item</button>
      </div>

      {loadingListings ? (
        <div style={{ color: 'var(--text-3)', fontSize: 14, padding: '24px 0' }}>Loading listings…</div>
      ) : listings.length === 0 ? (
        <div style={{ color: 'var(--text-3)', fontSize: 14, padding: '24px 0' }}>No listings yet.</div>
      ) : (
        <div className="items-grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
          {listings.slice(0, 4).map((item) => (
            <ItemCard key={item._id} item={item} onClick={() => navigate(`/items/${item._id}`)} onEdit={() => onEdit(item)} toggleStatus={toggleStatus} onDelete={deleteItem} />
          ))}
        </div>
      )}
    </>
  )
}

/* ── Listings Tab ─────────────────────────────────────────────────────── */
function ListingsTab({ listings, loading, navigate, onEdit, toggleStatus, deleteItem }) {
  return (
    <>
      <div className="dash-welcome">My Listings 📦</div>
      <div className="dash-sub">All your listed items in one place.</div>

      <div className="section-header" style={{ marginTop: 16 }}>
        <div className="section-label">{listings.length} Items</div>
        <button className="btn-primary" style={{ padding: '8px 18px', fontSize: 13 }} onClick={() => navigate('/list-item')}>+ List New Item</button>
      </div>

      {loading ? (
        <div style={{ color: 'var(--text-3)', fontSize: 14, padding: '24px 0' }}>Loading listings…</div>
      ) : listings.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>📦</div>
          <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>No listings yet</div>
          <div style={{ color: 'var(--text-3)', fontSize: 14, marginBottom: 20 }}>Start sharing your stuff with the community!</div>
          <button className="btn-primary" onClick={() => navigate('/list-item')}>List Your First Item</button>
        </div>
      ) : (
        <div className="items-grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
          {listings.map((item) => (
            <ItemCard key={item._id} item={item} onClick={() => navigate(`/items/${item._id}`)} onEdit={() => onEdit(item)} toggleStatus={toggleStatus} onDelete={deleteItem} />
          ))}
        </div>
      )}
    </>
  )
}

/* ── Requests Tab ─────────────────────────────────────────────────────── */
function RequestsTab({ requests, loading, accept, reject, navigate, createRoom }) {
  return (
    <>
      <div className="dash-welcome">Requests 📋</div>
      <div className="dash-sub">Manage incoming rental requests.</div>

      {loading ? (
        <div style={{ color: 'var(--text-3)', fontSize: 14, padding: '24px 0' }}>Loading requests…</div>
      ) : requests.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>📋</div>
          <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>No requests yet</div>
          <div style={{ color: 'var(--text-3)', fontSize: 14 }}>When someone requests your items, they'll appear here.</div>
        </div>
      ) : (
        requests.map((req) => (
          <RequestRow key={req._id} req={req} accept={accept} reject={reject} navigate={navigate} createRoom={createRoom} />
        ))
      )}
    </>
  )
}
/* ── Accepted & Completed Requests Tab ───────────────────────────────── */
function AcceptedRequestsTab({ requests, loading, navigate, user, completeRequest, onReview }) {
  return (
    <>
      <div className="dash-welcome">Accepted Requests ✅</div>
      <div className="dash-sub">Active and completed rentals — mark complete when done, then leave a review.</div>

      {loading ? (
        <div style={{ color: 'var(--text-3)', fontSize: 14, padding: '24px 0' }}>Loading requests…</div>
      ) : requests.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
          <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>No accepted requests yet</div>
          <div style={{ color: 'var(--text-3)', fontSize: 14 }}>When a request is accepted, it will appear here.</div>
        </div>
      ) : (
        requests.map((req) => {
          const emoji = getCategoryEmoji(req.item?.category)
          const start = req.startDate ? new Date(req.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : ''
          const end = req.endDate ? new Date(req.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : ''
          const otherUser = req.requester?.name || req.owner?.name || 'User'
          const isOwner = (req.owner?._id || req.owner) === user?._id
          const isCompleted = req.status === 'completed'
          return (
            <div className="request-card" key={req._id} style={{ cursor: 'pointer' }}
              onClick={() => navigate(`/items/${req.item?._id || req.item}`)}>
              <div className="request-item-icon">{emoji}</div>
              <div className="request-info">
                <div className="request-item-name">{req.item?.title || 'Item'}</div>
                <div className="request-dates">📅 {start} – {end}</div>
                <div className="request-renter">👤 {otherUser}</div>
              </div>
              <div className="request-right">
                <div className="request-price">${req.totalCost || '—'}</div>
                <div className={`status-badge ${isCompleted ? 'status-completed' : 'status-accepted'}`}>
                  {isCompleted ? 'Completed' : 'Accepted'}
                </div>
                <div style={{ display: 'flex', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
                  {!isCompleted && isOwner && (
                    <button
                      className="btn-accept"
                      style={{ padding: '6px 14px', fontSize: 12 }}
                      onClick={(e) => { e.stopPropagation(); completeRequest(req._id) }}
                    >
                      ✅ Mark Complete
                    </button>
                  )}
                  {isCompleted && (
                    <button
                      className="btn-primary"
                      style={{ padding: '6px 14px', fontSize: 12 }}
                      onClick={(e) => { e.stopPropagation(); onReview(req) }}
                    >
                      ⭐ Leave Review
                    </button>
                  )}
                  <button className="btn-primary" style={{ padding: '6px 14px', fontSize: 12, background: 'var(--surface-2)' }}
                    onClick={(e) => { e.stopPropagation(); navigate('/chat') }}>
                    💬 Chat
                  </button>
                </div>
              </div>
            </div>
          )
        })
      )}
    </>
  )
}
/* ── Reviews Tab ──────────────────────────────────────────────────────── */
function ReviewsTab({ reviews, loading }) {
  return (
    <>
      <div className="dash-welcome">Reviews ⭐</div>
      <div className="dash-sub">See what people are saying about you.</div>

      {loading ? (
        <div style={{ color: 'var(--text-3)', fontSize: 14, padding: '24px 0' }}>Loading reviews…</div>
      ) : reviews.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>⭐</div>
          <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>No reviews yet</div>
          <div style={{ color: 'var(--text-3)', fontSize: 14 }}>Reviews from your renters will appear here.</div>
        </div>
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
    </>
  )
}

/* ── Shared Components ────────────────────────────────────────────────── */
function RequestRow({ req, accept, reject, navigate, createRoom }) {
  const isPending = req.status === 'pending'
  const emoji = getCategoryEmoji(req.item?.category)
  const start = req.startDate ? new Date(req.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : ''
  const end = req.endDate ? new Date(req.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : ''

  const requesterId = req.requester?._id || req.requester

  const handleChat = () => {
    if (!requesterId) return
    createRoom({ participantId: requesterId }, {
      onSuccess: (res) => navigate?.(`/chat/${res.room._id}`),
    })
  }

  const handleProfile = () => {
    if (!requesterId) return
    navigate?.(`/profile/${requesterId}`)
  }

  return (
    <div className="request-card">
      <div className="request-item-icon">{emoji}</div>
      <div className="request-info">
        <div className="request-item-name">{req.item?.title || 'Item'}</div>
        <div className="request-dates">📅 {start} – {end}</div>
        <div className="request-renter" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          👤{' '}
          <span
            onClick={handleProfile}
            style={{ cursor: 'pointer', textDecoration: 'underline', textDecorationColor: 'var(--text-3)' }}
            title="View profile"
          >
            {req.requester?.name || 'Someone'}
          </span>
        </div>
      </div>
      <div className="request-right">
        <div className={`status-badge ${STATUS_CLASS[req.status] || 'status-pending'}`} style={{ alignSelf: 'flex-end' }}>{req.status}</div>
        <div className="request-price">${req.totalCost || '—'}</div>
        {isPending && (
          <div className="action-row">
            <button className="btn-accept" onClick={() => accept(req._id)}>Accept</button>
            <button className="btn-reject" onClick={() => reject({ id: req._id })}>Reject</button>
          </div>
        )}
        <div className="action-row" style={{ marginTop: 6 }}>
          <button className="btn-primary" onClick={handleChat}
            style={{ padding: '5px 12px', fontSize: 12 }}>💬 Chat</button>
        </div>
      </div>
    </div>
  )
}

function ItemCard({ item, onClick, onEdit, toggleStatus, onDelete }) {
  const [confirmDelete, setConfirmDelete] = useState(false)
  const emoji = getCategoryEmoji(item.category)
  const isPaused = item.status === 'paused'
  return (
    <div className="item-card" onClick={onClick} style={{ opacity: isPaused ? 0.7 : 1, position: 'relative' }}>
      <div className="item-img">
        {item.images?.[0]
          ? <img src={item.images[0]} alt={item.title} style={{ width: '100%', height: '100%', objectFit: 'cover', filter: isPaused ? 'grayscale(0.5)' : 'none' }} />
          : <span style={{ fontSize: 52 }}>{emoji}</span>
        }
        <div className="item-img-overlay" />
        <div className="item-badge">{item.category || 'General'}</div>
        {isPaused && (
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.35)', display: 'flex', alignItems: 'center',
            justifyContent: 'center', zIndex: 1, borderRadius: 'inherit',
            flexDirection: 'column', gap: 4,
          }}>
            <span style={{
              background: 'rgba(255,180,0,0.9)', color: '#000', fontWeight: 700,
              fontSize: 12, padding: '4px 14px', borderRadius: 20, letterSpacing: 0.5,
            }}>⏸ PAUSED</span>
            {item.pausedUntil && (
              <span style={{
                background: 'rgba(0,0,0,0.7)', color: '#fff', fontSize: 10, fontWeight: 600,
                padding: '3px 10px', borderRadius: 12,
              }}>Until {new Date(item.pausedUntil).toLocaleDateString()}</span>
            )}
          </div>
        )}
        <div style={{ position: 'absolute', top: 8, right: 8, zIndex: 2, display: 'flex', gap: 4 }}>
          {toggleStatus && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                toggleStatus({ id: item._id, status: isPaused ? 'active' : 'paused' })
              }}
              style={{
                background: isPaused ? 'rgba(0,180,80,0.85)' : 'rgba(255,180,0,0.85)',
                border: 'none', borderRadius: 8,
                color: isPaused ? '#fff' : '#000', fontSize: 13, padding: '5px 10px', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 4,
                backdropFilter: 'blur(4px)', fontWeight: 600,
              }}
              title={isPaused ? 'Resume listing' : 'Pause listing'}
            >
              {isPaused ? '▶ Resume' : '⏸ Pause'}
            </button>
          )}
          {onEdit && (
            <button
              onClick={(e) => { e.stopPropagation(); onEdit() }}
              style={{
                background: 'rgba(0,0,0,0.65)', border: 'none', borderRadius: 8,
                color: '#fff', fontSize: 13, padding: '5px 10px', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 4,
                backdropFilter: 'blur(4px)',
              }}
              title="Edit listing"
            >
              ✏️ Edit
            </button>
          )}
          {onDelete && (
            <button
              onClick={(e) => { e.stopPropagation(); setConfirmDelete(true) }}
              style={{
                background: 'rgba(220,38,38,0.85)', border: 'none', borderRadius: 8,
                color: '#fff', fontSize: 13, padding: '5px 10px', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 4,
                backdropFilter: 'blur(4px)', fontWeight: 600,
              }}
              title="Delete listing"
            >
              🗑️
            </button>
          )}
        </div>
        {/* Delete confirmation overlay */}
        {confirmDelete && (
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              position: 'absolute', inset: 0, zIndex: 10,
              background: 'rgba(0,0,0,0.8)', borderRadius: 'inherit',
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              justifyContent: 'center', gap: 10, padding: 20,
            }}
          >
            <div style={{ color: '#fff', fontSize: 14, fontWeight: 600, textAlign: 'center' }}>
              Delete this listing?
            </div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', textAlign: 'center' }}>
              This action cannot be undone.
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() => { onDelete(item._id); setConfirmDelete(false) }}
                style={{
                  background: '#dc2626', border: 'none', borderRadius: 8,
                  color: '#fff', fontSize: 13, padding: '7px 18px', cursor: 'pointer',
                  fontWeight: 700,
                }}
              >
                🗑️ Delete
              </button>
              <button
                onClick={() => setConfirmDelete(false)}
                style={{
                  background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: 8,
                  color: '#fff', fontSize: 13, padding: '7px 18px', cursor: 'pointer',
                  fontWeight: 600,
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
      <div className="item-body">
        <div className="item-title">{item.title}</div>
        <div className="item-meta">
          <div className="item-location">📍 {item.location?.city || item.location || 'Unknown'}</div>
          <div className="item-rating">⭐ {(item.rating || 0) > 0 ? item.rating.toFixed(1) : 'New'}</div>
        </div>
        <div className="item-footer">
          <div className="item-price">${item.pricePerDay} <span>/ day</span></div>
          {item.owner && typeof item.owner === 'object' && (
            <div className="item-owner">
              {item.owner.avatar ? (
                <img
                  src={item.owner.avatar}
                  alt={item.owner.name}
                  style={{
                    width: 26, height: 26, borderRadius: '50%',
                    objectFit: 'cover', display: 'block', flexShrink: 0,
                  }}
                />
              ) : (
                <div className="owner-avatar">
                  {item.owner.name?.[0] || '?'}
                </div>
              )}
              <div className="owner-name">{item.owner.name?.split(' ')[0] || 'Owner'}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function getCategoryEmoji(cat) {
  const map = { Photography: '📷', Electronics: '🎮', 'Tools & DIY': '🔧', Outdoor: '🏕️', Sports: '🚲', Music: '🎸', Vehicles: '🚗', 'Home & Garden': '🏠', Science: '🔭', Events: '🎪' }
  return map[cat] || '📦'
}

/* ── Review Modal ─────────────────────────────────────────────────────── */
function ReviewModal({ request, user, onSubmit, submitting, onClose }) {
  const isOwner = (request.owner?._id || request.owner) === user?._id

  const otherUserId = isOwner
    ? (request.requester?._id || request.requester)
    : (request.owner?._id || request.owner)
  const otherUserName = isOwner
    ? (request.requester?.name || 'Renter')
    : (request.owner?.name || 'Owner')
  const itemId = request.item?._id || request.item

  // Fetch existing reviews for this request
  const { data: existingData } = useMyRequestReviews(request._id)
  const existing = existingData?.data || { item: null, user: null }

  // Item review state (only for renter)
  const canReviewItem = !isOwner && !existing.item
  const [itemRating, setItemRating] = useState(0)
  const [itemHovered, setItemHovered] = useState(0)
  const [itemComment, setItemComment] = useState('')

  // User review state (both sides)
  const canReviewUser = !existing.user
  const [userRating, setUserRating] = useState(0)
  const [userHovered, setUserHovered] = useState(0)
  const [userComment, setUserComment] = useState('')

  const [submittingLocal, setSubmittingLocal] = useState(false)

  const allDone = !canReviewItem && !canReviewUser
  const hasItemInput = canReviewItem && itemRating > 0
  const hasUserInput = canReviewUser && userRating > 0
  const canSubmit = hasItemInput || hasUserInput

  const handleSubmit = async () => {
    if (!canSubmit) return
    setSubmittingLocal(true)

    const promises = []
    if (hasItemInput) {
      promises.push(
        new Promise((resolve, reject) =>
          onSubmit(
            { requestId: request._id, rating: itemRating, comment: itemComment.trim() || 'Great item!', type: 'item', revieweeId: otherUserId, itemId },
            { onSuccess: resolve, onError: reject }
          )
        )
      )
    }
    if (hasUserInput) {
      promises.push(
        new Promise((resolve, reject) =>
          onSubmit(
            { requestId: request._id, rating: userRating, comment: userComment.trim() || 'Great experience!', type: 'user', revieweeId: otherUserId, itemId },
            { onSuccess: resolve, onError: reject }
          )
        )
      )
    }

    try {
      await Promise.all(promises)
      onClose()
    } catch {
      // toast handles errors
    } finally {
      setSubmittingLocal(false)
    }
  }

  const StarRow = ({ rating, hovered, setHovered, setRating: setR }) => (
    <div style={{ display: 'flex', gap: 6 }}>
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          onMouseEnter={() => setHovered(star)}
          onMouseLeave={() => setHovered(0)}
          onClick={() => setR(star)}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            fontSize: 26, lineHeight: 1, padding: 2,
            filter: star <= (hovered || rating) ? 'none' : 'grayscale(1) opacity(0.35)',
            transform: star <= (hovered || rating) ? 'scale(1.15)' : 'scale(1)',
            transition: 'all 0.15s ease',
          }}
        >
          ⭐
        </button>
      ))}
      {rating > 0 && (
        <span style={{ fontSize: 12, color: 'var(--text-3)', marginLeft: 8, alignSelf: 'center' }}>
          {['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'][rating]}
        </span>
      )}
    </div>
  )

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(0,0,0,0.92)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 20,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#0f0f1a', borderRadius: 16, padding: 32, width: '100%',
          maxWidth: 500, position: 'relative', border: '1px solid var(--border)',
          maxHeight: '90vh', overflowY: 'auto',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={onClose} style={{
          position: 'absolute', top: 12, right: 12, background: 'none', border: 'none',
          color: 'var(--text-3)', fontSize: 20, cursor: 'pointer', lineHeight: 1,
        }}>✕</button>

        <h3 style={{ margin: '0 0 4px', fontSize: 20, color: 'var(--text)' }}>Leave a Review</h3>
        <p style={{ margin: '0 0 20px', fontSize: 13, color: 'var(--text-3)' }}>
          {request.item?.title || 'Rental'} — {otherUserName}
        </p>

        {allDone && (
          <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--text-2)' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>✅</div>
            <div style={{ fontSize: 16, fontWeight: 600 }}>All reviews submitted!</div>
            <div style={{ fontSize: 13, color: 'var(--text-3)', marginTop: 4 }}>You've already reviewed everything for this rental.</div>
          </div>
        )}

        {/* ── Item Review Section (renter only) ── */}
        {canReviewItem && (
          <div style={{
            background: 'var(--surface-2)', borderRadius: 12, padding: 18, marginBottom: 16,
            border: '1px solid var(--border)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <span style={{ fontSize: 18 }}>📦</span>
              <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)' }}>
                Rate the Item
              </span>
              <span style={{ fontSize: 12, color: 'var(--text-3)', marginLeft: 'auto' }}>
                {request.item?.title || 'Item'}
              </span>
            </div>
            <StarRow rating={itemRating} hovered={itemHovered} setHovered={setItemHovered} setRating={setItemRating} />
            <textarea
              value={itemComment}
              onChange={(e) => setItemComment(e.target.value)}
              placeholder="How was the item?"
              maxLength={1000}
              rows={2}
              style={{
                width: '100%', background: 'var(--bg)', border: '1px solid var(--border)',
                borderRadius: 10, padding: '8px 12px', color: 'var(--text)', fontSize: 13,
                resize: 'vertical', outline: 'none', fontFamily: 'inherit', marginTop: 10,
              }}
            />
          </div>
        )}
        {!isOwner && existing.item && (
          <div style={{
            background: 'var(--surface-2)', borderRadius: 12, padding: 14, marginBottom: 16,
            border: '1px solid var(--border)', opacity: 0.6,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 18 }}>📦</span>
              <span style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-2)' }}>
                Item review submitted ✓ ({existing.item.rating}⭐)
              </span>
            </div>
          </div>
        )}

        {/* ── User Review Section (both sides) ── */}
        {canReviewUser && (
          <div style={{
            background: 'var(--surface-2)', borderRadius: 12, padding: 18, marginBottom: 16,
            border: '1px solid var(--border)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <span style={{ fontSize: 18 }}>👤</span>
              <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)' }}>
                Rate the {isOwner ? 'Renter' : 'Owner'}
              </span>
              <span style={{ fontSize: 12, color: 'var(--text-3)', marginLeft: 'auto' }}>
                {otherUserName}
              </span>
            </div>
            <StarRow rating={userRating} hovered={userHovered} setHovered={setUserHovered} setRating={setUserRating} />
            <textarea
              value={userComment}
              onChange={(e) => setUserComment(e.target.value)}
              placeholder={`How was your experience with ${otherUserName}?`}
              maxLength={1000}
              rows={2}
              style={{
                width: '100%', background: 'var(--bg)', border: '1px solid var(--border)',
                borderRadius: 10, padding: '8px 12px', color: 'var(--text)', fontSize: 13,
                resize: 'vertical', outline: 'none', fontFamily: 'inherit', marginTop: 10,
              }}
            />
          </div>
        )}
        {existing.user && (
          <div style={{
            background: 'var(--surface-2)', borderRadius: 12, padding: 14, marginBottom: 16,
            border: '1px solid var(--border)', opacity: 0.6,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 18 }}>👤</span>
              <span style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-2)' }}>
                {isOwner ? 'Renter' : 'Owner'} review submitted ✓ ({existing.user.rating}⭐)
              </span>
            </div>
          </div>
        )}

        {/* Submit */}
        {!allDone && (
          <button
            className="btn-primary"
            onClick={handleSubmit}
            disabled={!canSubmit || submittingLocal}
            style={{
              width: '100%', padding: '12px 0', fontSize: 15, fontWeight: 700,
              opacity: !canSubmit ? 0.5 : 1, borderRadius: 10,
            }}
          >
            {submittingLocal ? 'Submitting…' : 'Submit Review(s)'}
          </button>
        )}
      </div>
    </div>
  )
}
