import React, { useState } from 'react'
import './LiveFeed.css'

const opportunities = [
  {
    category: 'Research',
    match: 99,
    title: 'Schwarzman Scholars at Tsinghua',
    desc: 'A fully-funded one-year Master\'s degree and leadership program in Beijing.',
    location: 'Beijing, China',
    deadline: '4 Days Left',
    cta: 'Quick Apply',
    ctaStyle: 'dark',
  },
  {
    category: 'Startups',
    match: 96,
    title: 'Techstars New York City',
    desc: 'Three-month accelerator for high-growth startups with $120k funding.',
    location: 'New York, USA',
    deadline: '12 Days Left',
    cta: 'View Details',
    ctaStyle: 'outline',
  },
  {
    category: 'Arts',
    match: 91,
    title: 'Fulbright Arts Grant',
    desc: 'Funding for artists to pursue independent study and research abroad.',
    location: 'Global',
    deadline: '3 Weeks Left',
    cta: 'Apply via Nexora',
    ctaStyle: 'dark',
  },
]

export default function LiveFeed() {
  const [active, setActive] = useState(0)
  const total = opportunities.length

  const prev = () => setActive((a) => (a - 1 + total) % total)
  const next = () => setActive((a) => (a + 1) % total)

  const visible = [
    opportunities[active % total],
    opportunities[(active + 1) % total],
    opportunities[(active + 2) % total],
  ]

  return (
    <section className="livefeed" id="opportunities">
      <div className="container">
        <div className="livefeed__header">
          <div>
            <span className="section-label section-label--rust">Live Feed</span>
            <h2 className="livefeed__title">Closing soon, near you.</h2>
          </div>
          <div className="livefeed__nav">
            <button className="livefeed__nav-btn" onClick={prev} aria-label="Previous">‹</button>
            <button className="livefeed__nav-btn" onClick={next} aria-label="Next">›</button>
          </div>
        </div>

        <div className="livefeed__cards">
          {visible.map((opp, i) => (
            <div key={`${opp.title}-${i}`} className="livefeed__card">
              <div className="livefeed__card-top">
                <span className="livefeed__category">{opp.category}</span>
                <span className="livefeed__match">{opp.match}%</span>
              </div>

              <h3 className="livefeed__card-title">{opp.title}</h3>
              <p className="livefeed__card-desc">{opp.desc}</p>

              <div className="livefeed__card-meta">
                <span>📍 {opp.location}</span>
                <span>⏱ {opp.deadline}</span>
              </div>

              <button className={`livefeed__card-cta livefeed__card-cta--${opp.ctaStyle}`}>
                {opp.cta} {opp.ctaStyle === 'dark' ? '→' : '◎'}
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
