/**
 * NotFoundPage.jsx — 404 page (demoui design)
 */
import { useNavigate } from 'react-router-dom'

export default function NotFoundPage() {
  const navigate = useNavigate()
  return (
    <div className="static-page" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="hero-bg" style={{ position: 'fixed', inset: 0, zIndex: 0 }} />
      <div style={{ textAlign: 'center', position: 'relative', zIndex: 1, padding: 24 }}>
        <div className="grad" style={{
          fontFamily: "'Rajdhani', sans-serif", fontSize: 'clamp(80px, 15vw, 160px)',
          fontWeight: 800, lineHeight: 1, marginBottom: 16
        }}>404</div>
        <h2 style={{
          fontFamily: "'Rajdhani', sans-serif", fontSize: 28, fontWeight: 700,
          marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.02em'
        }}>Page not found</h2>
        <p style={{ color: 'var(--text-2)', fontSize: 16, marginBottom: 32, maxWidth: 400 }}>
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button className="btn-primary" onClick={() => navigate('/')}>🏠 Back to Home</button>
          <button className="btn-ghost" onClick={() => navigate('/browse')}>🔍 Browse Items</button>
        </div>
      </div>
    </div>
  )
}
