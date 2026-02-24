/**
 * WishlistPage.jsx — Amazon-style wishlist layout
 */
import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { HeartOff, ShoppingBag, Star, Heart, MapPin, Trash2, ExternalLink, Camera, Wrench, Tent, Monitor, Car, Bike, Music, Building2, Package, ChevronDown } from 'lucide-react'
import { useWishlist, useToggleWishlist } from '@/hooks/useWishlist'

const SORT_OPTIONS = [
  { label: 'Date added', value: '' },
  { label: 'Price: Low to High', value: 'price_asc' },
  { label: 'Price: High to Low', value: 'price_desc' },
  { label: 'Rating: High to Low', value: 'rating' },
]

function getCategoryIcon(cat) {
  const map = { Cameras: Camera, Electronics: Monitor, Tools: Wrench, Sports: Bike, Instruments: Music, Vehicles: Car, Spaces: Building2, Bikes: Bike, Other: Package }
  const Icon = map[cat] || Package
  return <Icon size={40} style={{ color: 'var(--text-3)' }} />
}

function StarRow({ rating, count }) {
  const full = Math.floor(rating)
  const half = rating - full >= 0.4
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
      <div style={{ display: 'flex', gap: 1 }}>
        {[1,2,3,4,5].map((i) => (
          <Star key={i} size={13}
            fill={i <= full ? '#f59e0b' : (i === full + 1 && half ? 'url(#half)' : 'transparent')}
            color={i <= full || (i === full + 1 && half) ? '#f59e0b' : '#4b5563'}
          />
        ))}
      </div>
      {count > 0 && <span style={{ fontSize: 12, color: 'var(--accent)' }}>{count}</span>}
    </div>
  )
}

