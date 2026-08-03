import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../lib/api'
import { useAuth } from '../lib/auth.jsx'
import './Settings.css'

export default function Settings() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const [activeTab, setActiveTab] = useState('account')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState(null)
  const [error, setError] = useState(null)

  // Account State
  const [email, setEmail] = useState('')
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')

  // 2FA Security & Sessions State
  const [twoFactor, setTwoFactor] = useState(false)
  const [sessions, setSessions] = useState([])

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
  })

  // Theme & Localization State
  const [locale, setLocale] = useState({
    language: 'English (US)',
    timezone: typeof Intl !== 'undefined' ? Intl.DateTimeFormat().resolvedOptions().timeZone : 'UTC',
    dateFormat: 'YYYY-MM-DD',
  })

  // Connected OAuth Accounts
  const [connected, setConnected] = useState({
    google: false,
    github: false,
    linkedin: false,
    orcid: false,
  })

  // AI Calibration State
  const [aiPreferences, setAiPreferences] = useState({
    sensitivity: '85% High Precision',
    frequency: 'Daily Signals',
    memoryEnabled: true,
  })

  // Detect Current Real Device & Browser
  const getDeviceSignature = () => {
    if (typeof navigator === 'undefined') return 'Active Browser Session'
    const ua = navigator.userAgent
    let os = 'Desktop'
    if (ua.includes('Macintosh') || ua.includes('Mac OS')) os = 'macOS'
    else if (ua.includes('Windows')) os = 'Windows'
    else if (ua.includes('Linux')) os = 'Linux'
    else if (ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS'
    else if (ua.includes('Android')) os = 'Android'

    let browser = 'Browser'
    if (ua.includes('Chrome') && !ua.includes('Edg')) browser = 'Chrome'
    else if (ua.includes('Safari') && !ua.includes('Chrome')) browser = 'Safari'
    else if (ua.includes('Firefox')) browser = 'Firefox'
    else if (ua.includes('Edg')) browser = 'Edge'

    return `${os} · ${browser}`
  }

  useEffect(() => {
    let cancelled = false
    setLoading(true)

    api
      .getProfile()
      .then((data) => {
        if (cancelled) return
        const p = data?.profile || {}
        setEmail(data?.email || user?.email || '')
        setFullName(data?.name || user?.name || '')
        setPhone(p.phone || '')

        setConnected({
          google: !!(data?.google_id || user?.google_id),
          github: false,
          linkedin: false,
          orcid: false,
        })

        setSessions([
          {
            id: 'current-session',
            device: `${getDeviceSignature()} (Current Device)`,
            activeStatus: 'Active Now',
            isCurrent: true,
          },
        ])

        setLoading(false)
      })
      .catch((err) => {
        if (cancelled) return
        setEmail(user?.email || '')
        setFullName(user?.name || '')
        setConnected({
          google: !!(user?.google_id),
          github: false,
          linkedin: false,
          orcid: false,
        })
        setSessions([
          {
            id: 'current-session',
            device: `${getDeviceSignature()} (Current Device)`,
            activeStatus: 'Active Now',
            isCurrent: true,
          },
        ])
        setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [user])

  const handleSave = async (e) => {
    if (e) e.preventDefault()
    setSaving(true)
    setError(null)
    setMessage(null)

    try {
      await api.updateProfile({
        full_name: fullName,
        phone: phone || undefined,
      })
      setMessage('Settings updated and synced successfully.')
      setTimeout(() => setMessage(null), 3500)
    } catch (err) {
      setError(err.message || 'Failed to save settings. Please try again.')
    } finally {
      setSaving(false)
    }
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
            className="bg-slate-100 hover:bg-slate-200 text-slate-800 px-5 py-2.5 rounded-2xl text-xs font-bold transition-all border border-slate-200 shrink-0 cursor-pointer"
          >
            Sign Out Session
          </button>
        </div>

        {message && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-mono rounded-2xl flex items-center gap-2">
            <i className="ti ti-check text-emerald-600 text-sm" />
            <span>{message}</span>
          </div>
        )}

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 text-red-800 text-xs font-mono rounded-2xl flex items-center gap-2">
            <i className="ti ti-alert-circle text-red-600 text-sm" />
            <span>{error}</span>
          </div>
        )}

        {/* 2-Column Sidebar Settings Layout */}
        <div className="grid grid-cols-12 gap-8 items-start">
          {/* Navigation Sidebar (4 Columns) */}
          <div className="col-span-12 lg:col-span-4 bg-white border border-slate-200 p-4 rounded-3xl shadow-sm space-y-2">
            <button
              onClick={() => setActiveTab('account')}
              className={`w-full p-3.5 rounded-2xl text-xs font-bold text-left flex items-center gap-3 transition-all cursor-pointer ${
                activeTab === 'account'
                  ? 'bg-[#0A0A0A] text-white shadow-md'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <i className="ti ti-user-cog text-base" />
              <span>Account Credentials</span>
            </button>

            <button
              onClick={() => setActiveTab('security')}
              className={`w-full p-3.5 rounded-2xl text-xs font-bold text-left flex items-center gap-3 transition-all cursor-pointer ${
                activeTab === 'security'
                  ? 'bg-[#0A0A0A] text-white shadow-md'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <i className="ti ti-shield-lock text-base" />
              <span>2FA &amp; Active Sessions</span>
            </button>

            <button
              onClick={() => setActiveTab('ai')}
              className={`w-full p-3.5 rounded-2xl text-xs font-bold text-left flex items-center gap-3 transition-all cursor-pointer ${
                activeTab === 'ai'
                  ? 'bg-[#0A0A0A] text-white shadow-md'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <i className="ti ti-sparkles text-base" />
              <span>AI Vector Calibration</span>
            </button>

            <button
              onClick={() => setActiveTab('notifications')}
              className={`w-full p-3.5 rounded-2xl text-xs font-bold text-left flex items-center gap-3 transition-all cursor-pointer ${
                activeTab === 'notifications'
                  ? 'bg-[#0A0A0A] text-white shadow-md'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <i className="ti ti-bell-ringing text-base" />
              <span>Notification Dispatches</span>
            </button>

            <button
              onClick={() => setActiveTab('privacy')}
              className={`w-full p-3.5 rounded-2xl text-xs font-bold text-left flex items-center gap-3 transition-all cursor-pointer ${
                activeTab === 'privacy'
                  ? 'bg-[#0A0A0A] text-white shadow-md'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <i className="ti ti-lock text-base" />
              <span>Privacy &amp; Data Permissions</span>
            </button>

            <button
              onClick={() => setActiveTab('connected')}
              className={`w-full p-3.5 rounded-2xl text-xs font-bold text-left flex items-center gap-3 transition-all cursor-pointer ${
                activeTab === 'connected'
                  ? 'bg-[#0A0A0A] text-white shadow-md'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <i className="ti ti-link text-base" />
              <span>Connected Accounts</span>
            </button>
          </div>

          {/* Settings Canvas (8 Columns) */}
          <div className="col-span-12 lg:col-span-8 bg-white border border-slate-200 p-6 sm:p-8 rounded-3xl shadow-xl space-y-6">
            {/* ═══ TAB 1: ACCOUNT CREDENTIALS ═══ */}
            {activeTab === 'account' && (
              <form onSubmit={handleSave} className="space-y-6">
                <div className="font-mono text-xs font-bold text-indigo-600 uppercase tracking-widest pb-3 border-b border-slate-200 flex items-center justify-between">
                  <span>[ ACCOUNT CREDENTIALS ]</span>
                  <span className="text-[10px] text-slate-400 font-normal">REAL-TIME PROFILE SYNC</span>
                </div>

                <div className="space-y-4 text-xs font-mono">
                  <div className="space-y-1.5">
                    <label className="text-slate-500 font-bold block uppercase">Primary Account Email</label>
                    <input
                      type="email"
                      value={email}
                      disabled
                      className="w-full bg-slate-100 border border-slate-200 p-3 rounded-2xl text-slate-600 font-sans cursor-not-allowed"
                    />
                    <span className="text-[10px] text-slate-400 font-sans block">Email is bound to your primary authentication identity.</span>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-slate-500 font-bold block uppercase">Full Name</label>
                    <input
                      type="text"
                      placeholder="Enter your full name"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 p-3 rounded-2xl text-slate-900 outline-none focus:border-indigo-500 font-sans"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-slate-500 font-bold block uppercase">Contact Phone (Optional)</label>
                    <input
                      type="tel"
                      placeholder="+1 (555) 000-0000"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 p-3 rounded-2xl text-slate-900 outline-none focus:border-indigo-500 font-sans"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-slate-500 font-bold block uppercase">Detected Local Timezone</label>
                    <input
                      type="text"
                      value={locale.timezone}
                      disabled
                      className="w-full bg-slate-100 border border-slate-200 p-3 rounded-2xl text-slate-600 font-sans cursor-not-allowed"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={saving}
                  className="bg-[#0A0A0A] hover:bg-slate-800 text-white font-bold text-xs px-6 py-3.5 rounded-2xl transition-all shadow-md active:scale-98 disabled:opacity-50 cursor-pointer flex items-center gap-2"
                >
                  {saving ? (
                    <>
                      <i className="ti ti-loader-2 animate-spin text-sm" />
                      <span>Saving Changes…</span>
                    </>
                  ) : (
                    <span>Save Account Settings</span>
                  )}
                </button>
              </form>
            )}

            {/* ═══ TAB 2: 2FA & ACTIVE SESSIONS ═══ */}
            {activeTab === 'security' && (
              <div className="space-y-6">
                <div className="font-mono text-xs font-bold text-indigo-600 uppercase tracking-widest pb-3 border-b border-slate-200">
                  [ 2FA SECURITY &amp; ACTIVE SESSIONS ]
                </div>

                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between">
                  <div>
                    <strong className="text-slate-900 block font-bold text-xs">Two-Factor Authentication (2FA)</strong>
                    <span className="text-slate-500 font-sans text-xs">Require hardware security key or TOTP app on login.</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={twoFactor}
                    onChange={(e) => setTwoFactor(e.target.checked)}
                    className="w-5 h-5 accent-indigo-600 cursor-pointer"
                  />
                </div>

                <div className="space-y-3">
                  <span className="font-mono text-[10px] text-slate-400 font-bold uppercase block">
                    Active System Sessions
                  </span>
                  {sessions.map((sess) => (
                    <div
                      key={sess.id}
                      className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between text-xs font-mono"
                    >
                      <div className="space-y-0.5">
                        <strong className="text-slate-900 block font-sans font-bold">{sess.device}</strong>
                        <span className="text-slate-500 text-[11px] font-sans">{sess.activeStatus}</span>
                      </div>
                      <span className="text-emerald-600 font-bold bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-md text-[10px]">
                        CURRENT SESSION
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ═══ TAB 3: AI VECTOR CALIBRATION ═══ */}
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
                      <option>95% Ultra High Precision (Strict matching on domain &amp; degree)</option>
                      <option>85% High Precision (Recommended default)</option>
                      <option>75% Balanced Discovery (Broad exploration across related fields)</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-slate-500 font-bold block uppercase">AI Feed Refresh Frequency</label>
                    <select
                      value={aiPreferences.frequency}
                      onChange={(e) => setAiPreferences({ ...aiPreferences, frequency: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 p-3 rounded-2xl text-slate-900 outline-none font-sans"
                    >
                      <option>Real-Time Live Signal Indexing</option>
                      <option>Daily Signals</option>
                      <option>Weekly Digest</option>
                    </select>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={saving}
                  className="bg-[#0A0A0A] hover:bg-slate-800 text-white font-bold text-xs px-6 py-3.5 rounded-2xl transition-all shadow-md active:scale-98 cursor-pointer"
                >
                  Update AI Calibration
                </button>
              </form>
            )}

            {/* ═══ TAB 4: NOTIFICATION PREFERENCES ═══ */}
            {activeTab === 'notifications' && (
              <form onSubmit={handleSave} className="space-y-6">
                <div className="font-mono text-xs font-bold text-indigo-600 uppercase tracking-widest pb-3 border-b border-slate-200">
                  [ NOTIFICATION DISPATCH PREFERENCES ]
                </div>

                <div className="space-y-3 text-xs">
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between">
                    <div>
                      <strong className="text-slate-900 block font-bold">Critical Application Deadline Alerts</strong>
                      <span className="text-slate-500 text-xs">Receive reminders for opportunities closing within 14 and 3 days.</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={notifications.deadlineAlerts}
                      onChange={(e) => setNotifications({ ...notifications, deadlineAlerts: e.target.checked })}
                      className="w-5 h-5 accent-indigo-600 cursor-pointer"
                    />
                  </div>

                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between">
                    <div>
                      <strong className="text-slate-900 block font-bold">Weekly AI Opportunity Vector Digest</strong>
                      <span className="text-slate-500 text-xs">Curated summary of top matching non-job opportunities indexed during the week.</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={notifications.weeklyDigest}
                      onChange={(e) => setNotifications({ ...notifications, weeklyDigest: e.target.checked })}
                      className="w-5 h-5 accent-indigo-600 cursor-pointer"
                    />
                  </div>

                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between">
                    <div>
                      <strong className="text-slate-900 block font-bold">Email Notifications</strong>
                      <span className="text-slate-500 text-xs">Allow Nexora to send verified signal notifications to {email || 'your primary email'}.</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={notifications.emailAlerts}
                      onChange={(e) => setNotifications({ ...notifications, emailAlerts: e.target.checked })}
                      className="w-5 h-5 accent-indigo-600 cursor-pointer"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={saving}
                  className="bg-[#0A0A0A] hover:bg-slate-800 text-white font-bold text-xs px-6 py-3.5 rounded-2xl transition-all shadow-md active:scale-98 cursor-pointer"
                >
                  Save Notification Preferences
                </button>
              </form>
            )}

            {/* ═══ TAB 5: PRIVACY & DATA PERMISSIONS ═══ */}
            {activeTab === 'privacy' && (
              <div className="space-y-6">
                <div className="font-mono text-xs font-bold text-indigo-600 uppercase tracking-widest pb-3 border-b border-slate-200">
                  [ PRIVACY &amp; DATA PERMISSIONS ]
                </div>

                <div className="space-y-3 text-xs">
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between">
                    <div>
                      <strong className="text-slate-900 block font-bold">Verified Research Lab &amp; Program Discovery</strong>
                      <span className="text-slate-500 text-xs">Allow verified host institutions to discover your anonymized candidate profile.</span>
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
                      <strong className="text-slate-900 block font-bold">Anonymized AI Vector Feedback</strong>
                      <span className="text-slate-500 text-xs">Help improve match scoring accuracy through anonymized match ranking metrics.</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={privacy.aiDataUsage}
                      onChange={(e) => setPrivacy({ ...privacy, aiDataUsage: e.target.checked })}
                      className="w-5 h-5 accent-indigo-600 cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* ═══ TAB 6: CONNECTED ACCOUNTS ═══ */}
            {activeTab === 'connected' && (
              <div className="space-y-6">
                <div className="font-mono text-xs font-bold text-indigo-600 uppercase tracking-widest pb-3 border-b border-slate-200 flex items-center justify-between">
                  <span>[ CONNECTED ACCOUNTS ]</span>
                  <span className="text-[10px] text-slate-400 font-normal">OAUTH IDENTITY PROVIDERS</span>
                </div>

                <div className="space-y-3 text-xs">
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between">
                    <div>
                      <span className="font-sans font-bold text-slate-900 block">Google Identity</span>
                      <span className="text-slate-500 text-[11px]">
                        {connected.google ? `Connected via ${email}` : 'Not connected'}
                      </span>
                    </div>
                    {connected.google ? (
                      <span className="text-emerald-600 font-bold bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-md text-[10px] font-mono">
                        ✓ CONNECTED
                      </span>
                    ) : (
                      <span className="text-slate-400 font-bold bg-slate-200/60 px-2.5 py-1 rounded-md text-[10px] font-mono">
                        NOT LINKED
                      </span>
                    )}
                  </div>

                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between">
                    <div>
                      <span className="font-sans font-bold text-slate-900 block">GitHub Academic &amp; Developer</span>
                      <span className="text-slate-500 text-[11px]">Sync repositories and open-source contributions for technical grants.</span>
                    </div>
                    <span className="text-slate-400 font-bold bg-slate-200/60 px-2.5 py-1 rounded-md text-[10px] font-mono">
                      NOT LINKED
                    </span>
                  </div>

                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between">
                    <div>
                      <span className="font-sans font-bold text-slate-900 block">ORCID Research Identity</span>
                      <span className="text-slate-500 text-[11px]">Verify published research papers and academic credentials.</span>
                    </div>
                    <span className="text-slate-400 font-bold bg-slate-200/60 px-2.5 py-1 rounded-md text-[10px] font-mono">
                      NOT LINKED
                    </span>
                  </div>

                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between">
                    <div>
                      <span className="font-sans font-bold text-slate-900 block">LinkedIn Profile</span>
                      <span className="text-slate-500 text-[11px]">Sync career trajectory and education background.</span>
                    </div>
                    <span className="text-slate-400 font-bold bg-slate-200/60 px-2.5 py-1 rounded-md text-[10px] font-mono">
                      NOT LINKED
                    </span>
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
