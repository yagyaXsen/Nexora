import React, { useState } from 'react'
import { Outlet, NavLink, Link, useNavigate } from 'react-router-dom'
import { Avatar, Button } from '../ui'
import { useAuth } from '../../lib/auth'
import './layout.css'

const PRIMARY_NAV = [
  { to: '/app', label: 'Dashboard', icon: '◫', end: true },
  { to: '/app/opportunities', label: 'Opportunities', icon: '🔍' },
  { to: '/app/tracker', label: 'Tracker', icon: '☰' },
  { to: '/app/reminders', label: 'Reminders', icon: '🔔' },
  { to: '/app/intelligence', label: 'Intelligence', icon: '⚡' },
]

const COMMUNITY_NAV = [
  { to: '/app/community', label: 'Hub', icon: '◎', end: true },
  { to: '/app/community/stories', label: 'Stories', icon: '★' },
  { to: '/app/community/questions', label: 'Q&A', icon: '?' },
  { to: '/app/community/mentors', label: 'Mentors', icon: '✦' },
  { to: '/app/community/tips', label: 'Tips', icon: '✎' },
]

function SideLink({ to, label, icon, end, onNavigate }) {
  return (
    <NavLink
      to={to}
      end={end}
      onClick={onNavigate}
      className={({ isActive }) => `app-side__link${isActive ? ' is-active' : ''}`}
    >
      <span className="app-side__ico" aria-hidden>
        {icon}
      </span>
      {label}
    </NavLink>
  )
}

/**
 * AppLayout — authenticated shell: dark sidebar + sticky topbar.
 * Child routes render through <Outlet />.
 */
export default function AppLayout() {
  const [sideOpen, setSideOpen] = useState(false)
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const closeSide = () => setSideOpen(false)
  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className={`app${sideOpen ? ' app--side-open' : ''}`}>
      <aside className="app-side">
        <Link to="/app" className="app-side__logo" onClick={closeSide}>
          <span className="app-side__logo-ico">✳</span>
          <span className="app-side__logo-txt">Nexora</span>
        </Link>

        <nav className="app-side__nav">
          {PRIMARY_NAV.map((item) => (
            <SideLink key={item.to} {...item} onNavigate={closeSide} />
          ))}
        </nav>

        <div className="app-side__section">Community</div>
        <nav className="app-side__nav">
          {COMMUNITY_NAV.map((item) => (
            <SideLink key={item.to} {...item} onNavigate={closeSide} />
          ))}
        </nav>

        <div className="app-side__spacer" />
        <SideLink to="/app/profile" label="Profile & Settings" icon="⚙" onNavigate={closeSide} />
      </aside>

      <div className="app-main">
        <header className="app-top">
          <div className="app-top__user">
            <Button variant="ghost" size="sm" onClick={() => setSideOpen((o) => !o)} aria-label="Toggle menu">
              ☰
            </Button>
          </div>
          <div className="app-top__right">
            <div className="app-top__user">
              <Avatar name={user?.name || 'Explorer'} size="sm" />
              <div>
                <div className="app-top__user-name">{user?.name || 'Explorer'}</div>
                <div className="app-top__user-role">{user?.email || 'Welcome back'}</div>
              </div>
            </div>
            <Button variant="subtle" size="sm" onClick={handleLogout}>
              Log out
            </Button>
          </div>
        </header>

        <main className="app-content">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
