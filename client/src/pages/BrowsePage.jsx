/**
 * BrowsePage.jsx — demoui-matched design with working filters
 */
import { useState, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useItems } from '@/hooks/useItems'
import { useWishlistIds, useToggleWishlist } from '@/hooks/useWishlist'
import useAuthStore from '@/store/authStore'

const CATEGORIES = [
  { label: 'All Categories', value: '', emoji: '' },
  { label: 'Cameras', value: 'Cameras', emoji: '📷' },
  { label: 'Tools', value: 'Tools', emoji: '🔧' },
  { label: 'Sports', value: 'Sports', emoji: '🏕️' },
  { label: 'Electronics', value: 'Electronics', emoji: '🎮' },
  { label: 'Vehicles', value: 'Vehicles', emoji: '🚗' },
  { label: 'Bikes', value: 'Bikes', emoji: '🚲' },
  { label: 'Instruments', value: 'Instruments', emoji: '🎸' },
  { label: 'Spaces', value: 'Spaces', emoji: '🏠' },
  { label: 'Other', value: 'Other', emoji: '📦' },
]

const RATING_OPTIONS = [
  { label: 'Any rating', value: 0 },
  { label: '4.5 & above', value: 4.5 },
  { label: '4.0 & above', value: 4.0 },
  { label: '3.0 & above', value: 3.0 },
]

const SORT_OPTIONS = [
  { label: 'Sort: Relevance', value: '' },
  { label: 'Price: Low to High', value: 'price_asc' },
  { label: 'Price: High to Low', value: 'price_desc' },
  { label: 'Rating: High to Low', value: 'rating' },
  { label: 'Newest First', value: 'newest' },
]

