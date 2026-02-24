/**
 * CommunityPage.jsx — Browse community members
 * Shows a list of active users with stats, click to view their full profile.
 */
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { MessageCircle, Star, Package, ChevronRight, Users, ChevronDown, ChevronUp } from 'lucide-react'
import api from '@/api/axios'
import useAuthStore from '@/store/authStore'
import { pageVariants } from '@/animations/pageVariants'

const fetchUsers = () =>
  api.get('/users', { params: { limit: 100 } }).then((r) => r.data)

// Demo data used when API returns nothing
const DEMO_MEMBERS = [
  { _id: 'demo1', name: 'Alex Sharma', bio: 'Photography enthusiast & gear lover. Based in Dehradun. I take great care of everything I own and expect the same in return. 5-star superhost.', rating: 4.9, totalReviews: 38, totalListings: 7, createdAt: '2024-02-01' },
  { _id: 'demo2', name: 'Priya Verma', bio: 'Outdoor adventure junkie. Camping gear, hiking equipment, and more available for rent in Mumbai.', rating: 4.7, totalReviews: 24, totalListings: 5, createdAt: '2024-05-15' },
  { _id: 'demo3', name: 'Ravi Kumar', bio: 'Professional videographer. Camera bodies, lenses, and lighting kits available. Delhi NCR.', rating: 5.0, totalReviews: 15, totalListings: 9, createdAt: '2024-01-10' },
  { _id: 'demo4', name: 'Sneha Patel', bio: 'Music teacher & instrument collector. Rent guitars, keyboards, and DJ equipment in Bangalore.', rating: 4.8, totalReviews: 31, totalListings: 12, createdAt: '2023-11-20' },
  { _id: 'demo5', name: 'Arjun Singh', bio: 'DIY & power tools specialist. Everything from drills to table saws. Jaipur area.', rating: 4.6, totalReviews: 19, totalListings: 8, createdAt: '2024-08-05' },
  { _id: 'demo6', name: 'Meera Joshi', bio: 'Sports equipment rental — cricket kits, badminton sets, cycling gear. Pune superhost.', rating: 4.9, totalReviews: 42, totalListings: 11, createdAt: '2023-09-12' },
]

