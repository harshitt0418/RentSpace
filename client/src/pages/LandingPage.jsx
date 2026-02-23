/**
 * LandingPage.jsx — real data only, no dummy fallbacks
 */
import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useItems } from '@/hooks/useItems'
import { useWishlistIds, useToggleWishlist } from '@/hooks/useWishlist'
import useAuthStore from '@/store/authStore'

const HERO_CARDS = [
  {
    img: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=440&h=260&fit=crop&auto=format',
    title: 'Sony A7 III Camera',
    price: 45,
    rating: 4.9,
    category: 'Photography',
  },
  {
    img: 'https://images.unsplash.com/photo-1473968512647-3e447244af8f?w=400&h=240&fit=crop&auto=format',
    title: 'DJI Mini 3 Pro',
    price: 38,
    rating: 4.8,
    category: 'Electronics',
  },
  {
    img: 'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=420&h=250&fit=crop&auto=format',
    title: 'DeWalt Power Drill Set',
    price: 18,
    rating: 5.0,
    category: 'Tools',
  },
]

const STEPS = [
  { num: '01', icon: '🔍', title: 'Find what you need', body: 'Search thousands of items listed by verified owners near you. Filter by category, price, location, and availability.' },
  { num: '02', icon: '📅', title: 'Request your dates', body: 'Pick your rental window on the availability calendar. Send the owner a message and wait for instant confirmation.' },
  { num: '03', icon: '🤝', title: 'Enjoy & return', body: 'Collect from the owner, use it, then return it safely. Leave a review and build your trusted community reputation.' },
]

function useCountUp(target, duration = 1200) {
  const [value, setValue] = useState(0)
  const started = useRef(false)
  useEffect(() => {
    if (started.current) return
    started.current = true
    let start = 0
    const step = target / (duration / 16)
    const id = setInterval(() => {
      start = Math.min(start + step, target)
      setValue(Math.floor(start))
      if (start >= target) clearInterval(id)
    }, 16)
    return () => clearInterval(id)
  }, [target, duration])
  return value
}

