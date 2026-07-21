from datetime import datetime
from typing import List, Optional, Any, Dict
from pydantic import BaseModel, Field, HttpUrl
from app.models import SourceType, OpportunityCategory, OpportunityStatus

class OpportunityExtract(BaseModel):
    category: OpportunityCategory = Field(description="The enum category of the opportunity")
    title: str = Field(description="Clean, concise title of the opportunity")
    organizer: str = Field(description="Organization, institution, or sponsor providing the opportunity")
    deadline: Optional[datetime] = Field(default=None, description="ISO format deadline date if available")
    apply_url: str = Field(description="Direct web URL to apply or official details page")
    country: Optional[str] = Field(default=None, description="Eligible country or region, e.g. Global, USA, India")
    funding_amount: Optional[str] = Field(default=None, description="Grant/Scholarship value or prize pool e.g. $10,000")
    eligibility_text: Optional[str] = Field(default=None, description="Summary of who can apply")
    description: str = Field(description="Detailed summary of the opportunity")
    tags: List[str] = Field(default_factory=list, description="Keywords or topic tags")
    confidence: float = Field(ge=0.0, le=1.0, description="AI confidence score from 0.0 to 1.0")

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
    confidence: float
    needs_review: bool
    dedupe_key: str
    source_id: Optional[int] = None
    raw_document_id: Optional[int] = None
    created_at: datetime
    updated_at: datetime

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
    total: int
    page: int
    page_size: int
    items: List[OpportunityRead]

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
    error_log: Optional[List[Any]] = None

    class Config:
        from_attributes = True
