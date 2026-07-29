import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { applyUrl } from '../lib/api'
import { categoryLabel, cleanTitle, deadlineInfo, formatDate, orgSlug } from '../lib/format'
import './OpportunityCard.css'

// Category → icon mapping
const CATEGORY_ICONS = {
  fellowship:   'ti-rocket',
  scholarship:  'ti-school',
  grant:        'ti-currency-euro',
  accelerator:  'ti-trending-up',
  competition:  'ti-trophy',
  conference:   'ti-presentation',
  exchange:     'ti-world',
  travel:       'ti-plane',
  gov_scheme:   'ti-building-community',
  giveaway:     'ti-gift',
}

export default function OpportunityCard({ opp, onSave, onApply, saved = false }) {
  const navigate = useNavigate()
  const dl = deadlineInfo(opp.deadline, opp.status)
  const closed = opp.status === 'expired' || opp.status === 'dead_link'
  const icon = CATEGORY_ICONS[opp.category] ?? 'ti-star'

  const [isSaved, setIsSaved] = useState(saved)
  useEffect(() => { setIsSaved(saved) }, [saved])

  const handleSaveToggle = (e) => {
    e.stopPropagation()
    setIsSaved(!isSaved)
    if (onSave) onSave(opp)
  }

  // Deadline badge colour
  const dlBadgeClass =
    dl.tone === 'red'   ? 'text-red-600 bg-red-50 border-red-100' :
    dl.tone === 'amber' ? 'text-amber-600 bg-amber-50 border-amber-100' :
    dl.tone === 'gray'  ? 'text-slate-400 bg-slate-50 border-slate-200' :
                          'text-emerald-600 bg-emerald-50 border-emerald-100'

  return (
    <article
      className="opp-card bg-white border border-slate-200 rounded-3xl p-6 shadow-sm hover:shadow-xl hover:border-indigo-200 transition-all duration-300 flex flex-col justify-between space-y-5 cursor-pointer group"
      onClick={() => navigate(`/opportunities/${opp.slug || opp.id}`)}
      aria-label={`${cleanTitle(opp.title)} by ${opp.organizer}`}
    >
      <div className="space-y-4">

        {/* ── Header: category badge + deadline badge ── */}
        <div className="flex items-center justify-between font-mono text-[9px]">
          <span className="flex items-center gap-1 bg-[#0A0A0A] text-white font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider">
            <i className={`ti ${icon} text-[10px]`} />
            {categoryLabel(opp.category)}
          </span>
          <span className={`font-bold border px-2.5 py-1 rounded-full ${dlBadgeClass}`}>
            {dl.text}
          </span>
        </div>

        {/* ── Title & Organizer ── */}
        <div className="space-y-1">
          <h3 className="text-base font-extrabold text-slate-950 leading-snug group-hover:text-indigo-600 transition-colors line-clamp-2">
            {cleanTitle(opp.title)}
          </h3>
          <Link
            to={`/organizations/${orgSlug(opp.organizer)}`}
            className="prism-mono text-[11px] font-bold text-slate-500 hover:text-indigo-600 transition-colors block truncate"
            onClick={(e) => e.stopPropagation()}
          >
            {opp.organizer}
          </Link>
        </div>

        {/* ── Metadata row: location · funding · deadline ── */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 font-medium pt-3 border-t border-slate-100">
          {opp.country && (
            <span className="flex items-center gap-1">
              <i className="ti ti-map-pin text-indigo-500 text-[11px]" />
              <span className="truncate max-w-[100px]">{opp.country}</span>
            </span>
          )}
          {opp.funding_amount && (
            <span className="flex items-center gap-1 font-bold text-slate-800">
              <i className="ti ti-cash text-emerald-500 text-[11px]" />
              <span className="truncate max-w-[130px]">{opp.funding_amount}</span>
            </span>
          )}
          {opp.deadline && !closed && (
            <span className="flex items-center gap-1 font-mono text-[10px] text-slate-400 ml-auto">
              <i className="ti ti-calendar text-[11px]" />
              {formatDate(opp.deadline)}
            </span>
          )}
        </div>
      </div>

      {/* ── Footer Actions ── */}
      <div
        className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3"
        onClick={(e) => e.stopPropagation()}
      >
        {closed ? (
          <span className="text-xs font-mono text-slate-400 font-bold flex items-center gap-1">
            <i className="ti ti-clock-x text-[12px]" /> Closed
          </span>
        ) : (
          <a
            className="bg-[#0A0A0A] hover:bg-indigo-600 text-white font-bold text-xs px-4 py-2 rounded-xl flex items-center gap-1.5 transition-all shadow-sm"
            href={applyUrl(opp)}
            onClick={onApply}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Apply to ${cleanTitle(opp.title)}`}
          >
            <span>Apply</span>
            <i className="ti ti-arrow-up-right text-xs" />
          </a>
        )}

        {onSave && (
          <button
            type="button"
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all border ${
              isSaved
                ? 'bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-red-50 hover:text-red-600 hover:border-red-200'
                : 'bg-slate-50 text-slate-700 border-slate-200 hover:border-indigo-400 hover:bg-indigo-50 hover:text-indigo-700'
            }`}
            onClick={handleSaveToggle}
            aria-label={isSaved ? 'Unsave opportunity' : 'Save opportunity'}
          >
            {isSaved ? '✓ Saved' : '+ Save'}
          </button>
        )}
      </div>
    </article>
  )
}
