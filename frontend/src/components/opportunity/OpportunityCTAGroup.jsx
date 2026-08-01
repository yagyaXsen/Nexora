/**
 * Trust-aware CTA group. Drives everything off the normalized `cta` model:
 *  - open + application_url  -> "Apply Now" (primary)
 *  - closed                  -> "Deadline Passed" (muted, links to official)
 *  - upcoming                -> "Opening Soon" (muted)
 *  - rolling                 -> "Rolling Applications"
 * Always offers a secondary "Official Source" link so the user can verify.
 */
export default function OpportunityCTAGroup({ opp, onApply }) {
  const cta = opp?.cta
  if (!cta) return null

  const disabled = cta.kind === 'closed' || cta.kind === 'upcoming'
  const primaryUrl = cta.url
  const secondaryUrl = opp?.officialSourceUrl

  return (
    <div className="space-y-3">
      {disabled || !primaryUrl ? (
        <div
          className="w-full py-3.5 rounded-2xl bg-slate-100 text-slate-400 font-bold text-sm text-center flex items-center justify-center gap-2 cursor-default"
          aria-disabled="true"
        >
          <span>{cta.label}</span>
          {cta.kind === 'upcoming' && <i className="ti ti-hourglass" />}
          {cta.kind === 'closed' && <i className="ti ti-archive" />}
        </div>
      ) : (
        <a
          href={primaryUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={onApply ? (e) => onApply(e) : undefined}
          className="w-full py-3.5 rounded-2xl font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-lg bg-[#0A0A0A] hover:bg-indigo-600 text-white"
        >
          <span>{cta.label}</span>
          <i className="ti ti-arrow-up-right" />
        </a>
      )}

      {secondaryUrl && (
        <a
          href={secondaryUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full py-3 rounded-2xl font-bold text-xs transition-colors border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 hover:border-slate-400 flex items-center justify-center gap-2"
        >
          <i className="ti ti-external-link text-[13px]" />
          Visit Official Source
        </a>
      )}

      {cta.hint && (
        <p className="text-[11px] font-mono text-slate-400 leading-relaxed text-center">
          {cta.hint}
        </p>
      )}
    </div>
  )
}
