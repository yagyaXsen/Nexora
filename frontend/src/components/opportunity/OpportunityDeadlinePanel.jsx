import { formatHumanDate } from '../../lib/opportunityNormalize'

/**
 * Deadline intelligence banner. Prominent urgency state (closing soon / open /
 * opens later / rolling / unclear), exact date when known, and an archived
 * callout for closed rounds.
 */
export default function OpportunityDeadlinePanel({ opp }) {
  if (!opp) return null

  const { status, daysLeft, deadlineISO } = opp

  if (status === 'closed') {
    return (
      <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 flex items-start gap-3">
        <i className="ti ti-archive text-slate-400 text-xl mt-0.5" />
        <div>
          <div className="font-bold text-slate-700 text-sm">This round has closed</div>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            {deadlineISO
              ? `Applications closed on ${formatHumanDate(deadlineISO)}. `
              : 'Applications are no longer being accepted. '}
            Many programs reopen annually — check the official source for the next cycle.
          </p>
        </div>
      </div>
    )
  }

  const banner =
    status === 'rolling'
      ? { icon: 'ti-infinity', tone: 'bg-emerald-50 border-emerald-200 text-emerald-800', title: 'Rolling Applications', desc: 'No fixed deadline — apply when ready.' }
      : status === 'upcoming'
        ? { icon: 'ti-calendar-time', tone: 'bg-amber-50 border-amber-200 text-amber-800', title: 'Opening Soon', desc: opp.applicationOpens ? `Applications open ${formatHumanDate(opp.applicationOpens)}.` : 'Applications are not open yet. Bookmark this page and check back.' }
        : daysLeft !== null && daysLeft <= 7
          ? { icon: 'ti-alert-triangle', tone: 'bg-red-50 border-red-200 text-red-700', title: daysLeft < 0 ? 'Deadline Passed' : daysLeft === 0 ? 'Closes Today' : daysLeft === 1 ? '1 Day Left' : `${daysLeft} Days Left`, desc: 'This deadline is imminent — prepare your materials now.' }
          : daysLeft !== null && daysLeft <= 30
            ? { icon: 'ti-hourglass-high', tone: 'bg-amber-50 border-amber-200 text-amber-800', title: `${daysLeft} Days Left`, desc: 'Deadline is approaching. Give yourself time to gather documents.' }
            : { icon: 'ti-hourglass', tone: 'bg-indigo-50 border-indigo-200 text-indigo-800', title: daysLeft !== null ? `${daysLeft} Days Left` : 'Deadline Not Stated', desc: deadlineISO ? `Applications close ${formatHumanDate(deadlineISO)}.` : 'No official deadline was published — confirm on the official source.' }

  return (
    <div className={`p-5 rounded-2xl border flex items-start gap-3 ${banner.tone}`}>
      <i className={`ti ${banner.icon} text-xl mt-0.5`} />
      <div>
        <div className="font-extrabold text-sm">{banner.title}</div>
        <p className="text-xs opacity-90 mt-1 leading-relaxed">{banner.desc}</p>
        {deadlineISO && status !== 'rolling' && (
          <p className="text-[11px] font-mono mt-1.5 opacity-80">
            Deadline: {formatHumanDate(deadlineISO)}
          </p>
        )}
      </div>
    </div>
  )
}
