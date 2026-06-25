import uuid
from sqlalchemy import Column, String, Text, Date, DateTime, Integer, ForeignKey, JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from .database import Base

class Opportunity(Base):
    __tablename__ = "opportunities"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title = Column(String(255), nullable=False)
    organization = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    url = Column(String(512), unique=True, index=True, nullable=False)
    funding = Column(String(100), nullable=True)
    deadline = Column(Date, nullable=True)
    country = Column(String(100), index=True, nullable=True)
    category = Column(String(50), index=True, nullable=True)  # e.g., Fellowship, Grant, Scholarship, Accelerator, Hackathon
    tags = Column(JSON, nullable=True)  # e.g., ["AI", "Research", "Student"]
    eligibility = Column(Text, nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationship to applications
    applications = relationship(
        "Application", 
        back_populates="opportunity", 
        cascade="all, delete-orphan"
    )


class ScrapedSource(Base):
    __tablename__ = "scraped_sources"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    url = Column(String(512), unique=True, index=True, nullable=False)
    scraper_type = Column(String(50), default="playwright_html")  # playwright_html, youth_op, etc.
    last_scraped = Column(DateTime(timezone=True), nullable=True)
    status = Column(String(20), default="Pending")  # Success, Failed, Pending


class Application(Base):
    __tablename__ = "applications"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    opportunity_id = Column(UUID(as_uuid=True), ForeignKey("opportunities.id", ondelete="CASCADE"), nullable=False)
    status = Column(String(50), default="Saved")  # Saved, Planning, Applied, Interview, Accepted, Rejected
    notes = Column(Text, nullable=True)
    priority = Column(String(20), default="Medium")  # Low, Medium, High
    applied_date = Column(Date, nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationship back to Opportunity
    opportunity = relationship("Opportunity", back_populates="applications")


class User(Base):
    """Authenticated account. Identity (email + password) is kept separate
    from the richer UserProfile (interests, regions, reputation) so auth and
    profile concerns stay decoupled."""
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    full_name = Column(String(255), nullable=True)
    password_hash = Column(String(255), nullable=False)
    is_active = Column(String(10), default="Yes")  # Yes/No

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Optional link to the user's profile (1:1). Nullable so the seeded
    # singleton profile and pre-auth data keep working.
    profile = relationship("UserProfile", back_populates="user", uselist=False)


class UserProfile(Base):
    __tablename__ = "user_profiles"

    id = Column(Integer, primary_key=True, index=True)
    # Nullable FK → users.id. Existing/seeded profiles have NULL here.
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=True, unique=True)
    name = Column(String(255), nullable=False)
    email = Column(String(255), nullable=False)
    bio = Column(Text, nullable=True)
    academic_status = Column(String(100), nullable=True)
    university = Column(String(255), nullable=True)
    verified_academic_id = Column(String(255), nullable=True)
    research_interests = Column(JSON, nullable=True)  # JSON list of strings
    base_city = Column(String(255), nullable=True)
    willing_to_relocate = Column(String(10), default="Yes")
    preferred_regions = Column(JSON, nullable=True)  # JSON list of strings
    reminder_preferences = Column(JSON, nullable=True)  # JSON object for reminder settings
    
    # Community reputation & engagement
    reputation_score = Column(Integer, default=0)
    badges = Column(JSON, nullable=True)  # List of earned badge IDs

    # Link back to the authenticated account (if any).
    user = relationship("User", back_populates="profile")


# ============================================================================
# COMMUNITY FEATURES MODELS
# ============================================================================

class SuccessStory(Base):
    __tablename__ = "success_stories"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    opportunity_id = Column(UUID(as_uuid=True), ForeignKey("opportunities.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(Integer, ForeignKey("user_profiles.id", ondelete="CASCADE"), nullable=False)
    
    title = Column(String(255), nullable=False)
    story_content = Column(Text, nullable=False)
    year_awarded = Column(Integer, nullable=True)
    
    # Application process details
    application_timeline = Column(JSON, nullable=True)  # e.g., {"applied": "2024-01", "interviewed": "2024-03", "accepted": "2024-04"}
    tips = Column(JSON, nullable=True)  # List of tip strings
    
    # Engagement metrics
    upvotes = Column(Integer, default=0)
    views = Column(Integer, default=0)
    is_verified = Column(String(10), default="No")  # Yes/No - admin verified
    is_featured = Column(String(10), default="No")
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    opportunity = relationship("Opportunity")
    user = relationship("UserProfile")


class OpportunityQuestion(Base):
    __tablename__ = "opportunity_questions"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    opportunity_id = Column(UUID(as_uuid=True), ForeignKey("opportunities.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(Integer, ForeignKey("user_profiles.id", ondelete="CASCADE"), nullable=False)
    
    question_text = Column(Text, nullable=False)
    tags = Column(JSON, nullable=True)  # e.g., ["deadline", "eligibility", "funding"]
    
    # Engagement metrics
    upvotes = Column(Integer, default=0)
    views = Column(Integer, default=0)
    is_answered = Column(String(10), default="No")
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    opportunity = relationship("Opportunity")
    user = relationship("UserProfile")
    answers = relationship("OpportunityAnswer", back_populates="question", cascade="all, delete-orphan")


class OpportunityAnswer(Base):
    __tablename__ = "opportunity_answers"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    question_id = Column(UUID(as_uuid=True), ForeignKey("opportunity_questions.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(Integer, ForeignKey("user_profiles.id", ondelete="CASCADE"), nullable=False)
    
    answer_text = Column(Text, nullable=False)
    
    # Status & verification
    upvotes = Column(Integer, default=0)
    is_accepted = Column(String(10), default="No")  # Marked as accepted by question author
    is_verified_expert = Column(String(10), default="No")  # Admin/mentor verified
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    question = relationship("OpportunityQuestion", back_populates="answers")
    user = relationship("UserProfile")


class MentorProfile(Base):
    __tablename__ = "mentor_profiles"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(Integer, ForeignKey("user_profiles.id", ondelete="CASCADE"), nullable=False, unique=True)
    
    bio = Column(Text, nullable=True)
    expertise_areas = Column(JSON, nullable=True)  # List of expertise strings
    successful_applications = Column(JSON, nullable=True)  # List of opportunity IDs they've won
    
    # Availability & stats
    availability = Column(String(20), default="Available")  # Available, Limited, Unavailable
    rating = Column(Integer, default=0)  # Average rating * 10 (e.g., 49 = 4.9 stars)
    total_sessions = Column(Integer, default=0)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    user = relationship("UserProfile")
    requests = relationship("MentorshipRequest", back_populates="mentor", foreign_keys="MentorshipRequest.mentor_id")


class MentorshipRequest(Base):
    __tablename__ = "mentorship_requests"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    mentee_id = Column(Integer, ForeignKey("user_profiles.id", ondelete="CASCADE"), nullable=False)
    mentor_id = Column(UUID(as_uuid=True), ForeignKey("mentor_profiles.id", ondelete="CASCADE"), nullable=False)
    opportunity_id = Column(UUID(as_uuid=True), ForeignKey("opportunities.id", ondelete="SET NULL"), nullable=True)
    
    message = Column(Text, nullable=True)
    status = Column(String(20), default="Pending")  # Pending, Accepted, Completed, Declined
    
    # Session details
    session_notes = Column(Text, nullable=True)
    rating = Column(Integer, nullable=True)  # 1-5 stars
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    completed_at = Column(DateTime(timezone=True), nullable=True)
    
    # Relationships
    mentee = relationship("UserProfile", foreign_keys=[mentee_id])
    mentor = relationship("MentorProfile", back_populates="requests", foreign_keys=[mentor_id])
    opportunity = relationship("Opportunity")


class ApplicationTip(Base):
    __tablename__ = "application_tips"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    opportunity_id = Column(UUID(as_uuid=True), ForeignKey("opportunities.id", ondelete="CASCADE"), nullable=True)
    
    category_type = Column(String(50), default="General")  # General, CategorySpecific, OpportunitySpecific
    tip_category = Column(String(50), nullable=True)  # e.g., Fellowship, Scholarship, Grant (if CategorySpecific)
    
    tip_text = Column(Text, nullable=False)
    author_id = Column(Integer, ForeignKey("user_profiles.id", ondelete="SET NULL"), nullable=True)
    
    # Engagement
    upvotes = Column(Integer, default=0)
    is_featured = Column(String(10), default="No")
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    opportunity = relationship("Opportunity")
    author = relationship("UserProfile")


# Vote tracking table to prevent duplicate votes
class CommunityVote(Base):
    __tablename__ = "community_votes"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(Integer, ForeignKey("user_profiles.id", ondelete="CASCADE"), nullable=False)
    
    # Polymorphic vote tracking
    votable_type = Column(String(50), nullable=False)  # SuccessStory, Question, Answer, Tip
    votable_id = Column(UUID(as_uuid=True), nullable=False)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
