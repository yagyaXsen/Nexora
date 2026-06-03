from pydantic import BaseModel, HttpUrl, Field
from typing import List, Optional
from datetime import date, datetime
from uuid import UUID

# Opportunity Schemas
class OpportunityBase(BaseModel):
    title: str = Field(..., max_length=255)
    organization: str = Field(..., max_length=255)
    description: str
    url: str = Field(..., max_length=512)
    funding: Optional[str] = Field(None, max_length=100)
    deadline: Optional[date] = None
    country: Optional[str] = Field("Global", max_length=100)
    category: Optional[str] = Field("Other", max_length=50)
    tags: List[str] = Field(default_factory=list)
    eligibility: Optional[str] = None

class OpportunityCreate(OpportunityBase):
    pass

class OpportunityUpdate(BaseModel):
    title: Optional[str] = None
    organization: Optional[str] = None
    description: Optional[str] = None
    url: Optional[str] = None
    funding: Optional[str] = None
    deadline: Optional[date] = None
    country: Optional[str] = None
    category: Optional[str] = None
    tags: Optional[List[str]] = None
    eligibility: Optional[str] = None

class Opportunity(OpportunityBase):
    id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class OpportunityPaginatedResponse(BaseModel):
    total: int
    page: int
    limit: int
    opportunities: List[Opportunity]


# ScrapedSource Schemas
class ScrapedSourceBase(BaseModel):
    name: str = Field(..., max_length=100)
    url: str = Field(..., max_length=512)
    scraper_type: str = Field("playwright_html", max_length=50)

class ScrapedSourceCreate(ScrapedSourceBase):
    pass

class ScrapedSource(ScrapedSourceBase):
    id: int
    last_scraped: Optional[datetime] = None
    status: str

    class Config:
        from_attributes = True


# Application Schemas
class ApplicationBase(BaseModel):
    opportunity_id: UUID
    status: str = Field("Saved", max_length=50)  # Saved, Planning, Applied, Interview, Accepted, Rejected
    notes: Optional[str] = None
    priority: str = Field("Medium", max_length=20)  # Low, Medium, High
    applied_date: Optional[date] = None

class ApplicationCreate(ApplicationBase):
    pass

class ApplicationUpdate(BaseModel):
    status: Optional[str] = None
    notes: Optional[str] = None
    priority: Optional[str] = None
    applied_date: Optional[date] = None

# Custom Application response that embeds the Opportunity
class ApplicationResponse(BaseModel):
    id: UUID
    opportunity_id: UUID
    status: str
    notes: Optional[str]
    priority: str
    applied_date: Optional[date]
    created_at: datetime
    updated_at: datetime
    opportunity: Opportunity

    class Config:
        from_attributes = True


# AI Search Schemas
class SearchQuery(BaseModel):
    query: str


# Dashboard Stats Schemas
class DashboardStats(BaseModel):
    total_opportunities: int
    saved_applications: int
    applied_applications: int
    accepted_applications: int
    upcoming_deadlines_count: int
    category_distribution: dict
    pipeline_stages: dict


# UserProfile Schemas
class UserProfileBase(BaseModel):
    name: str
    email: str
    bio: Optional[str] = None
    academic_status: Optional[str] = None
    university: Optional[str] = None
    verified_academic_id: Optional[str] = None
    research_interests: List[str] = Field(default_factory=list)
    base_city: Optional[str] = None
    willing_to_relocate: str = "Yes"
    preferred_regions: List[str] = Field(default_factory=list)

class UserProfileCreate(UserProfileBase):
    pass

class UserProfileUpdate(UserProfileBase):
    pass

class UserProfile(UserProfileBase):
    id: int

    class Config:
        from_attributes = True


class OpportunityWithMatch(Opportunity):
    match_score: int
