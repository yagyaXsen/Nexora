import React from 'react'
import './HowItWorks.css'

const steps = [
  {
    num: '01',
    title: 'Personalized Profile',
    desc: 'Define your identity, academic background, and future goals in simple terms. Nexora\'s AI builds a multidimensional profile of your potential.',
    side: 'left',
    visual: (
      <div className="hiw__photo-wrap">
        <div className="hiw__photo-placeholder">
          <div className="hiw__photo-person" />
        </div>
      </div>
    ),
  },
  {
    num: '02',
    title: 'AI Discovery',
    desc: 'Our engine crawls 50,000+ sources including "hidden" opportunities that never reach major search engines, filtered specifically for your profile.',
    side: 'right',
    visual: (
      <div className="hiw__scan-card">
        <div className="hiw__scan-icon">🗄</div>
        <div className="hiw__scan-bar" />
        <div className="hiw__scan-bar hiw__scan-bar--short" />
        <div className="hiw__scan-label">
          <span>Scanning...</span>
          <span className="hiw__scan-count">14 New Matches</span>
        </div>
      </div>
    ),
  },
  {
    num: '03',
    title: 'Automated Success',
    desc: 'Track deadlines, manage documents, and use our AI Copilot to refine your application essays for maximum matching probability.',
    side: 'left',
    visual: (
      <div className="hiw__tracker-card">
        {[
          { name: 'Rhodes Scholarship', status: 'Applied', color: 'green' },
          { name: 'Stanford GSB Fellowship', status: 'Interviewing', color: 'orange' },
        ].map((r) => (
          <div key={r.name} className="hiw__tracker-row">
            <span className="hiw__tracker-name">{r.name}</span>
            <span className={`hiw__tracker-badge hiw__tracker-badge--${r.color}`}>{r.status}</span>
          </div>
        ))}
      </div>
    ),
  },
]

export default function HowItWorks() {
  return (
    <section className="hiw">
      <div className="container">
        <h2 className="hiw__title">Your trajectory,<br />simplified.</h2>

        <div className="hiw__timeline">
          {/* Center line */}
          <div className="hiw__line" />

          {steps.map((step, i) => (
            <div key={step.num} className={`hiw__step hiw__step--${step.side}`}>
              {/* Content */}
              <div className={`hiw__content ${step.side === 'left' ? 'hiw__content--right' : 'hiw__content--left'}`}>
                <span className="hiw__num">{step.num}</span>
                <h3 className="hiw__step-title">{step.title}</h3>
                <p className="hiw__step-desc">{step.desc}</p>
              </div>

              {/* Circle on line */}
              <div className="hiw__node">
                <span className="hiw__node-inner">{i === 0 ? '◉' : i === 1 ? '⊞' : '✓'}</span>
              </div>

              {/* Visual */}
              <div className={`hiw__visual ${step.side === 'left' ? 'hiw__visual--left' : 'hiw__visual--right'}`}>
                {step.visual}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
