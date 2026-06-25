import React from 'react'
import './Footer.css'

const nav = {
  Platform:  ['Opportunities', 'AI Match Engine', 'CRM Tracker', 'Copilot Assistant'],
  Resources: ['Success Stories', 'Writing Guides', 'Help Center', 'API Docs'],
  Company:   ['About Us', 'Careers', 'Contact', 'Privacy'],
}

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container footer__inner">
        {/* Brand */}
        <div className="footer__brand">
          <a href="/" className="footer__logo">
            <span className="footer__logo-icon">✳</span>
            <span className="footer__logo-text">Nexora</span>
          </a>
          <p className="footer__tagline">
            The global intelligence network for scholarships, fellowships, and startup opportunities.
          </p>
          <div className="footer__socials">
            <a href="#twitter" className="footer__social" aria-label="Twitter">✕</a>
            <a href="#linkedin" className="footer__social" aria-label="LinkedIn">in</a>
            <a href="#github" className="footer__social" aria-label="GitHub">⌥</a>
          </div>
        </div>

        {/* Nav columns */}
        {Object.entries(nav).map(([col, links]) => (
          <div key={col} className="footer__col">
            <h4 className="footer__col-title">{col}</h4>
            <ul className="footer__col-links">
              {links.map((l) => (
                <li key={l}><a href={`#${l.toLowerCase().replace(/\s+/g, '-')}`}>{l}</a></li>
              ))}
            </ul>
          </div>
        ))}

        {/* System status */}
        <div className="footer__status">
          <div className="footer__status-dot" />
          <div>
            <div className="footer__status-title">System Status</div>
            <div className="footer__status-text">All systems operational.</div>
            <div className="footer__status-text">1,281 new matches in last hour.</div>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="footer__bottom">
        <div className="container footer__bottom-inner">
          <span>© 2026 Nexora Intelligence Corp. All rights reserved.</span>
          <div className="footer__bottom-links">
            <a href="#terms">Terms of Service</a>
            <a href="#cookies">Cookie Policy</a>
          </div>
        </div>
      </div>
    </footer>
  )
}
