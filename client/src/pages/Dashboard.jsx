/**
 * Dashboard.jsx — demoui-matched design with tab-based sidebar navigation
 */
import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import useAuthStore from '@/store/authStore'
import { getMe } from '@/api/authApi'
import { useReceivedRequests, useSentRequests, useAcceptRequest, useRejectRequest, useCancelRequest, useCompleteRequest } from '@/hooks/useRequests'
import { useCreateReview, useMyRequestReviews } from '@/hooks/useReviews'
import { useItems, useToggleItemStatus, useDeleteItem } from '@/hooks/useItems'
import { useUserReviews } from '@/hooks/useReviews'
import { useCreateRoom } from '@/hooks/useChat'
import EditItemModal from '@/components/EditItemModal'
import {
  Home, Package, ClipboardList, CheckCircle, MessageCircle, Star, Plus, User, Menu,
  Calendar, MapPin, Edit2, Trash2, DollarSign, Camera, Monitor, Wrench, Tent,
  Music, Car, Building2, Bike, Check, AlertTriangle, PauseCircle, PlayCircle, X as XIcon, FileText, Clock, ArrowDownLeft, ArrowUpRight,
  Layers, AlertCircle, PiggyBank
} from 'lucide-react'

const STATUS_CLASS = {
  pending: 'status-pending',
  accepted: 'status-accepted',
  rejected: 'status-rejected',
  cancelled: 'status-rejected',
  completed: 'status-completed',
}

const TABS = [
  { key: 'overview', icon: Home, label: 'Overview' },
  { key: 'listings', icon: Package, label: 'My Listings' },
  { key: 'requests', icon: ClipboardList, label: 'Requests' },
  { key: 'accepted', icon: CheckCircle, label: 'Accepted Requests' },
  { key: 'history', icon: Clock, label: 'History' },
  { key: 'messages', icon: MessageCircle, label: 'Messages', route: '/chat' },
  { key: 'reviews', icon: Star, label: 'Reviews' },
]

