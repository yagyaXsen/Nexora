/**
 * Normalized, frontend-safe Opportunity model.
 *
 * Every field is optional-safe: null/undefined/empty are collapsed to null or
 * [], so every consumer component can render a graceful empty state without
 * guard-clause spaghetti. All derived fields (badges, CTA, status flags,
 * daysLeft, trust level) are computed once here so the page stays dumb.
 *
 * This is the single contract between the API (either the published catalog
 * or the legacy DB endpoint) and the UI. See `opportunityTypes.d.ts` for the
 * TypeScript mirror.
 */

/**
 * Normalize a raw opportunity record (from the published catalog API or the
 * legacy DB API) into a stable frontend-safe shape. Never throws.
 * @param {object|null|undefined} raw
 * @returns {object} normalized opportunity
 */
export function normalizeOpportunity(raw) {
  if (!raw || typeof raw !== 'object') {
    return emptyOpportunity()
  }

  const src = raw
  const deadlineISO = pickISO(src.deadline, src.application_closes, src.deadline_date)
  const daysLeft = computeDaysLeft(deadlineISO)

  const type = pick(src.opportunity_type, src.category, 'other')
  const mode = pick(src.mode, 'unknown')
  const status = computeStatus(src, deadlineISO, daysLeft)
  const fundingType = pick(src.funding_type, null)
  const verification = computeVerification(src)

  // Enrichment funding details (may be absent) — surfaced in Benefits.
  const fundingDetail = {
    stipendAmount: pick(src.stipend_amount, null),
    tuitionCoverage: pick(src.tuition_coverage, null),
    travelSupport: pick(src.travel_support, null),
    accommodationSupport: pick(src.accommodation_support, null),
    fundingAmount: pick(src.funding_amount, null),
  }
  const cta = buildCTA(src, status, deadlineISO, daysLeft)

  const tags = toArray(src.tags, src.fields_of_interest, src.disciplines)
  const disciplines = toArray(src.disciplines, src.fields_of_interest)
  const studyLevel = toArray(src.study_level, src.degree_level)

  const trust = {
    level: verification.level,
    label: verification.label,
    tone: verification.tone,
    confidenceScore: num(src.confidence_score ?? src.confidence),
    sourceType: pick(src.source_type, null),
    discoveredVia: pick(src.discovered_via, null),
    verificationNotes: pick(src.verification_notes, null),
    verificationStatus: pick(src.verification_status, null),
    lastVerifiedAt: pick(src.last_verified_at, null),
  }

  return {
    // identity
    id: num(src.id),
    slug: pick(src.slug, src.canonical_slug, slugify(src.title || 'opportunity')),
    title: pick(src.title, src.program_name, 'Untitled Opportunity'),
    provider: pick(src.provider_organization, src.organizer, src.provider, ''),
    type,
    typeLabel: typeLabel(type),
    mode,
    modeLabel: modeLabel(mode),
    status,
    statusLabel: statusLabel(status),

    // links — never break on missing application_url
    applicationUrl: pickUrl(src.application_url, src.apply_url, src.applicationUrl),
    officialSourceUrl: pickUrl(
      src.official_source_url,
      src.organizer_website,
      src.source_url,
      src.officialSourceUrl
    ),
    primaryUrl: pickUrl(src.application_url, src.apply_url, src.official_source_url),

    // geo & dates
    countryOrRegion: pick(src.country_or_region, src.country, null),
    deadlineISO,
    deadlineDisplay: formatHumanDate(deadlineISO),
    daysLeft,
    applicationOpens: pickISO(src.application_opens),
    applicationCloses: pickISO(src.application_closes, src.application_closes_date),
    rollingDeadline: boolish(src.rolling_deadline),
    startDate: pickISO(src.start_date),
    endDate: pickISO(src.end_date),

    // text content
    summary: pick(src.short_original_summary, src.description, null),
    eligibilitySummary: pick(src.eligibility_summary, src.eligibility_text, null),
    benefitsSummary: pick(src.benefits_summary, src.program_benefits, null),
    targetAudience: pick(src.target_audience, null),
    duration: pick(src.duration, null),
    applicationFee: pick(src.application_fee, null),
    hostInstitution: pick(src.host_institution, null),
    organizerWebsite: pick(src.organizer_website, null),
    contactEmail: pick(src.contact_email, null),
    contactPage: pick(src.contact_page, null),
    faqUrl: pick(src.faq_url, null),
    termsUrl: pick(src.terms_url, null),
    featuredImage: pick(src.featured_image, null),

    // structured fields
    tags,
    disciplines,
    studyLevel,
    eligibleCountries: toArray(src.eligible_countries),
    requiredDocuments: toArray(src.required_documents),
    applicationSteps: toArray(src.application_steps),
    relatedLinks: toArray(src.related_links),

    // funding
    fundingType,
    fundingLabel: fundingLabel(fundingType),
    ...fundingDetail,

    // requirements
    citizenshipRequirements: pick(src.citizenship_requirements, null),
    ageRequirements: pick(src.age_requirements, null),
    languageRequirements: pick(src.language_requirements, null),
    academicRequirements: pick(src.academic_requirements, null),
    eligibilityVerdict: pick(src.eligibility_verdict, null),

    // AI match
    aiMatchScore: num(src.ai_match_score),
    aiMatchReasons: toArray(src.ai_match_reasons),
    recommendationReason: pick(src.recommendation_reason, null),

    // apply guidance
    applyCtaLabel: pick(src.apply_cta_label, null),
    applyCtaDestinationType: pick(src.apply_cta_destination_type, null),
    applyCtaNotes: pick(src.apply_cta_notes, null),
    applicationReadiness: pick(src.application_readiness, null),
    applicationDifficulty: pick(src.application_difficulty, null),
    timeNeededToApply: pick(src.time_needed_to_apply, null),
    officialDeadlineNote: pick(src.official_deadline_note, null),
    beforeYouApplyChecklist: toArray(src.before_you_apply_checklist),
    applyWarning: pick(src.apply_warning, null),
    externalApplication: boolish(src.external_application, true),
    requiresAccountCreation: src.requires_account_creation ?? null,
    whoShouldApply: pick(src.who_should_apply, null),
    whoShouldNotApply: pick(src.who_should_not_apply, null),
    prepTips: toArray(src.prep_tips),
    missingOrUnclearInfo: toArray(src.missing_or_unclear_info),
    whyThisIsTrustworthy: pick(src.why_this_is_trustworthy, null),

    // SEO
    seoTitle: pick(src.seo_title, null),
    seoDescription: pick(src.seo_description, null),

    // computed UI bundles
    badges: buildBadges({ status, fundingType, verification, mode, daysLeft, deadlineISO, aiMatchScore: num(src.ai_match_score) }),
    cta,
    trust,
  }
}

