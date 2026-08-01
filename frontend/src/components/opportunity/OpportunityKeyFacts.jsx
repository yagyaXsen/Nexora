import SectionCard, { InfoRow, ChipList } from './OpportunitySectionCard'
import { typeLabel, modeLabel, formatHumanDate } from '../../lib/opportunityNormalize'

/**
 * Key facts — a compact, scannable grid of everything a candidate wants at a
 * glance. Every row self-hides when its value is missing, so partial records
 * never render empty rows.
 */
export default function OpportunityKeyFacts({ opp }) {
  if (!opp) return null

  const facts = []

  facts.push({ label: 'Opportunity Type', value: typeLabel(opp.type), icon: 'ti-tag' })
  if (opp.provider) facts.push({ label: 'Provider', value: opp.provider, icon: 'ti-building' })
  if (opp.hostInstitution) facts.push({ label: 'Host Institution', value: opp.hostInstitution, icon: 'ti-school' })
  if (opp.countryOrRegion) facts.push({ label: 'Country / Region', value: opp.countryOrRegion, icon: 'ti-map-pin' })
  facts.push({ label: 'Mode', value: modeLabel(opp.mode), icon: 'ti-device-laptop' })
  if (opp.duration) facts.push({ label: 'Duration', value: opp.duration, icon: 'ti-clock' })
  if (opp.startDate) facts.push({ label: 'Starts', value: formatHumanDate(opp.startDate), icon: 'ti-calendar' })
  if (opp.endDate) facts.push({ label: 'Ends', value: formatHumanDate(opp.endDate), icon: 'ti-calendar' })
  if (opp.applicationOpens) facts.push({ label: 'Applications Open', value: formatHumanDate(opp.applicationOpens), icon: 'ti-door-enter' })
  if (opp.applicationCloses) facts.push({ label: 'Applications Close', value: formatHumanDate(opp.applicationCloses), icon: 'ti-door-exit' })
  if (opp.rollingDeadline === true) facts.push({ label: 'Deadline', value: 'Rolling', icon: 'ti-infinity' })
  else if (opp.rollingDeadline === false) facts.push({ label: 'Deadline', value: 'Fixed', icon: 'ti-calendar-time' })
  if (opp.targetAudience) facts.push({ label: 'Target Audience', value: opp.targetAudience, icon: 'ti-users' })
  if (opp.studyLevel?.length) facts.push({ label: 'Study Level', value: opp.studyLevel.join(', '), icon: 'ti-certificate' })
  if (opp.languageRequirements) facts.push({ label: 'Languages', value: opp.languageRequirements, icon: 'ti-language' })

  return (
    <SectionCard title="Key Facts" eyebrow="Quick Glance" icon="ti-list-details">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8">
        {facts.map((f) => (
          <InfoRow key={f.label} label={f.label} value={f.value} icon={f.icon} />
        ))}
      </div>

      {(opp.disciplines?.length > 0 || opp.tags?.length > 0) && (
        <div className="mt-5 pt-4 border-t border-slate-100 space-y-3">
          {opp.disciplines?.length > 0 && (
            <div>
              <div className="text-[11px] font-mono font-bold text-slate-400 uppercase tracking-wide mb-2">Disciplines</div>
              <ChipList items={opp.disciplines} />
            </div>
          )}
          {opp.tags?.length > 0 && (
            <div>
              <div className="text-[11px] font-mono font-bold text-slate-400 uppercase tracking-wide mb-2">Topics</div>
              <ChipList items={opp.tags} />
            </div>
          )}
        </div>
      )}
    </SectionCard>
  )
}
