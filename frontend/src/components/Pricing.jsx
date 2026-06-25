import React from 'react'
import './Pricing.css'

const proFeatures = [
  'Unlimited Matches',
  'AI Essay Review',
  'Direct Expert Chat',
  'Global CRM Access',
]

const freeFeatures = [
  '5 Matches / Day',
  'Basic Search',
]

export default function Pricing() {
  return (
    <section className="pricing" id="pricing">
      <div className="container">
        <div className="pricing__header">
          <span className="section-label">Pricing</span>
          <h2 className="pricing__title">Invest in your potential.</h2>
        </div>

        <div className="pricing__cards">
          {/* Pro Match — featured */}
          <div className="pricing__card pricing__card--pro">
            <div className="pricing__card-inner">
              <div>
                <span className="pricing__recommended">RECOMMENDED</span>
                <h3 className="pricing__plan-name">Pro Match</h3>
                <p className="pricing__plan-desc">
                  Unlimited matching, AI Copilot, and real-time deadline priority alerts.
                </p>

                <ul className="pricing__features">
                  {proFeatures.map((f) => (
                    <li key={f} className="pricing__feature">
                      <span className="pricing__check">✓</span> {f}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="pricing__pro-right">
                <div className="pricing__price">
                  <span className="pricing__currency">$</span>
                  <span className="pricing__amount">19</span>
                  <span className="pricing__period">/mo</span>
                </div>

                <a href="#signup" className="pricing__cta pricing__cta--pro">Go Pro Now</a>
                <p className="pricing__billing">BILLED ANNUALLY · SAVE 20%</p>
              </div>
            </div>

            {/* Decorative shapes */}
            <div className="pricing__deco pricing__deco--1" />
            <div className="pricing__deco pricing__deco--2" />
          </div>

          {/* Explorer — free */}
          <div className="pricing__card pricing__card--free">
            <h3 className="pricing__plan-name pricing__plan-name--dark">Explorer</h3>
            <p className="pricing__plan-desc pricing__plan-desc--dark">
              Start discovering opportunities for free. Basic filters included.
            </p>

            <ul className="pricing__features pricing__features--dark">
              {freeFeatures.map((f) => (
                <li key={f} className="pricing__feature pricing__feature--dark">
                  <span className="pricing__check pricing__check--dark">✓</span> {f}
                </li>
              ))}
              <li className="pricing__feature pricing__feature--disabled">
                <span className="pricing__check pricing__check--disabled">✕</span> AI Copilot
              </li>
            </ul>

            <a href="#signup" className="pricing__cta pricing__cta--free">Start Free</a>
          </div>
        </div>
      </div>
    </section>
  )
}
