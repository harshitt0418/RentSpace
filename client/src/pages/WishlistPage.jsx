/**
 * WishlistPage.jsx — Shows items the user has wishlisted
 */
import { useState, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { HeartOff, ShoppingBag } from 'lucide-react'
import { useWishlist, useToggleWishlist } from '@/hooks/useWishlist'

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
  { label: 'Sort: Default', value: '' },
  { label: 'Price: Low to High', value: 'price_asc' },
  { label: 'Price: High to Low', value: 'price_desc' },
  { label: 'Rating: High to Low', value: 'rating' },
]

export default function WishlistPage() {
  const navigate = useNavigate()
  const { data, isLoading } = useWishlist()
  const allItems = data?.data || []
  const { mutate: toggle, isPending } = useToggleWishlist()

  const [filterOpen, setFilterOpen] = useState(false)

  // Draft filter state
  const [draftCategory, setDraftCategory] = useState('')
  const [draftMaxPrice, setDraftMaxPrice] = useState('')
  const [draftRating, setDraftRating] = useState(0)

  // Applied filter state
  const [appliedCategory, setAppliedCategory] = useState('')
  const [appliedMaxPrice, setAppliedMaxPrice] = useState('')
  const [appliedRating, setAppliedRating] = useState(0)
  const [sort, setSort] = useState('')

  const applyFilters = useCallback(() => {
    setAppliedCategory(draftCategory)
    setAppliedMaxPrice(draftMaxPrice)
    setAppliedRating(draftRating)
    setFilterOpen(false)
  }, [draftCategory, draftMaxPrice, draftRating])

  const clearFilters = useCallback(() => {
    setDraftCategory('')
    setDraftMaxPrice('')
    setDraftRating(0)
    setAppliedCategory('')
    setAppliedMaxPrice('')
    setAppliedRating(0)
  }, [])

  const hasActiveFilters = appliedCategory || appliedMaxPrice || appliedRating > 0

  // Client-side filtering + sorting
  const items = useMemo(() => {
    let filtered = [...allItems]

    if (appliedCategory) {
      filtered = filtered.filter((item) => item.category === appliedCategory)
    }
    if (appliedMaxPrice) {
      filtered = filtered.filter((item) => item.pricePerDay <= Number(appliedMaxPrice))
    }
    if (appliedRating > 0) {
      filtered = filtered.filter((item) => (item.averageRating || 0) >= appliedRating)
    }

    if (sort === 'price_asc') filtered.sort((a, b) => a.pricePerDay - b.pricePerDay)
    else if (sort === 'price_desc') filtered.sort((a, b) => b.pricePerDay - a.pricePerDay)
    else if (sort === 'rating') filtered.sort((a, b) => (b.averageRating || 0) - (a.averageRating || 0))

    return filtered
  }, [allItems, appliedCategory, appliedMaxPrice, appliedRating, sort])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="browse-layout"
    >
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
            {isLoading ? (
              'Loading wishlist…'
            ) : (
              <>
                ❤️ <strong>{items.length}</strong> saved item{items.length !== 1 ? 's' : ''}
                {hasActiveFilters && (
                  <span style={{ color: 'var(--accent)', fontSize: 12, marginLeft: 8, cursor: 'pointer' }}
                    onClick={clearFilters}>
                    (clear filters)
                  </span>
                )}
              </>
            )}
          </div>
          <select className="sort-select" value={sort} onChange={(e) => setSort(e.target.value)}>
            {SORT_OPTIONS.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </div>

        {/* Item grid */}
        {isLoading ? (
          <div className="browse-grid">
            {[1, 2, 3, 4, 5, 6].map((i) => (
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
              <WishlistCard
                key={item._id}
                item={item}
                idx={i}
                onRemove={() => toggle(item._id)}
                removing={isPending}
                onClick={() => navigate(`/items/${item._id}`)}
              />
            ))}
          </div>
        ) : allItems.length > 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 0' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🔍</div>
            <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 6 }}>No matching items</div>
            <div style={{ fontSize: 14, color: 'var(--text-2)' }}>Try adjusting your filters.</div>
          </div>
        ) : (
          <div className="wishlist-empty">
            <div className="wishlist-empty-icon">
              <HeartOff size={32} />
            </div>
            <div className="wishlist-empty-title">Your wishlist is empty</div>
            <div className="wishlist-empty-sub">
              Browse items and tap the heart icon to save them here for later.
            </div>
            <button className="btn-primary" onClick={() => navigate('/browse')}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              <ShoppingBag size={16} />
              Browse Items
            </button>
          </div>
        )}
      </main>
    </motion.div>
  )
}

function WishlistCard({ item, idx, onRemove, removing, onClick }) {
  const emoji = getCategoryEmoji(item.category)
  const firstImage = item.images?.[0]

  return (
    <div className="item-card" style={{ animationDelay: `${idx * 0.07}s` }} onClick={onClick}>
      <div className="item-img">
        {firstImage ? (
          <img src={firstImage} alt={item.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <span style={{ fontSize: 52 }}>{emoji}</span>
        )}
        <div className="item-img-overlay" />
        <div
          className="item-like liked"
          onClick={(e) => {
            e.stopPropagation()
            if (!removing) onRemove()
          }}
          title="Remove from wishlist"
          style={{ transition: 'transform 0.2s ease' }}
        >
          ❤️
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
          <div className="item-price">
            ${item.pricePerDay} <span>/ day</span>
          </div>
          <div className="item-owner">
            <div className="owner-avatar">{item.owner?.name?.[0] || '?'}</div>
            <div className="owner-name">{item.owner?.name?.split(' ')[0] || 'Owner'}</div>
          </div>
        </div>
      </div>
    </div>
  )
}

function getCategoryEmoji(cat) {
  const map = {
    Cameras: '📷', Electronics: '🎮', Tools: '🔧', Sports: '🚲',
    Instruments: '🎸', Vehicles: '🚗', Spaces: '🏠', Bikes: '🚲', Other: '📦',
  }
  return map[cat] || '📦'
}
