/**
 * Lightweight SEO/meta manager for opportunity pages.
 * Sets document.title, meta description, canonical URL, Open Graph tags and
 * JSON-LD structured data. Tracks only the tags it creates and restores the
 * document's base state on reset, so navigating between routes never leaves
 * stale metadata and never destroys index.html's original <meta> tags.
 */

const SITE_URL = (import.meta.env.VITE_SITE_URL || window.location.origin).replace(/\/$/, '')

const DEFAULT_TITLE = 'Nexora — Global Opportunity Intelligence'

let jsonLdEl = null
let createdTags = []
// Adopted (pre-existing) tags whose content we temporarily overwrite, keyed by
// selector -> original content so resetSEO can restore them.
let adoptedOriginals = []

/** Create/update a meta tag. Newly-created tags are tracked for removal;
 *  adopted tags are tracked so their original content can be restored. */
function ensureMeta(attr, key, content) {
  if (!content) return null
  const selector = `meta[${attr}="${key}"]`
  let el = document.head.querySelector(selector)
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attr, key)
    document.head.appendChild(el)
    createdTags.push(el)
  } else if (!adoptedOriginals.some((a) => a.selector === selector)) {
    adoptedOriginals.push({ selector, original: el.getAttribute('content') })
  }
  el.setAttribute('content', content)
  return el
}

/** Create/update a link tag. Newly-created links are tracked for removal. */
function ensureLink(rel, href) {
  if (!href) return null
  let el = document.head.querySelector(`link[rel="${rel}"]`)
  if (!el) {
    el = document.createElement('link')
    el.setAttribute('rel', rel)
    document.head.appendChild(el)
    createdTags.push(el)
  }
  el.setAttribute('href', href)
  return el
}

export function applySEO({
  title,
  description,
  canonicalPath,
  image,
  jsonLd = null,
} = {}) {
  resetSEO()

  document.title = title ? `${title} · Nexora` : DEFAULT_TITLE

  ensureMeta('name', 'description', description || undefined)
  ensureMeta('property', 'og:title', title || undefined)
  ensureMeta('property', 'og:description', description || undefined)
  ensureMeta('property', 'og:type', 'website')
  ensureMeta('property', 'og:image', image || undefined)
  ensureMeta('property', 'og:url', canonicalPath ? `${SITE_URL}${canonicalPath}` : undefined)

  if (canonicalPath) {
    ensureLink('canonical', `${SITE_URL}${canonicalPath}`)
  }

  if (jsonLd) {
    jsonLdEl = document.createElement('script')
    jsonLdEl.type = 'application/ld+json'
    jsonLdEl.textContent = JSON.stringify(jsonLd)
    document.head.appendChild(jsonLdEl)
  }
}

export function resetSEO() {
  if (jsonLdEl) {
    jsonLdEl.remove()
    jsonLdEl = null
  }
  // Remove only tags this module created — never destroy index.html's own tags.
  for (const el of createdTags) {
    el.remove()
  }
  createdTags = []
  // Restore original content of any adopted meta tags we overwrote.
  for (const { selector, original } of adoptedOriginals) {
    const el = document.head.querySelector(selector)
    if (!el) continue
    if (original === null) el.remove()
    else el.setAttribute('content', original)
  }
  adoptedOriginals = []
  document.title = DEFAULT_TITLE
}

/** Build a schema.org EducationalOccupationalProgram object for an opportunity. */
export function opportunityJSONLD(opp) {
  const canonicalUrl = `${SITE_URL}/opportunities/${opp.slug || opp.id || ''}`
  return {
    '@context': 'https://schema.org',
    '@type': 'EducationalOccupationalProgram',
    name: opp.title,
    description: opp.summary || opp.eligibilitySummary || undefined,
    url: canonicalUrl,
    provider: opp.provider ? { '@type': 'Organization', name: opp.provider } : undefined,
    sameAs: opp.officialSourceUrl || undefined,
    timeToComplete: opp.duration || undefined,
    programType: opp.typeLabel || undefined,
    offers: opp.fundingType
      ? { '@type': 'Offer', category: opp.fundingType }
      : undefined,
  }
}

export default applySEO
