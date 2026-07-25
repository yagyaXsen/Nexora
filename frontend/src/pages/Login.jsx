import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/auth.jsx'
import './Auth.css'

function GoogleIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
      />
    </svg>
  )
}

function GithubIcon() {
  return (
    <svg className="w-4 h-4 fill-slate-900" viewBox="0 0 24 24">
      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
    </svg>
  )
}

function OrcidIcon() {
  return (
    <svg className="w-4 h-4 fill-[#A6CE39]" viewBox="0 0 24 24">
      <path d="M12 0C5.372 0 0 5.372 0 12s5.372 12 12 12 12-5.372 12-12S18.628 0 12 0zM7.369 4.378c.525 0 .947.431.947.947s-.422.947-.947.947a.95.95 0 01-.947-.947c0-.516.422-.947.947-.947zm-.722 3.038h1.444v10.041H6.647V7.416zm3.562 0h3.9c3.712 0 5.344 2.653 5.344 5.025 0 2.578-2.016 5.016-5.325 5.016h-3.919V7.416zm1.444 1.303v7.434h2.497c2.25 0 3.844-1.453 3.844-3.703 0-2.184-1.547-3.731-3.844-3.731h-2.497z" />
    </svg>
  )
}

function AppleIcon() {
  return (
    <svg className="w-4 h-4 fill-slate-900" viewBox="0 0 24 24">
      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.32c.67-.82 1.13-1.96.99-3.11-.97.04-2.17.65-2.86 1.46-.62.73-1.16 1.89-.99 3.02 1.09.08 2.22-.55 2.86-1.37z" />
    </svg>
  )
}

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = location.state?.from ?? sessionStorage.getItem('nexora_return_to') ?? '/dashboard'
  const showDemoAccount = import.meta.env.VITE_ENABLE_DEMO_ACCOUNT === 'true'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(true)
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)
  const [ssoLoading, setSsoLoading] = useState(null)

  const submit = async (e) => {
    e.preventDefault()
    setError(null)
    setBusy(true)
    try {
      await login(email, password)
      sessionStorage.removeItem('nexora_return_to')
      navigate(from, { replace: true })
    } catch (err) {
      setError(
        err.status === 401
          ? 'Incorrect email or password.'
          : err.message || 'Login failed — please check your network connection.'
      )
    } finally {
      setBusy(false)
    }
  }

  const handleDemoAutofill = () => {
    setEmail('demo@nexora.ai')
    setPassword('nexora2026')
  }

  const handleSocialLogin = (provider) => {
    setSsoLoading(provider)
    setTimeout(() => {
      setSsoLoading(null)
      setEmail(`demo.${provider.toLowerCase()}@nexora.ai`)
      setPassword('nexora2026')
      login('demo@nexora.ai', 'nexora2026').then(() => navigate(from))
    }, 800)
  }

  return (
    <div className="min-h-screen w-full bg-white flex flex-col justify-between p-6 sm:p-12 font-sans selection:bg-indigo-500 selection:text-white relative">
      
      {/* Top Full-Width Navigation Bar */}
      <header className="w-full max-w-6xl mx-auto flex items-center justify-between pb-6 border-b border-slate-100">
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 bg-[#0A0A0A] text-white rounded-xl flex items-center justify-center font-mono font-black text-sm shadow-sm group-hover:bg-indigo-600 transition-colors">
            N
          </div>
          <span className="font-extrabold tracking-tight text-slate-950 text-lg">NEXORA</span>
        </Link>

        <div className="flex items-center gap-4 text-xs">
          <span className="text-slate-500 hidden sm:inline-block">Don't have an account?</span>
          <Link
            to="/signup"
            state={location.state}
            className="bg-slate-100 hover:bg-slate-200 text-slate-900 px-4 py-2 rounded-xl font-bold transition-all"
          >
            Create an Account →
          </Link>
        </div>
      </header>

      {/* Main Full-Page Form Area (No Card Box!) */}
      <main className="w-full max-w-md mx-auto my-auto py-8 space-y-7">
        
        {/* Header Title */}
        <div className="space-y-2 text-center sm:text-left">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-950 tracking-tight leading-tight">
            Sign in to Nexora
          </h1>
          <p className="text-sm text-slate-500 font-serif">
            Access your AI-powered opportunity intelligence platform.
          </p>
        </div>

        {showDemoAccount && <>
        {/* Local/demo-only credentials — never rendered in a public build by default. */}
        <div className="p-4 bg-slate-900 text-white rounded-2xl flex items-center justify-between gap-3 shadow-xl">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-indigo-500/20 border border-indigo-400/30 text-indigo-400 rounded-xl flex items-center justify-center text-base shrink-0">
              <i className="ti ti-sparkles" />
            </div>
            <div>
              <div className="font-bold text-xs text-white">1-Click Demo Account</div>
              <div className="font-mono text-[10px] text-slate-400">demo@nexora.ai / nexora2026</div>
            </div>
          </div>
          <button
            type="button"
            onClick={handleDemoAutofill}
            className="bg-indigo-600 hover:bg-indigo-500 text-white font-mono text-[10px] font-bold px-3 py-1.5 rounded-xl transition-all shadow-md shrink-0 flex items-center gap-1"
          >
            <span>Autofill</span>
            <i className="ti ti-arrow-right text-[10px]" />
          </button>
        </div>

        {/* Social SSO Row */}
        <div className="space-y-2">
          <div className="text-[10px] font-mono uppercase font-bold text-slate-400 text-center tracking-wider">
            INSTITUTIONAL &amp; SOCIAL LOGIN
          </div>
          <div className="grid grid-cols-4 gap-2.5">
            {[
              { id: 'Google', Component: GoogleIcon },
              { id: 'GitHub', Component: GithubIcon },
              { id: 'ORCID', Component: OrcidIcon },
              { id: 'Apple', Component: AppleIcon },
            ].map(({ id, Component }) => (
              <button
                key={id}
                type="button"
                onClick={() => handleSocialLogin(id)}
                disabled={!!ssoLoading}
                className="py-3 px-2 bg-slate-50 border border-slate-200 rounded-2xl hover:border-indigo-400 hover:bg-indigo-50/40 transition-all flex flex-col items-center justify-center gap-1.5 disabled:opacity-50 group"
                title={`Sign in with ${id}`}
              >
                {ssoLoading === id ? (
                  <i className="ti ti-loader-2 animate-spin text-base text-indigo-600" />
                ) : (
                  <Component />
                )}
                <span className="font-mono text-[10px] text-slate-600 font-bold group-hover:text-indigo-600 transition-colors">
                  {id}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="relative flex items-center justify-center">
          <div className="border-t border-slate-200 w-full" />
          <span className="bg-white px-3 font-mono text-[10px] uppercase font-bold text-slate-400 relative">
            OR EMAIL &amp; PASSWORD
          </span>
        </div>
        </>}

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-xs font-bold text-red-600 flex items-center gap-2">
            <i className="ti ti-alert-circle text-base shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={submit} className="space-y-4">
          {/* Email */}
          <div className="space-y-1.5">
            <label htmlFor="login-email" className="block font-mono text-[10px] uppercase font-bold text-slate-700 tracking-wider">
              EMAIL ADDRESS
            </label>
            <input
              id="login-email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@institution.edu"
              className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium text-slate-900 placeholder-slate-400 focus:bg-white focus:border-indigo-600 focus:ring-4 focus:ring-indigo-50 outline-none transition-all"
            />
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label htmlFor="login-password" className="block font-mono text-[10px] uppercase font-bold text-slate-700 tracking-wider">
                PASSWORD
              </label>
              <Link to="/forgot-password" className="font-mono text-xs text-indigo-600 font-bold hover:underline">
                Forgot?
              </Link>
            </div>
            <div className="relative">
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full pl-4 pr-11 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium text-slate-900 placeholder-slate-400 focus:bg-white focus:border-indigo-600 focus:ring-4 focus:ring-indigo-50 outline-none transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-base"
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                <i className={showPassword ? 'ti ti-eye-off' : 'ti ti-eye'} />
              </button>
            </div>
          </div>

          {/* Remember me */}
          <div className="flex items-center justify-between pt-1">
            <label className="flex items-center gap-2.5 cursor-pointer text-xs font-medium text-slate-600 select-none">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 transition-colors"
              />
              <span>Remember this browser for 30 days</span>
            </label>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={busy}
            className="w-full bg-[#0A0A0A] hover:bg-slate-800 text-white font-bold text-sm py-4 rounded-2xl shadow-xl transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 active:scale-98"
          >
            {busy ? (
              <>
                <i className="ti ti-loader-2 animate-spin text-base" />
                <span>Verifying Credentials…</span>
              </>
            ) : (
              <>
                <span>Sign in to Dashboard</span>
                <i className="ti ti-arrow-right text-xs" />
              </>
            )}
          </button>
        </form>

      </main>

      {/* Full-Width Footer */}
      <footer className="w-full max-w-6xl mx-auto pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 font-mono text-[11px] text-slate-400">
        <div>© 2026 Nexora Intelligence Platform · Swiss Standard</div>
        <div className="flex gap-4">
          <Link to="/" className="hover:text-slate-600">Privacy Policy</Link>
          <Link to="/" className="hover:text-slate-600">Terms of Service</Link>
          <Link to="/" className="hover:text-slate-600">Security Standards</Link>
        </div>
      </footer>
    </div>
  )
}
