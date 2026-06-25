import React from 'react'
import './Partners.css'

const partners = [
  { name: 'MIT', icon: '△' },
  { name: 'Stanford', icon: '🎓' },
  { name: 'World Bank', icon: '🏛' },
  { name: 'Google', icon: 'G' },
]

export default function Partners() {
  return (
    <section className="partners">
      <div className="container partners__inner">
        {partners.map((p) => (
          <div key={p.name} className="partners__item">
            <span className="partners__icon">{p.icon}</span>
            <span className="partners__name">{p.name}</span>
          </div>
        ))}
      </div>
    </section>
  )
}
