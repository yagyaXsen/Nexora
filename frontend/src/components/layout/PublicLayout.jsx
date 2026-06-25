import React, { useEffect, useState } from 'react'
import { Outlet, Link, NavLink } from 'react-router-dom'
import { Button } from '../ui'
import './layout.css'

const NAV_LINKS = [
  { to: '/product', label: 'Product' },
  { to: '/explore', label: 'Explore' },
  { to: '/pricing', label: 'Pricing' },
  { to: '/about', label: 'About' },
]

const FOOTER_COLS = {
  Platform: [
    { label: 'Opportunities', to: '/explore' },
    { label: 'Product', to: '/product' },
    { label: 'Pricing', to: '/pricing' },
  ],
  Company: [
    { label: 'About', to: '/about' },
    { label: 'Contact', to: '/contact' },
  ],
  Legal: [
    { label: 'Terms', to: '/terms' },
    { label: 'Privacy', to: '/privacy' },
  ],
}

export function PublicNav() {
  const [scrolled, setScrolled] = useState(false)
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header className={`pub-nav${scrolled ? ' pub-nav--scrolled' : ''}`}>
      <div className="container pub-nav__inner">
        <Link to="/" className="pub-nav__logo">
          <span className="pub-nav__logo-icon">✳</span>
          <span className="pub-nav__logo-text">Nexora</span>
        </Link>
        <nav className="pub-nav__links">
          {NAV_LINKS.map((l) => (
            <NavLink key={l.to} to={l.to} className={({ isActive }) => (isActive ? 'is-active' : undefined)}>
              {l.label}
            </NavLink>
          ))}
        </nav>
        <div className="pub-nav__actions">
          <Link to="/login" className="pub-nav__login">
            Log in
          </Link>
          <Button as={Link} to="/signup" size="sm">
            Get Started Free
          </Button>
        </div>
      </div>
    </header>
  )
}

export function PublicFooter() {
  return (
    <footer className="pub-footer">
      <div className="container pub-footer__inner">
        <div>
          <Link to="/" className="pub-footer__logo">
            <span className="pub-footer__logo-ico">✳</span>
            <span className="pub-footer__logo-txt">Nexora</span>
          </Link>
          <p className="pub-footer__tagline">
            The global intelligence network for scholarships, fellowships, grants, and startup
            opportunities.
          </p>
        </div>
        {Object.entries(FOOTER_COLS).map(([col, links]) => (
          <div key={col}>
            <h4 className="pub-footer__col-title">{col}</h4>
            <ul className="pub-footer__links">
              {links.map((l) => (
                <li key={l.to}>
                  <Link to={l.to}>{l.label}</Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="pub-footer__bottom">
        <div className="container pub-footer__bottom-inner">
          <span>© 2026 Nexora Intelligence Corp. All rights reserved.</span>
        </div>
      </div>
    </footer>
  )
}

/**
 * PublicLayout — shared chrome for secondary marketing pages
 * (Product, Pricing, Explore, About, Contact, Legal).
 * The Home/landing page renders its own bespoke nav + footer.
 */
export default function PublicLayout() {
  return (
    <div className="pub">
      <PublicNav />
      <main className="pub__main">
        <Outlet />
      </main>
      <PublicFooter />
    </div>
  )
}
