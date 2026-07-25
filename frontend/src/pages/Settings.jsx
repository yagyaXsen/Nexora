import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/auth.jsx'
import './Settings.css'

export default function Settings() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const [activeTab, setActiveTab] = useState('account')

  // Account State
  const [email, setEmail] = useState(user?.email || 'yagya@nexora.ai')
  const [username, setUsername] = useState(user?.name ? user.name.toLowerCase().replace(/\s+/g, '') : 'yagya')
  const [phone, setPhone] = useState('+41 79 123 4567')

  // 2FA Security & Sessions State
  const [twoFactor, setTwoFactor] = useState(false)
  const [sessions, setSessions] = useState([
    { id: 1, device: 'macOS Sonoma · Zurich, Switzerland', ip: '185.220.101.4', isCurrent: true },
    { id: 2, device: 'iOS Safari 17 · Geneva, Switzerland', ip: '185.220.101.9', isCurrent: false },
    { id: 3, device: 'Chrome Windows · London, UK', ip: '194.168.1.5', isCurrent: false },
  ])

  // Privacy State
  const [privacy, setPrivacy] = useState({
    publicProfile: false,
    recruiterVisible: true,
    organizationVisible: true,
    activityVisible: true,
    aiDataUsage: true,
    analyticsSharing: false,
  })

  // Notification State
  const [notifications, setNotifications] = useState({
    emailAlerts: true,
    pushAlerts: true,
    weeklyDigest: true,
    deadlineAlerts: true,
    scholarshipAlerts: true,
    quietHoursStart: '22:00',
    quietHoursEnd: '07:00',
  })

  // Theme & Localization State
  const [appearance, setAppearance] = useState({
    theme: 'System Default',
    compactMode: false,
  })
  const [locale, setLocale] = useState({
    language: 'English (US)',
    timezone: 'Europe/Zurich (UTC+1)',
    dateFormat: 'YYYY-MM-DD',
    currency: 'USD ($)',
  })

  // Connected OAuth Accounts
  const [connected, setConnected] = useState({
    google: true,
    github: true,
    linkedin: true,
    microsoft: false,
    orcid: true,
  })

  // AI Calibration State
  const [aiPreferences, setAiPreferences] = useState({
    sensitivity: '85% High Precision',
    frequency: 'Daily Signals',
    memoryEnabled: true,
  })

  const [message, setMessage] = useState(null)

  const handleSave = (e) => {
    e.preventDefault()
    setMessage('Settings updated and synced across sessions successfully.')
    setTimeout(() => setMessage(null), 3000)
  }

  const revokeSession = (id) => {
    setSessions(sessions.filter((s) => s.id !== id))
  }

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <div className="prism-settings bg-white min-h-screen pt-24 pb-20 font-sans relative overflow-hidden">
      
      {/* Background Ambient Radial Glow */}
      <div className="absolute top-0 right-1/4 w-[800px] h-[500px] bg-gradient-to-tr from-indigo-500/10 via-purple-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-[1240px] mx-auto px-6 relative z-10 space-y-8">

        {/* Header Title */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-200">
          <div className="space-y-2">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight">
              Settings &amp; Security
            </h1>
            <p className="text-base text-slate-500 max-w-xl">
              Configure authentication parameters, security keys, notification dispatches, and AI vector precision.
            </p>
          </div>

          <button
            onClick={handleLogout}
            className="bg-slate-100 hover:bg-slate-200 text-slate-800 px-5 py-2.5 rounded-2xl text-xs font-bold transition-all border border-slate-200 shrink-0"
          >
            Sign Out Session
          </button>
        </div>

        {message && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-mono rounded-2xl">
            ✓ {message}
          </div>
        )}

        {/* 2-Column Sidebar Settings Layout */}
        <div className="grid grid-cols-12 gap-8 items-start">
          
          {/* Navigation Sidebar (4 Columns) */}
          <div className="col-span-12 lg:col-span-4 bg-white border border-slate-200 p-4 rounded-3xl shadow-sm space-y-2">
            <button
              onClick={() => setActiveTab('account')}
              className={`w-full p-3.5 rounded-2xl text-xs font-bold text-left flex items-center gap-3 transition-all ${activeTab === 'account' ? 'bg-[#0A0A0A] text-white shadow-md' : 'text-slate-700 hover:bg-slate-100'}`}
            >
              <i className="ti ti-user-cog text-base" />
              <span>Account Credentials</span>
            </button>

            <button
              onClick={() => setActiveTab('security')}
              className={`w-full p-3.5 rounded-2xl text-xs font-bold text-left flex items-center gap-3 transition-all ${activeTab === 'security' ? 'bg-[#0A0A0A] text-white shadow-md' : 'text-slate-700 hover:bg-slate-100'}`}
            >
              <i className="ti ti-[#4338ca] ti-shield-lock text-base" />
              <span>2FA &amp; Active Sessions</span>
            </button>

            <button
              onClick={() => setActiveTab('ai')}
              className={`w-full p-3.5 rounded-2xl text-xs font-bold text-left flex items-center gap-3 transition-all ${activeTab === 'ai' ? 'bg-[#0A0A0A] text-white shadow-md' : 'text-slate-700 hover:bg-slate-100'}`}
            >
              <i className="ti ti-sparkles text-base" />
              <span>AI Vector Calibration</span>
            </button>

            <button
              onClick={() => setActiveTab('notifications')}
              className={`w-full p-3.5 rounded-2xl text-xs font-bold text-left flex items-center gap-3 transition-all ${activeTab === 'notifications' ? 'bg-[#0A0A0A] text-white shadow-md' : 'text-slate-700 hover:bg-slate-100'}`}
            >
              <i className="ti ti-bell-ringing text-base" />
              <span>Notification Dispatches</span>
            </button>

            <button
              onClick={() => setActiveTab('privacy')}
              className={`w-full p-3.5 rounded-2xl text-xs font-bold text-left flex items-center gap-3 transition-all ${activeTab === 'privacy' ? 'bg-[#0A0A0A] text-white shadow-md' : 'text-slate-700 hover:bg-slate-100'}`}
            >
              <i className="ti ti-lock text-base" />
              <span>Privacy &amp; Data Permissions</span>
            </button>

            <button
              onClick={() => setActiveTab('connected')}
              className={`w-full p-3.5 rounded-2xl text-xs font-bold text-left flex items-center gap-3 transition-all ${activeTab === 'connected' ? 'bg-[#0A0A0A] text-white shadow-md' : 'text-slate-700 hover:bg-slate-100'}`}
            >
              <i className="ti ti-[#4338ca] ti-link text-base" />
              <span>Connected OAuth Providers</span>
            </button>
          </div>

          {/* Settings Canvas (8 Columns) */}
          <div className="col-span-12 lg:col-span-8 bg-white border border-slate-200 p-6 sm:p-8 rounded-3xl shadow-xl space-y-6">
            
            {activeTab === 'account' && (
              <form onSubmit={handleSave} className="space-y-6">
                <div className="font-mono text-xs font-bold text-indigo-600 uppercase tracking-widest pb-3 border-b border-slate-200">
                  [ ACCOUNT CREDENTIALS ]
                </div>

                <div className="space-y-4 text-xs font-mono">
                  <div className="space-y-1.5">
                    <label className="text-slate-500 font-bold block uppercase">Primary Account Email</label>
                    <input
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 p-3 rounded-2xl text-slate-900 outline-none focus:border-indigo-400 font-sans"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-slate-500 font-bold block uppercase">System Handle / Username</label>
                    <input
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 p-3 rounded-2xl text-slate-900 outline-none focus:border-indigo-400 font-sans"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-slate-500 font-bold block uppercase">Security Contact Phone</label>
                    <input
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 p-3 rounded-2xl text-slate-900 outline-none focus:border-indigo-400 font-sans"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="bg-[#0A0A0A] hover:bg-slate-800 text-white font-bold text-xs px-6 py-3 rounded-2xl transition-all shadow-md active:scale-98"
                >
                  Save Changes
                </button>
              </form>
            )}

            {activeTab === 'security' && (
              <div className="space-y-6">
                <div className="font-mono text-xs font-bold text-indigo-600 uppercase tracking-widest pb-3 border-b border-slate-200">
                  [ 2FA SECURITY &amp; ACTIVE SESSIONS ]
                </div>

                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between">
                  <div>
                    <strong className="text-slate-900 block font-bold text-xs">Two-Factor Authentication (2FA)</strong>
                    <span className="text-slate-500 font-sans text-xs">Require hardware or app verification on login.</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={twoFactor}
                    onChange={(e) => setTwoFactor(e.target.checked)}
                    className="w-5 h-5 accent-indigo-600 cursor-pointer"
                  />
                </div>

                <div className="space-y-3">
                  <span className="prism-mono text-[10px] text-slate-400 font-bold uppercase block">Active System Sessions</span>
                  {sessions.map((sess) => (
                    <div key={sess.id} className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between text-xs font-mono">
                      <div>
                        <strong className="text-slate-900 block font-sans font-bold">{sess.device}</strong>
                        <span className="text-slate-400 text-[10px]">{sess.ip}</span>
                      </div>
                      {sess.isCurrent ? (
                        <span className="text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded text-[10px]">CURRENT SESSION</span>
                      ) : (
                        <button onClick={() => revokeSession(sess.id)} className="text-red-600 font-bold hover:underline">Revoke</button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'ai' && (
              <form onSubmit={handleSave} className="space-y-6">
                <div className="font-mono text-xs font-bold text-indigo-600 uppercase tracking-widest pb-3 border-b border-slate-200">
                  [ AI VECTOR CALIBRATION ]
                </div>

                <div className="space-y-4 text-xs font-mono">
                  <div className="space-y-1.5">
                    <label className="text-slate-500 font-bold block uppercase">Vector Match Precision Threshold</label>
                    <select
                      value={aiPreferences.sensitivity}
                      onChange={(e) => setAiPreferences({ ...aiPreferences, sensitivity: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 p-3 rounded-2xl text-slate-900 outline-none font-sans"
                    >
                      <option>95% Ultra High Precision</option>
                      <option>85% High Precision</option>
                      <option>75% Balanced Discovery</option>
                    </select>
                  </div>
                </div>

                <button
                  type="submit"
                  className="bg-[#0A0A0A] hover:bg-slate-800 text-white font-bold text-xs px-6 py-3 rounded-2xl transition-all shadow-md active:scale-98"
                >
                  Update AI Calibration
                </button>
              </form>
            )}

            {activeTab === 'notifications' && (
              <form onSubmit={handleSave} className="space-y-6">
                <div className="font-mono text-xs font-bold text-indigo-600 uppercase tracking-widest pb-3 border-b border-slate-200">
                  [ NOTIFICATION DISPATCH PREFERENCES ]
                </div>

                <div className="space-y-3 font-mono text-xs">
                  <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between">
                    <span>Critical Application Deadline Alerts</span>
                    <input
                      type="checkbox"
                      checked={notifications.deadlineAlerts}
                      onChange={(e) => setNotifications({ ...notifications, deadlineAlerts: e.target.checked })}
                      className="w-4 h-4 accent-indigo-600 cursor-pointer"
                    />
                  </div>
                  <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between">
                    <span>Weekly AI Opportunity Vector Digest</span>
                    <input
                      type="checkbox"
                      checked={notifications.weeklyDigest}
                      onChange={(e) => setNotifications({ ...notifications, weeklyDigest: e.target.checked })}
                      className="w-4 h-4 accent-indigo-600 cursor-pointer"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="bg-[#0A0A0A] hover:bg-slate-800 text-white font-bold text-xs px-6 py-3 rounded-2xl transition-all shadow-md active:scale-98"
                >
                  Save Notification Preferences
                </button>
              </form>
            )}

            {activeTab === 'privacy' && (
              <div className="space-y-6">
                <div className="font-mono text-xs font-bold text-indigo-600 uppercase tracking-widest pb-3 border-b border-slate-200">
                  [ PRIVACY &amp; DATA PERMISSIONS ]
                </div>

                <div className="space-y-3 font-mono text-xs">
                  <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between">
                    <span>Allow Verified Recruiter Discovery</span>
                    <input
                      type="checkbox"
                      checked={privacy.recruiterVisible}
                      onChange={(e) => setPrivacy({ ...privacy, recruiterVisible: e.target.checked })}
                      className="w-4 h-4 accent-indigo-600 cursor-pointer"
                    />
                  </div>
                  <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between">
                    <span>Anonymized AI Training Contributions</span>
                    <input
                      type="checkbox"
                      checked={privacy.aiDataUsage}
                      onChange={(e) => setPrivacy({ ...privacy, aiDataUsage: e.target.checked })}
                      className="w-4 h-4 accent-indigo-600 cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'connected' && (
              <div className="space-y-6">
                <div className="font-mono text-xs font-bold text-indigo-600 uppercase tracking-widest pb-3 border-b border-slate-200">
                  [ CONNECTED OAUTH PROVIDERS ]
                </div>

                <div className="space-y-3 font-mono text-xs">
                  <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between">
                    <span className="font-sans font-bold">ORCID Digital Identity</span>
                    <span className="text-emerald-600 font-bold">✓ CONNECTED</span>
                  </div>
                  <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between">
                    <span className="font-sans font-bold">GitHub Academic</span>
                    <span className="text-emerald-600 font-bold">✓ CONNECTED</span>
                  </div>
                  <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between">
                    <span className="font-sans font-bold">Google Scholar</span>
                    <span className="text-emerald-600 font-bold">✓ CONNECTED</span>
                  </div>
                </div>
              </div>
            )}

          </div>

        </div>

      </div>
    </div>
  )
}