export default function Dashboard() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const user = useAuthStore((s) => s.user)
  const setUser = useAuthStore((s) => s.setUser)

  // Sync fresh user data (avatar, name, etc.) from server on every Dashboard visit
  useEffect(() => {
    getMe().then((res) => { if (res?.user) setUser(res.user) }).catch(() => { })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const validTabs = ['overview', 'listings', 'requests', 'accepted', 'history', 'reviews']
  const tabFromUrl = searchParams.get('tab')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [activeTab, setActiveTab] = useState(validTabs.includes(tabFromUrl) ? tabFromUrl : 'overview')
  const [editingItem, setEditingItem] = useState(null)
  const [reviewTarget, setReviewTarget] = useState(null) // request to review

  const { data: requestsData, isLoading: loadingRequests } = useReceivedRequests({ limit: 20 })
  const { data: sentData, isLoading: loadingSent } = useSentRequests({ limit: 50 })
  const { data: listingsData, isLoading: loadingListings } = useItems({ owner: user?._id, limit: 50 })
  const { data: reviewsData, isLoading: loadingReviews } = useUserReviews(user?._id)
  const { mutate: accept } = useAcceptRequest()
  const { mutate: reject } = useRejectRequest()
  const { mutate: cancelReq } = useCancelRequest()
  const { mutate: createRoom } = useCreateRoom()
  const { mutate: toggleStatus } = useToggleItemStatus()
  const { mutate: deleteItem } = useDeleteItem()
  const { mutate: completeRequest } = useCompleteRequest()
  const { mutate: submitReview, isPending: submittingReview } = useCreateReview()

  const requests = requestsData?.data || []
  const sentRequests = sentData?.data || []

  // Accepted tab: only 'accepted' status (not yet completed)
  const acceptedRequests = [
    ...requests.filter((r) => r.status === 'accepted'),
    ...sentRequests.filter((r) => r.status === 'accepted'),
  ]
  // History tab: completed requests
  const completedReceived = requests.filter((r) => r.status === 'completed')
  const completedSent = sentRequests.filter((r) => r.status === 'completed')

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
      <button className="mobile-sidebar-btn icon-btn mobile-fab" onClick={() => setSidebarOpen((v) => !v)}>
        <Menu size={20} />
      </button>
      {sidebarOpen && <div className="mobile-overlay" onClick={() => setSidebarOpen(false)} style={{ zIndex: 899 }} />}

      {/* Sidebar */}
      <aside className={`dash-sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div
          className="dash-user"
          onClick={() => navigate(`/profile/${user?._id}`)}
          style={{ cursor: 'pointer', borderRadius: 10, transition: 'background 0.15s' }}
          onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
          onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
          title="View your profile"
        >
          <div className="dash-user-avatar" style={{ overflow: 'hidden', position: 'relative' }}>
            {user?.avatar
              ? <img src={user.avatar} alt={user.name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
              : user?.name?.[0] || '?'
            }
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="dash-user-name" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.name || 'User'}</div>
            <div className="dash-user-role" style={{ color: 'var(--accent)', fontSize: 11 }}>View Profile →</div>
          </div>
        </div>
        <div className="divider" style={{ marginBottom: 12 }} />

        {TABS.map((tab) => (
          <div key={tab.key}
            className={`dash-nav-item ${activeTab === tab.key && !tab.route ? 'active' : ''}`}
            onClick={() => handleTabClick(tab)}>
            <div className="dash-nav-icon" style={{ position: 'relative' }}>
              <tab.icon size={16} />
              {tab.key === 'requests' && pendingCount > 0 && (
                <span style={{
                  position: 'absolute', top: -4, right: -4,
                  width: 8, height: 8, borderRadius: '50%',
                  background: 'var(--danger, #ef4444)',
                  border: '1.5px solid var(--sidebar-bg, #111)',
                  display: 'block',
                }} />
              )}
            </div>{tab.label}
          </div>
        ))}

        <div className="divider" style={{ margin: '12px 0' }} />
        <div className="dash-nav-item" onClick={() => { setSidebarOpen(false); navigate('/list-item') }}>
          <div className="dash-nav-icon"><Plus size={16} /></div>List New Item
        </div>
        <div className="dash-nav-item" onClick={() => { setSidebarOpen(false); navigate(`/profile/${user?._id}`) }}>
          <div className="dash-nav-icon"><User size={16} /></div>Profile
        </div>
      </aside>

      {/* Main */}
      <main className="dash-main">
        {activeTab === 'overview' && (
          <OverviewTab
            user={user} listings={listings} pendingCount={pendingCount}
            loadingListings={loadingListings} navigate={navigate}
            onViewAll={() => setActiveTab('listings')}
          />
        )}
        {activeTab === 'listings' && (
          <ListingsTab listings={listings} loading={loadingListings} navigate={navigate} onEdit={setEditingItem} toggleStatus={toggleStatus} deleteItem={deleteItem} />
        )}
        {activeTab === 'requests' && (
          <RequestsTab
            requests={requests}
            sentRequests={sentRequests}
            loading={loadingRequests || loadingSent}
            accept={accept} reject={reject} cancelReq={cancelReq} navigate={navigate} createRoom={createRoom}
          />
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
        {activeTab === 'history' && (
          <HistoryTab
            completedReceived={completedReceived}
            completedSent={completedSent}
            loading={loadingRequests || loadingSent}
            navigate={navigate}
            user={user}
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
function OverviewTab({ user, listings, pendingCount, loadingListings, navigate, onViewAll }) {
  return (
    <>
      <div className="dash-welcome">Good morning, {user?.name?.split(' ')[0] || 'there'}! 👋</div>
      <div className="dash-sub">Here's what's happening with your rentals today.</div>

      {/* Stats */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon"><Layers size={22} /></div>
          <div className="stat-value">{listings.length}</div>
          <div className="stat-label">Active Listings</div>
          <div className="stat-change">↑ +1 this week</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon"><AlertCircle size={22} /></div>
          <div className="stat-value">{pendingCount}</div>
          <div className="stat-label">Pending Requests</div>
          <div className="stat-change" style={{ color: 'var(--warning)' }}>
            {pendingCount > 0 ? `${pendingCount} need your response` : 'All clear!'}
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon"><PiggyBank size={22} /></div>
          <div className="stat-value">₹{user?.totalEarnings || 0}</div>
          <div className="stat-label">Total Earnings</div>
          <div className="stat-change">↑ this month</div>
        </div>
      </div>

      {/* My Listings — brief summary */}
      <div className="section-header" style={{ marginTop: 8 }}>
        <div className="section-label">My Listings</div>
        <button className="btn-primary" style={{ padding: '8px 18px', fontSize: 13 }} onClick={() => navigate('/list-item')}>+ List New</button>
      </div>

      {loadingListings ? (
        <div style={{ color: 'var(--text-3)', fontSize: 14, padding: '24px 0' }}>Loading listings…</div>
      ) : listings.length === 0 ? (
        <div style={{ color: 'var(--text-3)', fontSize: 14, padding: '24px 0' }}>No listings yet.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {listings.slice(0, 5).map((item) => (
            <BriefListingRow key={item._id} item={item} onClick={() => navigate(`/items/${item._id}`)} />
          ))}
          {listings.length > 5 && (
            <div style={{ textAlign: 'center', paddingTop: 4 }}>
              <span
                style={{ fontSize: 13, color: 'var(--accent)', cursor: 'pointer' }}
                onClick={() => onViewAll()}
              >
                +{listings.length - 5} more — view all
              </span>
            </div>
          )}
        </div>
      )}
    </>
  )
}

/* ── Listings Tab ─────────────────────────────────────────────────────── */
function ListingsTab({ listings, loading, navigate, onEdit, toggleStatus, deleteItem }) {
  return (
    <>
      <div className="dash-welcome">My Listings <Package size={20} style={{ display: 'inline', verticalAlign: 'middle' }} /></div>
      <div className="dash-sub">All your listed items in one place.</div>

      <div className="section-header" style={{ marginTop: 16 }}>
        <div className="section-label">{listings.length} Items</div>
        <button className="btn-primary" style={{ padding: '8px 18px', fontSize: 13 }} onClick={() => navigate('/list-item')}>+ List New Item</button>
      </div>

      {loading ? (
        <div style={{ color: 'var(--text-3)', fontSize: 14, padding: '24px 0' }}>Loading listings…</div>
      ) : listings.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}><Package size={48} style={{ color: 'var(--text-3)' }} /></div>
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

/* ── Role Toggle (reusable) ──────────────────────────────────────────── */
function RoleToggle({ value, onChange, labelA, labelB, labelC, iconA, iconB, iconC }) {
  const opts = [
    { val: 'a', label: labelA, icon: iconA },
    { val: 'b', label: labelB, icon: iconB },
    ...(labelC ? [{ val: 'c', label: labelC, icon: iconC }] : []),
  ]
  return (
    <div style={{
      display: 'inline-flex', borderRadius: 10, overflow: 'hidden',
      border: '1px solid var(--border)', marginBottom: 20, flexShrink: 0,
      flexWrap: 'wrap',
    }}>
      {opts.map(({ val, label, icon }) => (
        <button
          key={val}
          onClick={() => onChange(val)}
          style={{
            padding: '7px 16px', fontSize: 12, fontWeight: 600, border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 6, transition: 'all 0.15s',
            background: value === val ? 'var(--accent)' : 'transparent',
            color: value === val ? '#fff' : 'var(--text-3)',
          }}
        >
          {icon}{label}
        </button>
      ))}
    </div>
  )
}

/* ── Requests Tab ─────────────────────────────────────────────────────── */
function RequestsTab({ requests, sentRequests, loading, accept, reject, cancelReq, navigate, createRoom }) {
  const [view, setView] = useState('received')
  const list = view === 'received' ? requests : sentRequests
  const isEmpty = list.length === 0

  return (
    <>
      <div className="dash-welcome">Requests <ClipboardList size={20} style={{ display: 'inline', verticalAlign: 'middle' }} /></div>
      <div className="dash-sub" style={{ marginBottom: 16 }}>View incoming and outgoing rental requests.</div>

      <RoleToggle
        value={view === 'received' ? 'a' : 'b'}
        onChange={(v) => setView(v === 'a' ? 'received' : 'sent')}
        labelA="Received"
        labelB="Sent by Me"
        iconA={<ArrowDownLeft size={13} />}
        iconB={<ArrowUpRight size={13} />}
      />

      {loading ? (
        <div style={{ color: 'var(--text-3)', fontSize: 14, padding: '24px 0' }}>Loading requests…</div>
      ) : isEmpty ? (
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <ClipboardList size={48} style={{ color: 'var(--text-3)', display: 'block', margin: '0 auto 12px' }} />
          <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>
            {view === 'received' ? 'No incoming requests yet' : 'No sent requests yet'}
          </div>
          <div style={{ color: 'var(--text-3)', fontSize: 14 }}>
            {view === 'received' ? "When someone requests your items, they'll appear here." : 'Browse items and send a rental request.'}
          </div>
        </div>
      ) : (
        list.map((req) => (
          <RequestRow
            key={req._id} req={req}
            accept={view === 'received' ? accept : undefined}
            reject={view === 'received' ? reject : undefined}
            cancelReq={view === 'sent' ? cancelReq : undefined}
            navigate={navigate} createRoom={createRoom}
            isSent={view === 'sent'}
          />
        ))
      )}
    </>
  )
}
/* ── Shared Accepted / History Card ─────────────────────────────────── */
function AcceptedCard({ req, user, navigate, completeRequest, onReview, isHistory = false }) {
  const start = req.startDate ? new Date(req.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : ''
  const end = req.endDate ? new Date(req.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : ''
  const isOwner = (req.owner?._id || req.owner) === user?._id
  const otherPerson = isOwner ? req.requester?.name : req.owner?.name
  const otherPersonId = isOwner ? (req.requester?._id || req.requester) : (req.owner?._id || req.owner)
  const isCompleted = req.status === 'completed'
  return (
    <div className="request-card">
      {/* ── Top row: thumbnail + details + price ── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 14 }}>
        <div
          onClick={() => navigate(`/items/${req.item?._id || req.item}`)}
          style={{
            width: 64, height: 64, borderRadius: 10, flexShrink: 0,
            overflow: 'hidden', background: 'var(--bg-2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', border: '1px solid var(--border)',
          }}
        >
          {req.item?.images?.[0]
            ? <img src={req.item.images[0]} alt={req.item.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : getCategoryIcon(req.item?.category)
          }
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="request-item-name" style={{ cursor: 'pointer' }}
            onClick={() => navigate(`/items/${req.item?._id || req.item}`)}>
            {req.item?.title || 'Item'}
          </div>
          {req.item?.category && (
            <div style={{
              display: 'inline-block', fontSize: 11, fontWeight: 600,
              padding: '2px 8px', borderRadius: 20, marginBottom: 4,
              background: 'var(--accent-subtle, rgba(99,102,241,0.15))',
              color: 'var(--accent, #818cf8)',
            }}>
              {req.item.category}
            </div>
          )}
          <div style={{ display: 'flex', gap: 6, marginBottom: 4 }}>
            <span style={{
              display: 'inline-block', fontSize: 10, fontWeight: 700,
              padding: '2px 8px', borderRadius: 20,
              background: isOwner ? 'rgba(34,197,94,0.15)' : 'rgba(99,102,241,0.15)',
              color: isOwner ? '#4ade80' : 'var(--accent)',
              letterSpacing: '0.03em',
            }}>
              {isOwner ? '🏠 You are Owner' : '🛍️ You are Renting'}
            </span>
          </div>
          <div className="request-dates">
            <Calendar size={12} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 3 }} />
            {start}{start && end ? ` – ${end}` : ''}
          </div>
          <div className="request-renter">
            <User size={12} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 3 }} />{' '}
            <span style={{ color: 'var(--text-3)', fontSize: 11, marginRight: 4 }}>
              {isOwner ? 'Rented to' : 'Rented from'}
            </span>
            <span
              onClick={() => otherPersonId && navigate(`/profile/${otherPersonId}`)}
              style={{ cursor: otherPersonId ? 'pointer' : 'default', fontWeight: 600, textDecoration: otherPersonId ? 'underline' : 'none', textDecorationColor: 'var(--text-3)' }}
              title="View profile"
            >
              {otherPerson || 'User'}
            </span>
          </div>
        </div>

        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div className="request-price">₹{req.totalCost || '—'}</div>
          <div className="request-price-label">total</div>
        </div>
      </div>

      {/* ── Footer row: status + actions ── */}
      <div className="request-footer">
        <div className={`status-badge ${isCompleted ? 'status-completed' : 'status-accepted'}`}>
          {isCompleted ? 'Completed' : 'Active'}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {!isHistory && !isCompleted && isOwner && (
            <button
              className="btn-accept"
              onClick={(e) => { e.stopPropagation(); completeRequest(req._id) }}
            >
              <Check size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 3 }} /> Mark Done
            </button>
          )}
          {isCompleted && (
            <button
              className="btn-review"
              onClick={(e) => { e.stopPropagation(); onReview(req) }}
            >
              <Star size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 3 }} /> Review
            </button>
          )}
          {!isHistory && (
            <button
              className="btn-chat"
              onClick={(e) => { e.stopPropagation(); navigate('/chat') }}
            >
              <MessageCircle size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 3 }} /> Chat
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

/* ── Accepted & Completed Requests Tab ───────────────────────────────── */
function AcceptedRequestsTab({ requests, loading, navigate, user, completeRequest, onReview }) {
  const [view, setView] = useState('all')
  const filtered =
    view === 'owner' ? requests.filter((r) => (r.owner?._id || r.owner) === user?._id)
      : view === 'renter' ? requests.filter((r) => (r.requester?._id || r.requester) === user?._id)
        : requests

  return (
    <>
      <div className="dash-welcome">Accepted Requests <CheckCircle size={20} style={{ display: 'inline', verticalAlign: 'middle' }} /></div>
      <div className="dash-sub" style={{ marginBottom: 16 }}>Active rentals — mark complete when the rental ends.</div>

      <RoleToggle
        value={view === 'all' ? 'a' : view === 'owner' ? 'b' : 'c'}
        onChange={(v) => setView(v === 'a' ? 'all' : v === 'b' ? 'owner' : 'renter')}
        labelA="All"
        labelB="Items I Rented Out"
        labelC="Items I'm Renting"
        iconB={<ArrowUpRight size={13} />}
        iconC={<ArrowDownLeft size={13} />}
      />

      {loading ? (
        <div style={{ color: 'var(--text-3)', fontSize: 14, padding: '24px 0' }}>Loading requests…</div>
      ) : filtered.length === 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '60px 0' }}>
          <CheckCircle size={48} style={{ color: 'var(--text-3)', marginBottom: 12 }} />
          <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>No accepted requests</div>
          <div style={{ color: 'var(--text-3)', fontSize: 14 }}>
            {view === 'owner' ? "You haven't rented out any items yet." : view === 'renter' ? "You haven't rented anything yet." : 'When a request is accepted, it will appear here.'}
          </div>
        </div>
      ) : (
        filtered.map((req) => (
          <AcceptedCard
            key={req._id}
            req={req}
            user={user}
            navigate={navigate}
            completeRequest={completeRequest}
            onReview={onReview}
          />
        ))
      )}
    </>
  )
}
/* ── Reviews Tab ──────────────────────────────────────────────────────── */
function ReviewsTab({ reviews, loading }) {
  return (
    <>
      <div className="dash-welcome">Reviews <Star size={20} style={{ display: 'inline', verticalAlign: 'middle' }} /></div>
      <div className="dash-sub">See what people are saying about you.</div>

      {loading ? (
        <div style={{ color: 'var(--text-3)', fontSize: 14, padding: '24px 0' }}>Loading reviews…</div>
      ) : reviews.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}><Star size={48} style={{ color: 'var(--text-3)' }} /></div>
          <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>No reviews yet</div>
          <div style={{ color: 'var(--text-3)', fontSize: 14 }}>Reviews from your renters will appear here.</div>
        </div>
      ) : (
        reviews.map((r) => (
          <div className="review-card" key={r._id}>
            <div className="review-header">
              <div className="review-user">
                <div className="review-avatar" style={{ overflow: 'hidden' }}>
                  {r.reviewer?.avatar
                    ? <img src={r.reviewer.avatar} alt={r.reviewer.name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                    : r.reviewer?.name?.[0] || '?'
                  }
                </div>
                <div>
                  <div className="review-name">{r.reviewer?.name || 'Anonymous'}</div>
                  <div className="review-date">{new Date(r.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</div>
                </div>
              </div>
              <div className="review-stars" style={{ display: 'flex', gap: 2 }}>
                {Array.from({ length: Math.min(r.rating || 0, 5) }).map((_, i) => (
                  <Star key={i} size={14} fill="#f59e0b" color="#f59e0b" />
                ))}
              </div>
            </div>
            <div className="review-text">{r.comment}</div>
          </div>
        ))
      )}
    </>
  )
}

/* ── History Tab ──────────────────────────────────────────────────────── */
function HistoryTab({ completedReceived, completedSent, loading, navigate, user, onReview }) {
  const [view, setView] = useState('all')
  const list =
    view === 'owner' ? completedReceived
      : view === 'renter' ? completedSent
        : [...completedReceived, ...completedSent]
  const sorted = [...list].sort((a, b) =>
    new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt)
  )
  return (
    <>
      <div className="dash-welcome">History <Clock size={20} style={{ display: 'inline', verticalAlign: 'middle' }} /></div>
      <div className="dash-sub" style={{ marginBottom: 16 }}>Your completed rentals.</div>

      <RoleToggle
        value={view === 'all' ? 'a' : view === 'owner' ? 'b' : 'c'}
        onChange={(v) => setView(v === 'a' ? 'all' : v === 'b' ? 'owner' : 'renter')}
        labelA="All History"
        labelB="Items I Rented Out"
        labelC="Items I Rented"
        iconB={<ArrowUpRight size={13} />}
        iconC={<ArrowDownLeft size={13} />}
      />

      {loading ? (
        <div style={{ color: 'var(--text-3)', fontSize: 14, padding: '24px 0' }}>Loading history…</div>
      ) : sorted.length === 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '60px 0' }}>
          <Clock size={48} style={{ color: 'var(--text-3)', marginBottom: 12 }} />
          <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>No history yet</div>
          <div style={{ color: 'var(--text-3)', fontSize: 14 }}>
            {view === 'owner' ? "You haven't completed any rentals as an owner." : view === 'renter' ? "You haven't rented anything yet." : 'Completed rentals will appear here.'}
          </div>
        </div>
      ) : (
        sorted.map((req) => (
          <AcceptedCard
            key={req._id}
            req={req}
            user={user}
            navigate={navigate}
            onReview={onReview}
            isHistory
          />
        ))
      )}
    </>
  )
}

/* ── Brief Listing Row (Overview only) ────────────────────────────────── */
function BriefListingRow({ item, onClick }) {
  const isPaused = item.status === 'paused'
  return (
    <div
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '10px 14px', borderRadius: 12,
        background: 'var(--card-bg, rgba(255,255,255,0.04))',
        border: '1px solid var(--border)',
        cursor: 'pointer', transition: 'background 0.15s',
        opacity: isPaused ? 0.65 : 1,
      }}
    >
      <div style={{
        width: 48, height: 48, borderRadius: 8, flexShrink: 0,
        overflow: 'hidden', background: 'var(--bg-2)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {item.images?.[0]
          ? <img src={item.images[0]} alt={item.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : getCategoryIcon(item.category)
        }
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 600, fontSize: 14, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {item.title}
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2 }}>
          <MapPin size={11} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 3 }} />
          {item.location?.city || item.location || 'Unknown'}
        </div>
      </div>
      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        <div style={{ fontWeight: 700, fontSize: 14 }}>
          ₹{item.pricePerDay}<span style={{ fontWeight: 400, fontSize: 11, color: 'var(--text-3)' }}>/day</span>
        </div>
        <div className={`status-badge ${isPaused ? 'status-pending' : 'status-accepted'}`} style={{ marginTop: 4, display: 'inline-block' }}>
          {isPaused ? 'paused' : 'active'}
        </div>
      </div>
    </div>
  )
}

/* ── Shared Components ────────────────────────────────────────────────── */
function RequestRow({ req, accept, reject, cancelReq, navigate, createRoom, isSent = false }) {
  const isPending = req.status === 'pending'
  const isActive = ['pending', 'accepted'].includes(req.status)
  const start = req.startDate ? new Date(req.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : ''
  const end = req.endDate ? new Date(req.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : ''

  // 48-hour cancellation guard for sent requests
  const hoursUntilCheckin = req.startDate
    ? (new Date(req.startDate).getTime() - Date.now()) / (1000 * 60 * 60)
    : Infinity
  const canCancel = isSent && isActive && hoursUntilCheckin >= 48
  const cancelBlocked = isSent && isActive && hoursUntilCheckin < 48

  const requesterId = req.requester?._id || req.requester
  const ownerId = req.owner?._id || req.owner
  const chatPartnerId = isSent ? ownerId : requesterId

  const handleChat = () => {
    if (!chatPartnerId) return
    createRoom({ participantId: chatPartnerId }, {
      onSuccess: (res) => navigate?.(`/chat/${res.room._id}`),
    })
  }

  const handleProfile = () => {
    const profileId = isSent ? ownerId : requesterId
    if (!profileId) return
    navigate?.(`/profile/${profileId}`)
  }

  return (
    <div className="request-card">
      {/* ── Top row: thumbnail + details + price ── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 14 }}>

        {/* Item thumbnail */}
        <div
          onClick={() => req.item?._id && navigate?.(`/items/${req.item._id}`)}
          style={{
            width: 64, height: 64, borderRadius: 10, flexShrink: 0,
            overflow: 'hidden', background: 'var(--bg-2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: req.item?._id ? 'pointer' : 'default',
            border: '1px solid var(--border)',
          }}
        >
          {req.item?.images?.[0]
            ? <img src={req.item.images[0]} alt={req.item.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : getCategoryIcon(req.item?.category)
          }
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Item name — clickable */}
          <div
            className="request-item-name"
            onClick={() => req.item?._id && navigate?.(`/items/${req.item._id}`)}
            style={{ cursor: req.item?._id ? 'pointer' : 'default' }}
            title="View item"
          >
            {req.item?.title || 'Unknown Item'}
          </div>
          {/* Category badge */}
          {req.item?.category && (
            <div style={{
              display: 'inline-block', fontSize: 11, fontWeight: 600,
              padding: '2px 8px', borderRadius: 20, marginBottom: 4,
              background: 'var(--accent-subtle, rgba(99,102,241,0.15))',
              color: 'var(--accent, #818cf8)',
            }}>
              {req.item.category}
            </div>
          )}
          <div className="request-dates"><Calendar size={12} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 3 }} /> {start}{start && end ? ` – ${end}` : ''}</div>
          <div className="request-renter">
            <User size={12} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 3 }} />{' '}
            <span style={{ color: 'var(--text-3)', fontSize: 11, marginRight: 4 }}>
              {isSent ? 'Owner' : 'Requested by'}
            </span>
            <span
              onClick={handleProfile}
              style={{ cursor: 'pointer', textDecoration: 'underline', textDecorationColor: 'var(--text-3)', fontWeight: 600 }}
              title="View profile"
            >
              {isSent ? (req.owner?.name || 'Owner') : (req.requester?.name || 'Someone')}
            </span>
          </div>
        </div>

        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div className="request-price">₹{req.totalCost || '—'}</div>
          <div className="request-price-label">total</div>
        </div>
      </div>

      {/* ── Footer row: status + actions ── */}
      <div className="request-footer">
        <div className={`status-badge ${STATUS_CLASS[req.status] || 'status-pending'}`}>{req.status}</div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {/* Received requests: Accept / Reject */}
          {!isSent && isPending && (
            <>
              <button className="btn-accept" onClick={() => accept(req._id)}><Check size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 3 }} /> Accept</button>
              <button className="btn-reject" onClick={() => reject({ id: req._id })}><XIcon size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 3 }} /> Reject</button>
            </>
          )}
          {/* Sent requests: Cancel (48hr guard) */}
          {isSent && isActive && (
            <button
              className="btn-reject"
              disabled={cancelBlocked}
              title={cancelBlocked ? 'Cannot cancel within 48 hours of check-in' : 'Cancel this request'}
              style={{ opacity: cancelBlocked ? 0.45 : 1, cursor: cancelBlocked ? 'not-allowed' : 'pointer' }}
              onClick={() => canCancel && cancelReq(req._id)}
            >
              <XIcon size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 3 }} />
              {cancelBlocked ? 'Too late to cancel' : 'Cancel Request'}
            </button>
          )}
          <button className="btn-chat" onClick={handleChat}><MessageCircle size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 3 }} /> Chat</button>
        </div>
      </div>
    </div>
  )
}

function ItemCard({ item, onClick, onEdit, toggleStatus, onDelete }) {
  const [confirmDelete, setConfirmDelete] = useState(false)
  const isPaused = item.status === 'paused'
  return (
    <div className="item-card" onClick={onClick} style={{ opacity: isPaused ? 0.7 : 1, position: 'relative' }}>
      <div className="item-img">
        {item.images?.[0]
          ? <img src={item.images[0]} alt={item.title} style={{ width: '100%', height: '100%', objectFit: 'cover', filter: isPaused ? 'grayscale(0.5)' : 'none' }} />
          : getCategoryIcon(item.category)
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
              {isPaused ? <><PlayCircle size={14} /> Resume</> : <><PauseCircle size={14} /> Pause</>}
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
              <Edit2 size={14} /> Edit
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
              <Trash2 size={14} />
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
                <Trash2 size={14} /> Delete
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
          <div className="item-location"><MapPin size={12} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 3 }} /> {item.location?.city || item.location || 'Unknown'}</div>
          <div className="item-rating"><Star size={12} fill="#f59e0b" color="#f59e0b" style={{ display: 'inline', verticalAlign: 'middle', marginRight: 3 }} /> {(item.rating || 0) > 0 ? item.rating.toFixed(1) : 'New'}</div>
        </div>
        <div className="item-footer">
          <div className="item-price">₹{item.pricePerDay} <span>/ day</span></div>
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

function getCategoryIcon(cat) {
  const map = {
    Photography: Camera, Cameras: Camera, Electronics: Monitor,
    'Tools & DIY': Wrench, Tools: Wrench, Outdoor: Tent, Sports: Bike,
    Music: Music, Instruments: Music, Vehicles: Car, Spaces: Building2,
    'Home & Garden': Building2, Science: Monitor, Events: Star, Bikes: Bike
  }
  const Icon = map[cat] || Package
  return <Icon size={52} style={{ color: 'var(--text-3)' }} />
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
            fontSize: 26, lineHeight: 1, padding: 2, border: 'none', background: 'none', cursor: 'pointer',
            color: star <= (hovered || rating) ? '#f59e0b' : 'var(--text-3)',
            transform: star <= (hovered || rating) ? 'scale(1.15)' : 'scale(1)',
            transition: 'all 0.15s ease',
          }}
        >
          <Star size={26} fill={star <= (hovered || rating) ? '#f59e0b' : 'none'} />
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
        }}><XIcon size={20} /></button>

        <h3 style={{ margin: '0 0 4px', fontSize: 20, color: 'var(--text)' }}>Leave a Review</h3>
        <p style={{ margin: '0 0 20px', fontSize: 13, color: 'var(--text-3)' }}>
          {request.item?.title || 'Rental'} — {otherUserName}
        </p>

        {allDone && (
          <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--text-2)' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}><CheckCircle size={40} style={{ color: 'var(--success)' }} /></div>
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
              <Package size={18} style={{ color: 'var(--accent)', flexShrink: 0 }} />
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
              <Package size={18} style={{ color: 'var(--text-3)', flexShrink: 0 }} />
              <span style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-2)' }}>
                Item review submitted <Check size={12} style={{ display: 'inline', verticalAlign: 'middle' }} /> ({existing.item.rating} <Star size={12} fill="#f59e0b" color="#f59e0b" style={{ display: 'inline', verticalAlign: 'middle' }} />)
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
              <User size={18} style={{ color: 'var(--accent)', flexShrink: 0 }} />
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
              <User size={18} style={{ color: 'var(--text-3)', flexShrink: 0 }} />
              <span style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-2)' }}>
                {isOwner ? 'Renter' : 'Owner'} review submitted <Check size={12} style={{ display: 'inline', verticalAlign: 'middle' }} /> ({existing.user.rating} <Star size={12} fill="#f59e0b" color="#f59e0b" style={{ display: 'inline', verticalAlign: 'middle' }} />)
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
