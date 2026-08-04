import { Link } from 'react-router-dom'
import OpportunityBadge from './OpportunityBadge'
import { formatHumanDate } from '../../lib/opportunityNormalize'

/**
 * Related opportunities recommendation strip. Renders 3-6 compact cards from
 * the catalog's related endpoint. Hidden entirely when no related items.
 */
export default function RelatedOpportunities({ items = [], loading = false }) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-44 bg-slate-100 animate-pulse rounded-2xl border border-slate-200" />
        ))}
      </div>
    )
  }

  if (!items || items.length === 0) return null

  return (
    <section className="space-y-5">
      <div className="flex items-center gap-2">
        <i className="ti ti-sparkles text-slate-700 text-lg" />
        <h2 className="text-lg font-extrabold text-slate-900 tracking-tight">Similar Opportunities</h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map((r) => (
          <Link
            key={r.slug || r.id}
            to={`/opportunities/${r.slug || r.id}`}
            className="group bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-lg hover:border-slate-400 transition-all space-y-3"
          >
            <div className="flex items-center justify-between">
              <OpportunityBadge label={r.typeLabel || 'Opportunity'} tone="slate" icon="ti-tag" />
              {r.fundingLabel && r.fundingLabel !== 'Funding Unclear' && (
                <OpportunityBadge label={r.fundingLabel} tone="green" icon="ti-cash" />
              )}
            </div>
            <h3 className="text-sm font-extrabold text-slate-900 leading-snug group-hover:text-black transition-colors line-clamp-2">
              {r.title}
            </h3>
            <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 pt-2 border-t border-slate-100">
              <span className="flex items-center gap-1">
                <i className="ti ti-map-pin text-slate-500" /> {r.countryOrRegion || 'Global'}
              </span>
              {r.deadlineISO && (
                <span>{formatHumanDate(r.deadlineISO)}</span>
              )}
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}
