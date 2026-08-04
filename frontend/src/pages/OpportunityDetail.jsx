import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { api, trackApplyClick } from '../lib/api'
import { useAuth } from '../lib/auth.jsx'
import { normalizeOpportunity } from '../lib/opportunityNormalize'
import { applySEO, resetSEO, opportunityJSONLD } from '../lib/seo'
import { categoryLabel } from '../lib/format'

// Section components
import OpportunityHero from '../components/opportunity/OpportunityHero'
import OpportunityTrustCard from '../components/opportunity/OpportunityTrustCard'
import OpportunityKeyFacts from '../components/opportunity/OpportunityKeyFacts'
import OpportunityBenefits from '../components/opportunity/OpportunityBenefits'
import OpportunityEligibility from '../components/opportunity/OpportunityEligibility'
import OpportunityApplySteps from '../components/opportunity/OpportunityApplySteps'
import OpportunityDeadlinePanel from '../components/opportunity/OpportunityDeadlinePanel'
import OpportunityAIMatch from '../components/opportunity/OpportunityAIMatch'
import OpportunityVerification from '../components/opportunity/OpportunityVerification'
import OpportunityOrganizer from '../components/opportunity/OpportunityOrganizer'
import RelatedOpportunities from '../components/opportunity/RelatedOpportunities'
import './OpportunityDetail.css'

