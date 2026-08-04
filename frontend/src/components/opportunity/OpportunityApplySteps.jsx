import SectionCard, { EmptyHint } from './OpportunitySectionCard'

/**
 * How to apply — the conversion-focused section. Numbered application steps,
 * a required-documents checklist, and the official application / source links.
 * Shows a warning callout when the application URL differs from the source
 * page (so users aren't surprised by the handoff).
 */
export default function OpportunityApplySteps({ opp }) {
  if (!opp) return null

  const appUrl = opp.applicationUrl
  const srcUrl = opp.officialSourceUrl
  const differs = appUrl && srcUrl && appUrl !== srcUrl

  const hasSteps = opp.applicationSteps?.length > 0
  const hasDocs = opp.requiredDocuments?.length > 0
  const hasLinks = appUrl || srcUrl || opp.contactEmail || opp.contactPage || opp.faqUrl || opp.termsUrl

  if (!hasSteps && !hasDocs && !hasLinks && !opp.applyCtaNotes && !opp.beforeYouApplyChecklist?.length) {
    return (
      <SectionCard title="How to Apply" eyebrow="Next Steps" icon="ti-pencil">
        <EmptyHint>Application instructions weren't published in the source data. Use the official links to confirm the process.</EmptyHint>
      </SectionCard>
    )
  }

  return (
    <SectionCard title="How to Apply" eyebrow="Next Steps" icon="ti-pencil">
      {differs && (
        <div className="mb-5 p-4 rounded-2xl bg-amber-50 border border-amber-200">
          <div className="text-[11px] font-mono font-bold text-amber-700 uppercase tracking-wide mb-1 flex items-center gap-1">
            <i className="ti ti-alert-triangle" /> Applying happens on the official site
          </div>
          <p className="text-xs text-amber-800 leading-relaxed">
            The application link leads to the official program portal. You'll leave Nexora —
            no third-party intermediaries are involved.
          </p>
        </div>
      )}

      {opp.applyCtaNotes && (
        <p className="text-xs font-mono text-slate-500 mb-5 leading-relaxed">
          <i className="ti ti-info-circle text-indigo-500 mr-1" />
          {opp.applyCtaNotes}
        </p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {hasSteps && (
          <div>
            <div className="text-[11px] font-mono font-bold text-slate-400 uppercase tracking-widest mb-3">
              Application Steps
            </div>
            <ol className="space-y-3">
              {opp.applicationSteps.map((step, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="shrink-0 w-6 h-6 rounded-full bg-indigo-600 text-white text-[11px] font-bold flex items-center justify-center mt-0.5">
                    {i + 1}
                  </span>
                  <span className="text-sm text-slate-700 leading-relaxed">{step}</span>
                </li>
              ))}
            </ol>
          </div>
        )}

        {hasDocs && (
          <div>
            <div className="text-[11px] font-mono font-bold text-slate-400 uppercase tracking-widest mb-3">
              Required Documents
            </div>
            <ul className="space-y-2">
              {opp.requiredDocuments.map((doc) => (
                <li key={doc} className="flex items-start gap-2.5 text-sm text-slate-700">
                  <i className="ti ti-file-check text-emerald-500 mt-0.5" />
                  {doc}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {opp.beforeYouApplyChecklist?.length > 0 && (
        <div className="mt-6 pt-4 border-t border-slate-100">
          <div className="text-[11px] font-mono font-bold text-slate-400 uppercase tracking-widest mb-3">
            Before You Apply
          </div>
          <ul className="space-y-2">
            {opp.beforeYouApplyChecklist.map((item) => (
              <li key={item} className="flex items-start gap-2.5 text-sm text-slate-700">
                <i className="ti ti-checklist text-indigo-500 mt-0.5" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Link grid */}
      <div className="mt-6 pt-4 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-2">
        {appUrl && (
          <a
            href={appUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold border border-slate-200 hover:border-slate-800 hover:bg-slate-50 text-slate-700 hover:text-slate-950 transition-all"
          >
            <i className="ti ti-external-link text-slate-700" /> Official Application Portal
          </a>
        )}
        {srcUrl && (
          <a
            href={srcUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold border border-slate-200 hover:border-slate-800 hover:bg-slate-50 text-slate-700 hover:text-slate-950 transition-all"
          >
            <i className="ti ti-world text-slate-700" /> Official Program Page
          </a>
        )}
        {opp.contactEmail && (
          <a
            href={`mailto:${opp.contactEmail}`}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold border border-slate-200 hover:border-slate-800 hover:bg-slate-50 text-slate-700 hover:text-slate-950 transition-all"
          >
            <i className="ti ti-mail text-slate-700" /> Contact Email
          </a>
        )}
        {opp.contactPage && (
          <a
            href={opp.contactPage}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold border border-slate-200 hover:border-slate-800 hover:bg-slate-50 text-slate-700 hover:text-slate-950 transition-all"
          >
            <i className="ti ti-messages text-slate-700" /> Contact Page
          </a>
        )}
        {opp.faqUrl && (
          <a
            href={opp.faqUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold border border-slate-200 hover:border-slate-800 hover:bg-slate-50 text-slate-700 hover:text-slate-950 transition-all"
          >
            <i className="ti ti-help text-slate-700" /> FAQ
          </a>
        )}
        {opp.termsUrl && (
          <a
            href={opp.termsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold border border-slate-200 hover:border-slate-800 hover:bg-slate-50 text-slate-700 hover:text-slate-950 transition-all"
          >
            <i className="ti ti-file-text text-slate-700" /> Terms &amp; Conditions
          </a>
        )}
      </div>

      {opp.prepTips?.length > 0 && (
        <div className="mt-6 pt-4 border-t border-slate-100">
          <div className="text-[11px] font-mono font-bold text-slate-400 uppercase tracking-widest mb-3">
            Prep Tips
          </div>
          <ul className="space-y-2">
            {opp.prepTips.map((tip) => (
              <li key={tip} className="flex items-start gap-2.5 text-sm text-slate-700">
                <i className="ti ti-bulb text-amber-500 mt-0.5" /> {tip}
              </li>
            ))}
          </ul>
        </div>
      )}
    </SectionCard>
  )
}
