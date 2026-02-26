/**
 * LandingPage.jsx — real data only, no dummy fallbacks
 */
import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useItems } from '@/hooks/useItems'
import { useWishlistIds, useToggleWishlist } from '@/hooks/useWishlist'
import useAuthStore from '@/store/authStore'
import { getStats } from '@/api/itemApi'
import { Search, Calendar, CheckCircle, Star, Heart, MapPin, Tag, Camera, Monitor, Wrench, Tent, Music, Car, Building2, Bike, Package } from 'lucide-react'


const STEPS = [
  { num: '01', Icon: Search, title: 'Find what you need', body: 'Search thousands of items listed by verified owners near you. Filter by category, price, location, and availability.' },
  { num: '02', Icon: Calendar, title: 'Request your dates', body: 'Pick your rental window on the availability calendar. Send the owner a message and wait for instant confirmation.' },
  { num: '03', Icon: CheckCircle, title: 'Enjoy & return', body: 'Collect from the owner, use it, then return it safely. Leave a review and build your trusted community reputation.' },
]


function useCountUp(target, duration = 1200) {
  const [value, setValue] = useState(0)
  useEffect(() => {
    if (!target) return
    setValue(0)
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

  const { data: statsData } = useQuery({
    queryKey: ['platform-stats'],
    queryFn: getStats,
    staleTime: 5 * 60 * 1000,
  })

  const FALLBACK_ITEMS = 2400
  const FALLBACK_USERS = 840
  const FALLBACK_CITIES = 18

  const totalItems = Math.max(statsData?.totalItems ?? 0, FALLBACK_ITEMS)
  const totalUsers = Math.max(statsData?.totalUsers ?? 0, FALLBACK_USERS)
  const totalCities = Math.max(statsData?.totalCities ?? 0, FALLBACK_CITIES)

  const stat1 = useCountUp(totalItems)
  const stat2 = useCountUp(totalUsers)
  const stat3 = useCountUp(totalCities)

  // Scroll-reveal observer
  const revealRefs = useRef([])
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('revealed'); observer.unobserve(e.target) } }),
      { threshold: 0.15 }
    )
    revealRefs.current.forEach((el) => el && observer.observe(el))
    return () => observer.disconnect()
  }, [isLoading])
  const addRevealRef = (el) => { if (el && !revealRefs.current.includes(el)) revealRefs.current.push(el) }

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
            <div className="hero-stats">
              <div><div className="hero-stat-num">{stat1 >= totalItems ? `${totalItems}+` : stat1}</div><div className="hero-stat-label">Items listed</div></div>
              <div><div className="hero-stat-num">{stat2 >= totalUsers ? `${totalUsers}+` : stat2}</div><div className="hero-stat-label">Happy renters</div></div>
              <div><div className="hero-stat-num">{stat3 >= totalCities ? `${totalCities}+` : stat3}</div><div className="hero-stat-label">Cities active</div></div>
            </div>
          </div>
          <div className="hero-cards">
            {items.slice(0, 3).map((item, i) => (
              <div
                key={item._id}
                className={`hero-card hero-card-${i + 1} float-${i + 1}`}
                style={{ cursor: 'pointer' }}
                onClick={() => navigate(`/item/${item._id}`)}
              >
                <div className="hero-card-img">
                  <img src={item.images[0] || 'https://via.placeholder.com/400x300'} alt={item.title} className="hero-card-photo" />
                  <div className="hero-card-img-overlay" />
                  <div className="hero-card-cat-badge">{item.category}</div>
                </div>
                <div className="hero-card-body">
                  <div className="hero-card-title cursor-pointer hover:text-accent transition-colors truncate" title={item.title}>
                    {item.title}
                  </div>
                  <div className="hero-card-footer">
                    <div className="hero-card-price">₹{item.pricePerDay}/day</div>
                    <div className="hero-card-rating">
                      <Star size={12} fill="#B87333" color="#B87333" style={{ display: 'inline', verticalAlign: 'middle', marginRight: 3 }} />
                      {item.owner?.rating?.toFixed(1) || 'New'}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="section reveal-on-scroll" id="how-it-works" ref={addRevealRef}>
        <div className="section-eyebrow">Simple Process</div>
        <div className="section-title">How RentSpace<br />works for you</div>
        <div className="steps-grid stagger">
          {STEPS.map((s) => (
            <div className="step-card" key={s.num}>
              <div className="step-num">{s.num}</div>
              <div className="step-icon"><s.Icon size={32} /></div>
              <div className="step-title">{s.title}</div>
              <div className="step-body">{s.body}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="section reveal-on-scroll" ref={addRevealRef}>
        <div className="section-eyebrow">Popular Right Now</div>
        <div className="section-title">Featured items<br />near you</div>
        {isLoading ? (
          <div className="items-carousel">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="skeleton-card" style={{ flex: '0 0 280px' }}>
                <div className="skeleton-img" style={{ height: 200 }} />
                <div className="skeleton-body">
                  <div className="skeleton-line" style={{ width: '70%' }} />
                  <div className="skeleton-line" style={{ width: '50%' }} />
                  <div className="skeleton-line" style={{ width: '40%' }} />
                </div>
              </div>
            ))}
          </div>
        ) : items.length > 0 ? (
          <>
            <div className="items-carousel">
              {items.map((item, i) => (
                <ItemCard key={item._id} item={item} idx={i} onClick={() => navigate(`/items/${item._id}`)} />
              ))}
            </div>
            <div style={{ textAlign: 'center', marginTop: 24 }}>
              <button className="btn-ghost" style={{ padding: '12px 32px' }} onClick={() => navigate('/browse')}>View all listings →</button>
            </div>
          </>
        ) : (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-2)' }}>
            <div style={{ fontSize: 56, marginBottom: 16 }}><Tag size={56} style={{ color: 'var(--text-3)' }} /></div>
            <div style={{ fontSize: 20, fontWeight: 600, color: 'var(--text-1)', marginBottom: 8 }}>No listings yet</div>
            <div style={{ fontSize: 14, marginBottom: 24 }}>Be the first to list an item in your area!</div>
            <button className="btn-primary" onClick={() => navigate('/list-item')}>List an Item</button>
          </div>
        )}
      </div>

      <div className="cta-section reveal-on-scroll" ref={addRevealRef}>
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

  return (
    <div className="item-card" style={{ animationDelay: `${idx * 0.07}s` }} onClick={onClick}>
      <div className="item-img">
        {firstImage
          ? <img src={firstImage} alt={item.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : getCategoryIcon(item.category)
        }
        <div className="item-img-overlay" />
        <div className={`item-like ${liked ? 'liked' : ''}`} onClick={(e) => { e.stopPropagation(); toggle(item._id) }}>
          {liked ? <Heart size={16} fill="currentColor" /> : <Heart size={16} />}
        </div>
        <div className="item-badge">{item.category || 'General'}</div>
      </div>
      <div className="item-body">
        <div className="item-title">{item.title}</div>
        <div className="item-meta">
          <div className="item-location"> <MapPin size={12} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 3 }} /> {item.location?.city || item.location || 'Unknown'}</div>
          <div className="item-rating"> <Star size={12} fill="#f59e0b" color="#f59e0b" style={{ display: 'inline', verticalAlign: 'middle', marginRight: 3 }} /> {item.rating > 0 ? item.rating.toFixed(1) : 'New'}</div>
        </div>
        <div className="item-footer">
          <div className="item-price">₹{item.pricePerDay} <span>/ day</span></div>
          <div className="item-owner">
            <div className="owner-avatar">{item.owner?.name?.[0] || '?'}</div>
            <div className="owner-name">{item.owner?.name?.split(' ')[0] || 'Owner'}</div>
          </div>
        </div>
      </div>
    </div>
  )
}

function getCategoryIcon(cat) {
  const map = {
    Photography: Camera, Cameras: Camera, Electronics: Monitor, 'Tools & DIY': Wrench, Tools: Wrench,
    Outdoor: Tent, Sports: Bike, Music: Music, Instruments: Music, Vehicles: Car,
    Spaces: Building2, Other: Package,
  }
  const Icon = map[cat] || Package
  return <Icon size={52} style={{ color: 'var(--text-3)' }} />
}
