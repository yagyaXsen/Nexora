import OpportunityBadge from './OpportunityBadge'
import OpportunityCTAGroup from './OpportunityCTAGroup'
import { formatHumanDate } from '../../lib/opportunityNormalize'

/**
 * Sticky right-side trust/quick-glance card. Surfaces the facts a candidate
 * needs before clicking Apply: deadline + days left, status, funding type,
 * host, organizer, verification state and last-verified date.
 */
export default function OpportunityTrustCard({ opp, onApply }) {
  if (!opp) return null

  const daysLeft = opp.daysLeft
  const deadlineTone = daysLeft === null ? 'gray'
    : daysLeft < 0 ? 'gray'
    : daysLeft <= 7 ? 'red'
    : daysLeft <= 30 ? 'amber'
    : 'green'

  return (
    <aside className="lg:sticky lg:top-28 space-y-5">
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-lg space-y-5">
        {/* Deadline block */}
        <div className="space-y-2">
          <div className="font-mono text-[10px] text-slate-400 uppercase tracking-widest font-bold flex items-center gap-1.5">
            <i className="ti ti-calendar-time text-indigo-600" />
            Application Deadline
          </div>
          {opp.deadlineISO ? (
            <>
              <div className="text-2xl font-extrabold text-slate-900 tracking-tight">
                {formatHumanDate(opp.deadlineISO)}
              </div>
              <OpportunityBadge
                label={
                  daysLeft === null
                    ? 'Deadline Unknown'
                    : daysLeft < 0
                      ? 'Deadline Passed'
                      : daysLeft === 0
                        ? 'Closes Today'
                        : daysLeft === 1
                          ? '1 Day Left'
                          : `${daysLeft} Days Left`
                }
                tone={deadlineTone}
                icon="ti-hourglass"
              />
              {opp.officialDeadlineNote && (
                <p className="text-[11px] font-mono text-slate-400 leading-relaxed">{opp.officialDeadlineNote}</p>
              )}
            </>
          ) : (
            <div className="text-lg font-bold text-slate-700">
              {opp.statusLabel || 'Deadline not stated'}
            </div>
          )}
        </div>

        <hr className="border-slate-100" />

        {/* Key glance facts */}
        <dl className="space-y-3 text-sm">
          {opp.fundingLabel !== 'Funding Unclear' && (
            <div className="flex items-center justify-between">
              <dt className="font-mono text-[10px] uppercase tracking-widest text-slate-400">Funding</dt>
              <dd className="font-bold text-emerald-700 flex items-center gap-1">
                <i className="ti ti-cash text-emerald-500" /> {opp.fundingLabel}
              </dd>
            </div>
          )}
          {opp.hostInstitution && (
            <div className="flex items-center justify-between">
              <dt className="font-mono text-[10px] uppercase tracking-widest text-slate-400">Host</dt>
              <dd className="font-semibold text-slate-800 text-right">{opp.hostInstitution}</dd>
            </div>
          )}
          {opp.provider && (
            <div className="flex items-center justify-between">
              <dt className="font-mono text-[10px] uppercase tracking-widest text-slate-400">Organizer</dt>
              <dd className="font-semibold text-slate-800 text-right">{opp.provider}</dd>
            </div>
          )}
          {opp.duration && (
            <div className="flex items-center justify-between">
              <dt className="font-mono text-[10px] uppercase tracking-widest text-slate-400">Duration</dt>
              <dd className="font-semibold text-slate-800 text-right">{opp.duration}</dd>
            </div>
          )}
          {opp.countryOrRegion && (
            <div className="flex items-center justify-between">
              <dt className="font-mono text-[10px] uppercase tracking-widest text-slate-400">Location</dt>
              <dd className="font-semibold text-slate-800 text-right flex items-center gap-1">
                <i className="ti ti-map-pin text-indigo-600" /> {opp.countryOrRegion}
              </dd>
            </div>
          )}
        </dl>

        <hr className="border-slate-100" />

        {/* Verification chip */}
        <div className="flex items-center justify-between">
          <span className="font-mono text-[10px] uppercase tracking-widest text-slate-400">Verification</span>
          <OpportunityBadge label={opp.trust?.label} tone={opp.trust?.tone} icon="ti-shield-check" />
        </div>
        {opp.trust?.lastVerifiedAt && (
          <p className="text-[11px] font-mono text-slate-400">
            Last verified {formatHumanDate(opp.trust.lastVerifiedAt)}
          </p>
        )}

        <hr className="border-slate-100" />

        <OpportunityCTAGroup opp={opp} onApply={onApply} />
      </div>
    </aside>
  )
}
