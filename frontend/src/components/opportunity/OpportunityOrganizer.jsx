import SectionCard from './OpportunitySectionCard'

/**
 * Organizer section — provider, host institution, organizer website, and
 * contact channels. Self-hides entirely when no organizer data exists.
 */
export default function OpportunityOrganizer({ opp }) {
  if (!opp) return null

  const provider = opp.provider
  const host = opp.hostInstitution
  const website = opp.organizerWebsite
  const hasAny = provider || host || website || opp.contactEmail || opp.contactPage

  if (!hasAny) return null

  return (
    <SectionCard title="Organizer" eyebrow="Behind the Program" icon="ti-building">
      <div className="space-y-4">
        {(provider || host) && (
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
            {provider && (
              <div className="text-sm font-extrabold text-slate-900">{provider}</div>
            )}
            {host && host !== provider && (
              <div className="text-xs font-mono text-slate-500 mt-1">
                Host: <span className="font-bold text-slate-700">{host}</span>
              </div>
            )}
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          {website && (
            <a
              href={website}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold border border-slate-200 hover:border-slate-800 hover:bg-slate-50 text-slate-700 hover:text-slate-950 transition-all"
            >
              <i className="ti ti-world text-slate-700" /> Organizer Website
            </a>
          )}
          {opp.contactEmail && (
            <a
              href={`mailto:${opp.contactEmail}`}
              className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold border border-slate-200 hover:border-slate-800 hover:bg-slate-50 text-slate-700 hover:text-slate-950 transition-all"
            >
              <i className="ti ti-mail text-slate-700" /> Contact
            </a>
          )}
          {opp.contactPage && (
            <a
              href={opp.contactPage}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold border border-slate-200 hover:border-slate-800 hover:bg-slate-50 text-slate-700 hover:text-slate-950 transition-all"
            >
              <i className="ti ti-messages text-slate-700" /> Contact Page
            </a>
          )}
        </div>
      </div>
    </SectionCard>
  )
}
