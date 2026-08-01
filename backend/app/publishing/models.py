from typing import List, Optional
from pydantic import BaseModel


class PublishedOpportunity(BaseModel):
    """Frontend-safe, fully-normalized opportunity as served to the UI.

    Every field is optional-safe: absent/unknown values collapse to None or []
    so the client can render graceful empty states without crashing.
    """
    slug: str
    title: str
    provider_organization: Optional[str] = None
    opportunity_type: Optional[str] = None
    official_source_url: Optional[str] = None
    application_url: Optional[str] = None
    country_or_region: Optional[str] = None
    mode: Optional[str] = None
    eligibility_summary: Optional[str] = None
    benefits_summary: Optional[str] = None
    deadline: Optional[str] = None
    status: str = "unclear"
    target_audience: Optional[str] = None
    source_type: Optional[str] = None
    discovered_via: Optional[str] = None
    confidence_score: Optional[int] = None
    short_original_summary: Optional[str] = None
    verification_notes: Optional[str] = None
    funding_type: Optional[str] = None
    application_fee: Optional[str] = None
    duration: Optional[str] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    application_opens: Optional[str] = None
    application_closes: Optional[str] = None
    rolling_deadline: Optional[bool] = None
    disciplines: List[str] = []
    study_level: List[str] = []
    citizenship_requirements: Optional[str] = None
    age_requirements: Optional[str] = None
    language_requirements: Optional[str] = None
    academic_requirements: Optional[str] = None
    required_documents: List[str] = []
    application_steps: List[str] = []
    program_benefits: Optional[str] = None
    host_institution: Optional[str] = None
    organizer_website: Optional[str] = None
    contact_email: Optional[str] = None
    contact_page: Optional[str] = None
    tags: List[str] = []
    faq_url: Optional[str] = None
    terms_url: Optional[str] = None
    related_links: List[str] = []
    ai_match_score: Optional[int] = None
    ai_match_reasons: List[str] = []
    eligibility_verdict: Optional[str] = None
    deadline_urgency: Optional[str] = None
    badge_labels: List[str] = []
    canonical_slug: Optional[str] = None
    featured_image: Optional[str] = None
    seo_title: Optional[str] = None
    seo_description: Optional[str] = None
    last_verified_at: Optional[str] = None
    verification_status: Optional[str] = None
    # apply-page enrichment fields
    apply_cta_label: Optional[str] = None
    apply_cta_destination_type: Optional[str] = None
    apply_cta_notes: Optional[str] = None
    application_readiness: Optional[str] = None
    application_difficulty: Optional[str] = None
    time_needed_to_apply: Optional[str] = None
    official_deadline_note: Optional[str] = None
    before_you_apply_checklist: List[str] = []
    why_this_is_trustworthy: Optional[str] = None
    missing_or_unclear_info: List[str] = []
    apply_warning: Optional[str] = None
    external_application: bool = True
    requires_account_creation: Optional[bool] = None
    recommendation_reason: Optional[str] = None
    who_should_apply: Optional[str] = None
    who_should_not_apply: Optional[str] = None
    prep_tips: List[str] = []


class PublishedListResponse(BaseModel):
    items: List[PublishedOpportunity]
    total: int
    page: int
    page_size: int
    pages: int = 1
    categories: dict = {}


class PublishedStats(BaseModel):
    total: int
    by_type: dict
    by_status: dict
    fully_funded: int
    verified_count: int
    needs_review_count: int
    last_updated: Optional[str] = None


class PublishedRejection(BaseModel):
    input_title: str = ""
    input_provider: str = ""
    input_url: Optional[str] = None
    rejection_reason: str
    duplicate_of: str = ""
    notes: str = ""
