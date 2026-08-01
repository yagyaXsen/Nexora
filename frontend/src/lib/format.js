export function formatDate(iso) {
  if (!iso) return null
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export function daysLeft(iso) {
  if (!iso) return null
  const ms = new Date(iso) - new Date()
  return Math.ceil(ms / 86_400_000)
}

/** { text, tone } tone: green | amber | red | gray */
export function deadlineInfo(iso, status) {
  if (status === 'expired') return { text: 'Expired', tone: 'gray' }
  if (status === 'dead_link') return { text: 'Link unavailable', tone: 'gray' }
  if (!iso) return { text: 'Rolling deadline', tone: 'green' }
  const d = daysLeft(iso)
  if (d < 0) return { text: 'Expired', tone: 'gray' }
  if (d === 0) return { text: 'Closes today', tone: 'red' }
  if (d === 1) return { text: '1 day left', tone: 'red' }
  if (d <= 7) return { text: `${d} days left`, tone: 'amber' }
  return { text: `${d} days left`, tone: 'green' }
}

/**
 * Title cleaning — now handled by the pipeline extractor's _clean_title().
 * This is kept as a safety net for titles from non-pipeline sources (seed data,
 * manual entry). Passthrough that trims whitespace.
 */
export function cleanTitle(title) {
  if (!title) return ''
  return String(title).trim()
}

export function orgSlug(organizer) {
  if (!organizer) return 'eth-zurich-ai-center'
  return (
    organizer
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '') || 'eth-zurich-ai-center'
  )
}

const CATEGORY_LABELS = {
  scholarship: 'Scholarship',
  fellowship:  'Fellowship',
  grant:       'Grant',
  accelerator: 'Accelerator',
  incubator:   'Incubator',
  competition: 'Competition',
  hackathon:   'Hackathon',
  conference:  'Conference',
  research_program: 'Research Program',
  bootcamp:    'Bootcamp',
  workshop:    'Workshop',
  exchange:    'Exchange Program',
  exchange_program: 'Exchange Program',
  global_youth_program: 'Global Youth Program',
  travel:      'Travel Program',
  gov_scheme:  'Government Scheme',
  giveaway:    'Giveaway',
}

export function categoryLabel(cat) {
  return CATEGORY_LABELS[cat] ?? cat
}

export const ALL_CATEGORIES = Object.keys(CATEGORY_LABELS)

const STATUS_LABELS = {
  saved: 'Saved',
  planning: 'Planning',
  applied: 'Applied',
  interview: 'Interview',
  accepted: 'Accepted',
  rejected: 'Rejected',
}

export function statusLabel(status) {
  return STATUS_LABELS[status] ?? status
}
