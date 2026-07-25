import { useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../lib/api'
import './Auth.css'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [busy, setBusy] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState(null)

  const submit = async (e) => {
    e.preventDefault()
    if (!email) return
    setError(null)
    setBusy(true)

    try {
      await api.forgotPassword(email)
      setSent(true)
    } catch (err) {
      setError(err.message || 'Failed to dispatch reset link — please try again.')
    } finally {
      setBusy(false)
    }
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

        <Link to="/login" className="text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors">
          ← Back to Sign In
        </Link>
      </header>

      {/* Main Full-Page Form Area (No Card Box!) */}
      <main className="w-full max-w-md mx-auto my-auto py-8 space-y-7">

        {!sent ? (
          <div className="space-y-6">
            <div className="space-y-2 text-center sm:text-left">
              <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center text-xl font-bold border border-indigo-100 shadow-xs mb-3">
                <i className="ti ti-key" />
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-950 tracking-tight leading-tight">
                Recover your account
              </h1>
              <p className="text-sm text-slate-500 font-serif leading-relaxed">
                Enter your registered email address. We'll send an instant magic link to reset your password.
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
                <label htmlFor="recovery-email" className="block font-mono text-[10px] uppercase font-bold text-slate-700 tracking-wider">
                  REGISTERED EMAIL ADDRESS
                </label>
                <div className="relative">
                  <i className="ti ti-mail absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-base" />
                  <input
                    id="recovery-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@institution.edu"
                    className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium text-slate-900 placeholder-slate-400 focus:bg-white focus:border-indigo-600 focus:ring-4 focus:ring-indigo-50 outline-none transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={busy}
                className="w-full bg-[#0A0A0A] hover:bg-indigo-600 text-white font-bold text-sm py-4 rounded-2xl shadow-xl hover:shadow-indigo-600/25 transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {busy ? (
                  <>
                    <i className="ti ti-loader-2 animate-spin text-base" />
                    <span>Dispatching Link…</span>
                  </>
                ) : (
                  <>
                    <span>Send Recovery Link</span>
                    <i className="ti ti-arrow-right text-xs" />
                  </>
                )}
              </button>
            </form>
          </div>
        ) : (
          <div className="p-8 bg-slate-50 border border-slate-200 rounded-3xl space-y-6 text-center shadow-lg">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-3xl flex items-center justify-center text-3xl font-bold mx-auto border border-emerald-200 shadow-sm animate-bounce">
              <i className="ti ti-mail-check" />
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-extrabold text-slate-950 tracking-tight">Check your inbox</h2>
              <p className="text-xs text-slate-600 font-serif leading-relaxed max-w-sm mx-auto">
                We've dispatched a password reset link to <strong className="text-slate-900 font-sans">{email}</strong>.
              </p>
            </div>

            <div className="pt-2 border-t border-slate-200 flex flex-col gap-3">
              <button
                onClick={() => setSent(false)}
                className="text-xs font-bold text-indigo-600 hover:underline font-mono"
              >
                Didn't receive it? Resend email →
              </button>
              <Link
                to="/login"
                className="w-full bg-[#0A0A0A] text-white font-bold text-xs py-3 rounded-xl hover:bg-indigo-600 transition-colors inline-block"
              >
                Return to Sign In
              </Link>
            </div>
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