export function emptyOpportunity() {
  return normalizeOpportunity({})
}

/* ──────────────────────────────────────────────────────────────────────────
 * Derivation helpers
 * ────────────────────────────────────────────────────────────────────────── */

function computeStatus(src, deadlineISO, daysLeft) {
  const raw = String(src.status || '').toLowerCase()
  if (['closed', 'expired', 'dead_link', 'archived'].includes(raw)) return 'closed'
  if (raw === 'rolling' || src.rolling_deadline === true) return 'rolling'
  if (deadlineISO && daysLeft !== null && daysLeft < 0) return 'closed'
  if (raw === 'open' || raw === 'active' || raw === 'expiring_soon') return 'open'
  if (raw === 'upcoming') return 'upcoming'
  if (raw === 'unclear') return 'unclear'
  if (deadlineISO) return 'open'
  if (src.application_readiness === 'application_not_yet_open') return 'upcoming'
  return 'unclear'
}

function computeVerification(src) {
  const score = num(src.confidence_score ?? src.confidence)
  const vs = String(src.verification_status || '').toLowerCase()
  if (vs.includes('officially') || (score >= 90 && !vs.includes('needs_review'))) {
    return { level: 'verified', label: 'Officially Verified', tone: 'green' }
  }
  if (vs.includes('partial') || score >= 75) {
    return { level: 'partial', label: 'Partially Verified', tone: 'amber' }
  }
  return { level: 'needs_review', label: 'Needs Review', tone: 'gray' }
}

