import { useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { useAuth } from '../lib/auth.jsx'
import { isLocalhost, ADMIN_NO_LOGIN } from '../lib/env.js'
import { NexoraLogoIcon } from './common/NexoraLogo.jsx'
import './Nav.css'

export function Logo() {
  return (
    <Link to="/" className="flex items-center gap-2.5 text-slate-950 font-extrabold tracking-tight text-lg group">
      <NexoraLogoIcon className="w-8 h-8 shadow-xs group-hover:scale-105 transition-transform" fillSquare="#000000" fillN="#FFFFFF" />
      <span className="font-extrabold tracking-tight text-slate-950">Nexora</span>
    </Link>
  )
}

export default function Nav() {
  const { user } = useAuth()
  const [mobileOpen, setMobileOpen] = useState(false)
  // Expose the Admin link whenever logged in as admin (or dev no-login mode on localhost)
  const showAdmin = user?.role === 'admin' || user?.email === 'admin@nexora.ai' || (isLocalhost() && ADMIN_NO_LOGIN)

  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-200/80 font-sans transition-all">
      <div className="max-w-[1240px] mx-auto px-6 h-16 flex items-center justify-between">
        
        {/* Brand Logo */}
        <div className="flex items-center gap-3">
          <Logo />
        </div>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-1 font-bold text-xs">
          <NavLink
            to="/explore"
            className={({ isActive }) =>
              `px-3.5 py-2 rounded-xl transition-all ${isActive ? 'bg-slate-100 text-slate-950' : 'text-slate-600 hover:text-slate-950 hover:bg-slate-50'}`
            }
          >
            Discover
          </NavLink>

          {user && (
            <>
              <NavLink
                to="/dashboard"
                className={({ isActive }) =>
                  `px-3.5 py-2 rounded-xl transition-all ${isActive ? 'bg-slate-100 text-slate-950' : 'text-slate-600 hover:text-slate-950 hover:bg-slate-50'}`
                }
              >
                Dashboard
              </NavLink>
              
              <NavLink
                to="/tracker"
                className={({ isActive }) =>
                  `px-3.5 py-2 rounded-xl transition-all ${isActive ? 'bg-slate-100 text-slate-950' : 'text-slate-600 hover:text-slate-950 hover:bg-slate-50'}`
                }
              >
                Tracker
              </NavLink>

              <NavLink
                to="/notifications"
                className={({ isActive }) =>
                  `px-3.5 py-2 rounded-xl transition-all ${isActive ? 'bg-slate-100 text-slate-950' : 'text-slate-600 hover:text-slate-950 hover:bg-slate-50'}`
                }
              >
                Notifications
              </NavLink>

              <NavLink
                to="/settings"
                className={({ isActive }) =>
                  `px-3.5 py-2 rounded-xl transition-all ${isActive ? 'bg-slate-100 text-slate-950' : 'text-slate-600 hover:text-slate-950 hover:bg-slate-50'}`
                }
              >
                Settings
              </NavLink>

              {showAdmin && (
                <NavLink
                  to="/admin"
                  className={({ isActive }) =>
                    `px-3.5 py-2 rounded-xl transition-all ${isActive ? 'bg-red-50 text-red-600' : 'text-slate-600 hover:text-red-600 hover:bg-red-50'}`
                  }
                >
                  <i className="ti ti-shield-lock mr-1" /> Admin
                </NavLink>
              )}
            </>
          )}
        </nav>

        {/* User Account / CTA Actions */}
        <div className="flex items-center gap-3">
          {user ? (
            <Link
              to="/profile"
              className="flex items-center gap-2 bg-slate-50 hover:bg-slate-100 border border-slate-200/80 px-3.5 py-1.5 rounded-2xl text-xs font-bold text-slate-800 transition-all shadow-2xs"
            >
              <div className="w-6 h-6 bg-[#0A0A0A] text-white rounded-full flex items-center justify-center text-[10px] font-extrabold font-mono">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <span className="truncate max-w-[100px]">{user.name.split(' ')[0]}</span>
            </Link>
          ) : (
            <div className="flex items-center gap-2">
              <Link to="/login" className="text-xs font-bold text-slate-600 hover:text-slate-950 px-3 py-2 transition-colors">
                Log in
              </Link>
              <Link to="/signup" className="bg-[#0A0A0A] hover:bg-indigo-600 text-white font-bold text-xs px-4 py-2 rounded-xl transition-all shadow-xs">
                Join Nexora
              </Link>
            </div>
          )}

          {/* Mobile Menu Trigger */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden p-2 text-slate-600 hover:text-slate-950 text-xl font-bold"
            aria-label="Toggle Navigation Menu"
          >
            <i className={mobileOpen ? 'ti ti-x' : 'ti ti-menu-2'} />
          </button>
        </div>

      </div>

      {/* Mobile Navigation Dropdown Menu */}
      {mobileOpen && (
        <div className="md:hidden bg-white border-b border-slate-200 p-6 space-y-3 shadow-xl">
          <NavLink
            to="/explore"
            onClick={() => setMobileOpen(false)}
            className="block py-2 text-sm font-bold text-slate-800 border-b border-slate-100"
          >
            Discover
          </NavLink>
          {user && (
            <>
              <NavLink
                to="/dashboard"
                onClick={() => setMobileOpen(false)}
                className="block py-2 text-sm font-bold text-slate-800 border-b border-slate-100"
              >
                Dashboard
              </NavLink>
              <NavLink
                to="/tracker"
                onClick={() => setMobileOpen(false)}
                className="block py-2 text-sm font-bold text-slate-800 border-b border-slate-100"
              >
                Tracker
              </NavLink>
              <NavLink
                to="/notifications"
                onClick={() => setMobileOpen(false)}
                className="block py-2 text-sm font-bold text-slate-800 border-b border-slate-100"
              >
                Notifications
              </NavLink>
              <NavLink
                to="/settings"
                onClick={() => setMobileOpen(false)}
                className="block py-2 text-sm font-bold text-slate-800"
              >
                Settings
              </NavLink>
              {showAdmin && (
                <NavLink
                  to="/admin"
                  onClick={() => setMobileOpen(false)}
                  className="block py-2 text-sm font-bold text-red-600"
                >
                  Admin Console
                </NavLink>
              )}
            </>
          )}
        </div>
      )}

    </header>
  )
}