export default function CommunityPage() {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const { data, isLoading } = useQuery({ queryKey: ['community-users'], queryFn: fetchUsers, retry: false })

  const [showAll, setShowAll] = useState(false)

  const allMembers = data?.data?.length ? data.data : DEMO_MEMBERS
  // Sort top owners: by rating desc, then by totalReviews desc
  const sortedMembers = [...allMembers].sort((a, b) => {
    if ((b.rating || 0) !== (a.rating || 0)) return (b.rating || 0) - (a.rating || 0)
    return (b.totalReviews || 0) - (a.totalReviews || 0)
  })
  const members = showAll ? sortedMembers : sortedMembers.slice(0, 9)

  const getMemberYears = (date) => {
    if (!date) return '—'
    const y = new Date().getFullYear() - new Date(date).getFullYear()
    return y < 1 ? '<1y' : `${y}y`
  }

  return (
    <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit" className="community-page">
      {/* Hero */}
      <div className="community-hero">
        <div className="hero-bg" />
        <div className="hero-grid" />
        <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', maxWidth: 700, margin: '0 auto' }}>
          <div className="page-badge">👥 Community</div>
          <h1 className="hero-title">Meet Our Community</h1>
          <p className="hero-sub">
            Discover trusted members who share their gear, tools, and equipment.
            Every member is verified and reviewed by the community.
          </p>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="community-stats-bar">
        <div className="community-stat-item">
          <div className="community-stat-num">{allMembers.length}+</div>
          <div className="community-stat-label">Active Members</div>
        </div>
        <div className="community-stat-item">
          <div className="community-stat-num">{allMembers.reduce((s, m) => s + (m.totalListings || 0), 0)}+</div>
          <div className="community-stat-label">Items Listed</div>
        </div>
        <div className="community-stat-item">
          <div className="community-stat-num">{allMembers.reduce((s, m) => s + (m.totalReviews || 0), 0)}+</div>
          <div className="community-stat-label">Reviews Given</div>
        </div>
        <div className="community-stat-item">
          <div className="community-stat-num">
            {(() => {
              const rated = allMembers.filter((m) => m.rating && m.totalReviews > 0)
              return rated.length
                ? (rated.reduce((s, m) => s + m.rating, 0) / rated.length).toFixed(1)
                : '—'
            })()}
          </div>
          <div className="community-stat-label">Avg Rating</div>
        </div>
      </div>

      {/* Members Grid */}
      <div className="community-grid-wrapper">
        <div className="section-header" style={{ marginBottom: 24, alignItems: 'flex-end' }}>
          <div>
            <div className="section-label" style={{ fontSize: 20 }}>Top Owners</div>
            <div style={{ fontSize: 13, color: 'var(--text-3)', marginTop: 4 }}>
              Sorted by rating · showing {members.length} of {sortedMembers.length} members
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="items-grid">
            {[...Array(6)].map((_, i) => (
              <div className="skeleton" key={i}>
                <div className="skeleton-img" style={{ height: 120 }} />
                <div className="skeleton-body">
                  <div className="skeleton-line" style={{ width: '60%' }} />
                  <div className="skeleton-line" style={{ width: '80%' }} />
                  <div className="skeleton-line" style={{ width: '40%' }} />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="community-members-grid">
            {members.map((member) => (
              <motion.div
                key={member._id}
                className="member-card"
                whileHover={{ y: -4 }}
                transition={{ duration: 0.2 }}
                onClick={() => navigate(member._id?.startsWith('demo') ? '#' : `/profile/${member._id}`)}
                style={{ cursor: member._id?.startsWith('demo') ? 'default' : 'pointer' }}
              >
                <div className="member-card-top">
                  <div className="member-avatar">
                    {member.avatar
                      ? <img src={member.avatar} alt={member.name} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                      : member.name?.[0]?.toUpperCase()
                    }
                  </div>
                  <div className="member-info">
                    <div className="member-name">{member.name}</div>
                    <div className="member-joined">Member for {getMemberYears(member.createdAt)}</div>
                  </div>
                  {!member._id?.startsWith('demo') && (
                    <ChevronRight size={16} style={{ color: 'var(--text-3)', flexShrink: 0 }} />
                  )}
                </div>

                <div className="member-bio">{member.bio || 'No bio yet.'}</div>

                <div className="member-stats">
                  <div className="member-stat">
                    <Star size={14} style={{ color: '#F59E0B' }} />
                    <span>{member.rating?.toFixed(1) || '—'}</span>
                  </div>
                  <div className="member-stat">
                    <MessageCircle size={14} style={{ color: 'var(--accent)' }} />
                    <span>{member.totalReviews || 0} reviews</span>
                  </div>
                  <div className="member-stat">
                    <Package size={14} style={{ color: 'var(--accent-3)' }} />
                    <span>{member.totalListings || 0} listings</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* View All / Show Less button */}
        {!isLoading && sortedMembers.length > 9 && (
          <div style={{ textAlign: 'center', marginTop: 36 }}>
            <button
              className="btn-ghost"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '12px 28px', fontSize: 14, fontWeight: 600 }}
              onClick={() => setShowAll((v) => !v)}
            >
              {showAll ? (
                <><ChevronUp size={16} /> Show Less</>
              ) : (
                <><Users size={16} /> View All {sortedMembers.length} Members <ChevronDown size={16} /></>
              )}
            </button>
          </div>
        )}
      </div>

      {/* CTA */}
      <div className="cta-section">
        <div className="cta-title">{user ? 'Start Sharing Today' : 'Join the Community'}</div>
        <div className="cta-sub">
          {user
            ? 'List your idle gear, earn money, and help fellow community members.'
            : 'List your items and start earning. Connect with trusted renters in your area.'}
        </div>
        <div className="cta-btns">
          {user ? (
            <>
              <button className="btn-primary" onClick={() => navigate('/list-item')}>📦 List an Item</button>
              <button className="btn-ghost" onClick={() => navigate('/browse')}>🔍 Browse Items</button>
            </>
          ) : (
            <>
              <button className="btn-primary" onClick={() => navigate('/signup')}>🚀 Sign Up Free</button>
              <button className="btn-ghost" onClick={() => navigate('/browse')}>🔍 Browse Items</button>
            </>
          )}
        </div>
      </div>
    </motion.div>
  )
}