export default function BrowsePage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const user = useAuthStore((s) => s.user)
  const [filterOpen, setFilterOpen] = useState(false)

  // ── Draft filter state (user selects, not yet applied) ──
  const [draftCategory, setDraftCategory] = useState('')
  const [draftMinPrice, setDraftMinPrice] = useState('')
  const [draftMaxPrice, setDraftMaxPrice] = useState('')
  const [draftRating, setDraftRating] = useState(0)

  // ── Applied filter state (drives the actual query) ──
  const [appliedCategory, setAppliedCategory] = useState('')
  const [appliedMinPrice, setAppliedMinPrice] = useState('')
  const [appliedMaxPrice, setAppliedMaxPrice] = useState('')
  const [appliedRating, setAppliedRating] = useState(0)
  const [sort, setSort] = useState('')

  const applyFilters = useCallback(() => {
    setAppliedCategory(draftCategory)
    setAppliedMinPrice(draftMinPrice)
    setAppliedMaxPrice(draftMaxPrice)
    setAppliedRating(draftRating)
    setFilterOpen(false)
  }, [draftCategory, draftMinPrice, draftMaxPrice, draftRating])

  const clearFilters = useCallback(() => {
    setDraftCategory('')
    setDraftMinPrice('')
    setDraftMaxPrice('')
    setDraftRating(0)
    setAppliedCategory('')
    setAppliedMinPrice('')
    setAppliedMaxPrice('')
    setAppliedRating(0)
  }, [])

  // Build query params
  const queryParams = {
    q: searchParams.get('q') || undefined,
    category: appliedCategory || undefined,
    minPrice: appliedMinPrice || undefined,
    maxPrice: appliedMaxPrice || undefined,
    sort: sort || undefined,
    ...(user?._id ? { excludeOwner: user._id } : {}),
  }

  const { data, isLoading } = useItems(queryParams)
  let items = data?.data || data?.items || []

  // Client-side rating filter (backend doesn't support minRating)
  if (appliedRating > 0) {
    items = items.filter((item) => (item.rating || item.averageRating || 0) >= appliedRating)
  }

  const hasActiveFilters = appliedCategory || appliedMinPrice || appliedMaxPrice || appliedRating > 0

  return (
    <div className="browse-layout">
      {/* Mobile filter toggle */}
      <button className="mobile-filter-btn icon-btn" onClick={() => setFilterOpen((v) => !v)}
        style={{ position: 'fixed', top: 78, left: 12, zIndex: 800 }}>
        🔍
      </button>
      {filterOpen && <div className="mobile-overlay" onClick={() => setFilterOpen(false)} style={{ zIndex: 899 }} />}

      {/* ═══ FILTER SIDEBAR ═══ */}
      <aside className={`filter-sidebar ${filterOpen ? 'open' : ''}`}>
        <div className="filter-title">Filters</div>

        {/* Category filter */}
        <div className="filter-group">
          <div className="filter-label">Category</div>
          {CATEGORIES.map((c) => (
            <div
              key={c.label}
              className={`filter-option ${draftCategory === c.value ? 'active' : ''}`}
              onClick={() => setDraftCategory(c.value)}
            >
              <div className="filter-checkbox">{draftCategory === c.value ? '✓' : ''}</div>
              {c.emoji ? `${c.emoji} ${c.label}` : c.label}
            </div>
          ))}
        </div>

        {/* Price filter */}
        <div className="filter-group">
          <div className="filter-label">Price per Day</div>
          <input
            type="number"
            className="chat-input"
            placeholder="Max price $"
            value={draftMaxPrice}
            onChange={(e) => setDraftMaxPrice(e.target.value)}
            min="0"
            style={{ width: '100%', height: 30, fontSize: 12, padding: '4px 8px' }}
          />
        </div>

        {/* Rating filter */}
        <div className="filter-group">
          <div className="filter-label">Rating</div>
          {RATING_OPTIONS.map((r) => (
            <div
              key={r.value}
              className={`filter-option ${draftRating === r.value ? 'active' : ''}`}
              onClick={() => setDraftRating(r.value)}
            >
              <div className="filter-checkbox">{draftRating === r.value ? '✓' : ''}</div>
              ⭐ {r.label}
            </div>
          ))}
        </div>

        {/* Action buttons */}
        <button className="btn-primary" style={{ width: '100%', marginTop: 8 }} onClick={applyFilters}>
          Apply Filters
        </button>
        {hasActiveFilters && (
          <button className="btn-ghost" style={{ width: '100%', marginTop: 6, fontSize: 13 }} onClick={clearFilters}>
            Clear All Filters
          </button>
        )}
      </aside>

      {/* ═══ MAIN CONTENT ═══ */}
      <main className="browse-main">
        <div className="browse-header">
          <div className="browse-count">
            Showing <strong>{items.length}</strong> items
            {hasActiveFilters && (
              <span style={{ color: 'var(--accent)', fontSize: 12, marginLeft: 8, cursor: 'pointer' }}
                onClick={clearFilters}>
                (clear filters)
              </span>
            )}
          </div>
          <select className="sort-select" value={sort} onChange={(e) => setSort(e.target.value)}>
            {SORT_OPTIONS.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </div>

        {isLoading ? (
          <div className="browse-grid">
            {[1,2,3,4,5,6].map(i => (
              <div className="skeleton" key={i}>
                <div className="skeleton-img" />
                <div className="skeleton-body">
                  <div className="skeleton-line" style={{ width: '70%' }} />
                  <div className="skeleton-line" style={{ width: '50%' }} />
                  <div className="skeleton-line" style={{ width: '90%' }} />
                </div>
              </div>
            ))}
          </div>
        ) : items.length > 0 ? (
          <div className="browse-grid stagger">
            {items.map((item, i) => (
              <BrowseItemCard key={item._id} item={item} idx={i} onClick={() => navigate(`/items/${item._id}`)} />
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '80px 0' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🔍</div>
            <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 6 }}>No items found</div>
            <div style={{ fontSize: 14, color: 'var(--text-2)' }}>Try adjusting your filters or search.</div>
          </div>
        )}
      </main>
    </div>
  )
}

function BrowseItemCard({ item, idx, onClick }) {
  const { data: wlData } = useWishlistIds()
  const ids = wlData?.ids || []
  const liked = ids.includes(item._id)
  const { mutate: toggle } = useToggleWishlist()
  const emoji = getCategoryEmoji(item.category)
  const firstImage = item.images?.[0]

  return (
    <div className="item-card" style={{ animationDelay: `${idx * 0.07}s` }} onClick={onClick}>
      <div className="item-img">
        {firstImage
          ? <img src={firstImage} alt={item.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : <span style={{ fontSize: 52 }}>{emoji}</span>
        }
        <div className="item-img-overlay" />
        <div className={`item-like ${liked ? 'liked' : ''}`} onClick={(e) => { e.stopPropagation(); toggle(item._id) }}>
          {liked ? '❤️' : '🤍'}
        </div>
        <div className="item-badge">{item.category || 'General'}</div>
      </div>
      <div className="item-body">
        <div className="item-title">{item.title}</div>
        <div className="item-meta">
          <div className="item-location">📍 {item.location?.city || item.location || 'Unknown'}</div>
          <div className="item-rating">⭐ {item.averageRating?.toFixed(1) || 'New'}</div>
        </div>
        <div className="item-footer">
          <div className="item-price">${item.pricePerDay} <span>/ day</span></div>
          <div className="item-owner">
            {item.owner?.avatar ? (
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
                {item.owner?.name?.[0] || '?'}
              </div>
            )}
            <div className="owner-name">{item.owner?.name?.split(' ')[0] || 'Owner'}</div>
          </div>
        </div>
      </div>
    </div>
  )
}

function getCategoryEmoji(cat) {
  const map = {
    Photography: '📷', Electronics: '🎮', 'Tools & DIY': '🔧', Outdoor: '🏕️',
    Sports: '🚲', Music: '🎸', Vehicles: '🚗', 'Home & Garden': '🏠',
  }
  return map[cat] || '📦'
}
