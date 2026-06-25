import React from 'react'
import { Link } from 'react-router-dom'

/**
 * AuthBrand — the maroon split-screen panel shared by Login & Signup.
 * Collapses on small screens (handled in auth.css).
 */
export default function AuthBrand({ eyebrow, headline, sub }) {
  return (
    <div className="auth__brand">
      <Link to="/" className="auth__brand-logo">
        <span className="auth__brand-logo-ico">N</span>
        Nexora
      </Link>

      <div className="auth__brand-body">
        {eyebrow && <div className="auth__brand-eyebrow">{eyebrow}</div>}
        <h2 className="auth__brand-headline">{headline}</h2>
        <p className="auth__brand-sub">{sub}</p>

        <div className="auth__brand-proof">
          <div className="auth__brand-avatars">
            <span className="auth__brand-avatar" style={{ background: '#E8C07D' }} />
            <span className="auth__brand-avatar" style={{ background: '#C97B63' }} />
            <span className="auth__brand-avatar" style={{ background: '#7D9E8A' }} />
            <span className="auth__brand-avatar" style={{ background: '#9E7DA8' }} />
          </div>
          <span className="auth__brand-proof-txt">
            Join 12,000+ students & researchers tracking opportunities.
          </span>
        </div>
      </div>
    </div>
  )
}
