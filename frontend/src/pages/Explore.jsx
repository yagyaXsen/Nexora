import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { api } from '../lib/api'
import { useAuth } from '../lib/auth.jsx'
import { categoryLabel, formatDate } from '../lib/format'
import { applyUrl } from '../lib/api'
import { useApply } from '../hooks/useApply'
import './Explore.css'

const PAGE_SIZE = 12
const BOOKMARKS_KEY = 'nexora_bookmarks'

const POPULAR_SEARCHES = [
  'CERN Fellowship',
  'DAAD Postdoc',
  'ETH Zurich',
  'Horizon Europe',
  'Y Combinator',
  'Full Tuition',
  'Machine Learning',
  'Switzerland',
]

const COUNTRIES = [
  { value: '', label: 'All Regions / Global' },
  { value: 'Switzerland', label: 'Switzerland' },
  { value: 'Germany', label: 'Germany' },
  { value: 'United States', label: 'United States' },
  { value: 'United Kingdom', label: 'United Kingdom' },
  { value: 'European Union', label: 'European Union' },
  { value: 'Japan', label: 'Japan' },
  { value: 'Canada', label: 'Canada' },
  { value: 'Global', label: 'Global (Remote / Any)' },
]

const SORT_OPTIONS = [
  { value: 'relevance', label: '⚡ Best AI Match / Relevance' },
  { value: 'deadline_asc', label: '⏰ Deadline (Expiring Soon)' },
  { value: 'created_desc', label: '✨ Recently Discovered' },
  { value: 'funding_desc', label: '💰 Highest Funding' },
]

function readBookmarks() {
  try {
    const cur = JSON.parse(localStorage.getItem(BOOKMARKS_KEY) || '[]')
    return Array.isArray(cur) ? cur : []
  } catch {
    return []
  }
}

/** Helper to highlight matched search terms in title or organizer */
function HighlightText({ text, query }) {
  if (!text) return null
  if (!query || !query.trim()) return <>{text}</>

  const terms = query
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .filter((t) => t.length > 1)
  if (!terms.length) return <>{text}</>

  const regex = new RegExp(`(${terms.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`, 'gi')
  const parts = text.split(regex)

  return (
    <>
      {parts.map((part, i) =>
        terms.includes(part.toLowerCase()) ? (
          <mark key={i} className="bg-amber-100 text-amber-950 font-semibold px-0.5 rounded">
            {part}
          </mark>
        ) : (
          part
        )
      )}
    </>
  )
}

function getPageNumbers(currentPage, totalPages) {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1)
  }
  if (currentPage <= 4) {
    return [1, 2, 3, 4, 5, '...', totalPages]
  }
  if (currentPage >= totalPages - 3) {
    return [1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages]
  }
  return [1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages]
}

