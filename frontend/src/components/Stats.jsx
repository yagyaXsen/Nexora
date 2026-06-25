import React from 'react'
import './Stats.css'

const stats = [
  { value: '100K+', label: 'Active Users',      sublabel: 'Verified Talent',   bg: 'light' },
  { value: '500K+', label: 'Opportunities',      sublabel: 'Daily Discoveries', bg: 'maroon' },
  { value: '190+',  label: 'Countries',          sublabel: 'Global Coverage',   bg: 'dark' },
  { value: '$10B+', label: 'Capital Tracked',    sublabel: 'Annual Funding',    bg: 'yellow' },
]

export default function Stats() {
  return (
    <section className="stats" id="intelligence">
      <div className="container">
        <div className="stats__header">
          <span className="section-label">Platform Scale</span>
          <h2 className="stats__title">Numbers that speak volumes.</h2>
        </div>

        <div className="stats__grid">
          {stats.map((s) => (
            <div key={s.label} className={`stats__card stats__card--${s.bg}`}>
              <div className="stats__value">{s.value}</div>
              <div className="stats__label">{s.label}</div>
              <div className="stats__sublabel">{s.sublabel}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