export default function LandingPage() {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const { data: itemsData, isLoading } = useItems({ limit: 6, sort: 'newest', ...(user?._id ? { excludeOwner: user._id } : {}) })
  const items = itemsData?.data ?? []
  const stat1 = useCountUp(2400)
  const stat2 = useCountUp(840)
  const stat3 = useCountUp(18)

  return (
    <div>
      <section className="hero">
        <div className="hero-bg" />
        <div className="hero-grid" />
        <div className="hero-content">
          <div>
            <div className="hero-eyebrow"><div className="hero-eyebrow-dot" /> The smarter way to share</div>
            <h1 className="hero-title">Rent <span className="grad">anything</span>,<br />from <span className="grad-2">anyone</span>.</h1>
            <p className="hero-sub">Borrow what you need from trusted people nearby. List what you own and earn from items sitting idle.</p>
            <div className="hero-search">
              <input type="text" placeholder="Search for cameras, tools, drones" onKeyDown={(e) => e.key === 'Enter' && navigate('/browse')} />
              <button className="hero-search-btn" onClick={() => navigate('/browse')}>Search</button>
            </div>
            <div className="hero-stats">
              <div><div className="hero-stat-num">{stat1 >= 2400 ? '2400+' : stat1}</div><div className="hero-stat-label">Items listed</div></div>
              <div><div className="hero-stat-num">{stat2 >= 840 ? '840+' : stat2}</div><div className="hero-stat-label">Happy renters</div></div>
              <div><div className="hero-stat-num">{stat3}</div><div className="hero-stat-label">Cities active</div></div>
            </div>
          </div>
          <div className="hero-cards">
            {HERO_CARDS.map((c, i) => (
              <div key={i} className={`hero-card hero-card-${i + 1} float-${i + 1}`}>
                <div className="hero-card-img">
                  <img src={c.img} alt={c.title} className="hero-card-photo" />
                  <div className="hero-card-img-overlay" />
                  <div className="hero-card-cat-badge">{c.category}</div>
                </div>
                <div className="hero-card-body">
                  <div className="hero-card-title">{c.title}</div>
                  <div className="hero-card-footer">
                    <div className="hero-card-price">${c.price}/day</div>
                    <div className="hero-card-rating">⭐ {c.rating}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="section" id="how-it-works">
        <div className="section-eyebrow">Simple Process</div>
        <div className="section-title">How RentSpace<br />works for you</div>
        <div className="steps-grid stagger">
          {STEPS.map((s) => (
            <div className="step-card" key={s.num}>
              <div className="step-num">{s.num}</div>
              <div className="step-icon">{s.icon}</div>
              <div className="step-title">{s.title}</div>
              <div className="step-body">{s.body}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="section">
        <div className="section-eyebrow">Popular Right Now</div>
        <div className="section-title">Featured items<br />near you</div>
        {isLoading ? (
          <div className="items-grid">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="item-card">
                <div className="item-img skeleton-img" />
                <div className="item-body">
                  <div className="skeleton-line" style={{ width: '70%', height: 16, marginBottom: 8 }} />
                  <div className="skeleton-line" style={{ width: '50%', height: 12, marginBottom: 16 }} />
                  <div className="skeleton-line" style={{ width: '40%', height: 14 }} />
                </div>
              </div>
            ))}
          </div>
        ) : items.length > 0 ? (
          <>
            <div className="items-grid stagger">
              {items.map((item, i) => (
                <ItemCard key={item._id} item={item} idx={i} onClick={() => navigate(`/items/${item._id}`)} />
              ))}
            </div>
            <div style={{ textAlign: 'center', marginTop: 40 }}>
              <button className="btn-ghost" style={{ padding: '12px 32px' }} onClick={() => navigate('/browse')}>View all listings </button>
            </div>
          </>
        ) : (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-2)' }}>
            <div style={{ fontSize: 56, marginBottom: 16 }}>🏷️</div>
            <div style={{ fontSize: 20, fontWeight: 600, color: 'var(--text-1)', marginBottom: 8 }}>No listings yet</div>
            <div style={{ fontSize: 14, marginBottom: 24 }}>Be the first to list an item in your area!</div>
            <button className="btn-primary" onClick={() => navigate('/list-item')}>List an Item</button>
          </div>
        )}
      </div>

      <div className="cta-section">
        <div className="cta-title">Ready to start earning?</div>
        <div className="cta-sub">List your first item in under 5 minutes. No fees until you earn.</div>
        <div className="cta-btns">
          <button className="btn-primary" style={{ padding: '12px 28px', fontSize: 15 }} onClick={() => navigate('/list-item')}>List an Item</button>
          <button className="btn-ghost" style={{ padding: '12px 28px', fontSize: 15 }} onClick={() => navigate('/browse')}>Browse Items</button>
        </div>
      </div>
    </div>
  )
}

function ItemCard({ item, idx, onClick }) {
  const { data: wlData } = useWishlistIds()
  const ids = wlData?.ids || []
  const liked = ids.includes(item._id)
  const { mutate: toggle } = useToggleWishlist()
  const firstImage = item.images?.[0]
  const emoji = getCategoryEmoji(item.category)

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
          <div className="item-location"> {item.location?.city || item.location || 'Unknown'}</div>
          <div className="item-rating"> {item.averageRating?.toFixed(1) || 'New'}</div>
        </div>
        <div className="item-footer">
          <div className="item-price">${item.pricePerDay} <span>/ day</span></div>
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
    Photography: '📷', Cameras: '📷', Electronics: '🎮', 'Tools & DIY': '🔧', Tools: '🔧',
    Outdoor: '🏕️', Sports: '🚲', Music: '🎸', Instruments: '🎸', Vehicles: '🚗',
    Spaces: '🏠', Other: '📦',
  }
  return map[cat] || '📦'
}
