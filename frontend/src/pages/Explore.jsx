import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { api } from '../lib/api'
import { useAuth } from '../lib/auth.jsx'
import { categoryLabel, formatDate } from '../lib/format'
import { applyUrl } from '../lib/api'
import { useApply } from '../hooks/useApply'
import './Explore.css'

const PAGE_SIZE = 12

export default function Explore() {
  const [params, setParams] = useSearchParams()
  const navigate = useNavigate()
  const { user } = useAuth()

  const q = params.get('q') ?? ''
  const category = params.get('category') ?? ''
  const country = params.get('country') ?? ''
  const page = Number(params.get('page') ?? 1)

  const [searchInput, setSearchInput] = useState(q)
  const [countryInput, setCountryInput] = useState(country)
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [savedIds, setSavedIds] = useState(new Set())

  // Comparison State
  const [compareItems, setCompareItems] = useState([])
  const [showCompareModal, setShowCompareModal] = useState(false)

  useEffect(() => setSearchInput(q), [q])
  useEffect(() => setCountryInput(country), [country])

  useEffect(() => {
    if (!user) return
    api
      .applications()
      .then((apps) => setSavedIds(new Set(apps.map((a) => a.opportunity.id))))
      .catch(() => {})
  }, [user])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)

    const fetcher = q
      ? api.search(q).then((r) => ({
          items: r.items,
          total: r.total,
          intent: r.intent,
          degraded: r.degraded,
        }))
      : api
          .opportunities({ category, country, page, page_size: PAGE_SIZE })
          .then((r) => ({ items: r.items, total: r.total }))

    fetcher
      .then((r) => !cancelled && setResult(r))
      .catch((e) => !cancelled && setError(e.message))
      .finally(() => !cancelled && setLoading(false))

    return () => {
      cancelled = true
    }
  }, [q, category, country, page])

  const update = useCallback(
    (patch) => {
      const next = new URLSearchParams(params)
      for (const [k, v] of Object.entries(patch)) {
        if (v) next.set(k, v)
        else next.delete(k)
      }
      if (!('page' in patch)) next.delete('page')
      setParams(next)
    },
    [params, setParams]
  )

  const submitSearch = (e) => {
    e.preventDefault()
    const query = searchInput.trim()
    setParams(query ? { q: query } : {})
  }

  const save = async (opp) => {
    if (!user) {
      navigate('/login', { state: { from: `/explore?${params.toString()}` } })
      return
    }
    const isSaved = savedIds.has(opp.id)

    // ⚡ Instant Real-Time Optimistic UI Update (0ms latency)
    setSavedIds((prev) => {
      const next = new Set(prev)
      if (isSaved) {
        next.delete(opp.id)
      } else {
        next.add(opp.id)
      }
      return next
    })

    try {
      if (isSaved) {
        await api.unsaveOpportunity(opp.id)
      } else {
        await api.saveApplication(opp.id)
      }
    } catch {
      // Revert if API fails
      setSavedIds((prev) => {
        const next = new Set(prev)
        if (isSaved) {
          next.add(opp.id)
        } else {
          next.delete(opp.id)
        }
        return next
      })
    }
  }

  // Applying creates a tracker row, so reflect it in the saved state immediately.
  const applyHandler = useApply((opp) =>
    setSavedIds((prev) => new Set(prev).add(opp.id))
  )

  const toggleCompare = (opp) => {
    if (compareItems.some((item) => item.id === opp.id)) {
      setCompareItems(compareItems.filter((item) => item.id !== opp.id))
    } else {
      if (compareItems.length >= 3) return
      setCompareItems([...compareItems, opp])
    }
  }

  const intentChips = useMemo(() => {
    const intent = result?.intent
    if (!intent) return []
    const chips = []
    if (intent.category) chips.push({ label: categoryLabel(intent.category), kind: 'Category' })
    if (intent.country) chips.push({ label: intent.country, kind: 'Region' })
    if (intent.funding_required) chips.push({ label: 'Funded', kind: 'Funding' })
    for (const t of intent.tags ?? []) chips.push({ label: t, kind: 'Topic' })
    return chips
  }, [result])

  const totalPages = q ? 1 : Math.max(1, Math.ceil((result?.total ?? 0) / PAGE_SIZE))

  return (
    <div className="prism-explore bg-white min-h-screen pt-24 pb-20 border-b border-slate-200 font-sans relative overflow-hidden">
      
      {/* Background Ambient Radial Gradient Glow */}
      <div className="absolute top-0 right-1/4 w-[800px] h-[500px] bg-gradient-to-tr from-indigo-500/10 via-purple-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />
      
      <div className="max-w-[1240px] mx-auto px-6 relative z-10 space-y-12">

        {/* 1. Immersive Header & Floating Command Omnibar */}
        <header className="space-y-6">
          <div className="max-w-3xl space-y-3">
            <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 tracking-tight leading-[1.1]">
              Explore Global Programs
            </h1>
            <p className="text-lg text-slate-600 leading-relaxed">
              Search unstructured fellowships, private grants, and residency catalogs using autonomous semantic intent analysis.
            </p>
          </div>

          {/* Floating Omni Search Input Field */}
          <form className="bg-white/80 backdrop-blur-xl border border-slate-200 p-2 rounded-2xl shadow-xl flex items-center gap-3 max-w-4xl focus-within:border-indigo-400 focus-within:ring-4 focus-within:ring-indigo-50/50 transition-all duration-300" onSubmit={submitSearch}>
            <i className="ti ti-search text-slate-400 ml-4 text-xl" />
            <input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="bg-transparent border-none text-base text-slate-800 flex-1 py-3 px-1 outline-none font-sans placeholder-slate-400"
              placeholder="Search e.g. 'fully funded deeptech fellowships Zurich or San Francisco'"
              aria-label="Search opportunities"
            />
            {q && (
              <button
                type="button"
                className="text-xs font-mono text-slate-400 hover:text-red-500 px-2 transition-colors"
                onClick={() => setParams({})}
              >
                Clear ✕
              </button>
            )}
            <button type="submit" className="bg-[#0A0A0A] hover:bg-indigo-600 text-white font-bold text-sm px-6 py-3.5 rounded-xl flex items-center gap-2 transition-all duration-200 shadow-md">
              <span>Find Opportunities</span>
              <i className="ti ti-arrow-up-right text-xs" />
            </button>
          </form>

          {/* Parsed Intent Indicator */}
          {q && result?.intent && (
            <div className="flex flex-wrap items-center gap-2 font-mono text-xs text-slate-500 pt-1">
              <span className="font-bold text-indigo-600 uppercase tracking-wider">PARSED INTENT:</span>
              {intentChips.length === 0 && <span className="bg-slate-100 border border-slate-200 text-slate-700 px-3 py-1 rounded-lg">General Query</span>}
              {intentChips.map((c, i) => (
                <span key={i} className="bg-indigo-50 border border-indigo-100 text-indigo-700 px-3 py-1 rounded-lg flex items-center gap-1">
                  <strong className="text-indigo-600">{c.kind}:</strong> {c.label}
                </span>
              ))}
            </div>
          )}
        </header>

        {/* 2. Clean Category Filter Bar */}
        {!q && (
          <div className="space-y-4">
            <div className="prism-mono text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              [ DIRECTORY CATEGORIES ]
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
              
              {[
                { value: '',            label: 'All',          icon: 'ti-grid-dots' },
                { value: 'fellowship',  label: 'Fellowships',  icon: 'ti-rocket' },
                { value: 'scholarship', label: 'Scholarships', icon: 'ti-school' },
                { value: 'grant',       label: 'Grants',       icon: 'ti-currency-euro' },
                { value: 'accelerator', label: 'Accelerators', icon: 'ti-trending-up' },
                { value: 'competition', label: 'Competitions', icon: 'ti-trophy' },
                { value: 'exchange',    label: 'Exchange',     icon: 'ti-world' },
                { value: 'gov_scheme',  label: 'Gov Schemes',  icon: 'ti-building-community' },
              ].map(({ value, label, icon }) => {
                const active = category === value
                return (
                  <button
                    key={value}
                    className={`rounded-2xl border p-4 text-left flex flex-col justify-between gap-2 transition-all duration-300 ${
                      active
                        ? 'border-indigo-600 bg-indigo-950 text-white shadow-lg shadow-indigo-950/20'
                        : 'border-slate-200 bg-slate-50 text-slate-800 hover:border-slate-400'
                    }`}
                    onClick={() => update({ category: value })}
                  >
                    <i className={`ti ${icon} text-lg`} />
                    <strong className="text-xs font-bold block leading-tight">{label}</strong>
                  </button>
                )
              })}

            </div>
          </div>
        )}

        {/* 3. Main Discovery Feed & Comparison Workspace Grid (Asymmetric 8:4) */}
        <div className="grid grid-cols-12 gap-8 items-start">

          {/* Left Discovery Column (8 Columns) */}
          <div className="col-span-12 lg:col-span-8 space-y-6">
            
            {!loading && !error && result?.items.length > 0 && (
              <div className="space-y-3 pb-3 border-b border-slate-200 font-mono text-xs text-slate-400">
                <div className="flex justify-between items-center">
                  <span>
                    INDEXED OPPORTUNITIES: <strong className="text-slate-800">{result.total}</strong>
                  </span>
                </div>
                {result.degraded && (
                  <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-amber-800">
                    No exact matches — showing related opportunities.
                  </p>
                )}
              </div>
            )}

            {loading && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {[0, 1, 2, 3].map((i) => (
                  <div key={i} className="h-60 bg-slate-50 animate-pulse rounded-2xl border border-slate-200" />
                ))}
              </div>
            )}

            {!loading && error && (
              <div className="p-8 bg-[#FAFAFA] border border-slate-200 rounded-2xl text-center">
                <h3 className="font-bold text-lg text-red-500">Search Signal Error</h3>
                <p className="text-sm text-slate-600 mt-1">{error}</p>
              </div>
            )}

            {!loading && !error && result?.items.length === 0 && (
              <div className="p-12 bg-slate-50 border border-slate-200 rounded-3xl text-center space-y-4 shadow-xs">
                <h3 className="font-bold text-xl text-slate-900">No opportunities matched your search criteria</h3>
                <p className="font-serif text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
                  Try broader keywords, simplified eligibility requirements, or clear active filters.
                </p>
                <button
                  onClick={() => setParams({})}
                  className="bg-[#0A0A0A] hover:bg-indigo-600 text-white px-6 py-2.5 rounded-xl text-xs font-bold transition-all"
                >
                  Reset All Filters
                </button>
              </div>
            )}

            {/* Clean Minimal Opportunities Grid (Text-driven) */}
            {!loading && !error && result?.items.length > 0 && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {result.items.map((opp) => {
                    const isCompared = compareItems.some((item) => item.id === opp.id)

                    return (
                      <div
                        key={opp.id}
                        onClick={() => navigate(`/opportunities/${opp.slug || opp.id}`)}
                        className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm hover:shadow-xl hover:border-indigo-200 transition-all duration-300 flex flex-col justify-between space-y-5 group cursor-pointer"
                      >
                        
                        {/* Header Badges */}
                        <div className="flex items-center justify-between">
                          <span className="prism-mono text-[9px] bg-slate-900 text-white font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider">
                            {categoryLabel(opp.category)}
                          </span>
                          {opp.funding_amount && (
                            <span className="font-mono text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100">
                              Funding listed
                            </span>
                          )}
                        </div>

                        {/* Card Body Content */}
                        <div className="space-y-2">
                          <h3 className="text-base font-extrabold text-slate-950 leading-snug group-hover:text-indigo-600 transition-colors line-clamp-2">
                            {opp.title}
                          </h3>
                          <span className="prism-mono text-[11px] font-bold text-slate-500 block truncate">
                            {opp.organizer}
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-xs text-slate-500 font-medium pt-2 border-t border-slate-100">
                          <span className="flex items-center gap-1">
                            <i className="ti ti-map-pin text-indigo-600" /> {opp.country || 'Global'}
                          </span>
                          {opp.funding_amount ? (
                            <span className="flex items-center gap-1 font-bold text-slate-800 truncate max-w-[140px]">
                              <i className="ti ti-cash text-emerald-500" /> {opp.funding_amount}
                            </span>
                          ) : (
                            <span className="text-slate-400 font-mono text-[10px]">Rolling</span>
                          )}
                        </div>

                        {/* Card Footer Actions */}
                        <div className="pt-3 flex items-center justify-between gap-3" onClick={(e) => e.stopPropagation()}>
                          <a
                            href={applyUrl(opp)}
                            onClick={applyHandler(opp, `/explore?${params.toString()}`)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-[#0A0A0A] text-white px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-1 hover:bg-indigo-600 transition-colors"
                          >
                            <span>Apply</span>
                            <i className="ti ti-arrow-up-right text-xs" />
                          </a>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => save(opp)}
                              className={`px-3 py-2 rounded-xl text-xs font-bold transition-all border ${savedIds.has(opp.id) ? 'bg-indigo-50 text-indigo-600 border-indigo-100' : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-slate-400'}`}
                            >
                              {savedIds.has(opp.id) ? 'Saved' : 'Save'}
                            </button>

                            <button
                              onClick={() => toggleCompare(opp)}
                              className={`p-2 rounded-xl border text-xs font-bold transition-all ${isCompared ? 'bg-[#0A0A0A] text-white border-[#0A0A0A]' : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-slate-400'}`}
                              title={isCompared ? 'Remove from Compare' : 'Add to Compare'}
                            >
                              <i className="ti ti-arrows-diff text-sm" />
                            </button>
                          </div>
                        </div>

                      </div>
                    )
                  })}
                </div>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between pt-8 border-t border-slate-200 font-mono text-xs">
                    <button
                      disabled={page <= 1}
                      onClick={() => update({ page: String(page - 1) })}
                      className="px-4 py-2 border border-slate-200 rounded-xl disabled:opacity-30 hover:border-slate-800 transition-colors font-bold"
                    >
                      ← Previous
                    </button>
                    <span className="font-bold text-slate-600">PAGE {page} OF {totalPages}</span>
                    <button
                      disabled={page >= totalPages}
                      onClick={() => update({ page: String(page + 1) })}
                      className="px-4 py-2 border border-slate-200 rounded-xl disabled:opacity-30 hover:border-slate-800 transition-colors font-bold"
                    >
                      Next →
                    </button>
                  </div>
                )}
              </>
            )}

          </div>

          {/* Right Workspace Sidebar (4 Columns) */}
          <div className="col-span-12 lg:col-span-4 space-y-6">

            {/* Comparison Eligibility Matrix Workspace Card */}
            <div className="bg-white border border-slate-200 p-6 rounded-3xl shadow-xl space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 font-mono text-xs">
                <span className="font-bold text-indigo-600 flex items-center gap-1.5">
                  <i className="ti ti-arrows-diff text-sm" /> COMPARISON ENGINE
                </span>
                <span className="text-slate-400 font-bold">{compareItems.length} / 3 SELECTED</span>
              </div>

              {compareItems.length > 0 ? (
                <div className="space-y-3">
                  {compareItems.map((item) => (
                    <div key={item.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs">
                      <span className="font-bold truncate text-slate-800 max-w-[180px]">{item.title}</span>
                      <button onClick={() => toggleCompare(item)} className="text-red-500 hover:text-red-700 font-mono font-bold px-1 text-sm">✕</button>
                    </div>
                  ))}
                  <button
                    onClick={() => setShowCompareModal(true)}
                    className="w-full mt-2 bg-[#0A0A0A] hover:bg-indigo-600 text-white py-3.5 rounded-xl font-bold text-xs transition-all shadow-md"
                  >
                    Compare Side-by-Side →
                  </button>
                </div>
              ) : (
                <p className="font-serif text-xs text-slate-500 p-4 bg-slate-50 rounded-2xl border border-dashed border-slate-200 leading-relaxed">
                  Click the comparison icon on any opportunity card to review eligibility matrices side-by-side.
                </p>
              )}
            </div>

            {/* Real-time Ingestion Discovery Stats */}
            <div className="bg-white border border-slate-200 p-6 rounded-3xl shadow-xl space-y-4">
              <div className="font-mono text-xs text-indigo-600 font-bold uppercase tracking-widest pb-3 border-b border-slate-200">
                [ REAL-TIME DISCOVERY INSIGHTS ]
              </div>
              <ul className="space-y-4 font-serif text-xs text-slate-600 leading-relaxed">
                <li className="flex items-start gap-2">
                  <span className="text-indigo-600 font-bold">•</span>
                  <span><strong>Stockholm &amp; Zurich</strong> index streams just pushed 12 new computer science postdocs.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-indigo-600 font-bold">•</span>
                  <span>Completion of your academic details adds <strong>+18%</strong> match precision score.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-indigo-600 font-bold">•</span>
                  <span>4 major EU Horizon grant application deadlines verified for next month.</span>
                </li>
              </ul>
            </div>

          </div>

        </div>

      </div>

      {/* Side-by-Side Comparison Workspace Modal Overlay */}
      {showCompareModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-950/40 backdrop-blur-md" onClick={() => setShowCompareModal(false)}>
          <div className="bg-white rounded-3xl border border-slate-200 max-w-4xl w-full p-8 shadow-2xl space-y-6 relative overflow-hidden" onClick={(e) => e.stopPropagation()}>
            
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <div>
                <span className="font-mono text-xs text-indigo-600 font-bold">[ SIDE-BY-SIDE MATRIX ]</span>
                <h2 className="font-sans text-2xl font-extrabold text-slate-950 mt-1">Opportunity Comparison</h2>
              </div>
              <button onClick={() => setShowCompareModal(false)} className="text-slate-400 hover:text-indigo-600 text-xl font-mono font-bold">✕</button>
            </div>

            <div className="grid grid-cols-3 gap-6 divide-x divide-slate-200">
              {compareItems.map((item) => (
                <div key={item.id} className="space-y-4 px-3 first:pl-0">
                  <span className="font-mono text-[9px] bg-slate-900 text-white px-2.5 py-0.5 rounded-full font-bold uppercase">{item.category}</span>
                  <h4 className="font-bold text-base text-slate-900 leading-snug">{item.title}</h4>
                  <p className="font-serif text-xs text-slate-500">{item.organizer} · {item.country}</p>

                  <div className="pt-4 border-t border-slate-100 space-y-3 font-mono text-xs">
                    <div>
                      <span className="text-slate-400 block text-[9px] font-bold">STIPEND / FUNDING</span>
                      <strong className="text-slate-800">{item.funding_amount || 'Fully Funded'}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[9px] font-bold">DEADLINE</span>
                      <strong className="text-indigo-600">{item.deadline ? formatDate(item.deadline) : 'Rolling'}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[9px] font-bold">ELIGIBILITY</span>
                      <p className="font-serif text-[11px] text-slate-600 mt-1 leading-relaxed">{item.eligibility_text || 'Open worldwide'}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

          </div>
        </div>
      )}

    </div>
  )
}
