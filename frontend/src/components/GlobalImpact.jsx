import React from 'react'
import './GlobalImpact.css'

const categories = [
  { label: 'Scholarships', pct: 45, color: '#3d1020' },
  { label: 'Accelerators', pct: 30, color: '#888' },
  { label: 'Research Grants', pct: 25, color: '#ccc' },
]

export default function GlobalImpact() {
  return (
    <section className="impact">
      <div className="container impact__inner">
        {/* Left */}
        <div className="impact__left">
          <span className="section-label">Global Impact</span>
          <h2 className="impact__title">
            Where potential<br />meets power.
          </h2>

          <div className="impact__stat-box">
            <div className="impact__stat-label">Current Active</div>
            <div className="impact__stat-value">14,281</div>
            <div className="impact__stat-sub">Opportunities in EU</div>
            <div className="impact__dots">
              <span className="impact__dot impact__dot--dark" />
              <span className="impact__dot impact__dot--mid" style={{ top: 40, left: 20 }} />
            </div>
          </div>
        </div>

        {/* Right */}
        <div className="impact__right">
          {/* Donut chart */}
          <div className="impact__chart-wrap">
            <div className="impact__donut">
              <svg viewBox="0 0 120 120" className="impact__donut-svg">
                {/* 45% maroon */}
                <circle
                  cx="60" cy="60" r="44"
                  fill="none" stroke="#3d1020" strokeWidth="18"
                  strokeDasharray="124 158"
                  strokeDashoffset="0"
                  strokeLinecap="round"
                  transform="rotate(-90 60 60)"
                />
                {/* 30% grey */}
                <circle
                  cx="60" cy="60" r="44"
                  fill="none" stroke="#888" strokeWidth="18"
                  strokeDasharray="83 200"
                  strokeDashoffset="-124"
                  strokeLinecap="round"
                  transform="rotate(-90 60 60)"
                />
                {/* 25% light */}
                <circle
                  cx="60" cy="60" r="44"
                  fill="none" stroke="#ddd" strokeWidth="18"
                  strokeDasharray="69 213"
                  strokeDashoffset="-207"
                  strokeLinecap="round"
                  transform="rotate(-90 60 60)"
                />
              </svg>
              <div className="impact__donut-center">
                <div className="impact__donut-value">500K+</div>
                <div className="impact__donut-sub">TOTAL</div>
              </div>
            </div>

            <div className="impact__legend">
              {categories.map((c) => (
                <div key={c.label} className="impact__legend-item">
                  <span className="impact__legend-dot" style={{ background: c.color }} />
                  <span>{c.label} ({c.pct}%)</span>
                </div>
              ))}
            </div>
          </div>

          {/* Quote */}
          <blockquote className="impact__quote">
            "Nexora isn't just a database; it's the intelligent tissue connecting
            ambition to resources globally."
          </blockquote>
        </div>
      </div>
    </section>
  )
}
