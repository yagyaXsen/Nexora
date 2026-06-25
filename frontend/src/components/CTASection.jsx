import React from 'react'
import './CTASection.css'

export default function CTASection() {
  return (
    <section className="cta">
      <div className="container cta__inner">
        {/* Left */}
        <div className="cta__left">
          <h2 className="cta__title">
            Claim your <em className="cta__italic">future</em>.<br />
            Start today.
          </h2>
          <p className="cta__sub">One platform. Thousands of doors.</p>
          <p className="cta__sub">Join 100,000+ pioneers redefining their global trajectory.</p>
        </div>

        {/* Right */}
        <div className="cta__right">
          <a href="#signup" className="cta__btn cta__btn--primary">Sign up for free</a>
          <a href="#advisor" className="cta__btn cta__btn--outline">Talk to an advisor</a>
          <div className="cta__secure">
            <span className="cta__lock">🔒</span>
            <span>No credit card required</span>
          </div>
        </div>
      </div>
    </section>
  )
}
