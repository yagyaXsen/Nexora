import { useEffect, useState, useCallback } from 'react'
import { getToken, clearToken, ApiError } from '../lib/api'
import { useAuth } from '../lib/auth.jsx'
import { CountUp } from '../components/CountUp.jsx'
import { isLocalhost, ADMIN_NO_LOGIN } from '../lib/env.js'

// ── Dev-only admin API client ─────────────────────────────────────────────
// This file is lazy-loaded and registered ONLY in dev builds (see App.jsx),
// so these endpoints never ship in the production bundle.
//
// Zero-config no-login: when the dev server runs on localhost with no
// VITE_API_BASE_URL and no VITE_ADMIN_KEY, fall back to the backend's public
// dev-default admin key (DEV_ADMIN_KEY in app/config.py). That exact situation
// means the browser talks to the local backend via the vite proxy (same-origin
// /api → localhost:8000), so the dev key is never transmitted to a remote host
// and never grants access against a deployed API (which uses a real secret).
const hasUserKey = !!import.meta.env.VITE_ADMIN_KEY
// The dev key may only ever be sent to a LOCAL backend. It applies when
// VITE_API_BASE_URL is empty (vite proxy → localhost:8000) OR when it
// explicitly points at localhost/127.0.0.1 — the common .env setup. A
// remote API base (e.g. the deployed API with a real ADMIN_SECRET_KEY)
// never receives the dev key.
const ADMIN_BASE = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '')
const adminBaseIsLocal =
  !ADMIN_BASE ||
  /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(:\d+)?(\/|$)/i.test(ADMIN_BASE)
const ADMIN_KEY =
  import.meta.env.VITE_ADMIN_KEY ||
  (adminBaseIsLocal && import.meta.env.DEV && isLocalhost()
    ? 'nexora_admin_secret_dev_key'
    : '')

async function adminRequest(path, { method = 'GET' } = {}) {
  const base = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '')
  const headers = {}
  const token = getToken()
  if (token) headers.Authorization = `Bearer ${token}`
  if (ADMIN_KEY) headers['X-Admin-Key'] = ADMIN_KEY
  const res = await fetch(`${base}${path}`, { method, headers })
  let data = null
  try {
    data = await res.json()
  } catch {
    /* non-JSON body */
  }
  if (res.status === 401 && token) {
    // Same hand-off as the shared client: token is dead (e.g. after a wipe) →
    // clear it and send the user to login so they can sign up fresh.
    clearToken()
    if (window.location.pathname !== '/login') window.location.assign('/login')
  }
  if (!res.ok) {
    throw new ApiError(res.status, data?.detail ?? `HTTP ${res.status}`)
  }
  return data
}

const fmtDate = (iso) => {
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleString(undefined, {
      month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit',
    })
  } catch {
    return iso
  }
}

