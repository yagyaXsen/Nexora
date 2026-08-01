import SectionCard, { EmptyHint } from './OpportunitySectionCard'
import OpportunityBadge from './OpportunityBadge'
import { fundingLabel } from '../../lib/opportunityNormalize'

/**
 * Benefits / funding section. Renders a funding-type banner, the benefits
 * summary, and any program benefits. When funding data is entirely missing it
 * falls back to a concise, honest note rather than an empty block.
 */
export default function OpportunityBenefits({ opp }) {
  if (!opp) return null

  const hasFundingLabel = opp.fundingType && opp.fundingType !== 'unknown'
  const hasText = opp.benefitsSummary || opp.summary

  // Enrichment funding details (stipend/tuition/travel/accommodation) plus the
  // legacy DB `funding_amount` string — surfaced as coverage rows when present.
  const coverage = [
    { label: 'Stipend', value: opp.stipendAmount },
    { label: 'Tuition', value: opp.tuitionCoverage },
    { label: 'Travel', value: opp.travelSupport },
    { label: 'Accommodation', value: opp.accommodationSupport },
    { label: 'Funding', value: opp.fundingAmount },
  ].filter((c) => c.value && String(c.value).trim())

  const fundingTone =
    opp.fundingType === 'fully_funded' ? 'green'
    : opp.fundingType === 'non_funded' ? 'gray'
    : 'amber'

  return (
    <SectionCard title="Funding & Benefits" eyebrow="What You Get" icon="ti-cash">
      {hasFundingLabel && (
        <div className="mb-4">
          <OpportunityBadge label={fundingLabel(opp.fundingType)} tone={fundingTone} icon="ti-cash" />
        </div>
      )}

      {hasText ? (
        <div className="space-y-4">
          {opp.benefitsSummary && (
            <p className="font-serif text-sm text-slate-700 leading-relaxed">{opp.benefitsSummary}</p>
          )}
          {!opp.benefitsSummary && opp.summary && (
            <p className="font-serif text-sm text-slate-600 leading-relaxed">{opp.summary}</p>
          )}
        </div>
      ) : (
        <EmptyHint>
          Funding details were not published in the source data. Confirm specific amounts and
          coverage on the official program page.
        </EmptyHint>
      )}

      {coverage.length > 0 && (
        <div className="mt-5 pt-4 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-2">
          {coverage.map((c) => (
            <div key={c.label} className="flex items-center justify-between gap-3 px-3 py-2 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-[11px] font-mono font-bold text-slate-400 uppercase tracking-wide">{c.label}</span>
              <span className="text-sm font-bold text-emerald-700">{c.value}</span>
            </div>
          ))}
        </div>
      )}

      {opp.applicationFee && (
        <p className="mt-4 text-xs font-mono text-slate-500">
          <i className="ti ti-alert-triangle text-amber-500 mr-1" />
          Application fee: <strong>{opp.applicationFee}</strong>
        </p>
      )}
    </SectionCard>
  )
}
