import { Link } from 'react-router-dom'
import { Logo } from './Nav.jsx'
import './Footer.css'

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container footer-inner">
        <div className="footer-brand">
          <Logo light />
          <p className="footer-tagline">
            The world's opportunity intelligence network. Every scholarship,
            fellowship, grant and accelerator — found before its deadline passes.
          </p>
        </div>

        <div className="footer-cols">
          <div className="footer-col">
            <h4>Product</h4>
            <Link to="/explore">Explore</Link>
            <Link to="/dashboard">Dashboard</Link>
            <Link to="/tracker">Application Tracker</Link>
          </div>
          <div className="footer-col">
            <h4>Categories</h4>
            <Link to="/explore?category=scholarship">Scholarships</Link>
            <Link to="/explore?category=fellowship">Fellowships</Link>
            <Link to="/explore?category=grant">Grants</Link>
            <Link to="/explore?category=accelerator">Accelerators</Link>
          </div>
          <div className="footer-col">
            <h4>Account</h4>
            <Link to="/login">Log in</Link>
            <Link to="/signup">Sign up</Link>
            <Link to="/profile">Profile</Link>
          </div>
          <div className="footer-col">
            <h4>Trust & Legal</h4>
            <Link to="/privacy">Privacy Policy</Link>
            <Link to="/terms">Terms of Service</Link>
            <Link to="/contact">Contact & Support</Link>
          </div>
        </div>
      </div>

      <div className="container footer-bottom">
        <span>© 2026 Nexora. A global opportunity intelligence platform.</span>
        <span>Built with FastAPI + React.</span>
      </div>
    </footer>
  )
}
