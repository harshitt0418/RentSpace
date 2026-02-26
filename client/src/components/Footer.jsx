/**
 * Footer.jsx — Responsive with collapsible accordion sections on mobile
 */
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

export default function Footer() {
  const navigate = useNavigate()
  const [openCol, setOpenCol] = useState(null)

  const toggle = (col) => setOpenCol((prev) => (prev === col ? null : col))

  return (
    <>
      <footer className="site-footer">
        <div>
          <div className="footer-brand">RentSpace</div>
          <div className="footer-desc">
            The trusted peer-to-peer rental marketplace for your community.
          </div>
        </div>
        <div className={`footer-col ${openCol === 'platform' ? 'open' : ''}`}>
          <div className="footer-col-title" onClick={() => toggle('platform')}>Platform</div>
          <div className="footer-col-links">
            <span className="footer-link" onClick={() => navigate('/browse')}>Browse Items</span>
            <span className="footer-link" onClick={() => navigate('/list-item')}>List an Item</span>
            <span className="footer-link" onClick={() => navigate('/how-it-works')}>How It Works</span>
          </div>
        </div>
        <div className={`footer-col ${openCol === 'company' ? 'open' : ''}`}>
          <div className="footer-col-title" onClick={() => toggle('company')}>Company</div>
          <div className="footer-col-links">
            <span className="footer-link" onClick={() => navigate('/community')}>Community</span>
            <span className="footer-link" onClick={() => navigate('/privacy')}>Privacy</span>
            <span className="footer-link" onClick={() => navigate('/terms')}>Terms</span>
          </div>
        </div>
        <div className={`footer-col ${openCol === 'support' ? 'open' : ''}`}>
          <div className="footer-col-title" onClick={() => toggle('support')}>Support</div>
          <div className="footer-col-links">
            <span className="footer-link" onClick={() => navigate('/about')}>Help Center</span>
            <span className="footer-link" onClick={() => navigate('/about')}>Safety</span>
            <span className="footer-link" onClick={() => navigate('/privacy')}>Privacy Policy</span>
            <span className="footer-link" onClick={() => navigate('/terms')}>Terms of Service</span>
          </div>
        </div>
      </footer>
      <div className="footer-bottom">
        <span>© {new Date().getFullYear()} RentSpace. All rights reserved.</span>
      </div>
    </>
  )
}
