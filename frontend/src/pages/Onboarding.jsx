import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../lib/api'
import { useAuth } from '../lib/auth.jsx'
import {
  RocketIcon,
  MicroscopeIcon,
  SchoolIcon,
  TrendingIcon,
  TrophyIcon,
  BriefcaseIcon,
  GlobeIcon,
  GridIcon,
} from '../components/common/Icons.jsx'
import './Onboarding.css'

const OPPORTUNITY_TYPES = [
  { label: 'Fellowships', Icon: RocketIcon, desc: 'Postdoc, research & visiting fellow calls' },
  { label: 'Research Grants', Icon: MicroscopeIcon, desc: 'Institutional & government lab funding' },
  { label: 'Scholarships', Icon: SchoolIcon, desc: 'Fully funded master & doctoral degree awards' },
  { label: 'Accelerators', Icon: TrendingIcon, desc: 'Startup batch equity & non-dilutive funds' },
  { label: 'Competitions', Icon: TrophyIcon, desc: 'Global hackathons & innovation prizes' },
  { label: 'Internships', Icon: BriefcaseIcon, desc: 'Industry research & engineering roles' },
  { label: 'Exchange Programs', Icon: GlobeIcon, desc: 'International travel & visiting programs' },
  { label: 'Explore Everything', Icon: GridIcon, desc: 'Receive all global opportunity calls' },
]

const DOMAIN_OPTIONS = [
  { label: 'AI & Machine Learning', Icon: '🤖' },
  { label: 'Software Engineering', Icon: '💻' },
  { label: 'Deeptech & Quantum', Icon: '⚛️' },
  { label: 'Robotics & Hardware', Icon: '🦾' },
  { label: 'Climate & Clean Energy', Icon: '🌿' },
  { label: 'Biotech & Healthcare', Icon: '🧬' },
  { label: 'Business & Finance', Icon: '💼' },
  { label: 'Product & Design', Icon: '🎨' },
]

const REGION_OPTIONS = [
  { label: 'Europe & UK', flag: '🇪🇺' },
  { label: 'North America (US & Canada)', flag: '🇺🇸' },
  { label: 'Asia & Pacific', flag: '🌏' },
  { label: 'Middle East & MENA', flag: '🐪' },
  { label: 'Global / Remote Only', flag: '🌐' },
]

const TOTAL_STEPS = 2

