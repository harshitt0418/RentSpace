/**
 * AboutPage.jsx — Static about page
 */
import { useNavigate } from 'react-router-dom'

export default function AboutPage() {
  const navigate = useNavigate()

  return (
    <div className="static-page">
      <div className="static-hero">
        <div className="hero-bg" />
        <div className="static-hero-inner">
          <div className="section-eyebrow">About Us</div>
          <h1 className="static-hero-title">
            Built for <span className="grad">communities</span>,<br />
            powered by <span className="grad-2">trust</span>.
          </h1>
          <p className="static-hero-sub">
            RentSpace connects neighbors so they can share the things they already own.
            Less waste, more access, stronger communities.
          </p>
        </div>
      </div>

      <div className="section" style={{ maxWidth: 800 }}>
        <h2 className="section-title" style={{ fontSize: 28 }}>Our Mission</h2>
        <p style={{ color: 'var(--text-2)', fontSize: 16, lineHeight: 1.8, marginBottom: 40 }}>
          We believe that most items people buy are used only a fraction of the time.
          A power drill sits idle 99% of its life. A camping tent might be used twice a year.
          RentSpace exists to unlock the value of these idle assets — letting owners earn and
          renters save, while reducing overconsumption.
        </p>

        <div className="steps-grid" style={{ marginBottom: 48 }}>
          <div className="step-card">
            <div className="step-icon">🌍</div>
            <div className="step-title">Sustainability First</div>
            <div className="step-body">Every rental means one less purchase. By sharing instead of buying, we reduce waste and carbon footprints together.</div>
          </div>
          <div className="step-card">
            <div className="step-icon">🤝</div>
            <div className="step-title">Trust & Safety</div>
            <div className="step-body">Verified profiles, real reviews, secure payments, and built-in deposit protection keep every transaction safe.</div>
          </div>
          <div className="step-card">
            <div className="step-icon">💸</div>
            <div className="step-title">Fair Economics</div>
            <div className="step-body">No listing fees. We only earn when you do — a small service fee on successful rentals.</div>
          </div>
        </div>

        <h2 className="section-title" style={{ fontSize: 28 }}>The Team</h2>
        <p style={{ color: 'var(--text-2)', fontSize: 16, lineHeight: 1.8, marginBottom: 40 }}>
          RentSpace started as a college project and grew into a real platform used by thousands.
          Our small team is passionate about the sharing economy, great design, and building
          products that make a difference in everyday life.
        </p>

        <div className="cta-section" style={{ margin: '0 0 48px' }}>
          <div className="cta-title">Ready to join?</div>
          <div className="cta-sub">Start renting or listing today — it's completely free.</div>
          <div className="cta-btns">
            <button className="btn-primary" onClick={() => navigate('/signup')}>Create Account</button>
            <button className="btn-ghost" onClick={() => navigate('/browse')}>Browse Items</button>
          </div>
        </div>
      </div>
    </div>
  )
}
