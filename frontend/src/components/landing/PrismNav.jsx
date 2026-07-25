import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../lib/auth.jsx'
import { Logo } from '../Nav.jsx'

export default function PrismNav() {
  const { user } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)

  const closeMenu = () => setMenuOpen(false)

  return (
    <header className="prism-nav" data-open={menuOpen}>
      <div className="prism-nav__inner">
        <div className="prism-nav__brand">
          <Logo />
        </div>

        <button
          className="prism-nav__menu"
          type="button"
          aria-expanded={menuOpen}
          aria-controls="prism-navigation"
          aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'}
          onClick={() => setMenuOpen((open) => !open)}
        >
          <i className={menuOpen ? 'ti ti-x' : 'ti ti-menu-2'} aria-hidden="true" />
        </button>

        <nav id="prism-navigation" className={`prism-nav__links${menuOpen ? ' is-open' : ''}`} aria-label="Primary navigation">
          <a href="#discover" onClick={closeMenu}>Discover</a>
          <a href="#intelligence" onClick={closeMenu}>Intelligence</a>
          <a href="#workflow" onClick={closeMenu}>For Teams</a>
          <Link to="/explore" onClick={closeMenu}>Journal</Link>
        </nav>

        <div className="prism-nav__actions">
          {user ? (
            <Link className="prism-button prism-button--dark prism-button--compact" to="/dashboard">
              Go to Dashboard
            </Link>
          ) : (
            <>
              <Link className="prism-nav__text-link" to="/login">Log in</Link>
              <Link className="prism-button prism-button--dark prism-button--compact" to="/signup">
                Request access
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
