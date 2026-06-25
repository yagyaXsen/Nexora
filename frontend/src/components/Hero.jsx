import React from 'react'
import './Hero.css'

export default function Hero() {
  return (
    <section className="hero">
      <div className="container hero__inner">
        {/* Left column */}
        <div className="hero__left">
          <div className="badge hero__badge">
            <span className="hero__badge-dot">✦</span>
            Trusted by 100K+ Users
          </div>

          <h1 className="hero__headline">
            The world is<br />
            <em className="hero__italic">your</em>{' '}
            <span>stage.</span>
          </h1>

          <p className="hero__subtext">
            Unlock billions in global scholarships, fellowships,
            and grants through Nexora's AI-powered intelligence platform.
          </p>

          <div className="hero__actions">
            <a href="#opportunities" className="hero__cta-primary">
              Explore Opportunities <span>↗</span>
            </a>
          </div>

          <div className="hero__social-proof">
            <div className="hero__avatars">
              {['#e8c5a0','#c5a8d4','#a8c5d4'].map((bg, i) => (
                <span key={i} className="hero__avatar" style={{ background: bg, zIndex: 3 - i }} />
              ))}
            </div>
            <span className="hero__proof-text">Join 12k new users this month</span>
          </div>

          <div className="hero__notification">
            <div className="hero__notif-avatar" />
            <div>
              <div className="hero__notif-label">Recent Match</div>
              <div className="hero__notif-text">Amara from Lagos just secured a $50k Grant</div>
            </div>
          </div>
        </div>

        {/* Right column */}
        <div className="hero__right">
          {/* Live Intelligence card */}
          <div className="hero__live-card">
            <div className="hero__live-header">
              <span className="hero__live-dot" />
              <span className="hero__live-label">Live Intelligence</span>
              <span className="hero__globe-icon">🌐</span>
            </div>
            <h2 className="hero__live-title">Match with your potential.</h2>
            <div className="hero__search-bar">
              <span className="hero__search-icon">🔍</span>
              <input
                type="text"
                placeholder="Describe your dream fellowship..."
                className="hero__search-input"
                readOnly
              />
              <span className="hero__search-shortcut">⌘K</span>
            </div>
          </div>

          {/* Match cards */}
          <div className="hero__match-cards">
            <div className="hero__match-card hero__match-card--yellow">
              <div className="hero__match-top">
                <span className="hero__match-icon">📚</span>
                <span className="hero__match-pct">98% Match</span>
              </div>
              <div className="hero__match-name">Gates Cambridge</div>
              <div className="hero__match-meta">UK • FULLY FUNDED</div>
              <div className="hero__match-bar">
                <div className="hero__match-fill" style={{ width: '98%' }} />
              </div>
            </div>

            <div className="hero__match-card hero__match-card--white">
              <div className="hero__match-top">
                <span className="hero__match-icon">🚀</span>
                <span className="hero__match-pct hero__match-pct--grey">94% Match</span>
              </div>
              <div className="hero__match-name">YC S24 Accelerator</div>
              <div className="hero__match-meta">USA • $500K INVESTMENT</div>
              <div className="hero__match-bar">
                <div className="hero__match-fill hero__match-fill--dark" style={{ width: '94%' }} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
