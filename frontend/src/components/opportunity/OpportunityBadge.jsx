import { BADGE_TONES } from '../../lib/opportunityNormalize'

/**
 * Reusable pill badge. `tone` maps to BADGE_TONES; optional icon uses Tabler
 * icons (`ti-*`). Renders nothing if no label is provided.
 */
export default function OpportunityBadge({ label, tone = 'gray', icon, className = '' }) {
  if (!label) return null
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-bold font-mono uppercase tracking-wide ${BADGE_TONES[tone] || BADGE_TONES.gray} ${className}`}
    >
      {icon && <i className={`ti ${icon} text-[11px]`} />}
      {label}
    </span>
  )
}
