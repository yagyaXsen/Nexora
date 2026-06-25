import React from 'react'
import './Features.css'

export default function Features() {
  return (
    <section className="features">
      <div className="container features__grid">
        {/* Left — large Precision Match Engine card */}
        <div className="features__main-card">
          <div className="features__main-icon">⊞</div>
          <h2 className="features__main-title">Precision<br />Match Engine</h2>
          <p className="features__main-desc">
            Our proprietary AI doesn't just search; it understands your unique
            profile to predict your success rate with 94% accuracy.
          </p>
          <div className="features__main-status">
            <div className="features__status-dot" />
            <span>Scanning your profile...</span>
            <span className="features__status-badge">AI Active</span>
          </div>
        </div>

        {/* Right — 2×2 mini cards */}
        <div className="features__mini-grid">
          {/* Global Discovery */}
          <div className="features__mini-card features__mini-card--white">
            <div className="features__mini-icon">🌐</div>
            <h3 className="features__mini-title">Global Discovery</h3>
            <p className="features__mini-desc">
              Tracking 190+ countries and 50k+ local sources daily.
            </p>
          </div>

          {/* Smart Alerts */}
          <div className="features__mini-card features__mini-card--yellow">
            <div className="features__mini-icon">🔔</div>
            <h3 className="features__mini-title">Smart Alerts</h3>
            <p className="features__mini-desc">
              Never miss a deadline again with AI-prioritized notifications.
            </p>
          </div>

          {/* Application Tracker */}
          <div className="features__mini-card features__mini-card--white features__mini-card--wide">
            <div className="features__tracker-top">
              <div className="features__mini-icon-sm">⊟</div>
              <h3 className="features__mini-title">Application Tracker</h3>
            </div>
            <p className="features__mini-desc">
              Manage your entire discovery to acceptance journey in one unified CRM.
            </p>
            <div className="features__tracker-badges">
              <span className="features__tracker-badge features__tracker-badge--green">✓ Accepted</span>
              <span className="features__tracker-badge features__tracker-badge--orange">◎ Interview</span>
              <span className="features__tracker-badge features__tracker-badge--grey">+ Planning</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
