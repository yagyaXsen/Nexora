import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { api } from '../lib/api'
import './Auth.css'

export default function ResetPassword() {
  const [params] = useSearchParams()
  const token = params.get('token') || 'demo-token'
  const navigate = useNavigate()

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [busy, setBusy] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState(null)

  const getStrength = (pass) => {
    if (!pass) return { score: 0, label: 'No password', color: 'bg-slate-200' }
    let score = 0
    if (pass.length >= 6) score++
    if (pass.length >= 10) score++
    if (/[A-Z]/.test(pass)) score++
    if (/[0-9]/.test(pass)) score++
    if (/[^A-Za-z0-9]/.test(pass)) score++

    if (score <= 2) return { score: 33, label: 'Weak', color: 'bg-red-500' }
    if (score <= 4) return { score: 66, label: 'Medium', color: 'bg-amber-500' }
    return { score: 100, label: 'Strong', color: 'bg-emerald-500' }
  }

  const strength = getStrength(password)

  const submit = async (e) => {
    e.preventDefault()
    setError(null)
    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }
    setBusy(true)

    try {
      await api.resetPassword(token, password)
      setSuccess(true)
      setTimeout(() => navigate('/login'), 2500)
    } catch (err) {
      setError(err.message || 'Failed to update password — please try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="min-h-screen w-full bg-white flex flex-col justify-between p-6 sm:p-12 font-sans selection:bg-indigo-500 selection:text-white relative">
      
      {/* Top Full-Width Navigation Bar */}
      <header className="w-full max-w-6xl mx-auto flex items-center justify-between pb-6 border-b border-slate-100">
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 bg-[#0A0A0A] text-white rounded-xl flex items-center justify-center font-mono font-black text-sm shadow-sm">
            N
          </div>
          <span className="font-extrabold tracking-tight text-slate-950 text-lg">NEXORA</span>
        </Link>

        <Link to="/login" className="text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors">
          ← Back to Sign In
        </Link>
      </header>

      {/* Main Full-Page Form Area (No Card Box!) */}
      <main className="w-full max-w-md mx-auto my-auto py-8 space-y-7">

        {!success ? (
          <div className="space-y-6">
            <div className="space-y-2 text-center sm:text-left">
              <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center text-xl font-bold border border-purple-100 shadow-xs mb-3">
                <i className="ti ti-shield-lock" />
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-950 tracking-tight leading-tight">
                Set new password
              </h1>
              <p className="text-sm text-slate-500 font-serif">
                Choose a robust, unique password to secure your account.
              </p>
            </div>

            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-xs font-bold text-red-600 flex items-center gap-2">
                <i className="ti ti-alert-circle text-base shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={submit} className="space-y-5">
              <div className="space-y-1.5">
                <label className="block font-mono text-[10px] uppercase font-bold text-slate-700 tracking-wider">
                  NEW PASSWORD
                </label>
                <div className="relative">
                  <input
                    type={showPass ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full pl-4 pr-11 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium text-slate-900 placeholder-slate-400 focus:bg-white focus:border-indigo-600 focus:ring-4 focus:ring-indigo-50 outline-none transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-base"
                  >
                    <i className={showPass ? 'ti ti-eye-off' : 'ti ti-eye'} />
                  </button>
                </div>

                {password && (
                  <div className="pt-2 space-y-1">
                    <div className="flex items-center justify-between font-mono text-[9px]">
                      <span className="text-slate-400">STRENGTH:</span>
                      <span className="font-bold text-slate-700">{strength.label}</span>
                    </div>
                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${strength.color} transition-all duration-300`}
                        style={{ width: `${strength.score}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="block font-mono text-[10px] uppercase font-bold text-slate-700 tracking-wider">
                  CONFIRM NEW PASSWORD
                </label>
                <input
                  type={showPass ? 'text' : 'password'}
                  required
                  minLength={6}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium text-slate-900 placeholder-slate-400 focus:bg-white focus:border-indigo-600 focus:ring-4 focus:ring-indigo-50 outline-none transition-all"
                />
              </div>

              <button
                type="submit"
                disabled={busy}
                className="w-full bg-[#0A0A0A] hover:bg-indigo-600 text-white font-bold text-sm py-4 rounded-2xl shadow-xl hover:shadow-indigo-600/25 transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {busy ? (
                  <>
                    <i className="ti ti-loader-2 animate-spin text-base" />
                    <span>Updating Credentials…</span>
                  </>
                ) : (
                  <>
                    <span>Reset Password</span>
                    <i className="ti ti-check text-xs" />
                  </>
                )}
              </button>
            </form>
          </div>
        ) : (
          <div className="p-8 bg-slate-50 border border-slate-200 rounded-3xl space-y-6 text-center shadow-lg">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-3xl flex items-center justify-center text-3xl font-bold mx-auto border border-emerald-200 shadow-sm animate-bounce">
              <i className="ti ti-circle-check" />
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-extrabold text-slate-950 tracking-tight">Password Updated!</h2>
              <p className="text-xs text-slate-600 font-serif leading-relaxed max-w-sm mx-auto">
                Your new credentials have been updated. Redirecting to login…
              </p>
            </div>

            <Link
              to="/login"
              className="w-full bg-[#0A0A0A] text-white font-bold text-xs py-3.5 rounded-xl hover:bg-indigo-600 transition-colors inline-block"
            >
              Go to Sign In Now
            </Link>
          </div>
        )}

      </main>

      {/* Full-Width Footer */}
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