/**
 * Build a trustworthy CTA model. Primary CTA prefers the verified
 * application_url; falls back to official_source_url; never points at
 * third-party aggregators.
 */
function buildCTA(src, status, _deadlineISO, _daysLeft) {
  const appUrl = pickUrl(src.application_url, src.apply_url)
  const srcUrl = pickUrl(src.official_source_url, src.organizer_website, src.source_url)
  const readiness = String(src.application_readiness || '').toLowerCase()

  if (status === 'closed') {
    return {
      label: 'Deadline Passed',
      kind: 'closed',
      url: srcUrl || appUrl,
      external: true,
      hint: 'This application round has closed. Check the official source for future cycles.',
    }
  }
  if (status === 'upcoming' || readiness === 'application_not_yet_open') {
    return {
      label: 'Opening Soon',
      kind: 'upcoming',
      url: srcUrl || appUrl,
      external: true,
      hint: src.official_deadline_note || 'Applications are not open yet. Bookmark and check the official page.',
    }
  }
  if (status === 'rolling' || src.rolling_deadline === true) {
    return {
      label: 'Rolling Applications',
      kind: 'rolling',
      url: appUrl || srcUrl,
      external: true,
      hint: 'No fixed deadline — applications are reviewed on a rolling basis.',
    }
  }
  if (status === 'open' && appUrl) {
    return {
      label: 'Apply Now',
      kind: 'apply',
      url: appUrl,
      external: true,
      hint: 'Leaves Nexora to the official application page.',
    }
  }
  if (srcUrl) {
    return {
      label: 'Visit Official Source',
      kind: 'official',
      url: srcUrl,
      external: true,
      hint: 'Official program page — verify details before applying.',
    }
  }
  return {
    label: 'Check Official Source',
    kind: 'official',
    url: null,
    external: true,
    hint: 'Application details were not published. Confirm on the official site.',
  }
}

function buildBadges({ status, fundingType, verification, mode, daysLeft, deadlineISO, aiMatchScore }) {
  const badges = []

  badges.push({ key: 'status', label: statusLabel(status), tone: statusTone(status) })

  if (verification) {
    badges.push({ key: 'verification', label: verification.label, tone: verification.tone })
  }

  if (fundingType) {
    const f = fundingLabel(fundingType)
    badges.push({
      key: 'funding',
      label: f,
      tone: fundingType === 'fully_funded' ? 'green'
        : fundingType === 'non_funded' ? 'gray'
        : 'amber',
    })
  }

  if (deadlineISO && daysLeft !== null && status !== 'closed' && status !== 'rolling') {
    const tone = daysLeft <= 7 ? 'red' : daysLeft <= 30 ? 'amber' : 'green'
    badges.push({
      key: 'deadline',
      label: daysLeft < 0 ? 'Deadline Passed' : daysLeft === 0 ? 'Closes Today' : daysLeft === 1 ? '1 Day Left' : `${daysLeft} Days Left`,
      tone,
    })
  }

  if (mode && mode !== 'unknown') {
    badges.push({ key: 'mode', label: modeLabel(mode), tone: 'slate' })
  }

  if (aiMatchScore && aiMatchScore > 0) {
    badges.push({ key: 'ai_match', label: `${aiMatchScore}% Match`, tone: 'indigo' })
  }

  return badges
}

/* ──────────────────────────────────────────────────────────────────────────
 * Tiny utilities (kept local — project uses plain JS, no lodash)
 * ────────────────────────────────────────────────────────────────────────── */

function pick(...values) {
  for (const v of values) {
    if (v !== undefined && v !== null && String(v).trim() !== '') return String(v).trim()
  }
  return null
}

