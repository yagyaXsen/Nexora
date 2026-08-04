import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useGoogleLogin } from '@react-oauth/google'
import { useAuth } from '../lib/auth.jsx'
import './Auth.css'

function GoogleIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24">
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

export default function Login() {
  const { login, loginWithGoogle } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = location.state?.from ?? sessionStorage.getItem('nexora_return_to') ?? '/explore'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(true)
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)
  const [ssoLoading, setSsoLoading] = useState(false)

  const triggerGoogleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setError(null)
      setSsoLoading(true)
      try {
        await loginWithGoogle({ access_token: tokenResponse.access_token })
        sessionStorage.removeItem('nexora_return_to')
        navigate(from, { replace: true })
      } catch (err) {
        setError(err.message || 'Google authentication failed. Please try again.')
      } finally {
        setSsoLoading(false)
      }
    },
    onError: (errResp) => {
      console.error('Google OAuth Error:', errResp)
      if (errResp?.error === 'invalid_client') {
        setError('Google Client ID invalid. Please update VITE_GOOGLE_CLIENT_ID in frontend/.env with your Google Cloud Console Client ID.')
      } else {
        setError('Google Sign-In popup was closed or cancelled. Please try again.')
      }
      setSsoLoading(false)
    }
  })

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

  const handleGoogleSignIn = () => {
    setError(null)
    setSsoLoading(true)
    try {
      triggerGoogleLogin()
    } catch (err) {
      setError('Unable to launch Google Account Picker. Please try again.')
      setSsoLoading(false)
    }
  }

  return (
    <div className="min-h-screen w-full bg-white flex flex-col justify-between p-6 sm:p-12 font-sans selection:bg-indigo-500 selection:text-white relative">
      
      {/* Top Navigation Bar */}
      <header className="w-full max-w-6xl mx-auto flex items-center justify-between pb-6 border-b border-slate-100">
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 bg-[#0A0A0A] text-white rounded-xl flex items-center justify-center font-mono font-black text-sm shadow-sm">
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

      {/* Main Form Area */}
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

        {/* Primary Official Google Auth Button */}
        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={ssoLoading || busy}
          className="w-full py-4 px-4 bg-white border-2 border-slate-200 hover:border-slate-400 rounded-2xl text-slate-800 font-bold text-sm flex items-center justify-center gap-3 transition-all shadow-xs hover:shadow-md active:scale-98 disabled:opacity-50"
        >
          {ssoLoading ? (
            <>
              <i className="ti ti-loader-2 animate-spin text-base text-indigo-600" />
              <span>Opening Official Google Sign-In…</span>
            </>
          ) : (
            <>
              <GoogleIcon />
              <span>Continue with Google</span>
            </>
          )}
        </button>

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
            disabled={busy || ssoLoading}
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

      {/* Footer */}
      <footer className="w-full max-w-6xl mx-auto pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 font-mono text-[11px] text-slate-400">
        <div>© 2026 Nexora Intelligence Platform · Swiss Standard</div>
        <div className="flex gap-4">
          <Link to="/" className="hover:text-slate-600">Privacy Policy</Link>
          <Link to="/" className="hover:text-slate-600">Terms of Service</Link>
        </div>
      </footer>
    </div>
  )
}
