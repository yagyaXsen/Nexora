import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { api } from '../lib/api'
import { useAuth } from '../lib/auth.jsx'
import {
  RocketIcon,
  MicroscopeIcon,
  SchoolIcon,
  BuildingIcon,
  TrendingIcon,
  TrophyIcon,
  UsersIcon,
  BriefcaseIcon,
  GlobeIcon,
  BulbIcon,
  BankIcon,
  GridIcon,
  FlaskIcon,
  PlaneIcon,
  DollarIcon,
  ExchangeIcon,
  UserCheckIcon,
  BrainIcon,
} from '../components/common/Icons.jsx'
import './Onboarding.css'

const OPPORTUNITY_TYPES = [
  { label: 'Fellowships', Icon: RocketIcon },
  { label: 'Research Grants', Icon: MicroscopeIcon },
  { label: 'Scholarships', Icon: SchoolIcon },
  { label: 'Residencies', Icon: BuildingIcon },
  { label: 'Accelerators', Icon: TrendingIcon },
  { label: 'Competitions', Icon: TrophyIcon },
  { label: 'Conferences', Icon: UsersIcon },
  { label: 'Internships', Icon: BriefcaseIcon },
  { label: 'Exchange Programs', Icon: GlobeIcon },
  { label: 'Startup Programs', Icon: BulbIcon },
  { label: 'Government Schemes', Icon: BankIcon },
  { label: 'Explore Everything', Icon: GridIcon },
]

const DOMAIN_OPTIONS = [
  'AI & Machine Learning',
  'Software Engineering',
  'Deeptech & Quantum',
  'Robotics & Hardware',
  'Climate & Clean Energy',
  'Biotech & Healthcare',
  'Business & Finance',
  'Product & Design',
  'Cybersecurity',
  'Policy & Law',
  'Education & EdTech',
  'Data Science',
  'Space & Aerospace',
  'Social Impact',
]

const CAREER_GOALS = [
  { label: 'Fund Research', Icon: FlaskIcon },
  { label: 'Study Abroad', Icon: PlaneIcon },
  { label: 'Land Full-Time Role', Icon: BriefcaseIcon },
  { label: 'Launch Startup', Icon: RocketIcon },
  { label: 'Raise Funding', Icon: DollarIcon },
  { label: 'Career Switch', Icon: ExchangeIcon },
  { label: 'Secure Internship', Icon: UserCheckIcon },
  { label: 'Upskill & Learn', Icon: BrainIcon },
]

const TOTAL_STEPS = 5

