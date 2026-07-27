from datetime import datetime
from typing import List, Optional, Any, Dict
from pydantic import BaseModel, EmailStr, Field
from app.models import ApplicationStatus, SourceType, OpportunityCategory, OpportunityStatus

# ──────────────────────────────────────────────
# Auth Schemas
# ──────────────────────────────────────────────

class UserRegister(BaseModel):
    name: str
    email: EmailStr
    password: str

class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserUpdate(BaseModel):
    name: Optional[str] = None
    current_password: Optional[str] = None
    new_password: Optional[str] = None

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class ResetPasswordRequest(BaseModel):
    token: str = Field(min_length=1, max_length=512)
    password: str = Field(min_length=6, max_length=255)

class GoogleAuthRequest(BaseModel):
    id_token: Optional[str] = None
    credential: Optional[str] = None
    access_token: Optional[str] = None
    email: Optional[EmailStr] = None
    name: Optional[str] = None
    avatar: Optional[str] = None
    google_id: Optional[str] = None
    email_verified: Optional[bool] = True

class ProfileRead(BaseModel):
    id: int
    user_id: int
    academic_degree: str
    institution: str
    field_of_study: str
    citizenship: str
    residence: str
    skills: List[str] = []
    interests: List[str] = []
    target_countries: List[str] = []
    bio: Optional[str] = None
    vector_confidence: float = 98.4

    class Config:
        from_attributes = True

class ProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    academic_degree: Optional[str] = None
    institution: Optional[str] = None
    field_of_study: Optional[str] = None
    citizenship: Optional[str] = None
    residence: Optional[str] = None
    skills: Optional[List[str]] = None
    interests: Optional[List[str]] = None
    target_countries: Optional[List[str]] = None
    bio: Optional[str] = None

class UserRead(BaseModel):
    id: int
    google_id: Optional[str] = None
    name: str
    email: EmailStr
    avatar: Optional[str] = None
    email_verified: bool = True
    role: str
    last_login: Optional[datetime] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    profile: Optional[ProfileRead] = None

    class Config:
        from_attributes = True

# ──────────────────────────────────────────────
# Organization Schemas
# ──────────────────────────────────────────────

class OrganizationRead(BaseModel):
    id: int
    name: str
    slug: str
    category: str
    headquarters: str
    website: str
    description: str
    ai_summary: Optional[str] = None
    cover_image: Optional[str] = None
    verified: bool
    follower_count: int
    created_at: datetime

    class Config:
        from_attributes = True

# ──────────────────────────────────────────────
# Opportunity Schemas
# ──────────────────────────────────────────────

class OpportunityExtract(BaseModel):
    category: OpportunityCategory = Field(description="The enum category of the opportunity")
    title: str = Field(description="Clean, concise title of the opportunity")
    organizer: str = Field(description="Organization, institution, or sponsor providing the opportunity")
    deadline: Optional[datetime] = Field(default=None, description="ISO format deadline date if available")
    apply_url: str = Field(description="Direct web URL to apply or official details page")
    country: Optional[str] = Field(default=None, description="Eligible country or region")
    funding_amount: Optional[str] = Field(default=None, description="Grant/Scholarship value or prize pool")
    eligibility_text: Optional[str] = Field(default=None, description="Summary of who can apply")
    description: str = Field(description="Detailed summary of the opportunity")
    tags: List[str] = Field(default_factory=list, description="Keywords or topic tags")
    confidence: float = Field(ge=0.0, le=1.0, description="AI confidence score from 0.0 to 1.0")

class OpportunityRead(BaseModel):
    id: int
    title: str
    slug: str
    description: str
    category: str
    organizer: str
    deadline: Optional[datetime] = None
    apply_url: str
    country: Optional[str] = None
    funding_amount: Optional[str] = None
    eligibility_text: Optional[str] = None
    tags: Optional[List[str]] = None
    status: str
    click_count: int = 0
    confidence: float
    needs_review: bool
    created_at: datetime

    class Config:
        from_attributes = True

class OpportunityUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    category: Optional[OpportunityCategory] = None
    organizer: Optional[str] = None
    deadline: Optional[datetime] = None
    apply_url: Optional[str] = None
    country: Optional[str] = None
    funding_amount: Optional[str] = None
    eligibility_text: Optional[str] = None
    tags: Optional[List[str]] = None
    status: Optional[OpportunityStatus] = None
    confidence: Optional[float] = None
    needs_review: Optional[bool] = None

class OpportunityStats(BaseModel):
    total_opportunities: int
    active_count: int
    expiring_soon_count: int
    expired_count: int
    dead_link_count: int
    needs_review_count: int
    categories_breakdown: Dict[str, int]

class PaginatedOpportunities(BaseModel):
    items: List[OpportunityRead]
    total: int
    page: int
    page_size: int
    pages: int = 1

# ──────────────────────────────────────────────
# Application / Tracker Schemas
# ──────────────────────────────────────────────

class ApplicationCreate(BaseModel):
    opportunity_id: int
    status: ApplicationStatus = ApplicationStatus.SAVED
    notes: Optional[str] = None

class ApplicationRead(BaseModel):
    id: int
    user_id: int
    opportunity_id: int
    status: str
    notes: Optional[str] = None
    applied_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    opportunity: OpportunityRead

    class Config:
        from_attributes = True

class ApplicationUpdate(BaseModel):
    status: Optional[ApplicationStatus] = None
    notes: Optional[str] = None

class ApplyRequest(BaseModel):
    opportunity_id: int

class ApplyResponse(BaseModel):
    """Returned by POST /api/applications/apply. `apply_url` is the organizer's
    own URL — the caller navigates there itself, so recording the apply never
    blocks the outbound trip."""
    application_id: int
    opportunity_id: int
    status: str
    applied_at: Optional[datetime] = None
    apply_url: str
    already_applied: bool = False

# ──────────────────────────────────────────────
# Notification Schemas
# ──────────────────────────────────────────────

class NotificationRead(BaseModel):
    id: int
    user_id: int
    title: str
    message: str
    category: str
    priority: str
    is_read: bool
    is_pinned: bool
    opp_id: Optional[int] = None
    organizer: str
    created_at: datetime

    class Config:
        from_attributes = True

# ──────────────────────────────────────────────
# AI Search Schemas
# ──────────────────────────────────────────────

class SearchRequest(BaseModel):
    query: str

class SearchIntent(BaseModel):
    category: Optional[str] = None
    country: Optional[str] = None
    keywords: List[str] = []
    tags: List[str] = []
    funding_required: bool = False

class SearchResponse(BaseModel):
    query: str
    intent: SearchIntent
    degraded: bool = False
    total: int
    items: List[OpportunityRead]

# ──────────────────────────────────────────────
# Source Schemas
# ──────────────────────────────────────────────

class SourceCreate(BaseModel):
    name: str
    type: SourceType = SourceType.RSS
    url: str
    config: Optional[Dict[str, Any]] = None
    enabled: bool = True
    schedule: str = "daily"

class SourceUpdate(BaseModel):
    name: Optional[str] = None
    type: Optional[SourceType] = None
    url: Optional[str] = None
    config: Optional[Dict[str, Any]] = None
    enabled: Optional[bool] = None
    schedule: Optional[str] = None

class SourceRead(BaseModel):
    id: int
    name: str
    type: str
    url: str
    config: Optional[Dict[str, Any]] = None
    enabled: bool
    schedule: str
    last_run_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# ──────────────────────────────────────────────
# Dashboard Summary Schema
# ──────────────────────────────────────────────

class DashboardSummary(BaseModel):
    ai_matched_count: int
    saved_count: int
    applied_count: int
    upcoming_deadlines_count: int
    total_indexed: int
    new_today: int

class PipelineRunRead(BaseModel):
    id: int
    source_id: int
    started_at: datetime
    finished_at: Optional[datetime] = None
    status: str
    fetched_count: int
    new_count: int
    updated_count: int
    duplicate_count: int
    failed_count: int
    error_log: Optional[Any] = None

    class Config:
        from_attributes = True