/** Build an .ics calendar file for the deadline (browser-download stub). */
function buildICS(opp) {
  if (!opp?.deadlineISO) return null
  const date = opp.deadlineISO.replace(/-/g, '')
  const esc = (s) => (s || '').replace(/[,;\n]/g, ' ')
  const ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Nexora//Opportunity Deadline//EN',
    'BEGIN:VEVENT',
    `UID:nexora-${opp.slug}@nexora`,
    `DTSTART;VALUE=DATE:${date}`,
    `SUMMARY:${esc(opp.title)} - Deadline`,
    `DESCRIPTION:Apply deadline for ${esc(opp.title)} at ${esc(opp.provider)}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n')
  return URL.createObjectURL(new Blob([ics], { type: 'text/calendar' }))
}

function downloadICS(opp) {
  const url = buildICS(opp)
  if (!url) return
  const a = document.createElement('a')
  a.href = url
  a.download = `${opp.slug}-deadline.ics`
  a.click()
  // Revoke after the download starts so we don't leak blob URLs.
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

const BOOKMARKS_KEY = 'nexora_bookmarks'

/** Read the local bookmark stub safely — never throw on corrupt storage. */
function readBookmarks() {
  try {
    const current = JSON.parse(localStorage.getItem(BOOKMARKS_KEY) || '[]')
    return Array.isArray(current) ? current : []
  } catch {
    return []
  }
}

export default function OpportunityDetail() {
  const { idOrSlug } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()

  const [opp, setOpp] = useState(null)      // normalized model
  const [rawId, setRawId] = useState(null)  // DB id when source is legacy DB
  const [related, setRelated] = useState([])
  const [relatedLoading, setRelatedLoading] = useState(false)
  const [notFound, setNotFound] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)
  const [shareCopied, setShareCopied] = useState(false)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setNotFound(false)
    setOpp(null)
    setRelated([])

    const load = async () => {
      // 1) Prefer the published (verified/enriched) catalog.
      try {
        const data = await api.publishedOpportunity(idOrSlug)
        if (cancelled) return
        setOpp(normalizeOpportunity(data))
        setRawId(data.id ?? null)
        return
      } catch {
        /* fall through to legacy DB endpoint */
      }
      // 2) Legacy DB endpoint (id or slug).
      try {
        const data = await api.opportunity(idOrSlug)
        if (cancelled) return
        setOpp(normalizeOpportunity(data))
        setRawId(data.id ?? null)
      } catch {
        if (!cancelled) setNotFound(true)
      }
    }

    load().finally(() => !cancelled && setLoading(false))
    return () => {
      cancelled = true
    }
  }, [idOrSlug])

  // Related opportunities (published catalog → legacy category match).
  useEffect(() => {
    if (!opp) return
    let cancelled = false
    setRelatedLoading(true)

    const fetchRelated = async () => {
      try {
        const list = await api.publishedRelated(opp.slug, 6)
        if (cancelled) return
        // Empty published result (e.g. legacy DB records aren't in the
        // published catalog) should fall through to the legacy category match.
        if (list && list.length > 0) {
          setRelated(list.map(normalizeOpportunity).filter((r) => r.slug !== opp.slug))
          if (!cancelled) setRelatedLoading(false)
          return
        }
      } catch {
        /* fall through to legacy */
      }
      // Fallback: same category from the published catalog (verified/enriched),
      // then the legacy DB endpoint as a last resort.
      try {
        const r = await api.published({ category: opp.type, page_size: 6 })
        if (cancelled) return
        const mapped = (r.items || [])
          .map(normalizeOpportunity)
          .filter((x) => x.slug !== opp.slug && (rawId == null || x.id !== rawId))
        if (mapped.length > 0) {
          setRelated(mapped)
          if (!cancelled) setRelatedLoading(false)
          return
        }
      } catch {
        /* fall through to legacy */
      }
      try {
        const r = await api.opportunities({ category: opp.type, page_size: 6 })
        if (cancelled) return
        setRelated(
          r.items
            .map(normalizeOpportunity)
            .filter((x) => x.slug !== opp.slug && (rawId == null || x.id !== rawId))
        )
      } catch {
        /* no related available */
      } finally {
        if (!cancelled) setRelatedLoading(false)
      }
    }

    fetchRelated()
    return () => {
      cancelled = true
    }
  }, [opp, rawId])

  // Saved state. Legacy DB records check the tracker API; published
  // (non-DB) records use the localStorage bookmark stub — hydrate it on mount.
  useEffect(() => {
    if (!user) return
    if (rawId == null) {
      setSaved(readBookmarks().includes(opp?.slug))
      return
    }
    api
      .applications()
      .then((apps) => setSaved(apps.some((a) => a.opportunity.id === rawId)))
      .catch(() => {})
  }, [user, rawId, opp?.slug])

  // SEO: dynamic title, meta, canonical, OG, structured data.
  useEffect(() => {
    if (!opp) {
      resetSEO()
      return
    }
    applySEO({
      title: opp.seoTitle || opp.title,
      description: opp.seoDescription || opp.summary || opp.eligibilitySummary || undefined,
      canonicalPath: `/opportunities/${opp.slug}`,
      image: opp.featuredImage || undefined,
      jsonLd: (() => {
        try {
          return opportunityJSONLD(opp)
        } catch {
          return null // never let JSON-LD break the page
        }
      })(),
    })
    return resetSEO
  }, [opp])

  const toggleSave = useCallback(async () => {
    if (!user) {
      navigate('/login', { state: { from: `/opportunities/${idOrSlug}` } })
      return
    }
    if (rawId == null) {
      // Published (non-DB) record: local bookmark stub — no tracker row yet.
      const current = readBookmarks()
      const next = current.includes(opp.slug)
        ? current.filter((s) => s !== opp.slug)
        : [...current, opp.slug]
      localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(next))
      setSaved(next.includes(opp.slug))
      return
    }
    const previous = saved
    setSaved(!previous)
    setSaving(true)
    try {
      if (previous) await api.unsaveOpportunity(rawId)
      else await api.saveApplication(rawId)
    } catch {
      setSaved(previous)
    } finally {
      setSaving(false)
    }
  }, [user, rawId, saved, opp?.slug, idOrSlug, navigate])

  // Apply handler: login gate + fire-and-forget tracking; plain external nav.
  const handleApply = useCallback(
    (e) => {
      if (!user) {
        e.preventDefault()
        navigate('/login', { state: { from: `/opportunities/${idOrSlug}` } })
        return
      }
      if (rawId != null) {
        trackApplyClick(rawId)
        api
          .applyToOpportunity(rawId)
          .then(() => setSaved(true))
          .catch(() => {})
      }
    },
    [user, rawId, idOrSlug, navigate]
  )

  const handleShare = useCallback(async () => {
    const url = `${window.location.origin}/opportunities/${opp?.slug || idOrSlug}`
    try {
      await navigator.clipboard.writeText(url)
      setShareCopied(true)
      setTimeout(() => setShareCopied(false), 2000)
    } catch {
      /* clipboard unavailable */
    }
  }, [opp?.slug, idOrSlug])

  /* ── Loading skeleton ─────────────────────────────────────────────── */
  if (loading) {
    return (
      <div className="bg-white min-h-screen pt-24 pb-20 print-hide">
        <div className="max-w-[1240px] mx-auto px-6 space-y-6">
          <div className="h-8 w-64 bg-slate-100 animate-pulse rounded-xl" />
          <div className="h-72 bg-slate-100 animate-pulse rounded-3xl border border-slate-200" />
          <div className="grid grid-cols-12 gap-8">
            <div className="col-span-12 lg:col-span-8 space-y-6">
              <div className="h-40 bg-slate-100 animate-pulse rounded-3xl border border-slate-200" />
              <div className="h-40 bg-slate-100 animate-pulse rounded-3xl border border-slate-200" />
            </div>
            <div className="col-span-12 lg:col-span-4">
              <div className="h-80 bg-slate-100 animate-pulse rounded-3xl border border-slate-200" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  /* ── Not found state ───────────────────────────────────────────────── */
  if (notFound) {
    return (
      <div className="bg-white min-h-screen pt-24 pb-20 print-hide">
        <div className="max-w-[600px] mx-auto text-center py-16 space-y-6">
          <i className="ti ti-world-off text-5xl text-slate-300" />
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Opportunity Record Not Found
          </h1>
          <p className="font-serif text-sm text-slate-600">
            This opportunity may have expired or been removed from the active index.
          </p>
          <Link
            to="/explore"
            className="bg-[#0A0A0A] text-white px-6 py-3 rounded-2xl font-bold text-sm inline-block hover:bg-slate-800 transition-colors shadow-sm hover:shadow-md active:scale-[0.98]"
          >
            Return to Opportunity Explorer
          </Link>
        </div>
      </div>
    )
  }

  if (!opp) return null

  const closed = opp.status === 'closed'

  return (
    <div className="bg-white min-h-screen pt-24 pb-20 font-sans relative overflow-hidden print:pt-0">
      {/* Ambient glow */}
      <div className="absolute top-0 right-1/4 w-[800px] h-[500px] bg-gradient-to-tr from-slate-200/30 via-slate-100/20 to-transparent rounded-full blur-3xl pointer-events-none print:hidden" />

      <div className="max-w-[1240px] mx-auto px-6 relative z-10 space-y-8 print:max-w-none print:px-0">

        {/* Breadcrumb + utility row */}
        <nav className="flex flex-wrap items-center gap-2 font-mono text-xs text-slate-400 print:hidden">
          <Link to="/explore" className="hover:text-slate-800 transition-colors font-bold">Explorer Index</Link>
          <span>/</span>
          <span className="uppercase text-slate-800 font-bold">{categoryLabel(opp.type)}</span>
          <span className="ml-auto flex items-center gap-2">
            <button
              type="button"
              onClick={() => window.print()}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-200 hover:border-slate-400 text-slate-500 font-bold transition-colors"
              title="Print this page"
            >
              <i className="ti ti-printer text-xs" /> Print
            </button>
            <a
              href={`mailto:support@nexora.app?subject=${encodeURIComponent(`Report an issue: ${opp.title}`)}&body=${encodeURIComponent(`Opportunity: ${window.location.href}`)}`}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-200 hover:border-red-300 text-slate-500 font-bold transition-colors"
              title="Report an issue with this listing"
            >
              <i className="ti ti-flag text-xs" /> Report
            </a>
          </span>
        </nav>

        {/* Hero */}
        <OpportunityHero
          opp={opp}
          saved={saved}
          saving={saving}
          onToggleSave={toggleSave}
          onShare={handleShare}
          onApply={handleApply}
        />

        {/* Deadline intelligence banner (desktop top of content) */}
        {!closed && <OpportunityDeadlinePanel opp={opp} />}

        {/* Asymmetric grid: content (8) + sticky trust sidebar (4) */}
        <div className="grid grid-cols-12 gap-8 items-start">
          <article className="col-span-12 lg:col-span-8 space-y-6 detail-print-main">
            <OpportunityAIMatch opp={opp} />
            <OpportunityKeyFacts opp={opp} />
            <OpportunityBenefits opp={opp} />
            <OpportunityEligibility opp={opp} />
            <OpportunityApplySteps opp={opp} />
            <OpportunityVerification opp={opp} />
            <OpportunityOrganizer opp={opp} />
          </article>

          <div className="col-span-12 lg:col-span-4 print:hidden">
            <OpportunityTrustCard opp={opp} onApply={handleApply} />
          </div>
        </div>

        {/* Related strip */}
        {!closed && (
          <RelatedOpportunities items={related} loading={relatedLoading} />
        )}

        {/* Calendar stub + share feedback */}
        <div className="flex flex-wrap items-center gap-2 text-xs font-mono text-slate-400 pt-2 print:hidden">
          {opp.deadlineISO && (
            <button
              type="button"
              onClick={() => downloadICS(opp)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 hover:border-slate-800 hover:text-slate-950 hover:bg-slate-50 transition-colors"
            >
              <i className="ti ti-calendar-plus text-slate-700" /> Add deadline to calendar
            </button>
          )}
          {shareCopied && (
            <span className="text-emerald-600 font-bold flex items-center gap-1">
              <i className="ti ti-check" /> Link copied
            </span>
          )}
        </div>

      </div>
    </div>
  )
}
