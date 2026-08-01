/**
 * TypeScript contract for the normalized frontend Opportunity model.
 *
 * The app itself is plain JSX, but this ambient declaration documents the
 * exact shape produced by `lib/opportunityNormalize.js` so the types are
 * available to any tooling (IDE intellisense, future TS migration, and the
 * backend's PublishedOpportunity Pydantic model, which mirrors it).
 */

export interface OpportunityBadge {
  key: string
  label: string
  tone: 'green' | 'amber' | 'red' | 'gray' | 'slate' | 'indigo' | 'blue'
}

export interface OpportunityCTA {
  label: string
  kind: 'apply' | 'official' | 'upcoming' | 'rolling' | 'closed'
  url: string | null
  external: boolean
  hint: string
}

export interface OpportunityTrust {
  level: 'verified' | 'partial' | 'needs_review'
  label: string
  tone: string
  confidenceScore: number | null
  sourceType: string | null
  discoveredVia: string | null
  verificationNotes: string | null
  verificationStatus: string | null
  lastVerifiedAt: string | null
}

export interface NormalizedOpportunity {
  // identity
  id: number | null
  slug: string
  title: string
  provider: string
  type: string
  typeLabel: string
  mode: string
  modeLabel: string
  status: 'open' | 'upcoming' | 'rolling' | 'closed' | 'unclear'
  statusLabel: string

  // links
  applicationUrl: string | null
  officialSourceUrl: string | null
  primaryUrl: string | null

  // geo & dates
  countryOrRegion: string | null
  deadlineISO: string | null
  deadlineDisplay: string | null
  daysLeft: number | null
  applicationOpens: string | null
  applicationCloses: string | null
  rollingDeadline: boolean | null
  startDate: string | null
  endDate: string | null

  // text content
  summary: string | null
  eligibilitySummary: string | null
  benefitsSummary: string | null
  targetAudience: string | null
  duration: string | null
  applicationFee: string | null
  hostInstitution: string | null
  organizerWebsite: string | null
  contactEmail: string | null
  contactPage: string | null
  faqUrl: string | null
  termsUrl: string | null
  featuredImage: string | null

  // structured
  tags: string[]
  disciplines: string[]
  studyLevel: string[]
  eligibleCountries: string[]
  requiredDocuments: string[]
  applicationSteps: string[]
  relatedLinks: string[]

  // funding
  fundingType: string | null
  fundingLabel: string

  // requirements
  citizenshipRequirements: string | null
  ageRequirements: string | null
  languageRequirements: string | null
  academicRequirements: string | null
  eligibilityVerdict: string | null

  // AI match
  aiMatchScore: number | null
  aiMatchReasons: string[]
  recommendationReason: string | null

  // apply guidance
  applyCtaLabel: string | null
  applyCtaDestinationType: string | null
  applyCtaNotes: string | null
  applicationReadiness: string | null
  applicationDifficulty: string | null
  timeNeededToApply: string | null
  officialDeadlineNote: string | null
  beforeYouApplyChecklist: string[]
  applyWarning: string | null
  externalApplication: boolean | null
  requiresAccountCreation: boolean | null
  whoShouldApply: string | null
  whoShouldNotApply: string | null
  prepTips: string[]
  missingOrUnclearInfo: string[]
  whyThisIsTrustworthy: string | null

  // SEO
  seoTitle: string | null
  seoDescription: string | null

  // computed bundles
  badges: OpportunityBadge[]
  cta: OpportunityCTA
  trust: OpportunityTrust
}

/** Mirror of the backend Pydantic PublishedOpportunity (input shape). */
export interface RawPublishedOpportunity {
  slug?: string
  title?: string
  provider_organization?: string | null
  opportunity_type?: string | null
  official_source_url?: string | null
  application_url?: string | null
  country_or_region?: string | null
  mode?: string | null
  eligibility_summary?: string | null
  benefits_summary?: string | null
  deadline?: string | null
  status?: string | null
  target_audience?: string | null
  source_type?: string | null
  discovered_via?: string | null
  confidence_score?: number | null
  short_original_summary?: string | null
  verification_notes?: string | null
  funding_type?: string | null
  duration?: string | null
  disciplines?: string[]
  study_level?: string[]
  required_documents?: string[]
  application_steps?: string[]
  tags?: string[]
  ai_match_score?: number | null
  ai_match_reasons?: string[]
  last_verified_at?: string | null
  verification_status?: string | null
  [key: string]: unknown
}
