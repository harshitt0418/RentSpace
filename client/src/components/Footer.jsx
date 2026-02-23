/**
 * Footer.jsx — Responsive with proper links
 */
import { useNavigate } from 'react-router-dom'

export default function Footer() {
  const navigate = useNavigate()

  return (
    <>
      <footer className="site-footer">
        <div>
          <div className="footer-brand">RentSpace</div>
          <div className="footer-desc">
            The trusted peer-to-peer rental marketplace for your community.
          </div>
        </div>
        <div>
          <div className="footer-col-title">Platform</div>
          <span className="footer-link" onClick={() => navigate('/browse')}>Browse Items</span>
          <span className="footer-link" onClick={() => navigate('/list-item')}>List an Item</span>
          <span className="footer-link" onClick={() => navigate('/how-it-works')}>How It Works</span>
        </div>
        <div>
          <div className="footer-col-title">Company</div>
          <span className="footer-link" onClick={() => navigate('/community')}>Community</span>
          <span className="footer-link" onClick={() => navigate('/privacy')}>Privacy</span>
          <span className="footer-link" onClick={() => navigate('/terms')}>Terms</span>
        </div>
        <div>
          <div className="footer-col-title">Support</div>
          <span className="footer-link" onClick={() => navigate('/about')}>Help Center</span>
          <span className="footer-link" onClick={() => navigate('/about')}>Safety</span>
          <span className="footer-link" onClick={() => navigate('/privacy')}>Privacy Policy</span>
          <span className="footer-link" onClick={() => navigate('/terms')}>Terms of Service</span>
        </div>
      </footer>
      <div className="footer-bottom">
        <span>© {new Date().getFullYear()} RentSpace. All rights reserved.</span>
        <span>Built with 🤍 for communities</span>
      </div>
    </>
  )
}