export default function Admin() {
  const { user } = useAuth()
  const [stats, setStats] = useState(null)
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)
  const [wipeConfirmOpen, setWipeConfirmOpen] = useState(false)
  const [wipeTyped, setWipeTyped] = useState('')
  const [notice, setNotice] = useState(null)

  // In dev-only no-login mode the console is accessible without a session;
  // otherwise it still requires role === 'admin'.
  const localOnly = isLocalhost()
  const noLoginMode = ADMIN_NO_LOGIN && localOnly
  const isAdmin = noLoginMode || user?.role === 'admin'

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [statsRes, usersRes] = await Promise.all([
        adminRequest('/api/admin/stats'),
        adminRequest('/api/admin/users'),
      ])
      setStats(statsRes?.data ?? statsRes ?? null)
      setUsers(usersRes?.data ?? usersRes ?? [])
    } catch (e) {
      if (!hasUserKey && e?.status === 403) {
        setError(
          "The API rejected the request. Point VITE_API_BASE_URL at a local backend " +
          'or set VITE_ADMIN_KEY in frontend/.env.local to match ADMIN_SECRET_KEY ' +
          'on the server to use the no-login console.'
        )
      } else {
        setError(e.message || 'Failed to load admin data')
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (isAdmin && localOnly) load()
  }, [isAdmin, localOnly, load])

  const handleWipe = async () => {
    if (wipeTyped.trim().toLowerCase() !== 'reset') return
    setBusy(true)
    setNotice(null)
    try {
      const res = await adminRequest('/api/admin/reset-users', { method: 'POST' })
      setNotice(res?.data?.message || 'All user data cleared.')
      setWipeConfirmOpen(false)
      setWipeTyped('')
      // Reload — stats/users should now be empty
      await load()
    } catch (e) {
      setNotice(`Error: ${e.message || 'Failed to wipe user data'}`)
    } finally {
      setBusy(false)
    }
  }

  if (!user && !noLoginMode) return null

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-white pt-32 pb-20 font-sans">
        <div className="max-w-[680px] mx-auto px-6">
          <div className="border border-red-200 bg-red-50 rounded-3xl p-10 text-center space-y-4">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-red-100 flex items-center justify-center text-red-600">
              <i className="ti ti-shield-lock text-2xl" />
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900">Admin access required</h1>
            <p className="text-sm text-slate-600">
              Your account (<span className="font-mono">{user.email}</span>) does not have the{' '}
              <code className="bg-slate-100 px-1.5 py-0.5 rounded text-xs">admin</code> role.
              Contact the platform owner to be promoted.
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (!localOnly) {
    return (
      <div className="min-h-screen bg-white pt-32 pb-20 font-sans">
        <div className="max-w-[680px] mx-auto px-6">
          <div className="border border-amber-200 bg-amber-50 rounded-3xl p-10 text-center space-y-4">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-100 flex items-center justify-center text-amber-600">
              <i className="ti ti-shield-lock text-2xl" />
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900">Admin console is private</h1>
            <p className="text-sm text-slate-600">
              The admin console is only available from{' '}
              <code className="bg-slate-100 px-1.5 py-0.5 rounded text-xs">localhost</code> during
              development — it is intentionally disabled on the live site.
            </p>
          </div>
        </div>
      </div>
    )
  }

  const signups = stats?.signups ?? {}
  const active = stats?.active_users ?? {}

  const statCards = [
    { label: 'TOTAL USERS', value: stats?.total_users ?? 0, icon: 'ti ti-users', tone: 'text-slate-900', sub: `${stats?.google_users ?? 0} via Google` },
    { label: 'ACTIVE 24H', value: active.last_24h ?? 0, icon: 'ti ti-bolt', tone: 'text-indigo-600', sub: `${active.last_7d ?? 0} active 7d · ${active.last_30d ?? 0} active 30d` },
    { label: 'SIGNUPS 7D', value: signups.last_7d ?? 0, icon: 'ti ti-user-plus', tone: 'text-emerald-600', sub: `${signups.today ?? 0} today · ${signups.last_30d ?? 0} in 30d` },
    { label: 'PROFILES', value: stats?.total_profiles ?? 0, icon: 'ti ti-id-badge-2', tone: 'text-purple-600', sub: `${stats?.profile_completion_rate ?? 0}% complete` },
    { label: 'APPLICATIONS', value: stats?.total_applications ?? 0, icon: 'ti ti-layout-kanban', tone: 'text-amber-600', sub: `${stats?.total_notifications ?? 0} notifications` },
  ]

  return (
    <div className="min-h-screen bg-white pt-24 pb-20 font-sans relative overflow-hidden">
      <div className="absolute top-0 right-1/4 w-[600px] h-[400px] bg-gradient-to-br from-red-500/5 via-indigo-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-[1240px] mx-auto px-6 relative z-10 space-y-10">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200/80">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="prism-mono text-[11px] font-bold text-red-600 bg-red-50 px-3 py-1 rounded-full uppercase tracking-wider">
                <i className="ti ti-shield-lock mr-1.5" /> ADMIN CONSOLE
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">Platform Control Room</h1>
            <p className="text-sm text-slate-500">Signups, active users, and stored user data — for launch monitoring.</p>
          </div>
          <button
            onClick={load}
            disabled={loading || busy}
            className="bg-white border border-slate-200 text-slate-700 px-4 py-2.5 rounded-xl text-xs font-bold hover:bg-slate-50 transition-all disabled:opacity-50 flex items-center gap-2 shadow-xs"
          >
            <i className={`ti ${loading ? 'ti-loader-2 animate-spin' : 'ti-refresh'}`} />
            Refresh
          </button>
        </div>

        {notice && (
          <div className="rounded-2xl px-4 py-3 text-sm font-bold border bg-emerald-50 border-emerald-200 text-emerald-700 flex items-center justify-between">
            <span>{notice}</span>
            <button onClick={() => setNotice(null)} className="text-emerald-600 hover:text-emerald-800"><i className="ti ti-x" /></button>
          </div>
        )}

        {error && (
          <div className="rounded-2xl px-4 py-3 text-sm font-bold border bg-red-50 border-red-200 text-red-700">
            {error}
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {statCards.map((c) => (
            <div key={c.label} className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm space-y-2 hover:border-indigo-300 hover:shadow-md transition-all">
              <div className="flex items-center justify-between">
                <span className="prism-mono text-[10px] uppercase font-bold text-slate-400">{c.label}</span>
                <i className={`ti ${c.icon} text-sm ${c.tone}`} />
              </div>
              <div className="text-3xl font-extrabold text-slate-900">
                {loading ? <span className="inline-block w-10 h-7 bg-slate-100 animate-pulse rounded" /> : <CountUp end={c.value} />}
              </div>
              <span className="text-[11px] text-slate-500 block truncate">{c.sub}</span>
            </div>
          ))}
        </div>

        {/* Users table */}
        <section className="space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-tight">
              Registered Users ({users.length})
            </h2>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-16 bg-slate-100 animate-pulse rounded-2xl" />
              ))}
            </div>
          ) : users.length === 0 ? (
            <div className="p-10 bg-[#FAFAFA] border border-slate-200 rounded-2xl text-center space-y-2">
              <i className="ti ti-users text-3xl text-slate-300" />
              <p className="text-sm text-slate-500 font-bold">No users yet</p>
              <p className="text-xs text-slate-400">New signups will appear here in real time.</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-slate-200">
              <table className="w-full text-left text-sm min-w-[900px]">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    {['USER', 'EMAIL', 'ROLE', 'SIGNED UP', 'LAST LOGIN', 'PROFILE', 'ACTIVITY'].map((h) => (
                      <th key={h} className="prism-mono text-[10px] uppercase font-bold text-slate-400 px-4 py-3">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 bg-[#0A0A0A] text-white rounded-full flex items-center justify-center text-[10px] font-extrabold font-mono shrink-0">
                            {(u.name || '?').charAt(0).toUpperCase()}
                          </div>
                          <span className="font-bold text-slate-800">{u.name}</span>
                          {u.google_id && (
                            <span className="prism-mono text-[9px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded font-bold">G</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-600">{u.email}</td>
                      <td className="px-4 py-3">
                        <span className={`prism-mono text-[10px] font-bold px-2 py-0.5 rounded ${u.role === 'admin' ? 'bg-red-50 text-red-600' : 'bg-slate-100 text-slate-500'}`}>
                          {u.role.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-500 text-xs">{fmtDate(u.created_at)}</td>
                      <td className="px-4 py-3 text-slate-500 text-xs">{fmtDate(u.last_login)}</td>
                      <td className="px-4 py-3 text-slate-600 text-xs">
                        {u.profile ? (
                          <div className="space-y-0.5 max-w-[240px]">
                            <div className="truncate"><span className="font-bold">Institution:</span> {u.profile.institution || '—'}</div>
                            <div className="truncate"><span className="font-bold">Degree:</span> {u.profile.academic_degree || '—'}</div>
                            <div className="truncate"><span className="font-bold">Field:</span> {u.profile.field_of_study || '—'}</div>
                          </div>
                        ) : (
                          <span className="text-slate-300 italic">No profile yet</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-slate-600 text-xs">
                        <span className="font-bold">{u.applications_count}</span> apps · <span className="font-bold">{u.notifications_count}</span> notif
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Danger zone */}
        <section className="border border-red-200 bg-red-50/40 rounded-3xl p-6 sm:p-8 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-red-100 flex items-center justify-center text-red-600">
              <i className="ti ti-alert-triangle" />
            </div>
            <div>
              <h2 className="font-extrabold text-slate-900">Danger Zone — Wipe All User Data</h2>
              <p className="text-xs text-slate-500">
                Deletes every user, profile, application, notification, follower and token.
                Opportunities, organizations and sources are <span className="font-bold">not</span> touched. This cannot be undone.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setWipeConfirmOpen(true)}
              disabled={busy}
              className="bg-red-600 hover:bg-red-700 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition-all disabled:opacity-50 flex items-center gap-2"
            >
              <i className={`ti ${busy ? 'ti-loader-2 animate-spin' : 'ti-trash'}`} />
              {busy ? 'Wiping…' : 'Wipe All User Data'}
            </button>
          </div>
        </section>

        {/* Wipe confirmation modal */}
        {wipeConfirmOpen && (
          <div className="fixed inset-0 z-[60] bg-slate-950/50 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-7 space-y-5">
              <div className="flex items-center justify-between">
                <h3 className="font-extrabold text-slate-900 flex items-center gap-2">
                  <i className="ti ti-alert-triangle text-red-600" /> Confirm destructive wipe
                </h3>
                <button onClick={() => setWipeConfirmOpen(false)} className="text-slate-400 hover:text-slate-700"><i className="ti ti-x" /></button>
              </div>
              <p className="text-sm text-slate-600">
                This permanently deletes <span className="font-bold">{users.length} user(s)</span> and all of their data.
                To confirm, type <code className="bg-slate-100 px-1.5 py-0.5 rounded text-xs font-bold">reset</code> below.
              </p>
              <input
                value={wipeTyped}
                onChange={(e) => setWipeTyped(e.target.value)}
                placeholder="type reset"
                className="w-full border border-slate-300 rounded-xl px-4 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-red-400"
              />
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => { setWipeConfirmOpen(false); setWipeTyped('') }}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleWipe}
                  disabled={wipeTyped.trim().toLowerCase() !== 'reset' || busy}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-red-600 text-white hover:bg-red-700 transition-colors disabled:opacity-40"
                >
                  {busy ? 'Wiping…' : 'Wipe Everything'}
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