export default function Explore() {
  const [params, setParams] = useSearchParams()
  const navigate = useNavigate()
  const { user } = useAuth()

  const q = params.get('q') ?? ''
  const category = params.get('category') ?? ''
  const country = params.get('country') ?? ''
  const sort = params.get('sort') ?? 'relevance'
  const page = Math.max(1, Number(params.get('page') ?? 1))
  const pageSize = Number(params.get('page_size') ?? 12)

  const [searchInput, setSearchInput] = useState(q)
  const [suggestions, setSuggestions] = useState([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [savedIds, setSavedIds] = useState(new Set())
  const [savedSlugs, setSavedSlugs] = useState(() => new Set(readBookmarks()))

  // Comparison State
  const [compareItems, setCompareItems] = useState([])
  const [showCompareModal, setShowCompareModal] = useState(false)

  const searchContainerRef = useRef(null)

  // Keep local search input synced when URL q changes externally
  useEffect(() => {
    setSearchInput(q)
  }, [q])

  // Click outside to dismiss autocomplete dropdown
  useEffect(() => {
    function handleClickOutside(e) {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target)) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const update = useCallback(
    (patch) => {
      const next = new URLSearchParams(params)
      for (const [k, v] of Object.entries(patch)) {
        if (v !== undefined && v !== null && v !== '') {
          next.set(k, v)
        } else {
          next.delete(k)
        }
      }
      if (!('page' in patch) && !('page_size' in patch)) {
        next.delete('page')
      }
      setParams(next)
    },
    [params, setParams]
  )

  const goToPage = (newPage) => {
    if (newPage < 1) return
    update({ page: String(newPage) })
    const anchor = document.getElementById('opportunities-feed-top')
    if (anchor) {
      anchor.scrollIntoView({ behavior: 'smooth', block: 'start' })
    } else {
      window.scrollTo({ top: 320, behavior: 'smooth' })
    }
  }

  const handlePageSizeChange = (newSize) => {
    update({ page_size: String(newSize), page: 1 })
  }

  // ⚡ AUTO-SYNC & LIVE SEARCH:
  // When user types or deletes from searchInput:
  // - If searchInput is empty, IMMEDIATELY clear `q` from URL so all opportunities appear instantly
  // - If searchInput has text, debounce 350ms to auto-update `q`
  useEffect(() => {
    const trimmed = searchInput.trim()

    // If input was deleted/emptied and q was previously set, instantly reset search
    if (!trimmed) {
      setSuggestions([])
      if (q) {
        update({ q: '', page: 1 })
      }
      return
    }

    // Fetch autocomplete suggestions
    if (trimmed.length >= 2) {
      api
        .suggestions(trimmed)
        .then((res) => setSuggestions(res?.suggestions || []))
        .catch(() => setSuggestions([]))
    } else {
      setSuggestions([])
    }

    // Debounce live search update so typing automatically updates results
    const timer = setTimeout(() => {
      if (trimmed !== q) {
        update({ q: trimmed, page: 1 })
      }
    }, 400)

    return () => clearTimeout(timer)
  }, [searchInput, q, update])

  useEffect(() => {
    if (!user) return
    api
      .applications()
      .then((apps) => setSavedIds(new Set(apps.map((a) => a.opportunity.id))))
      .catch(() => {})
  }, [user])

  useEffect(() => setSavedSlugs(new Set(readBookmarks())), [])

  // Fetch opportunities whenever q, category, country, sort, page, or pageSize changes
  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)

    const fetcher = api
      .opportunities({
        q,
        category,
        country,
        sort,
        page,
        page_size: pageSize,
      })
      .then((r) => ({
        items: r.items,
        total: r.total,
        page: r.page,
        pages: r.pages,
      }))
      .catch(() =>
        api.search(q || 'research').then((r) => ({
          items: r.items,
          total: r.total,
          intent: r.intent,
          degraded: r.degraded,
        }))
      )

    fetcher
      .then((r) => !cancelled && setResult(r))
      .catch((e) => !cancelled && setError(e.message))
      .finally(() => !cancelled && setLoading(false))

    return () => {
      cancelled = true
    }
  }, [q, category, country, sort, page])

  const handleSearchSubmit = (e) => {
    if (e) e.preventDefault()
    setShowSuggestions(false)
    const trimmed = searchInput.trim()
    update({ q: trimmed, page: 1 })
  }

  const handleClearSearch = () => {
    setSearchInput('')
    setShowSuggestions(false)
    setSuggestions([])
    update({ q: '', page: 1 })
  }

  const selectSuggestion = (text) => {
    setSearchInput(text)
    setShowSuggestions(false)
    update({ q: text, page: 1 })
  }

  const clearAllFilters = () => {
    setSearchInput('')
    setShowSuggestions(false)
    setSuggestions([])
    setParams({})
  }

  const isOppSaved = useCallback(
    (opp) => (opp.id != null ? savedIds.has(opp.id) : savedSlugs.has(opp.slug)),
    [savedIds, savedSlugs]
  )

  const save = async (opp) => {
    if (!user) {
      navigate('/login', { state: { from: `/explore?${params.toString()}` } })
      return
    }
    if (opp.id == null) {
      const cur = readBookmarks()
      const next = cur.includes(opp.slug) ? cur.filter((s) => s !== opp.slug) : [...cur, opp.slug]
      localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(next))
      setSavedSlugs(new Set(next))
      return
    }
    const isSaved = savedIds.has(opp.id)

    setSavedIds((prev) => {
      const next = new Set(prev)
      if (isSaved) next.delete(opp.id)
      else next.add(opp.id)
      return next
    })

    try {
      if (isSaved) {
        await api.unsaveOpportunity(opp.id)
      } else {
        await api.saveApplication(opp.id)
      }
    } catch {
      setSavedIds((prev) => {
        const next = new Set(prev)
        if (isSaved) next.add(opp.id)
        else next.delete(opp.id)
        return next
      })
    }
  }

  const applyHandler = useApply((opp) =>
    setSavedIds((prev) => new Set(prev).add(opp.id))
  )

  const compareKey = (opp) => (opp.id != null ? `id:${opp.id}` : `slug:${opp.slug}`)

  const toggleCompare = (opp) => {
    const key = compareKey(opp)
    if (compareItems.some((item) => compareKey(item) === key)) {
      setCompareItems(compareItems.filter((item) => compareKey(item) !== key))
    } else {
      if (compareItems.length >= 3) return
      setCompareItems([...compareItems, opp])
    }
  }

  const totalItems = result?.total ?? 0
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize))
  const startItem = totalItems > 0 ? (page - 1) * pageSize + 1 : 0
  const endItem = Math.min(page * pageSize, totalItems)
  const activeFiltersCount = (q ? 1 : 0) + (category ? 1 : 0) + (country ? 1 : 0) + (sort !== 'relevance' ? 1 : 0)

  return (
    <div className="prism-explore bg-white min-h-screen pt-24 pb-20 border-b border-slate-200 font-sans relative overflow-hidden">
      {/* Ambient background glow */}
      <div className="absolute top-0 right-1/4 w-[800px] h-[500px] bg-gradient-to-tr from-indigo-500/10 via-purple-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-[1280px] mx-auto px-6 relative z-10 space-y-8">
        
        {/* 1. Header & Omnisearch Bar */}
        <header className="space-y-6">
          <div className="max-w-3xl space-y-2">
            <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 tracking-tight leading-[1.1]">
              Explore Global Programs
            </h1>
            <p className="text-base sm:text-lg text-slate-600 leading-relaxed">
              Find non-job fellowships, private grants, scholarships, and research residencies worldwide.
            </p>
          </div>

          {/* Floating Search Container with Instant Autocomplete */}
          <div className="relative max-w-4xl" ref={searchContainerRef}>
            <form
              className="bg-white border border-slate-200 p-2 rounded-2xl shadow-xl flex flex-wrap items-center gap-3 focus-within:border-indigo-500 focus-within:ring-4 focus-within:ring-indigo-50/60 transition-all duration-300 relative z-30"
              onSubmit={handleSearchSubmit}
            >
              <i className="ti ti-search text-indigo-500 ml-4 text-xl" />
              <input
                value={searchInput}
                onChange={(e) => {
                  setSearchInput(e.target.value)
                  setShowSuggestions(true)
                }}
                onFocus={() => setShowSuggestions(true)}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') {
                    setShowSuggestions(false)
                  }
                }}
                className="bg-transparent border-none text-base text-slate-900 flex-1 min-w-[200px] py-3 px-1 outline-none placeholder-slate-400 font-medium"
                placeholder="Search by topic, organization, host country (e.g. 'CERN physics', 'DAAD Postdoc', 'ETH Zurich')..."
                aria-label="Search opportunities"
              />
              {searchInput && (
                <button
                  type="button"
                  className="text-xs font-mono text-slate-400 hover:text-red-500 px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-red-50 transition-colors"
                  onClick={handleClearSearch}
                  title="Clear search query"
                >
                  ✕ Clear
                </button>
              )}
              <button
                type="submit"
                className="bg-slate-950 hover:bg-indigo-600 text-white font-bold text-sm px-6 py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all duration-200 shadow-md w-full sm:w-auto"
              >
                <span>Search</span>
                <i className="ti ti-arrow-up-right text-xs" />
              </button>
            </form>

            {/* Suggestions & Quick Search Dropdown */}
            {showSuggestions && (
              <div className="absolute left-0 right-0 top-full mt-2 bg-white rounded-2xl border border-slate-200 shadow-2xl z-40 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                {suggestions.length > 0 ? (
                  <div className="p-3 space-y-1">
                    <div className="px-3 py-1 text-[11px] font-mono font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                      <i className="ti ti-sparkles text-indigo-500" /> Instant Autocomplete Suggestions
                    </div>
                    {suggestions.map((s, idx) => (
                      <button
                        key={idx}
                        type="button"
                        className="w-full text-left px-3.5 py-2.5 rounded-xl hover:bg-indigo-50/70 text-slate-800 text-sm flex items-center justify-between transition-colors group"
                        onClick={() => selectSuggestion(s.text)}
                      >
                        <span className="font-semibold text-slate-900 group-hover:text-indigo-600 flex items-center gap-2">
                          <i
                            className={`ti ${
                              s.type === 'organization'
                                ? 'ti-building'
                                : s.type === 'tag'
                                ? 'ti-tag'
                                : 'ti-award'
                            } text-slate-400 group-hover:text-indigo-500`}
                          />
                          {s.text}
                        </span>
                        <span className="text-[10px] font-mono font-bold text-slate-400 uppercase bg-slate-100 px-2 py-0.5 rounded-md group-hover:bg-indigo-100 group-hover:text-indigo-700">
                          {s.type}
                        </span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 space-y-3">
                    <div className="text-[11px] font-mono font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                      <i className="ti ti-trending-up text-indigo-500" /> Popular Opportunity Searches
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {POPULAR_SEARCHES.map((query) => (
                        <button
                          key={query}
                          type="button"
                          className="text-xs bg-slate-50 hover:bg-indigo-50 hover:text-indigo-600 text-slate-700 border border-slate-200 hover:border-indigo-200 px-3 py-1.5 rounded-lg transition-colors font-medium flex items-center gap-1"
                          onClick={() => selectSuggestion(query)}
                        >
                          <i className="ti ti-search text-[10px] text-slate-400" />
                          {query}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Quick-Search Pills Bar */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wide">Popular:</span>
            {POPULAR_SEARCHES.slice(0, 5).map((term) => (
              <button
                key={term}
                type="button"
                onClick={() => selectSuggestion(term)}
                className={`text-xs px-3 py-1 rounded-full border transition-all ${
                  q.toLowerCase() === term.toLowerCase()
                    ? 'bg-indigo-600 text-white border-indigo-600 font-bold shadow-xs'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-400 hover:text-indigo-600'
                }`}
              >
                {term}
              </button>
            ))}
          </div>
        </header>

        {/* 2. Category Quick Filters */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs font-bold text-slate-500 uppercase tracking-wider">
              Directory Categories
            </span>
            {category && (
              <button
                onClick={() => update({ category: '' })}
                className="text-xs text-indigo-600 hover:underline font-bold"
              >
                Reset Category
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5">
            {[
              { value: '', label: 'All Categories', icon: 'ti-grid-dots' },
              { value: 'fellowship', label: 'Fellowships', icon: 'ti-rocket' },
              { value: 'scholarship', label: 'Scholarships', icon: 'ti-school' },
              { value: 'grant', label: 'Grants', icon: 'ti-currency-euro' },
              { value: 'accelerator', label: 'Accelerators', icon: 'ti-trending-up' },
              { value: 'competition', label: 'Competitions', icon: 'ti-trophy' },
              { value: 'exchange', label: 'Exchange', icon: 'ti-world' },
              { value: 'gov_scheme', label: 'Gov Schemes', icon: 'ti-building-community' },
            ].map(({ value, label, icon }) => {
              const active = category === value
              return (
                <button
                  key={value}
                  className={`rounded-2xl border p-3.5 text-left flex flex-col justify-between gap-1.5 transition-all duration-200 ${
                    active
                      ? 'border-indigo-600 bg-slate-950 text-white shadow-md'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-slate-400 hover:bg-slate-50'
                  }`}
                  onClick={() => update({ category: value })}
                >
                  <i className={`ti ${icon} text-lg ${active ? 'text-indigo-400' : 'text-slate-500'}`} />
                  <strong className="text-xs font-bold block leading-tight">{label}</strong>
                </button>
              )
            })}
          </div>
        </div>

        {/* 3. Multi-Facet Toolbar: Location, Sort, and Active Filter Chips */}
        <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            {/* Country Selector */}
            <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 shadow-2xs">
              <i className="ti ti-map-pin text-indigo-500 text-sm" />
              <span className="font-semibold text-slate-500">Region:</span>
              <select
                value={country}
                onChange={(e) => update({ country: e.target.value })}
                className="bg-transparent border-none text-xs font-bold text-slate-900 outline-none cursor-pointer"
              >
                {COUNTRIES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Sort Selector */}
            <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 shadow-2xs">
              <i className="ti ti-arrows-sort text-indigo-500 text-sm" />
              <span className="font-semibold text-slate-500">Sort:</span>
              <select
                value={sort}
                onChange={(e) => update({ sort: e.target.value })}
                className="bg-transparent border-none text-xs font-bold text-slate-900 outline-none cursor-pointer"
              >
                {SORT_OPTIONS.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Active Filters Display & Clear */}
          {activeFiltersCount > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-mono text-slate-500 font-bold">ACTIVE:</span>
              {q && (
                <span className="bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs px-2.5 py-1 rounded-lg font-medium flex items-center gap-1">
                  Query: &quot;{q}&quot;
                  <button onClick={handleClearSearch} className="hover:text-red-600 font-bold ml-0.5">
                    ✕
                  </button>
                </span>
              )}
              {category && (
                <span className="bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs px-2.5 py-1 rounded-lg font-medium flex items-center gap-1">
                  {categoryLabel(category)}
                  <button onClick={() => update({ category: '' })} className="hover:text-red-600 font-bold ml-0.5">
                    ✕
                  </button>
                </span>
              )}
              {country && (
                <span className="bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs px-2.5 py-1 rounded-lg font-medium flex items-center gap-1">
                  {country}
                  <button onClick={() => update({ country: '' })} className="hover:text-red-600 font-bold ml-0.5">
                    ✕
                  </button>
                </span>
              )}
              <button
                onClick={clearAllFilters}
                className="text-xs text-red-600 hover:text-red-800 font-bold underline ml-1"
              >
                Clear all ({activeFiltersCount})
              </button>
            </div>
          )}
        </div>

        {/* 4. Results Grid & Sidebar Workspace */}
        <div className="grid grid-cols-12 gap-8 items-start">
          
          {/* Main Feed Column (8 Columns) */}
          <div className="col-span-12 lg:col-span-8 space-y-6">
            
            {/* Status & count banner with quick page controls */}
            {!loading && !error && result && (
              <div id="opportunities-feed-top" className="flex flex-wrap items-center justify-between gap-3 p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-mono text-slate-600 shadow-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="font-semibold text-slate-800">
                    SHOWING <strong className="text-slate-950">{startItem}–{endItem}</strong> OF{' '}
                    <strong className="text-slate-950">{totalItems}</strong> OPPORTUNITIES
                    {q && ` FOR "${q}"`}
                  </span>
                  {totalPages > 1 && (
                    <span className="text-slate-400 font-medium hidden sm:inline">
                      • PAGE {page} OF {totalPages}
                    </span>
                  )}
                </div>

                {/* Quick Page Size & Mini Navigation */}
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1">
                    <span className="text-slate-400 uppercase font-bold text-[10px] mr-1 hidden md:inline">Per Page:</span>
                    {[12, 24, 48].map((size) => (
                      <button
                        key={size}
                        onClick={() => handlePageSizeChange(size)}
                        className={`px-2 py-0.5 rounded-lg text-xs font-bold transition-all ${
                          pageSize === size
                            ? 'bg-slate-900 text-white shadow-xs'
                            : 'bg-white border border-slate-200 text-slate-600 hover:border-slate-400'
                        }`}
                      >
                        {size}
                      </button>
                    ))}
                    <button
                      onClick={() => handlePageSizeChange(100)}
                      className={`px-2 py-0.5 rounded-lg text-xs font-bold transition-all ${
                        pageSize >= 100
                          ? 'bg-slate-900 text-white shadow-xs'
                          : 'bg-white border border-slate-200 text-slate-600 hover:border-slate-400'
                      }`}
                    >
                      All
                    </button>
                  </div>

                  {totalPages > 1 && (
                    <div className="flex items-center gap-1 pl-2 border-l border-slate-200">
                      <button
                        disabled={page <= 1}
                        onClick={() => goToPage(page - 1)}
                        aria-label="Previous Page"
                        className="p-1 bg-white border border-slate-200 rounded-lg disabled:opacity-30 hover:border-slate-800 disabled:hover:border-slate-200 transition-colors text-slate-700 font-bold"
                      >
                        <i className="ti ti-chevron-left" />
                      </button>
                      <span className="px-1.5 font-bold text-slate-800 text-xs">
                        {page}/{totalPages}
                      </span>
                      <button
                        disabled={page >= totalPages}
                        onClick={() => goToPage(page + 1)}
                        aria-label="Next Page"
                        className="p-1 bg-white border border-slate-200 rounded-lg disabled:opacity-30 hover:border-slate-800 disabled:hover:border-slate-200 transition-colors text-slate-700 font-bold"
                      >
                        <i className="ti ti-chevron-right" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Loading skeletons */}
            {loading && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {[0, 1, 2, 3].map((i) => (
                  <div key={i} className="h-64 bg-slate-50 animate-pulse rounded-3xl border border-slate-200 p-6 space-y-4">
                    <div className="w-1/3 h-5 bg-slate-200 rounded-full" />
                    <div className="w-4/5 h-6 bg-slate-200 rounded" />
                    <div className="w-1/2 h-4 bg-slate-100 rounded" />
                    <div className="pt-6 border-t border-slate-100 flex justify-between">
                      <div className="w-1/4 h-8 bg-slate-200 rounded-xl" />
                      <div className="w-1/4 h-8 bg-slate-200 rounded-xl" />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Error view */}
            {!loading && error && (
              <div className="p-8 bg-red-50/50 border border-red-200 rounded-3xl text-center space-y-2">
                <h3 className="font-bold text-base text-red-600 flex items-center justify-center gap-2">
                  <i className="ti ti-alert-circle" /> Search Signal Error
                </h3>
                <p className="text-sm text-slate-600">{error}</p>
                <button
                  onClick={() => update({ page: 1 })}
                  className="mt-2 text-xs font-bold bg-white border border-red-200 text-red-600 px-4 py-2 rounded-xl hover:bg-red-50"
                >
                  Retry Search
                </button>
              </div>
            )}

            {/* Empty state with suggestions */}
            {!loading && !error && result?.items.length === 0 && (
              <div className="p-12 bg-slate-50 border border-slate-200 rounded-3xl text-center space-y-5 shadow-xs">
                <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto text-2xl">
                  <i className="ti ti-search" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-bold text-xl text-slate-900">No opportunities matched your search</h3>
                  <p className="text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
                    We couldn&apos;t find an exact match for &quot;{q || category || country}&quot;. Try selecting another category or searching with broader keywords.
                  </p>
                </div>
                <div className="flex flex-wrap justify-center gap-2 pt-2">
                  {POPULAR_SEARCHES.slice(0, 4).map((p) => (
                    <button
                      key={p}
                      onClick={() => selectSuggestion(p)}
                      className="text-xs bg-white border border-slate-200 hover:border-indigo-400 hover:text-indigo-600 text-slate-700 px-3.5 py-2 rounded-xl font-semibold transition-all shadow-2xs"
                    >
                      {p} →
                    </button>
                  ))}
                </div>
                <div>
                  <button
                    onClick={clearAllFilters}
                    className="bg-slate-950 hover:bg-indigo-600 text-white px-6 py-2.5 rounded-xl text-xs font-bold transition-all shadow-md"
                  >
                    Reset All Filters
                  </button>
                </div>
              </div>
            )}

            {/* Cards Grid */}
            {!loading && !error && result?.items.length > 0 && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {result.items.map((opp) => {
                    const isCompared = compareItems.some((item) => compareKey(item) === compareKey(opp))
                    const isSaved = isOppSaved(opp)

                    return (
                      <article
                        key={opp.id ?? opp.slug}
                        onClick={() => navigate(`/opportunities/${opp.slug || opp.id}`)}
                        className="opp-card bg-white border border-slate-200 rounded-3xl p-6 shadow-sm hover:shadow-xl hover:border-indigo-300 transition-all duration-300 flex flex-col justify-between space-y-5 group cursor-pointer"
                        aria-label={opp.title}
                      >
                        <div className="space-y-4">
                          {/* Header: Category Badge + Status */}
                          <div className="flex items-center justify-between font-mono text-[9px]">
                            <span className="flex items-center gap-1 bg-slate-950 text-white font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider">
                              {categoryLabel(opp.category)}
                            </span>
                            {opp.funding_amount ? (
                              <span className="font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 px-2.5 py-1 rounded-full">
                                Funded
                              </span>
                            ) : (
                              <span className="text-slate-400 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-full font-bold">
                                Program
                              </span>
                            )}
                          </div>

                          {/* Title & Organizer */}
                          <div className="space-y-1">
                            <h3 className="text-base font-extrabold text-slate-950 leading-snug group-hover:text-indigo-600 transition-colors line-clamp-2">
                              <HighlightText text={opp.title} query={q} />
                            </h3>
                            <span className="font-mono text-[11px] font-bold text-slate-500 block truncate">
                              <HighlightText text={opp.organizer} query={q} />
                            </span>
                          </div>

                          {/* Metadata row */}
                          <div className="flex flex-wrap items-center justify-between gap-y-1 text-xs text-slate-500 font-medium pt-3 border-t border-slate-100">
                            <span className="flex items-center gap-1">
                              <i className="ti ti-map-pin text-indigo-500 text-[11px]" />
                              <span className="truncate max-w-[110px]">{opp.country || 'Global'}</span>
                            </span>
                            {opp.funding_amount ? (
                              <span className="flex items-center gap-1 font-bold text-slate-800 truncate max-w-[130px]">
                                <i className="ti ti-cash text-emerald-500 text-[11px]" />
                                {opp.funding_amount}
                              </span>
                            ) : (
                              <span className="text-slate-400 font-mono text-[10px]">Rolling / Open</span>
                            )}
                            {opp.deadline && (
                              <span className="font-mono text-[10px] text-slate-400">
                                {formatDate(opp.deadline)}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Footer actions */}
                        <div
                          className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <a
                            href={applyUrl(opp)}
                            onClick={applyHandler(opp, `/explore?${params.toString()}`)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-slate-950 hover:bg-indigo-600 text-white font-bold text-xs px-4 py-2 rounded-xl flex items-center gap-1.5 transition-all shadow-2xs"
                            aria-label={`Apply to ${opp.title}`}
                          >
                            <span>Apply</span>
                            <i className="ti ti-arrow-up-right text-xs" />
                          </a>

                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => save(opp)}
                              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all border ${
                                isSaved
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:border-indigo-400 hover:bg-indigo-50 hover:text-indigo-700'
                              }`}
                            >
                              {isSaved ? '✓ Saved' : '+ Save'}
                            </button>

                            <button
                              type="button"
                              onClick={() => toggleCompare(opp)}
                              className={`p-2 rounded-xl border text-xs font-bold transition-all ${
                                isCompared
                                  ? 'bg-slate-950 text-white border-slate-950'
                                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-slate-400'
                              }`}
                              title={isCompared ? 'Remove from Compare' : 'Add to Side-by-Side Compare'}
                            >
                              <i className="ti ti-arrows-diff text-sm" />
                            </button>
                          </div>
                        </div>
                      </article>
                    )
                  })}
                </div>

                {/* Comprehensive Bottom Pagination Controls */}
                {totalPages > 1 && (
                  <div className="pt-8 pb-4 border-t border-slate-200 space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-3 font-mono text-xs">
                      <button
                        disabled={page <= 1}
                        onClick={() => goToPage(page - 1)}
                        className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl disabled:opacity-30 hover:border-slate-800 transition-all font-bold flex items-center gap-2 shadow-xs disabled:cursor-not-allowed text-slate-800"
                      >
                        <i className="ti ti-arrow-left" /> Previous Page
                      </button>

                      {/* Numbered Page Buttons */}
                      <div className="flex items-center gap-1.5 flex-wrap justify-center">
                        {getPageNumbers(page, totalPages).map((p, idx) => {
                          if (p === '...') {
                            return (
                              <span key={`ellipsis-${idx}`} className="px-2 text-slate-400 font-bold">
                                …
                              </span>
                            )
                          }
                          const isCurrent = p === page
                          return (
                            <button
                              key={`page-${p}`}
                              onClick={() => goToPage(p)}
                              className={`w-9 h-9 rounded-xl font-bold transition-all flex items-center justify-center text-xs ${
                                isCurrent
                                  ? 'bg-slate-900 text-white shadow-md shadow-slate-900/10 scale-105'
                                  : 'bg-white border border-slate-200 text-slate-700 hover:border-slate-800 hover:bg-slate-50'
                              }`}
                            >
                              {p}
                            </button>
                          )
                        })}
                      </div>

                      <button
                        disabled={page >= totalPages}
                        onClick={() => goToPage(page + 1)}
                        className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl disabled:opacity-30 hover:border-slate-800 transition-all font-bold flex items-center gap-2 shadow-xs disabled:cursor-not-allowed text-slate-800"
                      >
                        Next Page <i className="ti ti-arrow-right" />
                      </button>
                    </div>

                    {/* Bottom summary indicator */}
                    <div className="flex items-center justify-center text-xs text-slate-500 font-mono gap-2 pt-1">
                      <span>Showing <strong>{startItem}–{endItem}</strong> of <strong>{totalItems}</strong> opportunities</span>
                      <span>•</span>
                      <span>Page {page} of {totalPages}</span>
                    </div>
                  </div>
                )}
              </>
            )}

          </div>

          {/* Right Workspace Sidebar (4 Columns) */}
          <div className="col-span-12 lg:col-span-4 space-y-6">
            
            {/* Side-by-side comparison workspace */}
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
                    <div
                      key={compareKey(item)}
                      className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs"
                    >
                      <span className="font-bold truncate text-slate-800 max-w-[180px]">{item.title}</span>
                      <button
                        onClick={() => toggleCompare(item)}
                        className="text-red-500 hover:text-red-700 font-mono font-bold px-1 text-sm"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={() => setShowCompareModal(true)}
                    className="w-full mt-2 bg-slate-950 hover:bg-indigo-600 text-white py-3.5 rounded-xl font-bold text-xs transition-all shadow-md flex items-center justify-center gap-1.5"
                  >
                    <span>Compare Matrix Side-by-Side</span>
                    <i className="ti ti-arrow-right text-xs" />
                  </button>
                </div>
              ) : (
                <p className="text-xs text-slate-500 p-4 bg-slate-50 rounded-2xl border border-dashed border-slate-200 leading-relaxed">
                  Click the comparison icon <i className="ti ti-arrows-diff text-indigo-500 font-bold inline" /> on any card to evaluate eligibility, funding, and deadlines side-by-side.
                </p>
              )}
            </div>

            {/* AI Search Tips Card */}
            <div className="bg-white border border-slate-200 p-6 rounded-3xl shadow-xl space-y-4">
              <div className="font-mono text-xs text-slate-700 font-bold uppercase tracking-wider pb-3 border-b border-slate-200 flex items-center gap-1.5">
                <i className="ti ti-bulb text-indigo-500" /> Search Tips & Suggestions
              </div>
              <ul className="space-y-3 text-xs text-slate-600 leading-relaxed">
                <li className="flex items-start gap-2">
                  <span className="text-indigo-600 font-bold">•</span>
                  <span>Combine organization + country like <strong>&quot;ETH Zurich postdoc&quot;</strong> or <strong>&quot;DAAD Germany&quot;</strong> for pinpoint matches.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-indigo-600 font-bold">•</span>
                  <span>Search specific topics like <strong>&quot;DeepTech grant&quot;</strong>, <strong>&quot;Machine Learning&quot;</strong>, or <strong>&quot;Quantum&quot;</strong>.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-indigo-600 font-bold">•</span>
                  <span>Sort by <strong>&quot;Approaching Deadline&quot;</strong> to prioritize upcoming application cutoffs.</span>
                </li>
              </ul>
            </div>

          </div>

        </div>

      </div>

      {/* Comparison Modal */}
      {showCompareModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/50 backdrop-blur-md"
          onClick={() => setShowCompareModal(false)}
        >
          <div
            className="bg-white rounded-3xl border border-slate-200 max-w-4xl w-full p-6 sm:p-8 shadow-2xl space-y-6 relative overflow-y-auto max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-200">
              <div>
                <span className="font-mono text-xs text-slate-500 font-bold uppercase">Side-by-Side Matrix</span>
                <h2 className="text-xl sm:text-2xl font-extrabold text-slate-950 mt-1">
                  Opportunity Comparison
                </h2>
              </div>
              <button
                onClick={() => setShowCompareModal(false)}
                className="text-slate-400 hover:text-slate-900 text-xl font-mono font-bold shrink-0"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:divide-x divide-slate-200">
              {compareItems.map((item) => (
                <div key={compareKey(item)} className="space-y-4 sm:px-3 sm:first:pl-0">
                  <span className="font-mono text-[9px] bg-slate-950 text-white px-2.5 py-0.5 rounded-full font-bold uppercase">
                    {categoryLabel(item.category)}
                  </span>
                  <h4 className="font-bold text-base text-slate-900 leading-snug">{item.title}</h4>
                  <p className="text-xs text-slate-500 font-medium">
                    {item.organizer} · {item.country || 'Global'}
                  </p>

                  <div className="pt-4 border-t border-slate-100 space-y-3 font-mono text-xs">
                    <div>
                      <span className="text-slate-400 block text-[9px] font-bold">STIPEND / FUNDING</span>
                      <strong className="text-slate-800">{item.funding_amount || 'Fully Funded / Stipend'}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[9px] font-bold">DEADLINE</span>
                      <strong className="text-indigo-600">
                        {item.deadline ? formatDate(item.deadline) : 'Rolling / Open'}
                      </strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[9px] font-bold">ELIGIBILITY</span>
                      <p className="font-sans text-[11px] text-slate-600 mt-1 leading-relaxed">
                        {item.eligibility_text || 'Open worldwide to eligible candidates.'}
                      </p>
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
