/**
 * Shared helpers for consuming the verified published catalog
 * (/api/published/opportunities) anywhere in the app.
 *
 * Published records are slug-keyed (no DB `id`), use `provider_organization`
 * / `opportunity_type` / `country_or_region` / `funding_type`, and expose rich
 * enrichment fields. Cards (OpportunityCard, Explore cards) expect the legacy
 * shape (`organizer`, `category`, `country`, `funding_amount`, `apply_url`),
 * so `toCardShape()` maps between the two. Save/compare for slug-keyed records
 * use the local bookmark stub because there is no DB row to track.
 */

export const PUBLISHED_FUNDING_LABELS = {
  fully_funded: 'Fully Funded',
  partially_funded: 'Partially Funded',
  stipend: 'Stipend',
  grant_support: 'Grant Support',
  tuition_covered: 'Tuition Covered',
}

const BOOKMARKS_KEY = 'nexora_bookmarks'

/** Read the local bookmark stub safely — never throws on corrupt storage. */
export function readBookmarks() {
  try {
    const current = JSON.parse(localStorage.getItem(BOOKMARKS_KEY) || '[]')
    return Array.isArray(current) ? current : []
  } catch {
    return []
  }
}

/** Toggle a slug in the local bookmark stub; returns the new saved state. */
export function toggleBookmark(slug) {
  const current = readBookmarks()
  const next = current.includes(slug) ? current.filter((s) => s !== slug) : [...current, slug]
  localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(next))
  return next.includes(slug)
}

/**
 * Map a published-catalog record into the legacy card shape the shared
 * OpportunityCard / Explore feed expect. Published records have no DB id, so
 * save/compare key off the slug.
 */
export function toCardShape(p) {
  return {
    ...p,
    id: null,
    category: p.opportunity_type,
    organizer: p.provider_organization,
    country: p.country_or_region,
    funding_amount: PUBLISHED_FUNDING_LABELS[p.funding_type] || null,
    eligibility_text: p.eligibility_summary,
    apply_url: p.application_url || p.official_source_url,
  }
}

