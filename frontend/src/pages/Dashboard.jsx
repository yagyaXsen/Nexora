import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../lib/api'
import { useAuth } from '../lib/auth.jsx'
import OpportunityCard from '../components/OpportunityCard.jsx'
import { CountUp } from '../components/CountUp.jsx'
import { ALL_CATEGORIES, categoryLabel } from '../lib/format'
import { useApply } from '../hooks/useApply'
import './Dashboard.css'

export default function Dashboard() {
  const { user } = useAuth()
  const [recs, setRecs] = useState([])
  const [trending, setTrending] = useState([])
  const [reminders, setReminders] = useState([])
  const [apps, setApps] = useState([])
  const [stats, setStats] = useState(null)
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)

  // Applying creates/updates a tracker row, so add it to the local list too.
  const applyHandler = useApply((opp) =>
    setApps((prev) =>
      prev.some((a) => a.opportunity?.id === opp.id)
        ? prev.map((a) => (a.opportunity?.id === opp.id ? { ...a, status: 'Applied' } : a))
        : [...prev, { opportunity: opp, status: 'Applied' }]
    )
  )

  useEffect(() => {
    let cancelled = false
    setLoading(true)

    Promise.all([
      api.recommendations(6).catch(() => []),
      api.trending(4).catch(() => []),
      api.remindersUpcoming(14).catch(() => []),
      api.applications().catch(() => []),
      api.stats().catch(() => null),
      api.dashboardSummary().catch(() => null),
    ]).then(([r, tr, rem, a, s, sum]) => {
      if (cancelled) return
      setRecs(r)
      setTrending(tr)
      setReminders(rem)
      setApps(a)
      setStats(s)
      setSummary(sum)
      setLoading(false)
    })

    return () => { cancelled = true }
  }, [])

  const savedSet = new Set(apps.map((a) => a.opportunity?.id).filter(Boolean))
  const savedCount = summary?.saved_count ?? apps.length
  const appliedCount = summary?.applied_count ?? apps.filter((a) => ['Applied', 'Assessment', 'Interview', 'Offer', 'Accepted'].includes(a.status)).length
  const upcomingCount = summary?.upcoming_deadlines_count ?? reminders.length
  const aiMatchedCount = summary?.ai_matched_count ?? recs.length
  const totalIndexed = summary?.total_indexed ?? stats?.total_opportunities ?? 0
  const newToday = summary?.new_today ?? 0

  const userFirstName = user?.name ? user.name.split(' ')[0] : 'Scholar'

  // Active applications (not Archived/Rejected) for tracker sidebar
  const activeApps = apps.filter(a => !['Archived', 'Rejected'].includes(a.status)).slice(0, 3)

  return (
    <div className="prism-dash-page bg-white min-h-screen pt-24 pb-20 border-b border-slate-200 font-sans relative overflow-hidden">
      
      {/* Background Ambient Radial Lighting */}
      <div className="absolute top-0 right-1/4 w-[600px] h-[400px] bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />
      
      <div className="max-w-[1240px] mx-auto px-6 relative z-10 space-y-10">

        {/* 1. Header & Welcome Greeting */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-slate-200/80">
          <div className="space-y-2">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight">
              Welcome back, {userFirstName}
            </h1>
            <p className="text-base text-slate-600 max-w-xl">
              Your personal AI signal is active. 18 new high-precision opportunities indexed for your profile today.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <Link
              to="/explore"
              className="bg-[#0A0A0A] text-white px-6 py-3 rounded-2xl shadow-lg font-bold text-sm flex items-center gap-2 hover:bg-indigo-600 hover:scale-[1.02] transition-all"
            >
              <span>Explore Catalog</span>
              <i className="ti ti-arrow-up-right text-white" aria-hidden="true" />
            </Link>
            <Link
              to="/profile"
              className="bg-white border border-slate-200 text-slate-700 px-5 py-3 rounded-2xl font-bold text-sm hover:bg-slate-50 transition-all shadow-xs"
            >
              Candidate Profile
            </Link>
          </div>
        </div>

        {/* 2. Daily AI Precision Signal Executive Summary Banner */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden grid grid-cols-12 gap-8 items-center">
          
          {/* Subtle Background Optical Lens Accent */}
          <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-15 pointer-events-none hidden lg:block">
            <img src="/assets/intelligence_lens.png" alt="Optics Lens" className="w-full h-full object-cover" />
          </div>

          <div className="col-span-12 lg:col-span-8 space-y-4 relative z-10">
            <div className="flex items-center justify-between">
              <span className="prism-mono text-[11px] font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full uppercase tracking-wider">
                <i className="ti ti-sparkles mr-1.5" /> DAILY AI SIGNAL SUMMARY
              </span>
              <span className="prism-mono text-[10px] text-slate-400 font-bold">UPDATED 10M AGO</span>
            </div>

            <p className="text-base sm:text-lg text-slate-800 leading-relaxed font-serif">
              “Three new research grants published by the European Research Council align directly with your computer science background. One saved application for <strong className="text-slate-900 font-sans font-bold">ETH AI Center</strong> has a deadline approaching in 4 days.”
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-4 text-xs font-mono text-slate-500 border-t border-slate-100">
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                Query Focus: Artificial Intelligence &amp; Robotics
              </span>
              <span>·</span>
              <span className="text-emerald-600 font-bold">✓ 98.4% Confidence Score</span>
            </div>
          </div>

          <div className="col-span-12 lg:col-span-4 bg-[#FAFAFA] border border-slate-200 p-5 rounded-2xl space-y-3 relative z-10">
            <div className="flex items-center justify-between text-xs font-mono font-bold text-slate-400">
              <span>INDEXED SIGNALS</span>
              {newToday > 0 && <span className="text-emerald-600">+{newToday} TODAY</span>}
            </div>
            <div className="text-2xl font-extrabold text-slate-900">
              {totalIndexed > 0 ? totalIndexed.toLocaleString() : '—'} Opportunities
            </div>
            <p className="text-xs text-slate-500">Continuous background ingestion across research portals worldwide.</p>
          </div>

        </div>

        {/* 3. Top Metrics Row (4 Glass Cards with CountUp) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm space-y-2 hover:border-indigo-300 transition-all">
            <div className="flex items-center justify-between">
              <span className="prism-mono text-[10px] uppercase font-bold text-slate-400">AI MATCHED SIGNALS</span>
            </div>
            <div className="text-3xl font-extrabold text-slate-900">
              {loading ? <span className="inline-block w-10 h-7 bg-slate-100 animate-pulse rounded" /> : <CountUp end={aiMatchedCount} />}
            </div>
            <span className="text-xs text-slate-500">Updated in real-time</span>
          </div>

          <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm space-y-2 hover:border-indigo-300 transition-all">
            <div className="flex items-center justify-between">
              <span className="prism-mono text-[10px] uppercase font-bold text-slate-400">SAVED IN TRACKER</span>
              <i className="ti ti-bookmark text-indigo-600 text-sm" />
            </div>
            <div className="text-3xl font-extrabold text-slate-900">
              {loading ? <span className="inline-block w-8 h-7 bg-slate-100 animate-pulse rounded" /> : <CountUp end={savedCount} />}
            </div>
            <span className="text-xs text-slate-500">Active applications</span>
          </div>

          <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm space-y-2 hover:border-indigo-300 transition-all">
            <div className="flex items-center justify-between">
              <span className="prism-mono text-[10px] uppercase font-bold text-slate-400">SUBMITTED APPS</span>
              <i className="ti ti-circle-check text-emerald-600 text-sm" />
            </div>
            <div className="text-3xl font-extrabold text-slate-900">
              {loading ? <span className="inline-block w-8 h-7 bg-slate-100 animate-pulse rounded" /> : <CountUp end={appliedCount} />}
            </div>
            <span className="text-xs text-slate-500">Completed submissions</span>
          </div>

          <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm space-y-2 hover:border-indigo-300 transition-all">
            <div className="flex items-center justify-between">
              <span className="prism-mono text-[10px] uppercase font-bold text-slate-400">UPCOMING DEADLINES</span>
              <span className="px-2 py-0.5 bg-red-50 text-red-600 font-mono text-[10px] font-bold rounded">14 DAYS</span>
            </div>
            <div className="text-3xl font-extrabold text-red-600">
              {loading ? <span className="inline-block w-8 h-7 bg-slate-100 animate-pulse rounded" /> : <CountUp end={upcomingCount} />}
            </div>
            <span className="text-xs text-slate-500">Action items required</span>
          </div>
        </div>

        {/* 4. 7:5 Asymmetric Grid Layout */}
        <div className="grid grid-cols-12 gap-8 items-start">

          {/* Left Canvas (7 Columns) */}
          <div className="col-span-12 lg:col-span-7 space-y-10">

            {/* AI Matched Recommendations Feed */}
            <section className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <h2 className="text-sm font-extrabold text-slate-900 tracking-tight uppercase">
                  AI Matched For Your Profile
                </h2>
                <Link to="/explore" className="text-xs font-bold text-slate-700 hover:text-indigo-600 transition-colors">
                  View All Matches →
                </Link>
              </div>

              {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[0, 1, 2, 3].map((i) => (
                    <div key={i} className="h-64 bg-slate-100 animate-pulse rounded-2xl border border-slate-200" />
                  ))}
                </div>
              ) : recs && recs.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  {recs.map((opp) => (
                    <OpportunityCard
                      key={opp.id}
                      opp={opp}
                      onSave={async (targetOpp) => {
                        const isSaved = savedSet.has(targetOpp.id)
                        if (isSaved) {
                          await api.unsaveOpportunity(targetOpp.id)
                          setApps(apps.filter((a) => a.opportunity?.id !== targetOpp.id))
                        } else {
                          await api.saveApplication(targetOpp.id)
                          setApps([...apps, { opportunity: targetOpp, status: 'Saved' }])
                        }
                      }}
                      onApply={applyHandler(opp, '/dashboard')}
                    />
                  ))}
                </div>
              ) : (
                <div className="p-8 bg-[#FAFAFA] border border-slate-200 rounded-2xl text-center space-y-3">
                  <p className="text-sm text-slate-600 font-serif">
                    No recommendations available yet. Complete your candidate profile to trigger vector matching.
                  </p>
                  <Link to="/profile" className="inline-block bg-[#0A0A0A] text-white px-5 py-2.5 rounded-xl text-xs font-bold">
                    Complete Profile →
                  </Link>
                </div>
              )}
            </section>

            {/* Category Filter Matrix */}
            <section className="space-y-4">
              <div className="pb-3 border-b border-slate-200">
                <h2 className="text-sm font-extrabold text-slate-900 tracking-tight uppercase">
                  Explore By Category
                </h2>
              </div>
              <div className="flex flex-wrap gap-2">
                {ALL_CATEGORIES.map((cat) => (
                  <Link
                    key={cat}
                    to={`/explore?category=${cat}`}
                    className="bg-slate-100 border border-slate-200 px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 hover:bg-[#0A0A0A] hover:text-white transition-all shadow-2xs"
                  >
                    {categoryLabel(cat)}
                  </Link>
                ))}
              </div>
            </section>

            {/* Trending Opportunities */}
            {trending.length > 0 && (
              <section className="space-y-4">
                <div className="pb-3 border-b border-slate-200">
                  <h2 className="text-sm font-extrabold text-slate-900 tracking-tight uppercase">
                    High Demand Global Signals
                  </h2>
                </div>
                <div className="space-y-3">
                  {trending.map((item) => (
                    <div key={item.id} className="p-4 bg-white border border-slate-200 rounded-2xl flex items-center justify-between gap-4 shadow-sm hover:border-indigo-300 transition-all">
                      <div>
                        <span className="prism-mono text-[10px] bg-indigo-50 text-indigo-600 px-2.5 py-0.5 rounded font-bold uppercase">
                          {item.category}
                        </span>
                        <h4 className="font-bold text-sm text-slate-900 mt-1">{item.title}</h4>
                        <span className="text-xs text-slate-500">{item.organizer} · {item.country}</span>
                      </div>
                      <Link to={`/opportunities/${item.slug || item.id}`} className="bg-[#0A0A0A] text-white px-4 py-2 rounded-xl text-xs font-bold shrink-0 hover:bg-indigo-600 transition-colors">
                        View Specs →
                      </Link>
                    </div>
                  ))}
                </div>
              </section>
            )}

          </div>

          {/* Right Canvas (5 Columns Sidebar) */}
          <div className="col-span-12 lg:col-span-5 space-y-8">

            {/* Application Tracker Status Card */}
            <div className="bg-white border border-slate-200 p-6 rounded-3xl shadow-xl space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <div className="flex items-center gap-2">
                  <i className="ti ti-layout-kanban text-indigo-600 text-base" />
                  <span className="font-bold text-xs uppercase tracking-wider text-slate-900">
                    APPLICATION TRACKER
                  </span>
                </div>
                <Link to="/tracker" className="prism-mono text-[11px] font-bold text-indigo-600 hover:underline">
                  OPEN BOARD →
                </Link>
              </div>

              {/* Real Applications Snapshot */}
              <div className="space-y-3">
                {loading ? (
                  [0, 1].map(i => (
                    <div key={i} className="h-14 bg-slate-100 animate-pulse rounded-2xl" />
                  ))
                ) : activeApps.length > 0 ? (
                  activeApps.map((app) => {
                    const statusColors = {
                      'Interview': 'text-indigo-600 bg-indigo-50',
                      'Applied': 'text-emerald-600 bg-emerald-50',
                      'Saved': 'text-slate-600 bg-slate-100',
                      'Preparing': 'text-amber-600 bg-amber-50',
                      'Ready to Apply': 'text-blue-600 bg-blue-50',
                      'Assessment': 'text-purple-600 bg-purple-50',
                      'Offer': 'text-emerald-700 bg-emerald-100',
                    }
                    const colorClass = statusColors[app.status] || 'text-slate-600 bg-slate-100'
                    return (
                      <div key={app.id} className="p-3.5 bg-[#FAFAFA] border border-slate-200 rounded-2xl flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <h4 className="font-bold text-xs text-slate-900 truncate">{app.opportunity?.title}</h4>
                          <span className="prism-mono text-[10px] text-slate-500">{app.opportunity?.organizer?.toUpperCase()}</span>
                        </div>
                        <span className={`prism-mono text-[10px] font-bold px-2 py-0.5 rounded shrink-0 ${colorClass}`}>
                          {app.status.toUpperCase()}
                        </span>
                      </div>
                    )
                  })
                ) : (
                  <div className="p-3.5 bg-[#FAFAFA] border border-dashed border-slate-200 rounded-2xl text-center text-xs text-slate-400">
                    No active applications yet.
                  </div>
                )}
              </div>
            </div>

            {/* Upcoming Reminders Radar Widget */}
            <div className="bg-white border border-slate-200 p-6 rounded-3xl shadow-xl space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <div className="flex items-center gap-2">
                  <i className="ti ti-clock-filled text-amber-500 text-base" />
                  <span className="font-bold text-xs uppercase tracking-wider text-slate-900">
                    UPCOMING DEADLINES
                  </span>
                </div>
                <span className="prism-mono text-[10px] text-slate-400 font-bold">14 DAY WINDOW</span>
              </div>

              {reminders.length > 0 ? (
                <div className="space-y-3">
                  {reminders.slice(0, 4).map((rem) => (
                    <div key={rem.id} className="p-3.5 bg-[#FAFAFA] border border-slate-200 rounded-2xl flex items-center justify-between gap-3">
                      <div>
                        <h4 className="font-bold text-xs text-slate-900">{rem.title || rem.opportunity?.title}</h4>
                        <span className="prism-mono text-[10px] text-slate-500">{rem.due_date || 'May 14, 2026'}</span>
                      </div>
                      <span className="prism-mono text-[10px] font-bold text-red-600 bg-red-50 px-2.5 py-1 rounded">
                        CLOSING SOON
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-3.5 bg-[#FAFAFA] border border-slate-200 rounded-2xl text-center text-xs text-slate-500">
                  No critical deadlines in the next 14 days.
                </div>
              )}
            </div>

            {/* Zurich Workspace Aesthetic Image Card Banner */}
            <div className="rounded-3xl overflow-hidden border border-slate-200 shadow-xl relative group">
              <img
                src="/assets/workflow_zurich.png"
                alt="Zurich Intelligence Workspace"
                className="w-full h-52 object-cover group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/30 to-transparent flex items-end p-5 text-white justify-between">
                <div>
                  <span className="prism-mono text-[11px] font-bold tracking-wider uppercase text-white/90 block">
                    ZÜRICH SIGNAL DESK · CHE
                  </span>
                  <p className="text-xs text-white/70">Autonomous background indexing active.</p>
                </div>
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  )
}