export default function Onboarding() {
  const navigate = useNavigate()
  const { user } = useAuth()

  const [step, setStep] = useState(1)

  // Step 1: Opportunity Types
  const [selectedTypes, setSelectedTypes] = useState(['Explore Everything'])

  // Step 2: Domains & Target Regions
  const [selectedDomains, setSelectedDomains] = useState(['AI & Machine Learning', 'Software Engineering'])
  const [selectedRegions, setSelectedRegions] = useState(['Europe & UK', 'North America (US & Canada)'])

  // Step 3: Fast Signal Calibration Loading
  const [processingMsg, setProcessingMsg] = useState('Calibrating AI recommendation feed…')

  const toggleType = (label) => {
    if (label === 'Explore Everything') {
      setSelectedTypes(['Explore Everything'])
      return
    }
    const filtered = selectedTypes.filter((t) => t !== 'Explore Everything')
    if (filtered.includes(label)) {
      const next = filtered.filter((t) => t !== label)
      setSelectedTypes(next.length === 0 ? ['Explore Everything'] : next)
    } else {
      setSelectedTypes([...filtered, label])
    }
  }

  const toggleDomain = (domain) => {
    if (selectedDomains.includes(domain)) {
      if (selectedDomains.length > 1) {
        setSelectedDomains(selectedDomains.filter((d) => d !== domain))
      }
    } else {
      setSelectedDomains([...selectedDomains, domain])
    }
  }

  const toggleRegion = (region) => {
    if (selectedRegions.includes(region)) {
      if (selectedRegions.length > 1) {
        setSelectedRegions(selectedRegions.filter((r) => r !== region))
      }
    } else {
      setSelectedRegions([...selectedRegions, region])
    }
  }

  const handleFinish = async () => {
    setStep(3)
    setTimeout(() => setProcessingMsg('Indexing live deadline signals & match scores…'), 500)
    setTimeout(() => setProcessingMsg('AI vector profile complete — redirecting…'), 1100)

    try {
      const payload = {
        full_name: user?.name,
        interests: [...selectedTypes, ...selectedDomains],
        field_of_study: selectedDomains.join(', '),
        target_countries: selectedRegions,
      }
      await api.updateProfile(payload)
    } catch {
      /* Graceful fallback */
    }

    setTimeout(() => navigate('/dashboard', { replace: true }), 1500)
  }

  return (
    <div className="min-h-screen w-full bg-white flex flex-col justify-between p-6 sm:p-12 font-sans selection:bg-indigo-500 selection:text-white relative">
      {/* Top Header Navigation */}
      <header className="w-full max-w-4xl mx-auto flex items-center justify-between pb-6 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 bg-[#0A0A0A] text-white rounded-xl flex items-center justify-center font-mono font-black text-sm shadow-xs">
            N
          </div>
          <span className="font-extrabold tracking-tight text-slate-950 text-lg">NEXORA</span>
          <span className="font-mono text-[9px] font-bold text-slate-400 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-md uppercase ml-1">
            2-STEP SETUP
          </span>
        </div>

        {step <= TOTAL_STEPS && (
          <div className="flex items-center gap-3">
            <div className="flex gap-1.5">
              {Array.from({ length: TOTAL_STEPS }, (_, i) => (
                <div
                  key={i}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    i + 1 === step
                      ? 'w-7 bg-indigo-600'
                      : i + 1 < step
                      ? 'w-2 bg-emerald-500'
                      : 'w-2 bg-slate-200'
                  }`}
                />
              ))}
            </div>
            <span className="font-mono text-[11px] font-bold text-slate-400">
              0{step}/0{TOTAL_STEPS}
            </span>
          </div>
        )}
      </header>

      {/* Main Interactive Step Container */}
      <main className="w-full max-w-3xl mx-auto my-auto py-8 space-y-8">
        {/* ══ STEP 1: OPPORTUNITY TYPES ══ */}
        {step === 1 && (
          <div className="space-y-6">
            <div className="space-y-2">
              <div className="font-mono text-[10px] font-bold text-indigo-600 uppercase tracking-widest flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-indigo-600" /> STEP 01 · OPPORTUNITY FOCUS
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-950 tracking-tight">
                What are you here to discover?
              </h1>
              <p className="text-sm text-slate-500 font-medium leading-relaxed">
                Click to select your opportunity verticals. Multi-select enabled.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {OPPORTUNITY_TYPES.map(({ label, Icon, desc }) => {
                const isSel = selectedTypes.includes(label)
                return (
                  <button
                    key={label}
                    type="button"
                    onClick={() => toggleType(label)}
                    className={`p-4 rounded-2xl border text-left flex items-start gap-3.5 transition-all duration-200 cursor-pointer ${
                      isSel
                        ? 'border-indigo-600 bg-indigo-50/80 text-indigo-950 shadow-sm ring-1 ring-indigo-500/20'
                        : 'border-slate-200/80 bg-slate-50/60 text-slate-700 hover:border-slate-300 hover:bg-slate-100/60'
                    }`}
                  >
                    <div className={`p-2 rounded-xl shrink-0 mt-0.5 ${isSel ? 'bg-indigo-600 text-white' : 'bg-white border border-slate-200 text-slate-500'}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-sm font-extrabold block text-slate-900 mb-0.5">{label}</span>
                      <span className="text-xs text-slate-500 font-medium block leading-snug">{desc}</span>
                    </div>
                  </button>
                )
              })}
            </div>

            <div className="flex items-center justify-between pt-6 border-t border-slate-100">
              <span className="font-mono text-xs text-slate-400 font-bold">
                {selectedTypes.length} SELECTED
              </span>
              <button
                onClick={() => setStep(2)}
                className="bg-[#0A0A0A] hover:bg-indigo-600 text-white font-bold text-sm px-7 py-3.5 rounded-2xl shadow-xl transition-all flex items-center gap-2 cursor-pointer active:scale-98"
              >
                <span>Continue to Fields &amp; Regions</span>
                <i className="ti ti-arrow-right text-xs" />
              </button>
            </div>
          </div>
        )}

        {/* ══ STEP 2: FIELDS & REGIONS (CLICK-ONLY) ══ */}
        {step === 2 && (
          <div className="space-y-8">
            <div className="space-y-2">
              <div className="font-mono text-[10px] font-bold text-indigo-600 uppercase tracking-widest flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-indigo-600" /> STEP 02 · FIELDS &amp; REGIONS
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-950 tracking-tight">
                Select your fields &amp; target regions
              </h1>
              <p className="text-sm text-slate-500 font-medium leading-relaxed">
                Click options to calibrate your AI feed. Zero typing required.
              </p>
            </div>

            {/* Section A: Fields of Study */}
            <div className="space-y-3">
              <span className="font-mono text-xs uppercase font-extrabold text-slate-700 tracking-wider block">
                Primary Fields of Interest
              </span>
              <div className="flex flex-wrap gap-2.5">
                {DOMAIN_OPTIONS.map(({ label, Icon }) => {
                  const isSel = selectedDomains.includes(label)
                  return (
                    <button
                      key={label}
                      type="button"
                      onClick={() => toggleDomain(label)}
                      className={`px-4 py-2.5 rounded-xl border text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                        isSel
                          ? 'border-indigo-600 bg-indigo-600 text-white shadow-xs'
                          : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300 hover:bg-slate-100'
                      }`}
                    >
                      <span>{Icon}</span>
                      <span>{label}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Section B: Target Regions */}
            <div className="space-y-3 pt-2">
              <span className="font-mono text-xs uppercase font-extrabold text-slate-700 tracking-wider block">
                Target Geographic Regions
              </span>
              <div className="flex flex-wrap gap-2.5">
                {REGION_OPTIONS.map(({ label, flag }) => {
                  const isSel = selectedRegions.includes(label)
                  return (
                    <button
                      key={label}
                      type="button"
                      onClick={() => toggleRegion(label)}
                      className={`px-4 py-2.5 rounded-xl border text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                        isSel
                          ? 'border-slate-900 bg-slate-900 text-white shadow-xs'
                          : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300 hover:bg-slate-100'
                      }`}
                    >
                      <span>{flag}</span>
                      <span>{label}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="flex items-center justify-between pt-6 border-t border-slate-100">
              <button
                onClick={() => setStep(1)}
                className="font-mono text-xs font-bold text-slate-500 hover:text-slate-950 flex items-center gap-1.5 cursor-pointer"
              >
                <i className="ti ti-arrow-left text-xs" />
                <span>Back</span>
              </button>
              
              <button
                onClick={handleFinish}
                className="bg-[#0A0A0A] hover:bg-indigo-600 text-white font-bold text-sm px-8 py-3.5 rounded-2xl shadow-xl transition-all flex items-center gap-2 cursor-pointer active:scale-98"
              >
                <span>Complete Profile &amp; Launch Dashboard</span>
                <i className="ti ti-sparkles text-xs" />
              </button>
            </div>
          </div>
        )}

        {/* ══ STEP 3: FAST CALIBRATION ANIMATION ══ */}
        {step === 3 && (
          <div className="py-20 text-center space-y-6">
            <div className="w-16 h-16 bg-[#0A0A0A] text-white rounded-3xl flex items-center justify-center font-mono font-black text-2xl mx-auto shadow-2xl animate-pulse">
              N
            </div>
            <div className="space-y-2">
              <h2 className="font-sans font-extrabold text-2xl text-slate-950">Calibrating Signal Feed</h2>
              <p className="font-mono text-xs text-indigo-600 font-bold uppercase tracking-widest">{processingMsg}</p>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="w-full max-w-4xl mx-auto pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 font-mono text-[11px] text-slate-400">
        <div>© {new Date().getFullYear()} Nexora Intelligence Platform</div>
        <div className="flex gap-4">
          <span>Click-Only Fast Onboarding</span>
        </div>
      </footer>
    </div>
  )
}
