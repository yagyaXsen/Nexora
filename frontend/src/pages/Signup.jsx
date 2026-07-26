import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/auth.jsx'
import { api } from '../lib/api'
import { AtomIcon, SchoolIcon, RocketIcon, BriefcaseIcon } from '../components/common/Icons.jsx'
import './Auth.css'

const USER_ROLES = [
  { id: 'Researcher', label: 'Researcher / Postdoc', Icon: AtomIcon },
  { id: 'Student', label: 'Student / Scholar', Icon: SchoolIcon },
  { id: 'Founder', label: 'Founder / Entrepreneur', Icon: RocketIcon },
  { id: 'Professional', label: 'Industry Professional', Icon: BriefcaseIcon },
]

const VERTICAL_OPTIONS = [
  'Fellowships',
  'Research Grants',
  'Residencies',
  'Scholarships',
  'Accelerators',
  'Competitions',
]

const DOMAIN_OPTIONS = [
  'AI & Machine Learning',
  'Deeptech & Quantum',
  'Robotics & Hardware',
  'Climate & Clean Energy',
  'Biotech & Health',
  'Software Systems',
]

export default function Signup() {
  const { signup } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [step, setStep] = useState(1)

  // Step 1: Credentials
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState('Researcher')
  const [showPassword, setShowPassword] = useState(false)

  // Step 2: Academic Profile
  const [institution, setInstitution] = useState('ETH Zurich')
  const [educationLevel, setEducationLevel] = useState('Master / PhD')
  const [residence, setResidence] = useState('Switzerland')
  const [citizenship, setCitizenship] = useState('Switzerland, Global')

  // Step 3: Opportunity Focus
  const [selectedVerticals, setSelectedVerticals] = useState(['Fellowships', 'Research Grants'])
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

  const toggleVertical = (v) => {
    setSelectedVerticals((prev) =>
      prev.includes(v) ? prev.filter((item) => item !== v) : [...prev, v]
    )
  }

  const toggleDomain = (d) => {
    setSelectedDomains((prev) =>
      prev.includes(d) ? prev.filter((item) => item !== d) : [...prev, d]
    )
  }

  const handleStep1Next = (e) => {
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

  const handleStep2Next = (e) => {
    e.preventDefault()
    setStep(3)
  }

  const handleCreateAccount = async () => {
    setError(null)
    setBusy(true)

    try {
      await signup(name.trim(), email, password)

      try {
        await api.updateProfile({
          academic_degree: educationLevel,
          institution,
          residence,
          citizenship,
          interests: [...selectedVerticals, ...selectedDomains],
        })
      } catch {
        /* non-fatal */
      }

      setStep(4)
      setTimeout(() => navigate('/onboarding'), 2200)
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
        {step <= 3 && (
          <div className="space-y-2">
            <div className="flex justify-between items-center font-mono text-[10px] font-bold text-slate-400">
              <span className="text-indigo-600 font-extrabold">STEP 0{step} OF 03</span>
              <span>CALIBRATING VECTOR</span>
            </div>
            <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden flex">
              <div
                className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 transition-all duration-500"
                style={{ width: `${(step / 3) * 100}%` }}
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

        {/* ════════ STEP 1: Account Information ════════ */}
        {step === 1 && (
          <div className="space-y-6">
            <div className="space-y-1 text-center sm:text-left">
              <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-950 tracking-tight leading-tight">
                Create your account
              </h1>
              <p className="text-sm text-slate-500 font-serif">
                Step 1: Account credentials &amp; primary role.
              </p>
            </div>

            <form onSubmit={handleStep1Next} className="space-y-4">
              <div className="space-y-1.5">
                <label htmlFor="signup-name" className="block font-mono text-[10px] uppercase font-bold text-slate-700 tracking-wider">
                  FULL NAME &amp; TITLE
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
                  placeholder="ariana@ethz.ch"
                  className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium text-slate-900 placeholder-slate-400 focus:bg-white focus:border-indigo-600 focus:ring-4 focus:ring-indigo-50 outline-none transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block font-mono text-[10px] uppercase font-bold text-slate-700 tracking-wider">
                  PRIMARY ARCHETYPE
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {USER_ROLES.map(({ id, label, Icon }) => {
                    const isSel = role === id
                    return (
                      <button
                        key={id}
                        type="button"
                        onClick={() => setRole(id)}
                        className={`p-3 rounded-xl border text-left flex items-center gap-2.5 transition-all ${
                          isSel
                            ? 'border-indigo-600 bg-indigo-50/80 text-indigo-950 font-bold shadow-xs'
                            : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300'
                        }`}
                      >
                        <Icon className={`w-4 h-4 shrink-0 ${isSel ? 'text-indigo-600' : 'text-slate-400'}`} />
                        <span className="text-xs">{label}</span>
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="signup-password" className="block font-mono text-[10px] uppercase font-bold text-slate-700 tracking-wider">
                  PASSWORD (6+ CHARS)
                </label>
                <div className="relative">
                  <input
                    id="signup-password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={6}
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
                  <div className="pt-1.5 space-y-1">
                    <div className="flex justify-between font-mono text-[9px]">
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

              <button
                type="submit"
                className="w-full bg-[#0A0A0A] hover:bg-indigo-600 text-white font-bold text-sm py-4 rounded-2xl shadow-xl hover:shadow-indigo-600/25 transition-all duration-300 flex items-center justify-center gap-2 mt-2"
              >
                <span>Continue to Profile</span>
                <i className="ti ti-arrow-right text-xs" />
              </button>
            </form>
          </div>
        )}

        {/* ════════ STEP 2: Basic Profile ════════ */}
        {step === 2 && (
          <div className="space-y-6">
            <div className="space-y-1 text-center sm:text-left">
              <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-950 tracking-tight leading-tight">
                Academic Footprint
              </h1>
              <p className="text-sm text-slate-500 font-serif">
                Step 2: Tell us your institution and location footprint.
              </p>
            </div>

            <form onSubmit={handleStep2Next} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block font-mono text-[10px] uppercase font-bold text-slate-700 tracking-wider">
                  INSTITUTION / UNIVERSITY
                </label>
                <input
                  type="text"
                  required
                  value={institution}
                  onChange={(e) => setInstitution(e.target.value)}
                  placeholder="ETH Zurich"
                  className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium text-slate-900 placeholder-slate-400 focus:bg-white focus:border-indigo-600 focus:ring-4 focus:ring-indigo-50 outline-none transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block font-mono text-[10px] uppercase font-bold text-slate-700 tracking-wider">
                  DEGREE LEVEL / ROLE TITLE
                </label>
                <input
                  type="text"
                  required
                  value={educationLevel}
                  onChange={(e) => setEducationLevel(e.target.value)}
                  placeholder="Postdoctoral Fellow / Master Student"
                  className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium text-slate-900 placeholder-slate-400 focus:bg-white focus:border-indigo-600 focus:ring-4 focus:ring-indigo-50 outline-none transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="block font-mono text-[10px] uppercase font-bold text-slate-700 tracking-wider">
                    RESIDENCE
                  </label>
                  <input
                    type="text"
                    required
                    value={residence}
                    onChange={(e) => setResidence(e.target.value)}
                    placeholder="Switzerland"
                    className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium text-slate-900 outline-none focus:bg-white focus:border-indigo-600 transition-all"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block font-mono text-[10px] uppercase font-bold text-slate-700 tracking-wider">
                    CITIZENSHIP
                  </label>
                  <input
                    type="text"
                    required
                    value={citizenship}
                    onChange={(e) => setCitizenship(e.target.value)}
                    placeholder="Global / EU"
                    className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium text-slate-900 outline-none focus:bg-white focus:border-indigo-600 transition-all"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="w-1/3 border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs py-3.5 rounded-2xl transition-colors"
                >
                  ← Back
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-[#0A0A0A] hover:bg-indigo-600 text-white font-bold text-sm py-3.5 rounded-2xl shadow-xl hover:shadow-indigo-600/25 transition-all duration-300 flex items-center justify-center gap-2"
                >
                  <span>Continue to Focus</span>
                  <i className="ti ti-arrow-right text-xs" />
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ════════ STEP 3: Opportunity Focus ════════ */}
        {step === 3 && (
          <div className="space-y-6">
            <div className="space-y-1 text-center sm:text-left">
              <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-950 tracking-tight leading-tight">
                Opportunity Focus
              </h1>
              <p className="text-sm text-slate-500 font-serif">
                Step 3: Select your target program verticals &amp; disciplines.
              </p>
            </div>

            <div className="space-y-5">
              <div className="space-y-2">
                <div className="font-mono text-[10px] uppercase font-bold text-slate-700 tracking-wider">
                  PROGRAM VERTICALS (MULTI-SELECT)
                </div>
                <div className="flex flex-wrap gap-2">
                  {VERTICAL_OPTIONS.map((v) => {
                    const isSel = selectedVerticals.includes(v)
                    return (
                      <button
                        key={v}
                        type="button"
                        onClick={() => toggleVertical(v)}
                        className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-all flex items-center gap-1.5 ${
                          isSel
                            ? 'border-indigo-600 bg-indigo-50 text-indigo-700 shadow-2xs'
                            : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300'
                        }`}
                      >
                        <span>{isSel ? '✓' : '+'}</span>
                        <span>{v}</span>
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="space-y-2">
                <div className="font-mono text-[10px] uppercase font-bold text-slate-700 tracking-wider">
                  DOMAIN DISCIPLINES
                </div>
                <div className="flex flex-wrap gap-2">
                  {DOMAIN_OPTIONS.map((d) => {
                    const isSel = selectedDomains.includes(d)
                    return (
                      <button
                        key={d}
                        type="button"
                        onClick={() => toggleDomain(d)}
                        className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-all flex items-center gap-1.5 ${
                          isSel
                            ? 'border-purple-600 bg-purple-50 text-purple-700 shadow-2xs'
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

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="w-1/3 border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs py-3.5 rounded-2xl transition-colors"
                >
                  ← Back
                </button>
                <button
                  type="button"
                  onClick={handleCreateAccount}
                  disabled={busy}
                  className="flex-1 bg-[#0A0A0A] hover:bg-slate-800 text-white font-bold text-sm py-3.5 rounded-2xl shadow-xl transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 active:scale-98"
                >
                  {busy ? (
                    <>
                      <i className="ti ti-loader-2 animate-spin text-base" />
                      <span>Initializing AI Vector…</span>
                    </>
                  ) : (
                    <>
                      <span>Complete &amp; Launch</span>
                      <i className="ti ti-sparkles text-xs" />
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ════════ STEP 4: Confirmation Success State ════════ */}
        {step === 4 && (
          <div className="p-8 bg-slate-50 border border-slate-200 rounded-3xl space-y-6 text-center shadow-lg">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-3xl flex items-center justify-center text-3xl font-bold mx-auto border border-emerald-200 shadow-sm animate-bounce">
              <i className="ti ti-circle-check" />
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-extrabold text-slate-950 tracking-tight">Account Created!</h2>
              <p className="text-xs text-slate-600 font-serif leading-relaxed max-w-sm mx-auto">
                Welcome to Nexora. Launching your signal calibration onboarding…
              </p>
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