function pickUrl(...values) {
  for (const v of values) {
    if (typeof v === 'string' && /^https?:\/\//i.test(v.trim())) return v.trim()
  }
  return null
}

function pickISO(...values) {
  for (const v of values) {
    if (!v) continue
    const s = String(v)
    const m = s.match(/^(\d{4}-\d{2}-\d{2})/)
    if (m) return m[1]
    const d = new Date(s)
    if (!Number.isNaN(d.getTime()) && /^\d/.test(s)) {
      return d.toISOString().slice(0, 10)
    }
  }
  return null
}

function toArray(...groups) {
  const out = []
  for (const g of groups) {
    if (g == null) continue
    if (Array.isArray(g)) {
      for (const item of g) {
        if (item !== undefined && item !== null && String(item).trim()) out.push(String(item).trim())
      }
    } else if (typeof g === 'string') {
      for (const part of g.split(/[,;\n|]+/)) {
        if (part.trim()) out.push(part.trim())
      }
    }
  }
  return [...new Set(out)]
}

function num(v) {
  const n = Number(v)
  return Number.isFinite(n) ? n : null
}

function boolish(v, fallback = null) {
  if (v === true || v === false) return v
  if (v === undefined || v === null || v === '') return fallback
  return String(v).toLowerCase() === 'true'
}

function computeDaysLeft(iso) {
  if (!iso) return null
  const deadline = new Date(`${iso}T23:59:59`)
  const now = new Date()
  const ms = deadline - now
  return Math.ceil(ms / 86_400_000)
}

export function formatHumanDate(iso) {
  if (!iso) return null
  const d = new Date(`${iso}T12:00:00`)
  if (Number.isNaN(d.getTime())) return null
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export function slugify(text) {
  if (!text) return 'opportunity'
  return String(text)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 120) || 'opportunity'
}

/* ──────────────────────────────────────────────────────────────────────────
 * Labels
 * ────────────────────────────────────────────────────────────────────────── */

export function typeLabel(type) {
  const map = {
    scholarship: 'Scholarship',
    fellowship: 'Fellowship',
    grant: 'Grant',
    accelerator: 'Accelerator',
    incubator: 'Incubator',
    competition: 'Competition',
    hackathon: 'Hackathon',
    conference: 'Conference',
    research_program: 'Research Program',
    bootcamp: 'Bootcamp',
    workshop: 'Workshop',
    exchange_program: 'Exchange Program',
    global_youth_program: 'Global Youth Program',
    other: 'Opportunity',
  }
  return map[type] ?? map.other
}

export function modeLabel(mode) {
  const map = { in_person: 'In Person', 'in-person': 'In Person', inperson: 'In Person', in_person_onsite: 'In Person', remote: 'Remote', online: 'Online', hybrid: 'Hybrid', unknown: 'Mode Unknown' }
  return map[mode] ?? map.unknown
}

export function statusLabel(status) {
  const map = {
    open: 'Open Now',
    upcoming: 'Opening Soon',
    rolling: 'Rolling Applications',
    closed: 'Closed',
    unclear: 'Deadline Unclear',
  }
  return map[status] ?? map.unclear
}

function statusTone(status) {
  const map = { open: 'green', upcoming: 'amber', rolling: 'green', closed: 'gray', unclear: 'gray' }
  return map[status] ?? 'gray'
}

export function fundingLabel(fundingType) {
  const map = {
    fully_funded: 'Fully Funded',
    partially_funded: 'Partially Funded',
    stipend: 'Stipend',
    tuition_covered: 'Tuition Covered',
    grant_support: 'Grant Support',
    non_funded: 'Not Funded',
    unknown: 'Funding Unclear',
  }
  return map[fundingType] ?? 'Funding Unclear'
}

/** Tone → Tailwind classes for badges. Kept here so all components share it. */
export const BADGE_TONES = {
  green: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  amber: 'bg-amber-50 text-amber-700 border-amber-200',
  red: 'bg-red-50 text-red-600 border-red-200',
  gray: 'bg-slate-100 text-slate-600 border-slate-200',
  slate: 'bg-slate-50 text-slate-600 border-slate-200',
  indigo: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  blue: 'bg-blue-50 text-blue-700 border-blue-200',
}
