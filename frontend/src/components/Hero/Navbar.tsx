import { motion, useScroll, useTransform, useMotionValue, useSpring } from 'framer-motion'
import { useRef, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { NexoraLogoIcon } from '../common/NexoraLogo.jsx'
import { useAuth } from '../../lib/auth.jsx'

const navLinks = [
  { label: 'Explore', path: '/explore' },
  { label: 'Tracker', path: '/tracker' },
  { label: 'Features', path: '/explore' }
]

function MagneticButton({ children, className, onClick }: { children: React.ReactNode, className?: string, onClick?: () => void }) {
  const ref = useRef<HTMLButtonElement>(null)
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  
  const springConfig = { stiffness: 150, damping: 15, mass: 0.1 }
  const springX = useSpring(x, springConfig)
  const springY = useSpring(y, springConfig)

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!ref.current) return
    const rect = ref.current.getBoundingClientRect()
    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2
    x.set((e.clientX - centerX) * 0.2)
    y.set((e.clientY - centerY) * 0.2)
  }

  const handleMouseLeave = () => {
    x.set(0)
    y.set(0)
  }

  return (
    <motion.button
      ref={ref}
      onClick={onClick}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ x: springX, y: springY }}
      className={`relative ${className}`}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      {children}
    </motion.button>
  )
}

export default function Navbar() {
  const { user } = useAuth()
  const { scrollY } = useScroll()
  const [isScrolled, setIsScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  
  const scale = useTransform(scrollY, [0, 200], [1, 0.96])
  const y = useTransform(scrollY, [0, 200], [0, -8])

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 300) {
        setIsScrolled(true)
      } else {
        setIsScrolled(false)
      }
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Close the mobile menu when the route changes.
  useEffect(() => {
    setMenuOpen(false)
  }, [user])

  return (
    <div className="fixed top-6 left-0 right-0 z-50 flex justify-center px-4 pointer-events-none">
      <motion.nav 
        style={{ scale, y }}
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className={`pointer-events-auto relative rounded-full backdrop-blur-xl flex items-center justify-between px-4 py-2.5 w-full max-w-5xl transition-all duration-300 ${
          isScrolled 
            ? 'bg-slate-900/90 border border-slate-700/80 shadow-2xl text-white' 
            : 'bg-black/50 border border-white/20 shadow-2xl text-white'
        }`}
      >
        {/* Left: Official Nexora SVG Brand Logo */}
        <Link to="/" className="flex items-center gap-2.5 pl-2 group">
          <NexoraLogoIcon className="w-7 h-7 shadow-md group-hover:scale-105 transition-transform" fillSquare="#FFFFFF" fillN="#000000" />
          <span className="text-white font-extrabold tracking-tight text-lg">Nexora</span>
        </Link>

        {/* Center: Links */}
        <div className="hidden lg:flex items-center gap-1">
          {navLinks.map((item, i) => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + i * 0.1, duration: 0.5 }}
            >
              <Link
                to={item.path}
                className="text-slate-300 hover:text-white px-4 py-2 rounded-full text-sm font-medium transition-colors hover:bg-white/10 block"
              >
                {item.label}
              </Link>
            </motion.div>
          ))}
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          {user ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5, type: 'spring' }}
              className="hidden sm:flex items-center gap-2"
            >
              <Link to="/dashboard">
                <MagneticButton className={`font-semibold px-5 py-2.5 rounded-full text-sm shadow-md transition-all flex items-center gap-2 ${
                  isScrolled 
                    ? 'bg-blue-600 text-white hover:bg-blue-500' 
                    : 'bg-white text-slate-950 hover:bg-slate-100'
                }`}>
                  <span>Dashboard</span>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                </MagneticButton>
              </Link>
            </motion.div>
          ) : (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.7 }}
                className="hidden sm:block"
              >
                <Link
                  to="/login"
                  className="text-slate-300 hover:text-white px-4 py-2 text-sm font-medium transition-colors block"
                >
                  Log in
                </Link>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.8, type: 'spring' }}
                className="hidden sm:block"
              >
                <Link to="/signup">
                  <MagneticButton className={`font-semibold px-5 py-2.5 rounded-full text-sm shadow-md transition-all ${
                    isScrolled 
                      ? 'bg-blue-600 text-white hover:bg-blue-500' 
                      : 'bg-white text-slate-950 hover:bg-slate-100'
                  }`}>
                    Start Free
                  </MagneticButton>
                </Link>
              </motion.div>
            </>
          )}

          {/* Mobile Menu Trigger (below lg the center links are hidden) */}
          <button
            type="button"
            aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((v) => !v)}
            className="lg:hidden p-2 -mr-1 text-white/90 hover:text-white transition-colors"
          >
            <i className={`ti ${menuOpen ? 'ti-x' : 'ti-menu-2'} text-xl`} />
          </button>
        </div>
      </motion.nav>          {/* Mobile Dropdown Menu */}
          {menuOpen && (
            <div className="lg:hidden pointer-events-auto absolute top-full left-0 right-0 mt-3 mx-auto w-full max-w-5xl rounded-2xl border border-white/15 bg-slate-950/95 backdrop-blur-xl shadow-2xl p-3 flex flex-col gap-1">
              {user && (
                <Link
                  to="/dashboard"
                  onClick={() => setMenuOpen(false)}
                  className="text-slate-200 hover:text-white hover:bg-white/10 px-4 py-3 rounded-xl text-sm font-medium transition-colors block"
                >
                  Dashboard
                </Link>
              )}
              {navLinks.map((item) => (
                <Link
                  key={item.label}
                  to={item.path}
                  onClick={() => setMenuOpen(false)}
                  className="text-slate-200 hover:text-white hover:bg-white/10 px-4 py-3 rounded-xl text-sm font-medium transition-colors block"
                >
                  {item.label}
                </Link>
              ))}
              {!user && (
                <>
                  <Link
                    to="/login"
                    onClick={() => setMenuOpen(false)}
                    className="text-slate-200 hover:text-white hover:bg-white/10 px-4 py-3 rounded-xl text-sm font-medium transition-colors block"
                  >
                    Log in
                  </Link>
                  <Link
                    to="/signup"
                    onClick={() => setMenuOpen(false)}
                    className="mt-1 bg-white text-slate-950 hover:bg-slate-100 px-4 py-3 rounded-xl text-sm font-semibold transition-colors block text-center"
                  >
                    Start Free
                  </Link>
                </>
              )}
            </div>
          )}
    </div>
  )
}
