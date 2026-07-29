import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { api, applyUrl } from '../lib/api'
import { useApply } from '../hooks/useApply'
import { useAuth } from '../lib/auth.jsx'
import {
  categoryLabel,
  cleanTitle,
  deadlineInfo,
  formatDate,
  orgSlug,
} from '../lib/format'
import OpportunityCard from '../components/OpportunityCard.jsx'
import './OpportunityDetail.css'



export default function OpportunityDetail() {
  const { idOrSlug } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()

  const [opp, setOpp] = useState(null)
  const [similar, setSimilar] = useState([])
  const [notFound, setNotFound] = useState(false)
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setOpp(null)
    setNotFound(false)

    api
      .opportunity(idOrSlug)
      .then((data) => {
        setOpp(data)
        // Fetch similar signals based on category
        api.opportunities({ category: data.category, page_size: 3 }).then((r) => {
          setSimilar(r.items.filter((item) => item.id !== data.id))
        })
      })
      .catch(() => setNotFound(true))
  }, [idOrSlug])

  useEffect(() => {
    if (!user || !opp) return
    api
      .applications()
      .then((apps) => setSaved(apps.some((a) => a.opportunity.id === opp.id)))
      .catch(() => {})
  }, [user, opp])

  const toggleSave = async () => {
    if (!user) {
      navigate('/login', { state: { from: `/opportunities/${idOrSlug}` } })
      return
    }
    const previousState = saved
    // ⚡ Instant Real-Time Optimistic UI Update
    setSaved(!previousState)
    setSaving(true)

    try {
      if (previousState) {
        await api.unsaveOpportunity(opp.id)
      } else {
        await api.saveApplication(opp.id)
      }
    } catch {
      // Revert if network error
      setSaved(previousState)
    } finally {
      setSaving(false)
    }
  }

  // Gate the apply, then record it. See useApply — the <a> still navigates even
  // if the POST fails, so a backend hiccup never costs the user their application.
  // Bound at the call site below, since `opp` is null while loading.
  const applyHandler = useApply(() => setSaved(true))

  if (notFound) {
    return (
      <div className="bg-white min-h-screen pt-24 pb-20">
        <div className="max-w-[600px] mx-auto text-center py-16 space-y-6">
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Opportunity Record Not Found</h1>
          <p className="font-serif text-sm text-slate-600">
            This signal may have expired or been removed from the active database index.
          </p>
          <Link to="/explore" className="bg-[#0A0A0A] text-white px-6 py-3 rounded-2xl font-bold text-sm inline-block hover:bg-indigo-600 transition-colors">
            Return to Opportunity Explorer
          </Link>
        </div>
      </div>
    )
  }

  if (!opp) {
    return (
      <div className="bg-white min-h-screen pt-24 pb-20">
        <div className="max-w-[1240px] mx-auto px-6">
          <div className="h-64 bg-slate-100 animate-pulse rounded-3xl border border-slate-200" />
        </div>
      </div>
    )
  }

  const dl = deadlineInfo(opp.deadline, opp.status)
  const closed = opp.status === 'expired' || opp.status === 'dead_link'

  return (
    <div className="prism-opp-detail bg-white min-h-screen pt-24 pb-20 font-sans relative overflow-hidden">
      
      {/* Background Ambient Radial Gradient Glow */}
      <div className="absolute top-0 right-1/4 w-[800px] h-[500px] bg-gradient-to-tr from-indigo-500/10 via-purple-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />
      
      <div className="max-w-[1240px] mx-auto px-6 relative z-10 space-y-8">

        {/* 1. Breadcrumb Header */}
        <nav className="flex items-center gap-2 font-mono text-xs text-slate-400">
          <Link to="/explore" className="hover:text-slate-800 transition-colors">Explorer Index</Link>
          <span>/</span>
          <span className="uppercase text-slate-800 font-bold">{categoryLabel(opp.category)}</span>
        </nav>

        {/* 2. Asymmetric 7:5 Grid Layout */}
        <div className="grid grid-cols-12 gap-8 items-start">

          {/* Left Column (8 Columns: Content) */}
          <article className="col-span-12 lg:col-span-8 bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-xl space-y-6 p-6 sm:p-8">
            


            {/* Badges Bar */}
            <div className="flex flex-wrap items-center gap-2 font-mono text-xs">
              <span className="bg-slate-900 text-white px-2.5 py-0.5 rounded-full font-bold uppercase">{categoryLabel(opp.category)}</span>
              <span className="bg-red-50 text-red-600 px-2.5 py-0.5 rounded-full font-bold">{dl.text}</span>
              {opp.country && (
                <span className="bg-slate-50 border border-slate-200 px-2.5 py-0.5 rounded-full text-slate-700 font-bold flex items-center gap-1">
                  <i className="ti ti-map-pin text-indigo-600" />
                  <span>{opp.country}</span>
                </span>
              )}
            </div>

            {/* Program Title */}
            <div className="space-y-2">
              <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-950 tracking-tight leading-snug">{cleanTitle(opp.title)}</h1>
              <p className="text-sm text-slate-500">
                Hosted by{' '}
                <Link
                  to={`/organizations/${orgSlug(opp.organizer)}`}
                  className="text-indigo-600 font-bold hover:underline"
                >
                  {opp.organizer}
                </Link>
              </p>
            </div>

            {closed && (
              <div className="p-4 bg-amber-50 border border-amber-200 text-amber-900 text-xs font-mono rounded-2xl">
                NOTICE: This opportunity signal has expired or is no longer accepting new entries.
              </div>
            )}

            {/* Full Program Description */}
            <section className="space-y-3 pt-6 border-t border-slate-100">
              <h2 className="font-mono text-xs text-slate-400 font-bold uppercase tracking-widest">[ PROGRAM SPECIFICATIONS &amp; OVERVIEW ]</h2>
              <p className="font-serif text-base text-slate-700 leading-relaxed whitespace-pre-line">{opp.description}</p>
            </section>

            {/* Eligibility Requirements */}
            {opp.eligibility_text && (
              <section className="space-y-3 pt-6 border-t border-slate-100">
                <h2 className="font-mono text-xs text-slate-400 font-bold uppercase tracking-widest">[ ELIGIBILITY REQUIREMENTS ]</h2>
                <p className="font-serif text-sm text-slate-600 leading-relaxed">{opp.eligibility_text}</p>
              </section>
            )}

            {/* Tags & Topics */}
            {opp.tags?.length > 0 && (
              <section className="space-y-3 pt-6 border-t border-slate-100">
                <h2 className="font-mono text-xs text-slate-400 font-bold uppercase tracking-widest">[ INDEXED TOPICS &amp; TAGS ]</h2>
                <div className="flex flex-wrap gap-2">
                  {opp.tags.map((t) => (
                    <Link
                      key={t}
                      to={`/explore?q=${encodeURIComponent(t)}`}
                      className="bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-xl text-xs font-mono text-slate-600 hover:bg-[#0A0A0A] hover:text-white transition-all"
                    >
                      #{t}
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {/* Similar Opportunities Carousel */}
            {similar.length > 0 && (
              <section className="space-y-4 pt-8 border-t border-slate-100">
                <h2 className="font-mono text-xs text-slate-400 font-bold uppercase tracking-widest">[ SIMILAR HIGH-CONFIDENCE SIGNALS ]</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {similar.map((s) => (
                    <OpportunityCard key={s.id} opp={s} />
                  ))}
                </div>
              </section>
            )}
          </article>

          {/* Right Column (4 Columns: Actions Sidebar) */}
          <aside className="col-span-12 lg:col-span-4 space-y-6">

            {/* Opportunity Specs Summary */}
            <div className="bg-white border border-slate-200 p-6 rounded-3xl shadow-xl space-y-5">
              <div className="font-mono text-xs text-indigo-600 font-bold uppercase tracking-widest pb-3 border-b border-slate-200">
                [ OPPORTUNITY SPECS ]
              </div>

              {opp.deadline && (
                <div className="space-y-1">
                  <span className="prism-mono text-[9px] text-slate-400 uppercase font-bold">Application Deadline</span>
                  <div className="font-sans font-extrabold text-base text-slate-900">{formatDate(opp.deadline)}</div>
                  <div className="prism-mono text-xs text-red-500 font-bold">{dl.text}</div>
                </div>
              )}

              {opp.funding_amount && (
                <div className="space-y-1 pt-3 border-t border-slate-100">
                  <span className="prism-mono text-[9px] text-slate-400 uppercase font-bold">Stipend / Funding Budget</span>
                  <div className="font-sans font-extrabold text-base text-slate-900">{opp.funding_amount}</div>
                </div>
              )}

              {opp.country && (
                <div className="space-y-1 pt-3 border-t border-slate-100">
                  <span className="prism-mono text-[9px] text-slate-400 uppercase font-bold">Target Location</span>
                  <div className="font-sans font-extrabold text-sm text-slate-900">{opp.country}</div>
                </div>
              )}
            </div>

            {/* Outbound Actions */}
            <div className="space-y-3">
              {!closed && (
                <a
                  href={applyUrl(opp)}
                  onClick={applyHandler(opp, `/opportunities/${idOrSlug}`)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full bg-[#0A0A0A] hover:bg-indigo-600 text-white py-3.5 rounded-2xl font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-lg"
                >
                  <span>Apply via Nexora</span>
                  <i className="ti ti-arrow-up-right text-white"></i>
                </a>
              )}

              <button
                onClick={toggleSave}
                disabled={saving}
                className={`w-full py-3 rounded-2xl font-bold text-xs transition-colors shadow-xs border ${
                  saved
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-red-50 hover:border-red-200 hover:text-red-600'
                    : 'bg-white border-slate-200 text-slate-800 hover:bg-slate-50'
                }`}
              >
                {saving ? 'Processing…' : saved ? '✓ Saved in Tracker (Click to Unsave)' : '+ Save Opportunity'}
              </button>
            </div>

          </aside>

        </div>
      </div>
    </div>
  )
}
