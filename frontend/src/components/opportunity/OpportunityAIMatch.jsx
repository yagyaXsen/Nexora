import SectionCard from './OpportunitySectionCard'

/**
 * AI match + personalized fit section. Renders a match percentage, reasons as
 * bullets, and why-it-may-fit guidance. Returns null entirely when no AI data
 * exists — no empty block is rendered.
 */
export default function OpportunityAIMatch({ opp }) {
  if (!opp) return null

  const hasScore = opp.aiMatchScore !== null && opp.aiMatchScore > 0
  const hasReasons = opp.aiMatchReasons?.length > 0
  const hasRecommendation = opp.recommendationReason

  if (!hasScore && !hasReasons && !hasRecommendation) return null

  const score = hasScore ? Math.min(100, Math.max(0, opp.aiMatchScore)) : null

  return (
    <SectionCard
      title="AI Match & Fit"
      eyebrow="Personalized"
      icon="ti-sparkles"
      action={
        score !== null && (
          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-indigo-600 text-white text-sm font-extrabold">
            <i className="ti ti-bolt" /> {score}%
          </span>
        )
      }
    >
      <div className="space-y-4">
        {hasReasons && (
          <ul className="space-y-2">
            {opp.aiMatchReasons.map((reason) => (
              <li key={reason} className="flex items-start gap-2.5 text-sm text-slate-700">
                <i className="ti ti-circle-check text-indigo-500 mt-0.5" />
                {reason}
              </li>
            ))}
          </ul>
        )}

        {hasRecommendation && (
          <p className="text-sm text-slate-600 leading-relaxed font-serif">
            {opp.recommendationReason}
          </p>
        )}

        {opp.missingOrUnclearInfo?.length > 0 && (
          <p className="text-[11px] font-mono text-amber-600 leading-relaxed">
            <i className="ti ti-alert-triangle mr-1" />
            Fit confidence is reduced because some eligibility criteria are unclear. Verify on the
            official source.
          </p>
        )}
      </div>
    </SectionCard>
  )
}
