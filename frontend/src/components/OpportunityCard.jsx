import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { applyUrl } from '../lib/api'
import { categoryLabel, cleanTitle, deadlineInfo, formatDate, orgSlug } from '../lib/format'
import './OpportunityCard.css'

export default function OpportunityCard({ opp, onSave, onApply, saved = false }) {
  const navigate = useNavigate()
  const dl = deadlineInfo(opp.deadline, opp.status)
  const closed = opp.status === 'expired' || opp.status === 'dead_link'

  // Internal instant state for 0ms visual feedback
  const [isSaved, setIsSaved] = useState(saved)

  useEffect(() => {
    setIsSaved(saved)
  }, [saved])

  const handleSaveToggle = (e) => {
    e.stopPropagation()
    const nextSavedState = !isSaved
    setIsSaved(nextSavedState) // ⚡ INSTANT 0MS CARD STATE REACTION!
    if (onSave) {
      onSave(opp)
    }
  }

  return (
    <article
      className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm hover:shadow-xl hover:border-indigo-200 transition-all duration-300 flex flex-col justify-between space-y-5 cursor-pointer group"
      onClick={() => navigate(`/opportunities/${opp.slug || opp.id}`)}
    >
      <div className="space-y-4">
        {/* Header Badges */}
        <div className="flex items-center justify-between font-mono text-[9px]">
          <span className="bg-[#0A0A0A] text-white font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider">
            {categoryLabel(opp.category)}
          </span>
          <span className="text-red-500 font-bold bg-red-50 border border-red-100 px-2.5 py-1 rounded-full">
            {dl.text}
          </span>
        </div>

        {/* Card Title & Organizer */}
        <div className="space-y-1">
          <h3 className="text-base font-extrabold text-slate-950 leading-snug group-hover:text-indigo-600 transition-colors">
            {cleanTitle(opp.title)}
          </h3>
          <Link
            to={`/organizations/${orgSlug(opp.organizer)}`}
            className="prism-mono text-[11px] font-bold text-slate-500 hover:text-indigo-600 transition-colors block"
            onClick={(e) => e.stopPropagation()}
          >
            {opp.organizer}
          </Link>
        </div>

        {/* Card Metadata */}
        <div className="flex items-center justify-between text-xs text-slate-500 font-medium pt-3 border-t border-slate-100">
          {opp.country && (
            <span className="flex items-center gap-1">
              <i className="ti ti-map-pin text-indigo-600" /> {opp.country}
            </span>
          )}
          {opp.funding_amount && (
            <span className="flex items-center gap-1 font-bold text-slate-800">
              <i className="ti ti-currency-euro" /> {opp.funding_amount}
            </span>
          )}
          {opp.deadline && (
            <span className="flex items-center gap-1 font-mono text-[10px]">
              <i className="ti ti-calendar" /> {formatDate(opp.deadline)}
            </span>
          )}
        </div>
      </div>

      {/* Card Footer Actions */}
      <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3" onClick={(e) => e.stopPropagation()}>
        {closed ? (
          <span className="text-xs font-mono text-slate-400 font-bold">Expired</span>
        ) : (
          <a
            className="bg-[#0A0A0A] hover:bg-indigo-600 text-white font-bold text-xs px-4 py-2 rounded-xl flex items-center gap-1 transition-all"
            href={applyUrl(opp.id)}
            onClick={onApply}
            target="_blank"
            rel="noopener noreferrer"
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
                ? 'bg-emerald-50 text-emerald-700 border-emerald-300 font-extrabold shadow-2xs hover:bg-red-50 hover:text-red-600 hover:border-red-200'
                : 'bg-slate-50 text-slate-700 border-slate-200 hover:border-indigo-400 hover:bg-indigo-50 hover:text-indigo-700'
            }`}
            onClick={handleSaveToggle}
            title={isSaved ? 'Click to unsave' : 'Save to tracker'}
          >
            {isSaved ? '✓ Saved' : '+ Save'}
          </button>
        )}
      </div>
    </article>
  )
}
