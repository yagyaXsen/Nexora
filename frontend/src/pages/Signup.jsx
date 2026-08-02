import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useGoogleLogin } from '@react-oauth/google'
import { useAuth } from '../lib/auth.jsx'
import { api } from '../lib/api'
import './Auth.css'

const DOMAIN_OPTIONS = [
  'AI & Machine Learning',
  'Software Engineering',
  'Deeptech & Quantum',
  'Robotics & Hardware',
  'Climate & Clean Energy',
  'Biotech & Healthcare',
  'Business & Finance',
  'Data Science',
]

const DEGREE_OPTIONS = [
  'Master / PhD',
  'Bachelor / Student',
  'Postdoc / Researcher',
  'Founder / Entrepreneur',
  'Industry Professional',
  'Other',
]

export default function Signup() {
  const { signup, loginWithGoogle } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [step, setStep] = useState(1)

  // Step 1: Credentials
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  // Step 2: Degree & Domain
  const [educationLevel, setEducationLevel] = useState('Master / PhD')
  const [selectedDomains, setSelectedDomains] = useState(['AI & Machine Learning'])

  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)

  const getStrength = (pass) => {
    if (!pass) return { score: 0, label: 'None', color: 'bg-slate-200' }
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

  const toggleDomain = (d) => {
    setSelectedDomains((prev) =>
      prev.includes(d) ? prev.filter((item) => item !== d) : [...prev, d]
    )
  }

  const triggerGoogleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setError(null)
      setBusy(true)
      try {
        const result = await loginWithGoogle({ access_token: tokenResponse.access_token })
        if (result?.is_new_user) {
          navigate('/onboarding')
        } else {
          navigate('/dashboard')
        }
      } catch (err) {
        setError(err.message || 'Google Sign-Up failed. Please try again.')
      } finally {
        setBusy(false)
      }
    },
    onError: (errResp) => {
      console.error('Google OAuth Error:', errResp)
      if (errResp?.error === 'invalid_client') {
        setError('Google Client ID invalid. Please update VITE_GOOGLE_CLIENT_ID in frontend/.env with your Google Cloud Console Client ID.')
      } else {
        setError('Google Sign-In popup was closed or cancelled. Please try again.')
      }
      setBusy(false)
    }
  })

  // Step 1 Submission
  const handleStep1Next = async (e) => {
    e.preventDefault()
    setError(null)
    if (!name.trim()) {
      setError('Please enter your full name.')
      return
    }
    if (!email || !email.includes('@')) {
      setError('Please enter a valid email address.')
      return
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }
    setStep(2)
  }

  // Step 2 Submission & Account Creation
  const handleCreateAccount = async () => {
    setError(null)
    setBusy(true)

    try {
      await signup(name.trim(), email, password)

      try {
        await api.updateProfile({
          full_name: name.trim(),
          academic_degree: educationLevel,
          field_of_study: selectedDomains.join(', ') || 'AI & Computer Science',
          interests: selectedDomains,
        })
      } catch {
        /* non-fatal */
      }

      setStep(3)
      setTimeout(() => navigate('/explore'), 2000)
    } catch (err) {
      setError(
        err.status === 409
          ? 'An account with this email already exists — try logging in.'
          : err.message || 'Signup failed — please try again.'
      )
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

        <div className="flex items-center gap-4 text-xs">
          <span className="text-slate-500 hidden sm:inline-block">Already registered?</span>
          <Link
            to="/login"
            state={location.state}
            className="bg-slate-100 hover:bg-slate-200 text-slate-900 px-4 py-2 rounded-xl font-bold transition-all"
          >
            Sign In →
          </Link>
        </div>
      </header>

      {/* Main Full-Page Form Area */}
      <main className="w-full max-w-md mx-auto my-auto py-8 space-y-7">
        
        {/* Step Progress Bar */}
        {step <= 2 && (
          <div className="space-y-2">
            <div className="flex justify-between items-center font-mono text-[10px] font-bold text-slate-400">
              <span className="text-indigo-950 font-extrabold tracking-wider">STEP 0{step} OF 02</span>
              <span className="text-slate-500 font-bold">CALIBRATING VECTOR</span>
            </div>
            <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden flex">
              <div
                className="h-full bg-gradient-to-r from-slate-950 via-indigo-950 to-slate-900 transition-all duration-500"
                style={{ width: `${(step / 2) * 100}%` }}
              />
            </div>
          </div>
        )}

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-xs font-bold text-red-600 flex items-center gap-2">
            <i className="ti ti-alert-circle text-base shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* ════════ STEP 1: Account Credentials ════════ */}
        {step === 1 && (
          <div className="space-y-6">
            <div className="space-y-1 text-center sm:text-left">
              <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-950 tracking-tight leading-tight">
                Create your account
              </h1>
              <p className="text-sm text-slate-500 font-serif">
                Step 1: Account credentials &amp; identity.
              </p>
            </div>

            {/* Google Auth Button */}
            <button
              type="button"
              onClick={() => {
                setError(null)
                setBusy(true)
                try {
                  triggerGoogleLogin()
                } catch {
                  setError('Unable to launch Google Account Picker. Please try again.')
                  setBusy(false)
                }
              }}
              disabled={busy}
              className="w-full py-3.5 px-4 bg-white border-2 border-slate-200 hover:border-slate-400 rounded-2xl text-slate-800 font-bold text-sm flex items-center justify-center gap-3 transition-all shadow-xs hover:shadow-md active:scale-98 disabled:opacity-50"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              <span>Continue with Google</span>
            </button>

            <div className="relative flex items-center justify-center">
              <div className="border-t border-slate-200 w-full" />
              <span className="bg-white px-3 font-mono text-[10px] uppercase font-bold text-slate-400 relative">
                OR REGISTER WITH EMAIL
              </span>
            </div>

            <form onSubmit={handleStep1Next} className="space-y-4">
              <div className="space-y-1.5">
                <label htmlFor="signup-name" className="block font-mono text-[10px] uppercase font-bold text-slate-700 tracking-wider">
                  FULL NAME
                </label>
                <input
                  id="signup-name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Dr. Ariana Chen"
                  className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium text-slate-900 placeholder-slate-400 focus:bg-white focus:border-indigo-600 focus:ring-4 focus:ring-indigo-50 outline-none transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="signup-email" className="block font-mono text-[10px] uppercase font-bold text-slate-700 tracking-wider">
                  EMAIL ADDRESS
                </label>
                <input
                  id="signup-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@institution.edu"
                  className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium text-slate-900 placeholder-slate-400 focus:bg-white focus:border-indigo-600 focus:ring-4 focus:ring-indigo-50 outline-none transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="signup-password" className="block font-mono text-[10px] uppercase font-bold text-slate-700 tracking-wider">
                  PASSWORD
                </label>
                <div className="relative">
                  <input
                    id="signup-password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full pl-4 pr-11 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium text-slate-900 placeholder-slate-400 focus:bg-white focus:border-indigo-600 focus:ring-4 focus:ring-indigo-50 outline-none transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-base"
                  >
                    <i className={showPassword ? 'ti ti-eye-off' : 'ti ti-eye'} />
                  </button>
                </div>
                {password && (
                  <div className="space-y-1 pt-1">
                    <div className="h-1 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${strength.color} transition-all duration-300`}
                        style={{ width: `${strength.score}%` }}
                      />
                    </div>
                    <div className="flex justify-between font-mono text-[9px] text-slate-400 font-bold">
                      <span>STRENGTH</span>
                      <span className="uppercase">{strength.label}</span>
                    </div>
                  </div>
                )}
              </div>

              <button
                type="submit"
                className="w-full bg-[#0A0A0A] hover:bg-slate-800 text-white font-bold text-sm py-4 rounded-2xl shadow-xl transition-all duration-300 flex items-center justify-center gap-2 mt-2"
              >
                <span>Continue to Profile Setup</span>
                <i className="ti ti-arrow-right text-xs" />
              </button>
            </form>
          </div>
        )}

        {/* ════════ STEP 2: Candidate Profile (Degree & Domain) ════════ */}
        {step === 2 && (
          <div className="space-y-6">
            <div className="space-y-1 text-center sm:text-left">
              <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-950 tracking-tight leading-tight">
                Candidate Profile
              </h1>
              <p className="text-sm text-slate-500 font-serif">
                Step 2: Select your degree level and primary domain discipline.
              </p>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); handleCreateAccount(); }} className="space-y-5">
              {/* 1. DEGREE / LEVEL */}
              <div className="space-y-2">
                <label className="block font-mono text-[10px] uppercase font-bold text-slate-700 tracking-wider">
                  DEGREE LEVEL / ROLE
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {DEGREE_OPTIONS.map((deg) => (
                    <button
                      key={deg}
                      type="button"
                      onClick={() => setEducationLevel(deg)}
                      className={`p-3.5 rounded-2xl border text-xs font-bold transition-all text-center ${
                        educationLevel === deg
                          ? 'border-indigo-950 bg-indigo-950 text-white shadow-sm'
                          : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300'
                      }`}
                    >
                      {deg}
                    </button>
                  ))}
                </div>
              </div>

              {/* 2. PRIMARY DOMAIN DISCIPLINE */}
              <div className="space-y-2 pt-2">
                <label className="block font-mono text-[10px] uppercase font-bold text-slate-700 tracking-wider">
                  PRIMARY DOMAIN DISCIPLINE (MULTI-SELECT)
                </label>
                <div className="flex flex-wrap gap-2">
                  {DOMAIN_OPTIONS.map((d) => {
                    const isSel = selectedDomains.includes(d)
                    return (
                      <button
                        key={d}
                        type="button"
                        onClick={() => toggleDomain(d)}
                        className={`px-3.5 py-2 rounded-xl border text-xs font-bold transition-all flex items-center gap-1.5 ${
                          isSel
                            ? 'border-indigo-950 bg-indigo-950 text-white shadow-2xs'
                            : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300'
                        }`}
                      >
                        <span>{isSel ? '✓' : '+'}</span>
                        <span>{d}</span>
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="flex items-center gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="w-1/3 border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs py-3.5 rounded-2xl transition-colors"
                >
                  ← Back
                </button>
                <button
                  type="submit"
                  disabled={busy}
                  className="flex-1 bg-[#0A0A0A] hover:bg-slate-800 text-white font-bold text-sm py-4 rounded-2xl shadow-xl transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {busy ? (
                    <>
                      <i className="ti ti-loader-2 animate-spin text-base" />
                      <span>Creating Account…</span>
                    </>
                  ) : (
                    <>
                      <span>Complete &amp; Discover Opportunities</span>
                      <i className="ti ti-arrow-right text-xs" />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ════════ STEP 3: Success Confirmation ════════ */}
        {step === 3 && (
          <div className="py-12 space-y-6 text-center">
            <div className="w-16 h-16 bg-emerald-500 text-white rounded-3xl mx-auto flex items-center justify-center text-2xl shadow-xl shadow-emerald-500/20 animate-bounce">
              ✓
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-extrabold text-slate-950 tracking-tight">Account Created!</h2>
              <p className="text-xs text-slate-600 font-serif leading-relaxed max-w-sm mx-auto">
                Welcome to Nexora. Launching your personalized opportunity discovery feed…
              </p>
            </div>
          </div>
        )}

      </main>

      {/* Footer */}
      <footer className="w-full max-w-6xl mx-auto pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 font-mono text-[11px] text-slate-400">
        <div>© {new Date().getFullYear()} Nexora Intelligence Platform · Swiss Standard</div>
        <div className="flex gap-4">
          <Link to="/privacy" className="hover:text-slate-600">Privacy Policy</Link>
          <Link to="/terms" className="hover:text-slate-600">Terms of Service</Link>
        </div>
      </footer>
    </div>
  )
}
