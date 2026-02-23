/**
 * HowItWorksPage.jsx — Standalone how-it-works page
 */
import { useNavigate } from 'react-router-dom'

const STEPS = [
  {
    num: '01', icon: '🔍', title: 'Find what you need',
    body: 'Search thousands of items listed by verified owners near you. Filter by category, price, location, and availability. Every item has photos, descriptions, and real reviews.',
  },
  {
    num: '02', icon: '📅', title: 'Request your dates',
    body: 'Pick your rental window on the availability calendar. Send the owner a message with any questions. Get instant notifications when your request is accepted.',
  },
  {
    num: '03', icon: '🤝', title: 'Meet & collect',
    body: 'Coordinate a pickup time and location through our built-in chat. Verify the item condition together. The refundable deposit is held securely until return.',
  },
  {
    num: '04', icon: '⭐', title: 'Enjoy, return & review',
    body: 'Use the item for your rental period. Return it safely to the owner. Leave an honest review to help build trust in the community. Get your deposit back instantly.',
  },
]

const FAQS = [
  { q: 'Is it free to list items?', a: 'Yes! Listing is completely free. We only charge a small service fee when a rental is completed.' },
  { q: 'What if an item gets damaged?', a: 'We hold a refundable deposit on every rental. In case of damage, the owner can claim from the deposit. Our support team mediates disputes.' },
  { q: 'How do payments work?', a: 'Payments are processed securely through the platform. Owners receive their earnings after the rental is completed successfully.' },
  { q: 'Can I cancel a rental?', a: 'Yes. Renters can cancel before the rental period starts. Cancellation policies vary by listing.' },
]

export default function HowItWorksPage() {
  const navigate = useNavigate()

  return (
    <div className="static-page">
      <div className="static-hero">
        <div className="hero-bg" />
        <div className="static-hero-inner">
          <div className="section-eyebrow">Getting Started</div>
          <h1 className="static-hero-title">
            How <span className="grad">RentSpace</span><br />works
          </h1>
          <p className="static-hero-sub">
            Four simple steps to start renting or earning. No complicated setup — just sign up and go.
          </p>
        </div>
      </div>

      <div className="section" style={{ maxWidth: 900 }}>
        <div className="steps-grid stagger" style={{ gridTemplateColumns: 'repeat(2, 1fr)', gap: 24, marginBottom: 64 }}>
          {STEPS.map((s) => (
            <div className="step-card" key={s.num}>
              <div className="step-num">{s.num}</div>
              <div className="step-icon">{s.icon}</div>
              <div className="step-title">{s.title}</div>
              <div className="step-body">{s.body}</div>
            </div>
          ))}
        </div>

        <div style={{ marginBottom: 64 }}>
          <div className="section-eyebrow">For Owners</div>
          <h2 className="section-title" style={{ fontSize: 28 }}>Start earning from your stuff</h2>
          <div className="steps-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
            <div className="step-card">
              <div className="step-icon">📸</div>
              <div className="step-title">Create a listing</div>
              <div className="step-body">Add photos, set your price, and describe your item. It takes less than 5 minutes.</div>
            </div>
            <div className="step-card">
              <div className="step-icon">📬</div>
              <div className="step-title">Get requests</div>
              <div className="step-body">Receive rental requests from verified users. Accept or decline with one click.</div>
            </div>
            <div className="step-card">
              <div className="step-icon">💰</div>
              <div className="step-title">Get paid</div>
              <div className="step-body">Earn money from items you already own. Payments are processed securely.</div>
            </div>
          </div>
        </div>

        {/* FAQs */}
        <div style={{ marginBottom: 64 }}>
          <div className="section-eyebrow">FAQ</div>
          <h2 className="section-title" style={{ fontSize: 28 }}>Common questions</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {FAQS.map((faq, i) => (
              <div key={i} className="card" style={{ padding: '20px 24px' }}>
                <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 8 }}>{faq.q}</div>
                <div style={{ color: 'var(--text-2)', fontSize: 14, lineHeight: 1.7 }}>{faq.a}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="cta-section" style={{ margin: '0 0 48px' }}>
          <div className="cta-title">Ready to get started?</div>
          <div className="cta-sub">Join thousands of users already sharing in your community.</div>
          <div className="cta-btns">
            <button className="btn-primary" onClick={() => navigate('/signup')}>Create Account</button>
            <button className="btn-ghost" onClick={() => navigate('/browse')}>Browse Items</button>
          </div>
        </div>
      </div>
    </div>
  )
}
