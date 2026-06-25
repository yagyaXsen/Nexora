import React, { useState } from 'react'
import './Testimonials.css'

const featured = {
  quote: 'Nexora didn\'t just find me a scholarship; it found a future I didn\'t know I was eligible for.',
  name: 'Sarah Chen',
  title: 'Gates Cambridge Scholar • AI Researcher',
  initials: 'SC',
}

const cards = [
  {
    quote: '"The match scores are scarily accurate. Nexora understands my ambitions better than I do sometimes. It saved me weeks of manual searching across fragmented university portals."',
    name: 'Marcus Thorne',
    title: 'YC S23 Founder • JSA',
    initials: 'MT',
  },
  {
    quote: '"I never thought a student from Lagos could access these specialized research grants so easily. The platform handles the complexity for you."',
    name: 'Adebayo Okafor',
    title: "Master's Candidate • Nigeria",
    initials: 'AO',
  },
  {
    quote: '"The deadline tracker is an absolute lifesaver. It\'s like having a personal agent that whispers in your ear when a life-changing door is closing."',
    name: 'Elena Rodriguez',
    title: 'Artist-Grantee • Spain',
    initials: 'ER',
  },
]

export default function Testimonials() {
  const [active, setActive] = useState(0)

  return (
    <section className="testimonials">
      <div className="container">
        {/* Featured Quote */}
        <div className="testimonials__featured">
          <span className="section-label section-label--light">Testimonials</span>
          <blockquote className="testimonials__big-quote">
            "{featured.quote}"
          </blockquote>
          <div className="testimonials__featured-author">
            <div className="testimonials__avatar testimonials__avatar--featured">
              {featured.initials}
            </div>
            <div>
              <div className="testimonials__name">{featured.name}</div>
              <div className="testimonials__role">{featured.title}</div>
            </div>
          </div>

          {/* Indicator dots */}
          <div className="testimonials__dots">
            {cards.map((_, i) => (
              <button
                key={i}
                className={`testimonials__dot${i === active ? ' testimonials__dot--active' : ''}`}
                onClick={() => setActive(i)}
              />
            ))}
          </div>
        </div>

        {/* Cards */}
        <div className="testimonials__cards">
          {cards.map((c, i) => (
            <div key={c.name} className={`testimonials__card${i === active ? ' testimonials__card--active' : ''}`}>
              <p className="testimonials__card-quote">{c.quote}</p>
              <div className="testimonials__card-author">
                <div className="testimonials__avatar">{c.initials}</div>
                <div>
                  <div className="testimonials__card-name">{c.name}</div>
                  <div className="testimonials__card-role">{c.title}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
