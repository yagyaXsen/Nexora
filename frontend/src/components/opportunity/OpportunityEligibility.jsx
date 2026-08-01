import SectionCard, { InfoRow, EmptyHint } from './OpportunitySectionCard'
import OpportunityBadge from './OpportunityBadge'

/**
 * Eligibility section. Shows the eligibility summary, a clear verdict chip
 * ("Likely Eligible" / "Check Carefully" / "Unclear"), requirement rows, and
 * who should / should not apply. Self-hides empty rows.
 */
export default function OpportunityEligibility({ opp }) {
  if (!opp) return null

  const verdict = (opp.eligibilityVerdict || '').toLowerCase()
  const verdictBadge = verdict.includes('likely') || verdict.includes('eligible')
    ? { label: 'Likely Eligible', tone: 'green' }
    : verdict.includes('check') || verdict.includes('careful')
      ? { label: 'Check Carefully', tone: 'amber' }
      : opp.missingOrUnclearInfo?.length
        ? { label: 'Unclear — Verify', tone: 'gray' }
        : null

  const hasContent = opp.eligibilitySummary || opp.citizenshipRequirements || opp.academicRequirements
    || opp.ageRequirements || opp.languageRequirements || opp.whoShouldApply || opp.whoShouldNotApply

  if (!hasContent) {
    return (
      <SectionCard title="Eligibility" eyebrow="Who Can Apply" icon="ti-user-check">
        <EmptyHint>Eligibility requires manual review — check the official source for full criteria.</EmptyHint>
      </SectionCard>
    )
  }

  return (
    <SectionCard title="Eligibility" eyebrow="Who Can Apply" icon="ti-user-check">
      {verdictBadge && (
        <div className="mb-4">
          <OpportunityBadge label={verdictBadge.label} tone={verdictBadge.tone} icon="ti-shield-check" />
        </div>
      )}

      {opp.eligibilitySummary && (
        <p className="font-serif text-sm text-slate-700 leading-relaxed mb-4">{opp.eligibilitySummary}</p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8">
        {opp.citizenshipRequirements && (
          <InfoRow label="Citizenship" value={opp.citizenshipRequirements} icon="ti-world" />
        )}
        {opp.academicRequirements && (
          <InfoRow label="Academic" value={opp.academicRequirements} icon="ti-school" />
        )}
        {opp.ageRequirements && (
          <InfoRow label="Age" value={opp.ageRequirements} icon="ti-cake" />
        )}
        {opp.languageRequirements && (
          <InfoRow label="Language" value={opp.languageRequirements} icon="ti-language" />
        )}
        {opp.targetAudience && (
          <InfoRow label="Audience" value={opp.targetAudience} icon="ti-users" />
        )}
      </div>

      {(opp.whoShouldApply || opp.whoShouldNotApply) && (
        <div className="mt-5 pt-4 border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-4">
          {opp.whoShouldApply && (
            <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-100">
              <div className="text-[11px] font-mono font-bold text-emerald-700 uppercase tracking-wide mb-1.5 flex items-center gap-1">
                <i className="ti ti-checkbox" /> Good Fit For
              </div>
              <p className="text-sm text-slate-700 leading-relaxed">{opp.whoShouldApply}</p>
            </div>
          )}
          {opp.whoShouldNotApply && (
            <div className="p-4 rounded-2xl bg-red-50/60 border border-red-100">
              <div className="text-[11px] font-mono font-bold text-red-600 uppercase tracking-wide mb-1.5 flex items-center gap-1">
                <i className="ti ti-xbox" /> Probably Not
              </div>
              <p className="text-sm text-slate-700 leading-relaxed">{opp.whoShouldNotApply}</p>
            </div>
          )}
        </div>
      )}

      {opp.missingOrUnclearInfo?.length > 0 && (
        <p className="mt-4 text-[11px] font-mono text-amber-600 leading-relaxed">
          <i className="ti ti-alert-triangle mr-1" />
          Unclear: {opp.missingOrUnclearInfo.join(' · ')}
        </p>
      )}
    </SectionCard>
  )
}
