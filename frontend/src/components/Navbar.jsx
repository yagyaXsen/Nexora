import React, { useState, useEffect } from 'react'
import './Navbar.css'

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header className={`navbar${scrolled ? ' navbar--scrolled' : ''}`}>
      <div className="container navbar__inner">
        {/* Logo */}
        <a href="/" className="navbar__logo">
          <span className="navbar__logo-icon">✳</span>
          <span className="navbar__logo-text">Nexora</span>
        </a>

        {/* Nav links */}
        <nav className="navbar__links">
          <a href="#opportunities">Opportunities</a>
          <a href="#intelligence">Intelligence</a>
          <a href="#pricing">Pricing</a>
          <a href="#case-studies">Case Studies</a>
        </nav>

        {/* Actions */}
        <div className="navbar__actions">
          <a href="#login" className="navbar__login">Log in</a>
          <a href="#signup" className="navbar__cta">Get Started Free</a>
        </div>
      </div>
    </header>
  )
}
