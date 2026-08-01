import SectionCard from './OpportunitySectionCard'
import OpportunityBadge from './OpportunityBadge'
import { formatHumanDate } from '../../lib/opportunityNormalize'

/**
 * Verification & trust section. Reinforces credibility: verification status,
 * confidence score, source type, discovery method, verification notes, and
 * last-verified date. Always links back to the official source.
 */
export default function OpportunityVerification({ opp }) {
  if (!opp) return null
  const t = opp.trust

  if (!t || (!t.label && !t.verificationNotes && !t.discoveredVia)) {
    return (
      <SectionCard title="Verification" eyebrow="Trust & Sources" icon="ti-shield-check">
        <p className="font-serif text-sm text-slate-500 italic">
          Verification details weren't published for this opportunity — check the official source.
        </p>
      </SectionCard>
    )
  }

  return (
    <SectionCard title="Verification & Trust" eyebrow="Verified by Nexora" icon="ti-shield-check">
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <OpportunityBadge label={t.label} tone={t.tone} icon="ti-shield-check" />
        {t.confidenceScore !== null && (
          <OpportunityBadge
            label={`${t.confidenceScore}% confidence`}
            tone={t.confidenceScore >= 90 ? 'green' : t.confidenceScore >= 75 ? 'amber' : 'gray'}
            icon="ti-gauge"
          />
        )}
        {t.sourceType && <OpportunityBadge label={t.sourceType} tone="slate" icon="ti-source-code" />}
      </div>

      {(t.verificationNotes || t.discoveredVia || t.lastVerifiedAt) && (
        <div className="space-y-3 text-sm">
          {t.verificationNotes && (
            <p className="text-slate-600 leading-relaxed font-serif">{t.verificationNotes}</p>
          )}
          {t.discoveredVia && (
            <p className="text-[11px] font-mono text-slate-400">
              <i className="ti ti-compass mr-1 text-indigo-500" /> Discovered via: {t.discoveredVia}
            </p>
          )}
          {t.lastVerifiedAt && (
            <p className="text-[11px] font-mono text-slate-400">
              <i className="ti ti-refresh mr-1 text-emerald-500" /> Last verified {formatHumanDate(t.lastVerifiedAt)}
            </p>
          )}
        </div>
      )}

      {opp.whyThisIsTrustworthy && (
        <p className="mt-4 text-xs font-mono text-slate-500 leading-relaxed">
          <i className="ti ti-checkbox text-emerald-500 mr-1" />
          {opp.whyThisIsTrustworthy}
        </p>
      )}

      {opp.officialSourceUrl && (
        <a
          href={opp.officialSourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-5 inline-flex items-center gap-2 text-xs font-bold text-indigo-600 hover:underline"
        >
          <i className="ti ti-external-link" /> View Official Source
        </a>
      )}
    </SectionCard>
  )
}
