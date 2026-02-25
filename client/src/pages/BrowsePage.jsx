/**
 * BrowsePage.jsx — demoui-matched design with working filters
 */
import { useState, useCallback, useEffect, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useItems } from '@/hooks/useItems'
import { useWishlistIds, useToggleWishlist } from '@/hooks/useWishlist'
import useAuthStore from '@/store/authStore'
import {
  Search, MapPin, Star, Heart, Camera, Wrench, Tent, Monitor, Car, Bike,
  Music, Building2, Package, Navigation, X as XIcon, SlidersHorizontal
} from 'lucide-react'

const CATEGORIES = [
  { label: 'All Categories', value: '', icon: null },
  { label: 'Cameras', value: 'Cameras', icon: Camera },
  { label: 'Tools', value: 'Tools', icon: Wrench },
  { label: 'Sports', value: 'Sports', icon: Tent },
  { label: 'Electronics', value: 'Electronics', icon: Monitor },
  { label: 'Vehicles', value: 'Vehicles', icon: Car },
  { label: 'Bikes', value: 'Bikes', icon: Bike },
  { label: 'Instruments', value: 'Instruments', icon: Music },
  { label: 'Spaces', value: 'Spaces', icon: Building2 },
  { label: 'Other', value: 'Other', icon: Package },
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

  // ── Near Me / Location filter ──
  const [nearMe, setNearMe] = useState(false)
  const [userCoords, setUserCoords] = useState(null)   // { lat, lng, label }
  const [geoLoading, setGeoLoading] = useState(false)
  const [geoError, setGeoError] = useState('')
  const [cityInput, setCityInput] = useState('')
  const geoWatchRef = useRef(null)

  // GPS — use device location, then reverse-geocode to city name for display label
  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setGeoError('Geolocation not supported by your browser')
      return
    }
    setGeoLoading(true)
    setGeoError('')
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lon } = pos.coords
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`,
            { headers: { 'Accept-Language': 'en' } }
          )
          const data = await res.json()
          const addr = data.address || {}
          const cityName = addr.city || addr.town || addr.village || addr.county || addr.state || 'Your location'
          // ✅ Store the REAL coordinates — used for $nearSphere 50km radius query
          setUserCoords({ lat, lng: lon, label: cityName })
        } catch {
          // Reverse geocode failed — still use GPS coords for proximity filter
          setUserCoords({ lat, lng: lon, label: 'Your location' })
        }
        setNearMe(true)
        setCityInput('')
        setGeoLoading(false)
      },
      (err) => {
        setGeoError(err.code === 1 ? 'Location permission denied' : 'Could not get location')
        setNearMe(false)
        setGeoLoading(false)
      },
      { timeout: 8000, maximumAge: 60000 }
    )
  }, [])

  // Apply city text filter — matches items by location.city (no geocoding needed)
  const applyCityFilter = useCallback((cityName) => {
    if (!cityName.trim()) return
    const term = cityName.trim()
    setUserCoords({ lat: null, lng: null, label: term })
    setNearMe(true)
    setCityInput('')
    setGeoError('')
  }, [])

  const clearLocation = useCallback(() => {
    setNearMe(false)
    setUserCoords(null)
    setCityInput('')
    setGeoError('')
  }, [])

  // Clean up on unmount
  useEffect(() => () => {
    if (geoWatchRef.current) navigator.geolocation.clearWatch(geoWatchRef.current)
  }, [])

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
    setNearMe(false)
    setUserCoords(null)
    setCityInput('')
    setGeoError('')
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Build query params
  const queryParams = {
    q: searchParams.get('q') || undefined,
    category: appliedCategory || undefined,
    minPrice: appliedMinPrice || undefined,
    maxPrice: appliedMaxPrice || undefined,
    sort: sort || undefined,
    ...(user?._id ? { excludeOwner: user._id } : {}),
    ...(nearMe && userCoords
      ? (userCoords.lat && userCoords.lng
        ? { lat: userCoords.lat, lng: userCoords.lng, radius: 50 }  // GPS mode
        : { city: userCoords.label })                               // city text mode
      : {}),
  }

  const { data, isLoading } = useItems(queryParams)
  let items = data?.data || data?.items || []

  // Client-side rating filter (backend doesn't support minRating)
  if (appliedRating > 0) {
    items = items.filter((item) => (item.rating || 0) >= appliedRating)
  }

  const hasActiveFilters = appliedCategory || appliedMinPrice || appliedMaxPrice || appliedRating > 0 || nearMe

  return (
    <div className="browse-layout">
      {/* Mobile filter toggle — old FAB (hidden by CSS) */}
      <button className="mobile-filter-btn icon-btn mobile-fab" onClick={() => setFilterOpen((v) => !v)}>
        <Search size={20} />
      </button>
      {/* Mobile filter pill — new floating pill */}
      <button className="mobile-filter-pill" onClick={() => setFilterOpen((v) => !v)}>
        <SlidersHorizontal size={16} /> Filter & Sort
      </button>
      {filterOpen && <div className="mobile-overlay" onClick={() => setFilterOpen(false)} style={{ zIndex: 899 }} />}

      {/* ═══ FILTER SIDEBAR ═══ */}
      <aside className={`filter-sidebar ${filterOpen ? 'open' : ''}`}>
        <div className="filter-title">Filters</div>

        {/* ── Location filter ── */}
        <div className="filter-group">
          <div className="filter-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}><MapPin size={14} /> Location</div>

          {/* Active location pill */}
          {nearMe && userCoords ? (
            <div style={{
              background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.3)',
              borderRadius: 8, padding: '8px 12px', marginBottom: 8,
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8,
            }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 11, color: 'var(--accent)', fontWeight: 700, marginBottom: 2 }}>Within 50 km of</div>
                <div style={{ fontSize: 12, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {userCoords.label}
                </div>
              </div>
              <button
                onClick={clearLocation}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: 'var(--text-3)', fontSize: 16, lineHeight: 1, flexShrink: 0, padding: 2,
                }}
                title="Clear location"
              ><XIcon size={16} /></button>
            </div>
          ) : null}

          {/* GPS button */}
          {!nearMe && (
            <div
              className="filter-option"
              onClick={requestLocation}
              style={{ opacity: geoLoading ? 0.6 : 1, cursor: geoLoading ? 'wait' : 'pointer', marginBottom: 6 }}
            >
              <span style={{ fontSize: 14 }}>{geoLoading ? <span style={{ fontSize: 12 }}>…</span> : <Navigation size={14} />}</span>
              {geoLoading ? 'Detecting…' : 'Use my current location'}
            </div>
          )}

          {/* City search input */}
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <input
              type="text"
              className="chat-input"
              placeholder="Search by city…"
              value={cityInput}
              onChange={(e) => setCityInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && applyCityFilter(cityInput)}
              style={{ flex: 1, height: 34, fontSize: 12, padding: '4px 10px' }}
            />
            <button
              onClick={() => applyCityFilter(cityInput)}
              disabled={!cityInput.trim()}
              style={{
                height: 34, padding: '0 10px', borderRadius: 8, border: 'none',
                background: 'var(--accent)', color: '#fff', cursor: 'pointer',
                fontSize: 13, fontWeight: 600, flexShrink: 0,
                opacity: !cityInput.trim() ? 0.5 : 1,
              }}
            >
              Go
            </button>
          </div>

          {geoError && (
            <div style={{ fontSize: 11, color: 'var(--danger)', padding: '4px 2px', lineHeight: 1.4, marginTop: 4 }}>
              {geoError}
            </div>
          )}
        </div>
        <div className="filter-group">
          <div className="filter-label">Category</div>
          {CATEGORIES.map((c) => (
            <div
              key={c.label}
              className={`filter-option ${draftCategory === c.value ? 'active' : ''}`}
              onClick={() => setDraftCategory(c.value)}
            >
              <div className="filter-checkbox">{draftCategory === c.value ? <XIcon size={10} /> : ''}</div>
              {c.icon ? <><c.icon size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} /> {c.label}</> : c.label}
            </div>
          ))}
        </div>

        {/* Price filter */}
        <div className="filter-group">
          <div className="filter-label">Price per Day</div>
          <input
            type="number"
            className="chat-input"
            placeholder="Max price ₹"
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
              <div className="filter-checkbox">{draftRating === r.value ? <XIcon size={10} /> : ''}</div>
              <Star size={12} fill="#f59e0b" color="#f59e0b" style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} /> {r.label}
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
            {[1, 2, 3, 4, 5, 6].map(i => (
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
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '80px 0' }}>
            <div style={{ marginBottom: 12 }}><Search size={48} style={{ color: 'var(--text-3)' }} /></div>
            <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 6, textAlign: 'center' }}>No items found</div>
            <div style={{ fontSize: 14, color: 'var(--text-2)', textAlign: 'center' }}>Try adjusting your filters or search.</div>
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
  const firstImage = item.images?.[0]

  return (
    <div className="item-card" style={{ animationDelay: `${idx * 0.07}s` }} onClick={onClick}>
      <div className="item-img">
        {firstImage
          ? <img src={firstImage} alt={item.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : getCategoryIcon(item.category)
        }
        <div className="item-img-overlay" />
        <div className={`item-like ${liked ? 'liked' : ''}`} onClick={(e) => { e.stopPropagation(); toggle(item._id) }}>
          <Heart size={16} fill={liked ? 'currentColor' : 'none'} />
        </div>
        <div className="item-badge">{item.category || 'General'}</div>
      </div>
      <div className="item-body">
        <div className="item-title">{item.title}</div>
        <div className="item-meta">
          <div className="item-location"><MapPin size={12} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 3 }} /> {item.location?.city || item.location || 'Unknown'}</div>
          <div className="item-rating"><Star size={12} fill="#f59e0b" color="#f59e0b" style={{ display: 'inline', verticalAlign: 'middle', marginRight: 3 }} /> {item.rating > 0 ? item.rating.toFixed(1) : 'New'}</div>
        </div>
        <div className="item-footer">
          <div className="item-price">₹{item.pricePerDay} <span>/ day</span></div>
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

function getCategoryIcon(cat) {
  const map = {
    Photography: Camera, Cameras: Camera, Electronics: Monitor,
    'Tools & DIY': Wrench, Tools: Wrench, Outdoor: Tent, Sports: Tent,
    Music: Music, Instruments: Music, Vehicles: Car, Spaces: Building2,
    'Home & Garden': Building2, Bikes: Bike
  }
  const Icon = map[cat] || Package
  return <Icon size={52} style={{ color: 'var(--text-3)' }} />
}
