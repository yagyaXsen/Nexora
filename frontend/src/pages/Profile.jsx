import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../lib/api'
import { useAuth } from '../lib/auth.jsx'
import './Profile.css'

export default function Profile() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  // Tab State: 'identity' or 'settings'
  const [activeTab, setActiveTab] = useState('identity')

  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState(null)
  const [error, setError] = useState(null)

  // Profile Identity State
  const [fullName, setFullName] = useState('')
  const [dob, setDob] = useState('1998-05-14')
  const [residence, setResidence] = useState('Switzerland')
  const [citizenship, setCitizenship] = useState('Switzerland, India')
  const [timezone, setTimezone] = useState('Europe/Zurich (UTC+1)')
  const [languages, setLanguages] = useState('English (Native), German (Fluent), French (Basic)')

  // Academic Credentials
  const [academicDegree, setAcademicDegree] = useState('')
  const [institution, setInstitution] = useState('')
  const [fieldOfStudy, setFieldOfStudy] = useState('Computer Science & Artificial Intelligence')
  const [currentRole, setCurrentRole] = useState('Postdoctoral Research Fellow')

  // Skills & Preferences
  const [interestsText, setInterestsText] = useState('')
  const [skillsText, setSkillsText] = useState('')
  const [certificationsText, setCertificationsText] = useState('AWS Machine Learning Specialty, Deep Learning Institute Certified')
  const [targetCountries, setTargetCountries] = useState('Switzerland, Germany, United States, United Kingdom')
  const [workMode, setWorkMode] = useState('Hybrid')

  // Embedded Settings Module State
  const [emailInput, setEmailInput] = useState(user?.email || 'rdxweapon6@gmail.com')
  const [twoFactor, setTwoFactor] = useState(false)
  const [activeSessions, setActiveSessions] = useState([
    { id: 1, device: 'macOS Sonoma · Zurich, Switzerland', isCurrent: true },
    { id: 2, device: 'iOS Safari · Geneva, Switzerland', isCurrent: false },
  ])

  const [privacy, setPrivacy] = useState({
    recruiterVisible: true,
    publicProfile: false,
    aiDataSharing: true,
    analyticsSharing: false,
  })

  const [notifications, setNotifications] = useState({
    emailAlerts: true,
    pushAlerts: true,
    weeklyDigest: true,
    quietHours: '22:00 - 07:00',
  })

  const [appearance, setAppearance] = useState({
    theme: 'System Default',
    language: 'English (US)',
  })

  const [aiPreferences, setAiPreferences] = useState({
    sensitivity: '85% High Precision',
    personalizationLevel: 'Full Vector Profile',
  })

  const [connected, setConnected] = useState({
    linkedin: true,
    github: true,
    orcid: true,
    google: true,
  })

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    api
      .getProfile()
      .then((data) => {
        if (cancelled) return
        setProfile(data)
        setFullName(data.full_name || user?.name || '')
        setAcademicDegree(data.academic_degree || 'Postdoctoral Fellow')
        setInstitution(data.institution || 'ETH Zurich')
        setCitizenship(data.citizenship || 'Switzerland, India')
        setInterestsText(Array.isArray(data.interests) ? data.interests.join(', ') : 'Artificial Intelligence, Robotics, Quantum Computing, Deeptech')
        setSkillsText(Array.isArray(data.skills) ? data.skills.join(', ') : 'PyTorch, ROS2, Distributed Systems, LaTeX, C++, Computer Vision')
      })
      .catch((e) => !cancelled && setError(e.message))
      .finally(() => !cancelled && setLoading(false))

    return () => {
      cancelled = true
    }
  }, [user])

  const handleSaveProfile = async (e) => {
    e.preventDefault()
    setSaving(true)
    setMessage(null)
    setError(null)

    const payload = {
      full_name: fullName,
      academic_degree: academicDegree,
      institution: institution,
      citizenship: citizenship,
      interests: interestsText.split(',').map((s) => s.trim()).filter(Boolean),
      skills: skillsText.split(',').map((s) => s.trim()).filter(Boolean),
    }

    try {
      const updated = await api.updateProfile(payload)
      setProfile(updated)
      setMessage('Profile credentials successfully updated & AI vector re-indexed.')
    } catch (err) {
      setError(err.message || 'Failed to save profile updates')
    } finally {
      setSaving(false)
    }
  }

  const handleRevokeSession = (id) => {
    setActiveSessions(activeSessions.filter((s) => s.id !== id))
  }

  return (
    <div className="prism-profile bg-white min-h-screen pt-24 pb-20 font-sans relative overflow-hidden">
      
      {/* Background Ambient Radial Glow */}
      <div className="absolute top-0 right-1/4 w-[800px] h-[500px] bg-gradient-to-tr from-indigo-500/10 via-purple-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-[1240px] mx-auto px-6 relative z-10 space-y-8">

        {/* 1. Header Profile Banner */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-200">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-[#0A0A0A] text-white rounded-2xl flex items-center justify-center font-extrabold text-2xl shadow-md shrink-0">
              {fullName ? fullName.charAt(0) : 'S'}
            </div>
            <div className="space-y-1">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-950 tracking-tight">{fullName || 'Candidate Scholar'}</h1>
              <p className="text-sm text-slate-500 font-serif">
                {academicDegree} @ {institution} · {residence}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => logout().then(() => navigate('/login'))}
              className="bg-slate-100 hover:bg-slate-200 text-slate-800 px-5 py-2.5 rounded-2xl text-xs font-bold transition-all border border-slate-200"
            >
              Sign Out
            </button>
          </div>
        </div>

        {/* 2. Embedded Navigation Tabs */}
        <div className="flex gap-3 border-b border-slate-200 pb-3">
          <button
            onClick={() => setActiveTab('identity')}
            className={`px-5 py-2.5 rounded-2xl text-xs font-bold transition-all border ${activeTab === 'identity' ? 'bg-[#0A0A0A] text-white border-[#0A0A0A] shadow-md' : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-slate-400'}`}
          >
            Candidate Credentials &amp; Vector Data
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`px-5 py-2.5 rounded-2xl text-xs font-bold transition-all border ${activeTab === 'settings' ? 'bg-[#0A0A0A] text-white border-[#0A0A0A] shadow-md' : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-slate-400'}`}
          >
            System Preferences &amp; Security Settings
          </button>
        </div>

        {message && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-mono rounded-2xl">
            ✓ {message}
          </div>
        )}

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-xs font-mono rounded-2xl">
            ✕ {error}
          </div>
        )}

        {/* 3. TAB 1: IDENTITY & ACADEMIC VECTOR CREDENTIALS */}
        {activeTab === 'identity' && (
          <form onSubmit={handleSaveProfile} className="grid grid-cols-12 gap-8 items-start">
            
            {/* Left Column (8 Cols) */}
            <div className="col-span-12 lg:col-span-8 space-y-8">
              
              {/* Personal Details Card */}
              <div className="bg-white border border-slate-200 p-6 sm:p-8 rounded-3xl shadow-xl space-y-6">
                <div className="font-mono text-xs font-bold text-indigo-600 uppercase tracking-wider pb-3 border-b border-slate-200">
                  [ PERSONAL IDENTITY &amp; CITIZENSHIP ]
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
                  <div className="space-y-1.5">
                    <label className="text-slate-500 font-bold block uppercase">Full Name</label>
                    <input
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 p-3 rounded-2xl text-slate-900 outline-none focus:border-indigo-400 font-sans"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-slate-500 font-bold block uppercase">Date of Birth</label>
                    <input
                      type="date"
                      value={dob}
                      onChange={(e) => setDob(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 p-3 rounded-2xl text-slate-900 outline-none focus:border-indigo-400 font-sans"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-slate-500 font-bold block uppercase">Current Country of Residence</label>
                    <input
                      value={residence}
                      onChange={(e) => setResidence(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 p-3 rounded-2xl text-slate-900 outline-none focus:border-indigo-400 font-sans"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-slate-500 font-bold block uppercase">Citizenship &amp; Passports</label>
                    <input
                      value={citizenship}
                      onChange={(e) => setCitizenship(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 p-3 rounded-2xl text-slate-900 outline-none focus:border-indigo-400 font-sans"
                    />
                  </div>
                </div>
              </div>

              {/* Academic Credentials Card */}
              <div className="bg-white border border-slate-200 p-6 sm:p-8 rounded-3xl shadow-xl space-y-6">
                <div className="font-mono text-xs font-bold text-indigo-600 uppercase tracking-wider pb-3 border-b border-slate-200">
                  [ ACADEMIC &amp; RESEARCH CREDENTIALS ]
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
                  <div className="space-y-1.5">
                    <label className="text-slate-500 font-bold block uppercase">Highest Degree Level</label>
                    <input
                      value={academicDegree}
                      onChange={(e) => setAcademicDegree(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 p-3 rounded-2xl text-slate-900 outline-none focus:border-indigo-400 font-sans"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-slate-500 font-bold block uppercase">Institution / University</label>
                    <input
                      value={institution}
                      onChange={(e) => setInstitution(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 p-3 rounded-2xl text-slate-900 outline-none focus:border-indigo-400 font-sans"
                    />
                  </div>
                  <div className="space-y-1.5 col-span-2">
                    <label className="text-slate-500 font-bold block uppercase">Primary Research Field</label>
                    <input
                      value={fieldOfStudy}
                      onChange={(e) => setFieldOfStudy(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 p-3 rounded-2xl text-slate-900 outline-none focus:border-indigo-400 font-sans"
                    />
                  </div>
                </div>
              </div>

              {/* Skills & Vector Parameters */}
              <div className="bg-white border border-slate-200 p-6 sm:p-8 rounded-3xl shadow-xl space-y-6">
                <div className="font-mono text-xs font-bold text-indigo-600 uppercase tracking-wider pb-3 border-b border-slate-200">
                  [ SKILLS &amp; VECTOR MATCHING CRITERIA ]
                </div>

                <div className="space-y-4 text-xs font-mono">
                  <div className="space-y-1.5">
                    <label className="text-slate-500 font-bold block uppercase">Technical Skills (Comma Separated)</label>
                    <textarea
                      value={skillsText}
                      onChange={(e) => setSkillsText(e.target.value)}
                      className="w-full h-20 bg-slate-50 border border-slate-200 p-3 rounded-2xl text-slate-900 outline-none focus:border-indigo-400 font-sans"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-slate-500 font-bold block uppercase">Research &amp; Career Focus Areas</label>
                    <textarea
                      value={interestsText}
                      onChange={(e) => setInterestsText(e.target.value)}
                      className="w-full h-20 bg-slate-50 border border-slate-200 p-3 rounded-2xl text-slate-900 outline-none focus:border-indigo-400 font-sans"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={saving}
                  className="bg-[#0A0A0A] hover:bg-indigo-600 text-white font-bold text-sm px-8 py-3.5 rounded-2xl transition-all shadow-md"
                >
                  {saving ? 'Re-indexing AI Vector...' : 'Save & Re-Index AI Profile'}
                </button>
              </div>

            </div>

            {/* Right Column (4 Cols) */}
            <div className="col-span-12 lg:col-span-4 space-y-6">
              
              {/* Vector Health Status Card */}
              <div className="bg-white border border-slate-200 p-6 rounded-3xl shadow-xl space-y-4">
                <div className="font-mono text-xs text-indigo-600 font-bold uppercase tracking-widest pb-3 border-b border-slate-200">
                  [ VECTOR HEALTH ]
                </div>
                <div className="text-3xl font-extrabold text-slate-950 font-sans">98.4%</div>
                <p className="text-xs text-slate-500 font-serif leading-relaxed">
                  Your candidate profile vector is active across 1,420 indexed research portals.
                </p>
              </div>

              {/* Connected Academic Portals */}
              <div className="bg-white border border-slate-200 p-6 rounded-3xl shadow-xl space-y-4 font-mono text-xs">
                <div className="font-bold text-slate-900 uppercase pb-2 border-b border-slate-200">
                  [ CONNECTED PROFILES ]
                </div>
                <div className="space-y-2">
                  <div className="p-3 bg-slate-50 rounded-xl flex items-center justify-between border border-slate-200">
                    <span>ORCID iD</span>
                    <span className="text-emerald-600 font-bold">✓ VERIFIED</span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl flex items-center justify-between border border-slate-200">
                    <span>GitHub Research</span>
                    <span className="text-emerald-600 font-bold">✓ SYNCED</span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl flex items-center justify-between border border-slate-200">
                    <span>LinkedIn Academic</span>
                    <span className="text-emerald-600 font-bold">✓ SYNCED</span>
                  </div>
                </div>
              </div>

            </div>

          </form>
        )}

        {/* 4. TAB 2: SYSTEM SETTINGS & PRIVACY MODULE */}
        {activeTab === 'settings' && (
          <div className="grid grid-cols-12 gap-8 items-start">
            <div className="col-span-12 lg:col-span-8 bg-white border border-slate-200 p-6 sm:p-8 rounded-3xl shadow-xl space-y-6">
              <div className="font-mono text-xs font-bold text-indigo-600 uppercase tracking-wider pb-3 border-b border-slate-200">
                [ ACCOUNT &amp; PRIVACY SETTINGS ]
              </div>

              <div className="space-y-4 text-xs font-mono">
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between">
                  <div>
                    <strong className="text-slate-900 block font-bold">Recruiter &amp; Lab Visibility</strong>
                    <span className="text-slate-500 font-sans text-xs">Allow verified university labs to discover your profile.</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={privacy.recruiterVisible}
                    onChange={(e) => setPrivacy({ ...privacy, recruiterVisible: e.target.checked })}
                    className="w-5 h-5 accent-indigo-600 cursor-pointer"
                  />
                </div>

                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between">
                  <div>
                    <strong className="text-slate-900 block font-bold">Two-Factor Authentication (2FA)</strong>
                    <span className="text-slate-500 font-sans text-xs">Require security key verification on login.</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={twoFactor}
                    onChange={(e) => setTwoFactor(e.target.checked)}
                    className="w-5 h-5 accent-indigo-600 cursor-pointer"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