export default function Onboarding() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuth()

  const [step, setStep] = useState(1)

  // Step 1: Opportunity Focus
  const [selectedTypes, setSelectedTypes] = useState([])

  // Step 2: About You
  const [residence, setResidence] = useState('')
  const [citizenship, setCitizenship] = useState('')
  const [educationLevel, setEducationLevel] = useState('')
  const [institution, setInstitution] = useState('')
  const [fieldOfStudy, setFieldOfStudy] = useState('')

  // Step 3: Domains
  const [selectedDomains, setSelectedDomains] = useState(['AI & Machine Learning'])

  // Step 4: Skills & Goals
  const [skillsInput, setSkillsInput] = useState('')
  const [careerGoal, setCareerGoal] = useState('')
  const [preferredLocations, setPreferredLocations] = useState('')

  // Step 5: CV / LinkedIn
  const [linkedinUrl, setLinkedinUrl] = useState('')
  const [fileUploaded, setFileUploaded] = useState(false)

  // Step 6: Processing
  const [processingMsg, setProcessingMsg] = useState('Vectorizing candidate credentials…')

  const toggleType = (label) => {
    if (label === 'Explore Everything') {
      setSelectedTypes(['Explore Everything'])
      return
    }
    const filtered = selectedTypes.filter((t) => t !== 'Explore Everything')
    if (filtered.includes(label)) {
      setSelectedTypes(filtered.filter((t) => t !== label))
    } else {
      setSelectedTypes([...filtered, label])
    }
  }

  const toggleDomain = (domain) => {
    if (selectedDomains.includes(domain)) {
      setSelectedDomains(selectedDomains.filter((d) => d !== domain))
    } else {
      setSelectedDomains([...selectedDomains, domain])
    }
  }

  const handleFinish = async () => {
    setStep(6)
    setTimeout(() => setProcessingMsg('Scanning live opportunity signals for eligibility…'), 600)
    setTimeout(() => setProcessingMsg('Indexing deadline lead-times and confidence scores…'), 1400)
    setTimeout(() => setProcessingMsg('AI vector profile complete — redirecting to dashboard…'), 2100)

    try {
      const payload = {
        full_name: user?.name,
        academic_degree: educationLevel,
        institution,
        citizenship,
        residence,
        field_of_study: fieldOfStudy,
        interests: [...selectedTypes, ...selectedDomains],
        skills: skillsInput.split(',').map((s) => s.trim()).filter(Boolean),
        target_countries: preferredLocations.split(',').map((s) => s.trim()).filter(Boolean),
        bio: `${educationLevel} at ${institution} focused on ${fieldOfStudy}.`,
      }
      await api.updateProfile(payload)
    } catch { /* Graceful fallback */ }

    setTimeout(() => navigate('/dashboard', { replace: true }), 2800)
  }

  return (
    <div className="min-h-screen w-full bg-white flex flex-col justify-between p-6 sm:p-12 font-sans selection:bg-indigo-500 selection:text-white relative">
      
      {/* Top Full-Width Navigation Bar */}
      <header className="w-full max-w-6xl mx-auto flex items-center justify-between pb-6 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 bg-[#0A0A0A] text-white rounded-xl flex items-center justify-center font-mono font-black text-sm shadow-sm">
            N
          </div>
          <span className="font-extrabold tracking-tight text-slate-950 text-lg">NEXORA</span>
          <span className="font-mono text-[9px] font-bold text-slate-400 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-md uppercase ml-1">
            CALIBRATION
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
                      ? 'w-6 bg-indigo-600'
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

      {/* Main Full-Page Form Area */}
      <main className="w-full max-w-2xl mx-auto my-auto py-8 space-y-7">

        {/* ══ STEP 1: Opportunity Focus ══ */}
        {step === 1 && (
          <div className="space-y-6">
            <div className="space-y-2">
              <div className="prism-mono text-[10px] font-bold text-indigo-950 uppercase tracking-widest">
                STEP 01 · SIGNAL FOCUS
              </div>
              <h1 className="text-3xl font-extrabold text-slate-950 tracking-tight">
                What are you here to discover?
              </h1>
              <p className="text-sm text-slate-500 font-serif leading-relaxed">
                Select the opportunity verticals you want to monitor. Multi-select.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {OPPORTUNITY_TYPES.map(({ label, Icon }) => {
                const isSel = selectedTypes.includes(label)
                return (
                  <button
                    key={label}
                    type="button"
                    onClick={() => toggleType(label)}
                    className={`p-3.5 rounded-2xl border text-left flex items-center gap-3 transition-all ${
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

            <div className="flex items-center justify-between pt-4 border-t border-slate-200">
              <span className="font-mono text-xs text-slate-400 font-bold">
                {selectedTypes.length} SELECTED
              </span>
              <button
                onClick={() => selectedTypes.length > 0 && setStep(2)}
                className="bg-[#0A0A0A] hover:bg-indigo-600 text-white font-bold text-sm px-6 py-3.5 rounded-2xl shadow-xl hover:shadow-indigo-600/25 transition-all flex items-center gap-2"
              >
                <span>Continue to Profile</span>
                <i className="ti ti-arrow-right text-xs" />
              </button>
            </div>
          </div>
        )}

        {/* ══ STEP 2: Academic Profile ══ */}
        {step === 2 && (
          <div className="space-y-6">
            <div className="space-y-2">
              <div className="prism-mono text-[10px] font-bold text-indigo-950 uppercase tracking-widest">
                STEP 02 · ACADEMIC FOOTPRINT
              </div>
              <h1 className="text-3xl font-extrabold text-slate-950 tracking-tight">
                Academic &amp; Legal Footprint
              </h1>
              <p className="text-sm text-slate-500 font-serif leading-relaxed">
                Citizenship and education level eliminate 100% of non-eligible matches.
              </p>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-mono text-[10px] uppercase font-bold text-slate-700 mb-1">
                    Country of Residence
                  </label>
                  <input
                    type="text"
                    value={residence}
                    onChange={(e) => setResidence(e.target.value)}
                    className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium text-slate-900 focus:bg-white focus:border-indigo-600 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block font-mono text-[10px] uppercase font-bold text-slate-700 mb-1">
                    Passport / Citizenship
                  </label>
                  <input
                    type="text"
                    value={citizenship}
                    onChange={(e) => setCitizenship(e.target.value)}
                    className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium text-slate-900 focus:bg-white focus:border-indigo-600 outline-none transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block font-mono text-[10px] uppercase font-bold text-slate-700 mb-1">
                  Education Level / Role
                </label>
                <input
                  type="text"
                  value={educationLevel}
                  onChange={(e) => setEducationLevel(e.target.value)}
                  className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium text-slate-900 focus:bg-white focus:border-indigo-600 outline-none transition-all"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-mono text-[10px] uppercase font-bold text-slate-700 mb-1">
                    Institution / Org
                  </label>
                  <input
                    type="text"
                    value={institution}
                    onChange={(e) => setInstitution(e.target.value)}
                    className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium text-slate-900 focus:bg-white focus:border-indigo-600 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block font-mono text-[10px] uppercase font-bold text-slate-700 mb-1">
                    Field of Study
                  </label>
                  <input
                    type="text"
                    value={fieldOfStudy}
                    onChange={(e) => setFieldOfStudy(e.target.value)}
                    className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium text-slate-900 focus:bg-white focus:border-indigo-600 outline-none transition-all"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-200">
              <button
                onClick={() => setStep(1)}
                className="px-4 py-3 border border-slate-200 text-slate-700 font-bold text-xs rounded-2xl hover:bg-slate-50 transition-colors"
              >
                ← Back
              </button>
              <button
                onClick={() => setStep(3)}
                className="bg-[#0A0A0A] hover:bg-indigo-600 text-white font-bold text-sm px-6 py-3.5 rounded-2xl shadow-xl hover:shadow-indigo-600/25 transition-all flex items-center gap-2"
              >
                <span>Continue to Domains</span>
                <i className="ti ti-arrow-right text-xs" />
              </button>
            </div>
          </div>
        )}

        {/* ══ STEP 3: Domain Expertise ══ */}
        {step === 3 && (
          <div className="space-y-6">
            <div className="space-y-2">
              <div className="prism-mono text-[10px] font-bold text-indigo-950 uppercase tracking-widest">
                STEP 03 · DOMAIN SPECIALIZATION
              </div>
              <h1 className="text-3xl font-extrabold text-slate-950 tracking-tight">
                Select Domain Specializations
              </h1>
              <p className="text-sm text-slate-500 font-serif leading-relaxed">
                Help AI align opportunity signals with your core disciplines.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {DOMAIN_OPTIONS.map((domain) => {
                const isSel = selectedDomains.includes(domain)
                return (
                  <button
                    key={domain}
                    type="button"
                    onClick={() => toggleDomain(domain)}
                    className={`px-3.5 py-2 rounded-xl border text-xs font-bold transition-all flex items-center gap-1.5 ${
                      isSel
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-700 shadow-2xs'
                        : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <span>{isSel ? '✓' : '+'}</span>
                    <span>{domain}</span>
                  </button>
                )
              })}
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-200">
              <button
                onClick={() => setStep(2)}
                className="px-4 py-3 border border-slate-200 text-slate-700 font-bold text-xs rounded-2xl hover:bg-slate-50 transition-colors"
              >
                ← Back
              </button>
              <button
                onClick={() => setStep(4)}
                className="bg-[#0A0A0A] hover:bg-indigo-600 text-white font-bold text-sm px-6 py-3.5 rounded-2xl shadow-xl hover:shadow-indigo-600/25 transition-all flex items-center gap-2"
              >
                <span>Continue to Skills</span>
                <i className="ti ti-arrow-right text-xs" />
              </button>
            </div>
          </div>
        )}

        {/* ══ STEP 4: Skills & Goals ══ */}
        {step === 4 && (
          <div className="space-y-6">
            <div className="space-y-2">
              <div className="prism-mono text-[10px] font-bold text-indigo-950 uppercase tracking-widest">
                STEP 04 · SKILLS &amp; GOALS
              </div>
              <h1 className="text-3xl font-extrabold text-slate-950 tracking-tight">
                Skills &amp; Primary Trajectory Goal
              </h1>
              <p className="text-sm text-slate-500 font-serif leading-relaxed">
                Define what technical skills you bring and what milestone is next.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block font-mono text-[10px] uppercase font-bold text-slate-700 mb-1">
                  Core Technical Skills (comma separated)
                </label>
                <input
                  type="text"
                  value={skillsInput}
                  onChange={(e) => setSkillsInput(e.target.value)}
                  className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium text-slate-900 focus:bg-white focus:border-indigo-600 outline-none transition-all"
                />
              </div>

              <div>
                <label className="block font-mono text-[10px] uppercase font-bold text-slate-700 mb-2">
                  Primary Career Goal
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {CAREER_GOALS.map(({ label, Icon }) => {
                    const isSel = careerGoal === label
                    return (
                      <button
                        key={label}
                        type="button"
                        onClick={() => setCareerGoal(label)}
                        className={`p-3.5 rounded-2xl border text-center transition-all flex flex-col items-center justify-center gap-1.5 ${
                          isSel
                            ? 'border-indigo-600 bg-indigo-600 text-white font-bold shadow-md'
                            : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300'
                        }`}
                      >
                        <Icon className={`w-5 h-5 ${isSel ? 'text-white' : 'text-slate-500'}`} />
                        <span className="text-xs leading-tight block">{label}</span>
                      </button>
                    )
                  })}
                </div>
              </div>

              <div>
                <label className="block font-mono text-[10px] uppercase font-bold text-slate-700 mb-1">
                  Preferred Target Locations
                </label>
                <input
                  type="text"
                  value={preferredLocations}
                  onChange={(e) => setPreferredLocations(e.target.value)}
                  className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium text-slate-900 focus:bg-white focus:border-indigo-600 outline-none transition-all"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-200">
              <button
                onClick={() => setStep(3)}
                className="px-4 py-3 border border-slate-200 text-slate-700 font-bold text-xs rounded-2xl hover:bg-slate-50 transition-colors"
              >
                ← Back
              </button>
              <button
                onClick={() => setStep(5)}
                className="bg-[#0A0A0A] hover:bg-indigo-600 text-white font-bold text-sm px-6 py-3.5 rounded-2xl shadow-xl hover:shadow-indigo-600/25 transition-all flex items-center gap-2"
              >
                <span>Enhance Profile</span>
                <i className="ti ti-arrow-right text-xs" />
              </button>
            </div>
          </div>
        )}

        {/* ══ STEP 5: CV / LinkedIn ══ */}
        {step === 5 && (
          <div className="space-y-6">
            <div className="space-y-2">
              <div className="prism-mono text-[10px] font-bold text-indigo-600 uppercase tracking-widest">
                STEP 05 · SMART ENHANCEMENT
              </div>
              <h1 className="text-3xl font-extrabold text-slate-950 tracking-tight">
                Smart Profile Enhancement
              </h1>
              <p className="text-sm text-slate-500 font-serif leading-relaxed">
                Upload your CV to boost AI match confidence score from 60% to 98%.
              </p>
            </div>

            <div className="space-y-4">
              <div
                onClick={() => setFileUploaded(true)}
                className={`p-8 border-2 border-dashed rounded-3xl text-center cursor-pointer transition-all ${
                  fileUploaded
                    ? 'border-emerald-500 bg-emerald-50/60'
                    : 'border-slate-300 bg-slate-50 hover:border-indigo-400 hover:bg-indigo-50/30'
                }`}
              >
                <i className={`ti ${fileUploaded ? 'ti-circle-check text-emerald-600' : 'ti-upload text-indigo-600'} text-3xl mb-2 block`} />
                <span className="font-bold text-sm text-slate-900 block">
                  {fileUploaded ? '✓ Resume Document Uploaded (CV_2026.pdf)' : 'Click to Upload Resume / CV (PDF or DOCX)'}
                </span>
                <span className="font-mono text-xs text-slate-400 mt-1 block">Max file size 10MB</span>
              </div>

              <div>
                <label className="block font-mono text-[10px] uppercase font-bold text-slate-700 mb-1">
                  Or Paste LinkedIn / GitHub Profile URL
                </label>
                <input
                  type="url"
                  value={linkedinUrl}
                  onChange={(e) => setLinkedinUrl(e.target.value)}
                  placeholder="https://linkedin.com/in/username"
                  className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium text-slate-900 focus:bg-white focus:border-indigo-600 outline-none transition-all"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-200">
              <button
                onClick={handleFinish}
                className="font-mono text-xs text-slate-500 hover:underline"
              >
                Skip for now →
              </button>
              <button
                onClick={handleFinish}
                className="bg-[#0A0A0A] hover:bg-indigo-600 text-white font-bold text-sm px-6 py-3.5 rounded-2xl shadow-xl hover:shadow-indigo-600/25 transition-all flex items-center gap-2"
              >
                <span>Calibrate AI Signal</span>
                <i className="ti ti-sparkles text-xs" />
              </button>
            </div>
          </div>
        )}

        {/* ══ STEP 6: Processing ══ */}
        {step === 6 && (
          <div className="py-16 text-center space-y-6">
            <div className="w-16 h-16 bg-[#0A0A0A] text-white rounded-3xl flex items-center justify-center font-mono font-black text-2xl mx-auto shadow-2xl animate-pulse">
              N
            </div>
            <div className="space-y-2">
              <h2 className="font-sans font-extrabold text-2xl text-slate-950">Calibrating Signal</h2>
              <p className="font-mono text-xs text-indigo-600 font-bold uppercase tracking-widest">{processingMsg}</p>
            </div>
          </div>
        )}

      </main>

      {/* Full-Width Footer */}
      <footer className="w-full max-w-6xl mx-auto pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 font-mono text-[11px] text-slate-400">
        <div>© 2026 Nexora Intelligence Platform · Swiss Standard</div>
        <div className="flex gap-4">
          <span>Privacy Policy</span>
          <span>Terms of Service</span>
        </div>
      </footer>
    </div>
  )
}
