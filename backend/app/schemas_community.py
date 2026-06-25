from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from uuid import UUID


# ============================================================================
# SUCCESS STORIES SCHEMAS
# ============================================================================

class SuccessStoryBase(BaseModel):
    title: str = Field(..., min_length=5, max_length=255)
    story_content: str = Field(..., min_length=20)
    year_awarded: Optional[int] = None
    application_timeline: Optional[Dict[str, Any]] = None
    tips: Optional[List[str]] = None


class SuccessStoryCreate(SuccessStoryBase):
    opportunity_id: UUID
    user_id: int


class SuccessStoryUpdate(BaseModel):
    title: Optional[str] = None
    story_content: Optional[str] = None
    year_awarded: Optional[int] = None
    application_timeline: Optional[Dict[str, Any]] = None
    tips: Optional[List[str]] = None


class SuccessStoryResponse(SuccessStoryBase):
    id: UUID
    opportunity_id: UUID
    user_id: int
    upvotes: int
    views: int
    is_verified: str
    is_featured: str
    created_at: datetime
    updated_at: datetime
    
    # Nested data (optional, populated on demand)
    user_name: Optional[str] = None
    user_university: Optional[str] = None
    opportunity_title: Optional[str] = None

    class Config:
        from_attributes = True


# ============================================================================
# Q&A SCHEMAS
# ============================================================================

class QuestionBase(BaseModel):
    question_text: str = Field(..., min_length=10)
    tags: Optional[List[str]] = None


class QuestionCreate(QuestionBase):
    opportunity_id: UUID
    user_id: int


class QuestionUpdate(BaseModel):
    question_text: Optional[str] = None
    tags: Optional[List[str]] = None


class QuestionResponse(QuestionBase):
    id: UUID
    opportunity_id: UUID
    user_id: int
    upvotes: int
    views: int
    is_answered: str
    created_at: datetime
    
    # Nested data
    user_name: Optional[str] = None
    answer_count: Optional[int] = 0

    class Config:
        from_attributes = True


class AnswerBase(BaseModel):
    answer_text: str = Field(..., min_length=10)


class AnswerCreate(AnswerBase):
    question_id: UUID
    user_id: int


class AnswerUpdate(BaseModel):
    answer_text: Optional[str] = None


class AnswerResponse(AnswerBase):
    id: UUID
    question_id: UUID
    user_id: int
    upvotes: int
    is_accepted: str
    is_verified_expert: str
    created_at: datetime
    
    # Nested data
    user_name: Optional[str] = None
    user_reputation: Optional[int] = 0

    class Config:
        from_attributes = True


# ============================================================================
# MENTORSHIP SCHEMAS
# ============================================================================

class MentorProfileBase(BaseModel):
    bio: Optional[str] = None
    expertise_areas: Optional[List[str]] = None
    successful_applications: Optional[List[str]] = None
    availability: str = "Available"


class MentorProfileCreate(MentorProfileBase):
    user_id: int


class MentorProfileUpdate(BaseModel):
    bio: Optional[str] = None
    expertise_areas: Optional[List[str]] = None
    successful_applications: Optional[List[str]] = None
    availability: Optional[str] = None


class MentorProfileResponse(MentorProfileBase):
    id: UUID
    user_id: int
    rating: int  # Rating * 10 (e.g., 49 = 4.9)
    total_sessions: int
    created_at: datetime
    
    # Nested data
    user_name: Optional[str] = None
    user_university: Optional[str] = None
    user_academic_status: Optional[str] = None

    class Config:
        from_attributes = True


class MentorshipRequestBase(BaseModel):
    message: Optional[str] = None
    opportunity_id: Optional[UUID] = None


class MentorshipRequestCreate(MentorshipRequestBase):
    mentee_id: int
    mentor_id: UUID


class MentorshipRequestUpdate(BaseModel):
    status: Optional[str] = None
    session_notes: Optional[str] = None
    rating: Optional[int] = Field(None, ge=1, le=5)


class MentorshipRequestResponse(MentorshipRequestBase):
    id: UUID
    mentee_id: int
    mentor_id: UUID
    status: str
    session_notes: Optional[str] = None
    rating: Optional[int] = None
    created_at: datetime
    completed_at: Optional[datetime] = None
    
    # Nested data
    mentee_name: Optional[str] = None
    mentor_name: Optional[str] = None
    opportunity_title: Optional[str] = None

    class Config:
        from_attributes = True


# ============================================================================
# APPLICATION TIPS SCHEMAS
# ============================================================================

class ApplicationTipBase(BaseModel):
    tip_text: str = Field(..., min_length=10)
    category_type: str = "General"
    tip_category: Optional[str] = None


class ApplicationTipCreate(ApplicationTipBase):
    opportunity_id: Optional[UUID] = None
    author_id: int


class ApplicationTipUpdate(BaseModel):
    tip_text: Optional[str] = None
    category_type: Optional[str] = None
    tip_category: Optional[str] = None


class ApplicationTipResponse(ApplicationTipBase):
    id: UUID
    opportunity_id: Optional[UUID] = None
    author_id: Optional[int] = None
    upvotes: int
    is_featured: str
    created_at: datetime
    
    # Nested data
    author_name: Optional[str] = None
    opportunity_title: Optional[str] = None

    class Config:
        from_attributes = True


# ============================================================================
# VOTING SCHEMAS
# ============================================================================

class VoteCreate(BaseModel):
    user_id: int
    votable_type: str  # SuccessStory, Question, Answer, Tip
    votable_id: UUID


class VoteResponse(BaseModel):
    id: UUID
    user_id: int
    votable_type: str
    votable_id: UUID
    created_at: datetime

    class Config:
        from_attributes = True


# ============================================================================
# COMBINED/LIST RESPONSE SCHEMAS
# ============================================================================

class QuestionWithAnswers(QuestionResponse):
    answers: List[AnswerResponse] = []


class CommunityStats(BaseModel):
    total_stories: int = 0
    total_questions: int = 0
    total_answers: int = 0
    total_mentors: int = 0
    total_tips: int = 0
    active_users: int = 0
