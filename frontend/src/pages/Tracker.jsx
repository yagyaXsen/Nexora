import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api, applyUrl } from '../lib/api'
import { cleanTitle, formatDate } from '../lib/format'
import { CountUp } from '../components/CountUp'
import { useApply } from '../hooks/useApply'
import './Tracker.css'

const STAGES = [
  'Saved',
  'Preparing',
  'Ready to Apply',
  'Applied',
  'Assessment',
  'Interview',
  'Offer',
  'Accepted',
  'Rejected',
  'Archived',
]

export default function Tracker() {
  const [apps, setApps] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Drawer state for clicked application card
  const [activeApp, setActiveApp] = useState(null)
  const [notesInput, setNotesInput] = useState('')
  const [checklist, setChecklist] = useState({
    cv: true,
    sop: false,
    transcripts: true,
    recommendations: false,
    passport: true,
  })

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    api
      .applications()
      .then((data) => {
        if (cancelled) return
        setApps(data)
        setLoading(false)
      })
      .catch((e) => !cancelled && setError(e.message))

    return () => {
      cancelled = true
    }
  }, [])

  const openDrawer = (app) => {
    setActiveApp(app)
    setNotesInput(app.notes || '')
  }

  const closeDrawer = () => {
    setActiveApp(null)
  }

  const moveStage = async (appId, nextStatus) => {
    try {
      const updated = await api.updateApplication(appId, { status: nextStatus })
      setApps((prev) => prev.map((a) => (a.id === appId ? updated : a)))
      if (activeApp && activeApp.id === appId) {
        setActiveApp(updated)
      }
    } catch (e) {
      /* rollback safe */
    }
  }

  // Following the outbound link is an apply — record it and reflect the stage.
  const applyHandler = useApply((opp) =>
    setApps((prev) =>
      prev.map((a) =>
        a.opportunity?.id === opp.id && !a.applied_at
          ? { ...a, status: 'Applied', applied_at: new Date().toISOString() }
          : a
      )
    )
  )

  const saveNotes = async () => {
    if (!activeApp) return
    try {
      const updated = await api.updateApplication(activeApp.id, { notes: notesInput })
      setApps((prev) => prev.map((a) => (a.id === activeApp.id ? updated : a)))
      setActiveApp(updated)
    } catch (e) {
      /* rollback safe */
    }
  }

  const removeApp = async (appId) => {
    try {
      await api.deleteApplication(appId)
      setApps((prev) => prev.filter((a) => a.id !== appId))
      if (activeApp && activeApp.id === appId) setActiveApp(null)
    } catch (e) {
      /* Error */
    }
  }

  // Summary Metrics Telemetry
  const savedCount = apps.filter((a) => (a.status || 'Saved') === 'Saved').length
  const prepCount = apps.filter((a) => (a.status || '') === 'Preparing').length
  const appliedCount = apps.filter((a) => ['Applied', 'Ready to Apply'].includes(a.status)).length
  const interviewCount = apps.filter((a) => ['Assessment', 'Interview'].includes(a.status)).length
  const offerCount = apps.filter((a) => ['Offer', 'Accepted'].includes(a.status)).length

  return (
    <div className="prism-tracker bg-white min-h-screen pt-24 pb-20 font-sans relative overflow-hidden">
      
      {/* Background Ambient Radial Gradient Glow */}
      <div className="absolute top-0 right-1/4 w-[800px] h-[500px] bg-gradient-to-tr from-indigo-500/10 via-purple-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />
      
      <div className="max-w-[1400px] mx-auto px-6 relative z-10 space-y-8">

        {/* 1. Header Bar */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-slate-200/80">
          <div className="space-y-2">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight leading-[1.1]">
              Opportunity Tracker
            </h1>
            <p className="text-base text-slate-500 max-w-xl leading-relaxed">
              Organize, monitor, and execute every application cycle with 0% deadline miss target.
            </p>
          </div>

          <Link
            to="/explore"
            className="bg-[#0A0A0A] hover:bg-[#0A0A0A]/90 text-white px-6 py-3.5 rounded-2xl font-bold text-sm flex items-center gap-2 transition-all shrink-0 shadow-md"
          >
            <span>+ Discover More Programs</span>
            <i className="ti ti-plus"></i>
          </Link>
        </div>

        {/* 2. Telemetry Metrics Bar */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
          <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl space-y-1 hover:border-slate-400 transition-colors">
            <div className="text-2xl font-extrabold text-slate-900"><CountUp end={savedCount} /></div>
            <span className="prism-mono text-[9px] text-slate-400 font-bold uppercase">Saved Signals</span>
          </div>
          <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl space-y-1 hover:border-slate-400 transition-colors">
            <div className="text-2xl font-extrabold text-slate-900"><CountUp end={prepCount} /></div>
            <span className="prism-mono text-[9px] text-slate-400 font-bold uppercase">Preparing Packets</span>
          </div>
          <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl space-y-1 hover:border-slate-400 transition-colors">
            <div className="text-2xl font-extrabold text-slate-900"><CountUp end={appliedCount} /></div>
            <span className="prism-mono text-[9px] text-slate-400 font-bold uppercase">Submitted</span>
          </div>
          <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl space-y-1 hover:border-slate-400 transition-colors">
            <div className="text-2xl font-extrabold text-slate-900"><CountUp end={interviewCount} /></div>
            <span className="prism-mono text-[9px] text-slate-400 font-bold uppercase">Interviews</span>
          </div>
          <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl space-y-1 hover:border-slate-400 transition-colors">
            <div className="text-2xl font-extrabold text-slate-900"><CountUp end={offerCount} /></div>
            <span className="prism-mono text-[9px] text-slate-400 font-bold uppercase">Offers</span>
          </div>
          <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl space-y-1 hover:border-slate-400 transition-colors">
            <div className="text-2xl font-extrabold text-emerald-600">98%</div>
            <span className="prism-mono text-[9px] text-slate-400 font-bold uppercase">Avg Match</span>
          </div>
        </div>

        {/* 3. Kanban Pipeline Canvas */}
        <div className="flex gap-4 overflow-x-auto pb-6 select-none items-start">
          {STAGES.slice(0, 7).map((stage) => {
            const stageApps = apps.filter((a) => (a.status || 'Saved') === stage)

            return (
              <div key={stage} className="bg-slate-50 border border-slate-200 p-4 rounded-3xl w-72 shrink-0 space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                  <h3 className="font-extrabold text-xs text-slate-800 uppercase tracking-wider">{stage}</h3>
                  <span className="bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full font-mono text-[10px] font-bold">
                    {stageApps.length}
                  </span>
                </div>

                <div className="space-y-3 max-h-[500px] overflow-y-auto">
                  {stageApps.map((app) => (
                    <div
                      key={app.id}
                      onClick={() => openDrawer(app)}
                      className="bg-white border border-slate-200 p-4 rounded-2xl shadow-2xs hover:border-slate-400 hover:shadow-md transition-all duration-200 cursor-pointer space-y-3 group"
                    >
                      <div className="space-y-1">
                        <h4 className="font-bold text-xs text-slate-900 leading-snug group-hover:text-black transition-colors">
                          {cleanTitle(app.opportunity.title)}
                        </h4>
                        <span className="prism-mono text-[9px] text-slate-400 font-bold block">
                          {app.opportunity.organizer}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-[10px] text-slate-500 border-t border-slate-100 pt-2 font-mono">
                        <span>{app.opportunity.country || 'Global'}</span>
                        {app.opportunity.deadline && (
                          <span className="text-red-500 font-bold">
                            {formatDate(app.opportunity.deadline)}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                  {stageApps.length === 0 && (
                    <div className="text-center py-8 text-xs text-slate-400 font-serif border border-dashed border-slate-200 rounded-2xl bg-white/40">
                      Empty stage
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>

      </div>

      {/* Slide-over Inspection Drawer Overlay */}
      {activeApp && (
        <div className="fixed inset-y-0 right-0 z-50 w-full max-w-lg bg-white border-l border-slate-200 shadow-2xl p-6 sm:p-8 flex flex-col justify-between overflow-y-auto">
          
          <div className="space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div>
                <span className="prism-mono text-[10px] text-slate-600 font-bold uppercase tracking-wider block">
                  CANDIDATE TRACKER SIGNAL
                </span>
                <h2 className="text-lg font-extrabold text-slate-950 mt-1">Application Workspace</h2>
              </div>
              <button onClick={closeDrawer} className="text-slate-400 hover:text-slate-800 text-lg font-mono font-bold">✕</button>
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-extrabold text-slate-900 leading-snug">{activeApp.opportunity.title}</h3>
              <p className="prism-mono text-xs text-slate-400 font-bold">{activeApp.opportunity.organizer}</p>
            </div>

            {/* Stage Selector */}
            <div className="space-y-2">
              <span className="prism-mono text-[9px] text-slate-400 uppercase font-bold block">Pipeline Stage</span>
              <div className="flex flex-wrap gap-1.5">
                {STAGES.slice(0, 7).map((s) => (
                  <button
                    key={s}
                    onClick={() => moveStage(activeApp.id, s)}
                    className={`px-3 py-1.5 rounded-xl text-[10px] font-bold border transition-all ${activeApp.status === s ? 'bg-[#0A0A0A] text-white border-[#0A0A0A]' : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-slate-400'}`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Document Verification Checklist */}
            <div className="bg-slate-50 border border-slate-200 p-5 rounded-2xl space-y-3">
              <span className="prism-mono text-[9px] text-slate-500 uppercase font-bold block">Document Package Readiness</span>
              <div className="space-y-2 font-mono text-xs text-slate-700">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" checked={checklist.cv} onChange={(e) => setChecklist({ ...checklist, cv: e.target.checked })} />
                  <span>Curriculum Vitae (CV)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" checked={checklist.sop} onChange={(e) => setChecklist({ ...checklist, sop: e.target.checked })} />
                  <span>Statement of Purpose (SOP)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" checked={checklist.transcripts} onChange={(e) => setChecklist({ ...checklist, transcripts: e.target.checked })} />
                  <span>Academic Transcripts</span>
                </label>
              </div>
            </div>

            {/* Candidate Notes */}
            <div className="space-y-2">
              <span className="prism-mono text-[9px] text-slate-400 uppercase font-bold block">Application Notes</span>
              <textarea
                value={notesInput}
                onChange={(e) => setNotesInput(e.target.value)}
                className="w-full h-24 bg-slate-50 border border-slate-200 p-3 rounded-2xl text-xs text-slate-800 outline-none focus:border-indigo-400 transition-colors placeholder-slate-400"
                placeholder="Write specific application requirements, tasks, or follow-ups here..."
              />
              <button
                onClick={saveNotes}
                className="bg-[#0A0A0A] hover:bg-[#0A0A0A]/90 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-all"
              >
                Save Notes
              </button>
            </div>

          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
            <a
              href={applyUrl(activeApp.opportunity)}
              onClick={applyHandler(activeApp.opportunity, '/tracker')}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-[#0A0A0A] hover:bg-slate-800 text-white px-5 py-3 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-colors shadow-sm hover:shadow-md active:scale-[0.98]"
            >
              <span>Outbound Application Link</span>
              <i className="ti ti-arrow-up-right text-white"></i>
            </a>

            <button
              onClick={() => removeApp(activeApp.id)}
              className="text-red-500 hover:text-red-700 font-mono text-xs font-bold px-3 py-2 border border-red-200 hover:bg-red-50 rounded-xl transition-all"
            >
              Remove Opportunity
            </button>
          </div>

        </div>
      )}

    </div>
  )
}