export default function WishlistPage() {
  const navigate = useNavigate()
  const { data, isLoading } = useWishlist()
  const allItems = data?.data || []
  const { mutate: toggle, isPending } = useToggleWishlist()
  const [sort, setSort] = useState('')
  const [sortOpen, setSortOpen] = useState(false)

  const items = useMemo(() => {
    let filtered = [...allItems]
    if (sort === 'price_asc') filtered.sort((a, b) => a.pricePerDay - b.pricePerDay)
    else if (sort === 'price_desc') filtered.sort((a, b) => b.pricePerDay - a.pricePerDay)
    else if (sort === 'rating') filtered.sort((a, b) => (b.rating || 0) - (a.rating || 0))
    return filtered
  }, [allItems, sort])

  const sortLabel = SORT_OPTIONS.find((s) => s.value === sort)?.label || 'Date added'

  return (
    <div className="wl-page">
      <div className="wl-container">

        {/* ── Header ── */}
        <div className="wl-header">
          <div>
            <h1 className="wl-title">
              <Heart size={20} fill="#ef4444" color="#ef4444" style={{ display: 'inline', verticalAlign: 'middle', marginRight: 8 }} />
              Your Wishlist
            </h1>
            {!isLoading && (
              <p className="wl-subtitle">{items.length} item{items.length !== 1 ? 's' : ''}</p>
            )}
          </div>

          {/* Sort dropdown */}
          {items.length > 1 && (
            <div style={{ position: 'relative' }}>
              <button
                className="wl-sort-btn"
                onClick={() => setSortOpen((v) => !v)}
              >
                Sort by: <strong>{sortLabel}</strong> <ChevronDown size={14} style={{ marginLeft: 4 }} />
              </button>
              {sortOpen && (
                <>
                  <div style={{ position: 'fixed', inset: 0, zIndex: 99 }} onClick={() => setSortOpen(false)} />
                  <div className="wl-sort-dropdown">
                    {SORT_OPTIONS.map((s) => (
                      <div key={s.value} className={`wl-sort-option ${sort === s.value ? 'active' : ''}`}
                        onClick={() => { setSort(s.value); setSortOpen(false) }}>
                        {sort === s.value && <span style={{ color: 'var(--accent)', marginRight: 6 }}>&#10003;</span>}
                        {s.label}
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* ── Divider ── */}
        <div className="wl-divider" />

        {/* ── Loading skeletons ── */}
        {isLoading && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {[1,2,3].map((i) => (
              <div key={i} className="wl-row wl-skeleton-row">
                <div className="wl-img-wrap" style={{ background: 'var(--surface)', borderRadius: 8, animation: 'shimmer-bg 1.4s infinite' }} />
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div className="skeleton-line" style={{ width: '55%', height: 16 }} />
                  <div className="skeleton-line" style={{ width: '35%', height: 12 }} />
                  <div className="skeleton-line" style={{ width: '25%', height: 12 }} />
                </div>
                <div style={{ width: 120, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div className="skeleton-line" style={{ width: '80%', height: 20 }} />
                  <div className="skeleton-line" style={{ width: '100%', height: 34, borderRadius: 6 }} />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Empty state ── */}
        {!isLoading && items.length === 0 && (
          <div className="wl-empty">
            <div className="wl-empty-icon">
              <HeartOff size={36} />
            </div>
            <div className="wl-empty-title">Your wishlist is empty</div>
            <div className="wl-empty-sub">When you find an item you love, tap the ♥ heart to save it here.</div>
            <button className="btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}
              onClick={() => navigate('/browse')}>
              <ShoppingBag size={15} /> Browse Items
            </button>
          </div>
        )}

        {/* ── Item list ── */}
        {!isLoading && items.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {items.map((item, i) => (
              <WishlistRow
                key={item._id}
                item={item}
                idx={i}
                total={items.length}
                onRemove={() => toggle(item._id)}
                removing={isPending}
                onView={() => navigate(`/items/${item._id}`)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function WishlistRow({ item, idx, total, onRemove, removing, onView }) {
  const firstImage = item.images?.[0]
  const city = item.location?.city || (typeof item.location === 'string' ? item.location : '') || 'Unknown'
  const rating = item.rating || 0
  const reviews = item.totalReviews || 0
  const isLast = idx === total - 1

  return (
    <div className={`wl-row${isLast ? ' wl-row-last' : ''}`}>

      {/* Image */}
      <div className="wl-img-wrap" onClick={onView}>
        {firstImage
          ? <img src={firstImage} alt={item.title} className="wl-img" />
          : <div className="wl-img-placeholder">{getCategoryIcon(item.category)}</div>
        }
      </div>

      {/* Details */}
      <div className="wl-details">
        <div className="wl-item-title" onClick={onView}>{item.title}</div>

        <div className="wl-category-badge">{item.category || 'General'}</div>

        {rating > 0 ? (
          <StarRow rating={rating} count={reviews} />
        ) : (
          <span style={{ fontSize: 12, color: 'var(--text-3)' }}>No reviews yet</span>
        )}

        <div className="wl-meta-row">
          <MapPin size={12} style={{ flexShrink: 0 }} />
          <span>{city}</span>
        </div>

        {item.owner?.name && (
          <div className="wl-meta-row">
            <div className="wl-owner-dot">{item.owner.name[0]}</div>
            <span>by <strong>{item.owner.name.split(' ')[0]}</strong></span>
          </div>
        )}

        <div style={{ marginTop: 'auto' }}>
          <button
            className="wl-remove-btn"
            onClick={onRemove}
            disabled={removing}
          >
            <Trash2 size={13} /> Delete
          </button>
        </div>
      </div>

      {/* Price + action */}
      <div className="wl-actions">
        <div className="wl-price">
          <span className="wl-price-symbol">₹</span>
          <span className="wl-price-amount">{item.pricePerDay?.toLocaleString('en-IN')}</span>
          <span className="wl-price-per">/ day</span>
        </div>

        {item.status === 'available' || !item.status ? (
          <span className="wl-in-stock">&#10003;&nbsp;Available</span>
        ) : (
          <span className="wl-out-stock">Currently unavailable</span>
        )}

        <button className="wl-rent-btn" onClick={onView}>
          <ExternalLink size={14} /> View Item
        </button>
      </div>
    </div>
  )
}
