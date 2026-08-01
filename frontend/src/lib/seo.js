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

/** Create a meta tag; returns the element. Only newly-created tags are tracked. */
function ensureMeta(attr, key, content) {
  if (!content) return null
  let el = document.head.querySelector(`meta[${attr}="${key}"]`)
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attr, key)
    document.head.appendChild(el)
    createdTags.push(el)
  }
  el.setAttribute('content', content)
  return el
}

/** Create/update a link tag; only newly-created links are tracked. */
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
  // Remove only the tags this module created — pre-existing tags (e.g. the
  // description meta in index.html) are adopted and updated, never destroyed.
  for (const el of createdTags) {
    el.remove()
  }
  createdTags = []
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
