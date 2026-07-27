import enum
from datetime import datetime, timezone
from sqlalchemy import (
    Column, Integer, String, Text, Boolean, Float, DateTime, Enum, ForeignKey, JSON, UniqueConstraint
)
from sqlalchemy.orm import relationship
from app.database import Base

def utc_now():
    return datetime.now(timezone.utc)

class SourceType(str, enum.Enum):
    RSS = "rss"
    HTML = "html"
    SITEMAP = "sitemap"

class OpportunityCategory(str, enum.Enum):
    SCHOLARSHIP = "scholarship"
    FELLOWSHIP = "fellowship"
    GRANT = "grant"
    ACCELERATOR = "accelerator"
    COMPETITION = "competition"
    CONFERENCE = "conference"
    EXCHANGE = "exchange"
    TRAVEL = "travel"
    GOV_SCHEME = "gov_scheme"
    GIVEAWAY = "giveaway"

class OpportunityStatus(str, enum.Enum):
    ACTIVE = "active"
    EXPIRING_SOON = "expiring_soon"
    EXPIRED = "expired"
    DEAD_LINK = "dead_link"

class RawDocumentStatus(str, enum.Enum):
    FETCHED = "fetched"
    EXTRACTED = "extracted"
    NORMALIZED = "normalized"
    FAILED = "failed"

class ApplicationStatus(str, enum.Enum):
    SAVED = "Saved"
    PREPARING = "Preparing"
    READY_TO_APPLY = "Ready to Apply"
    APPLIED = "Applied"
    ASSESSMENT = "Assessment"
    INTERVIEW = "Interview"
    OFFER = "Offer"
    ACCEPTED = "Accepted"
    REJECTED = "Rejected"
    ARCHIVED = "Archived"

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    google_id = Column(String(255), unique=True, index=True, nullable=True)
    name = Column(String(255), nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    avatar = Column(Text, nullable=True)
    email_verified = Column(Boolean, default=True, nullable=False)
    role = Column(String(50), default="candidate", nullable=False)
    last_login = Column(DateTime(timezone=True), default=utc_now, nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False)

    profile = relationship("Profile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    applications = relationship("Application", back_populates="user", cascade="all, delete-orphan")
    notifications = relationship("Notification", back_populates="user", cascade="all, delete-orphan")
    org_following = relationship("OrganizationFollower", back_populates="user", cascade="all, delete-orphan")
    password_reset_tokens = relationship("PasswordResetToken", back_populates="user", cascade="all, delete-orphan")

class PasswordResetToken(Base):
    __tablename__ = "password_reset_tokens"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    token_hash = Column(String(64), unique=True, index=True, nullable=False)
    expires_at = Column(DateTime(timezone=True), nullable=False)
    used_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)

    user = relationship("User", back_populates="password_reset_tokens")

class Profile(Base):
    __tablename__ = "profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    academic_degree = Column(String(255), default="Postdoctoral Research Fellow", nullable=False)
    institution = Column(String(255), default="ETH Zurich", nullable=False)
    field_of_study = Column(String(255), default="Computer Science & Artificial Intelligence", nullable=False)
    citizenship = Column(String(255), default="Switzerland, India", nullable=False)
    residence = Column(String(255), default="Zurich, Switzerland", nullable=False)
    skills = Column(JSON, default=list, nullable=False)
    interests = Column(JSON, default=list, nullable=False)
    target_countries = Column(JSON, default=list, nullable=False)
    bio = Column(Text, nullable=True)
    vector_confidence = Column(Float, default=98.4, nullable=False)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False)

    user = relationship("User", back_populates="profile")

class Organization(Base):
    __tablename__ = "organizations"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False, index=True)
    slug = Column(String(255), unique=True, index=True, nullable=False)
    category = Column(String(100), default="Research Institution", nullable=False)
    headquarters = Column(String(255), default="Geneva, Switzerland", nullable=False)
    website = Column(Text, nullable=False)
    description = Column(Text, nullable=False)
    ai_summary = Column(Text, nullable=True)
    cover_image = Column(Text, nullable=True)
    verified = Column(Boolean, default=True, nullable=False)
    follower_count = Column(Integer, default=1420, nullable=False)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False)

    followers = relationship("OrganizationFollower", back_populates="organization", cascade="all, delete-orphan")

class OrganizationFollower(Base):
    __tablename__ = "organization_followers"
    __table_args__ = (
        UniqueConstraint("user_id", "organization_id", name="uq_user_organization_follower"),
    )

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    organization_id = Column(Integer, ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)

    user = relationship("User", back_populates="org_following")
    organization = relationship("Organization", back_populates="followers")

class Source(Base):
    __tablename__ = "sources"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    type = Column(String(50), nullable=False, default=SourceType.RSS.value)
    url = Column(Text, nullable=False)
    config = Column(JSON, nullable=True, default=dict)
    enabled = Column(Boolean, default=True, nullable=False)
    schedule = Column(String(50), default="daily", nullable=False)
    last_run_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False)

    raw_documents = relationship("RawDocument", back_populates="source", cascade="all, delete-orphan")
    opportunities = relationship("Opportunity", back_populates="source")
    pipeline_runs = relationship("PipelineRun", back_populates="source", cascade="all, delete-orphan")

class RawDocument(Base):
    __tablename__ = "raw_documents"

    id = Column(Integer, primary_key=True, index=True)
    source_id = Column(Integer, ForeignKey("sources.id", ondelete="CASCADE"), nullable=False)
    url = Column(Text, nullable=False)
    canonical_url = Column(Text, nullable=True)
    content_hash = Column(String(64), nullable=False, index=True)
    raw_content = Column(Text, nullable=False)
    status = Column(String(50), default=RawDocumentStatus.FETCHED.value, nullable=False)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False)

    source = relationship("Source", back_populates="raw_documents")
    opportunities = relationship("Opportunity", back_populates="raw_document")

class Opportunity(Base):
    __tablename__ = "opportunities"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(500), nullable=False, index=True)
    slug = Column(String(500), unique=True, index=True, nullable=False)
    description = Column(Text, nullable=False)
    category = Column(String(50), nullable=False, default=OpportunityCategory.GRANT.value, index=True)
    organizer = Column(String(255), nullable=False)
    deadline = Column(DateTime(timezone=True), nullable=True)
    apply_url = Column(Text, nullable=False)
    country = Column(String(100), nullable=True, index=True)
    funding_amount = Column(String(255), nullable=True)
    eligibility_text = Column(Text, nullable=True)
    tags = Column(JSON, nullable=True, default=list)
    status = Column(String(50), default=OpportunityStatus.ACTIVE.value, nullable=False, index=True)
    click_count = Column(Integer, default=0, nullable=False)
    confidence = Column(Float, default=1.0, nullable=False)
    needs_review = Column(Boolean, default=False, nullable=False, index=True)
    dedupe_key = Column(String(255), nullable=False, index=True)
    source_id = Column(Integer, ForeignKey("sources.id", ondelete="SET NULL"), nullable=True)
    raw_document_id = Column(Integer, ForeignKey("raw_documents.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False)

    source = relationship("Source", back_populates="opportunities")
    raw_document = relationship("RawDocument", back_populates="opportunities")

class Application(Base):
    __tablename__ = "applications"
    __table_args__ = (
        UniqueConstraint("user_id", "opportunity_id", name="uq_user_opportunity"),
    )

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    opportunity_id = Column(Integer, ForeignKey("opportunities.id", ondelete="CASCADE"), nullable=False)
    status = Column(String(50), default=ApplicationStatus.SAVED.value, nullable=False, index=True)
    notes = Column(Text, nullable=True)
    applied_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False)

    user = relationship("User", back_populates="applications")
    opportunity = relationship("Opportunity")

class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    category = Column(String(50), default="ai_match", nullable=False)
    priority = Column(String(50), default="medium", nullable=False)
    is_read = Column(Boolean, default=False, nullable=False)
    is_pinned = Column(Boolean, default=False, nullable=False)
    opp_id = Column(Integer, ForeignKey("opportunities.id", ondelete="SET NULL"), nullable=True)
    organizer = Column(String(255), default="Nexora Intelligence", nullable=False)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)

    user = relationship("User", back_populates="notifications")
    opportunity = relationship("Opportunity")

class PipelineRun(Base):
    __tablename__ = "pipeline_runs"

    id = Column(Integer, primary_key=True, index=True)
    source_id = Column(Integer, ForeignKey("sources.id", ondelete="CASCADE"), nullable=False)
    started_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)
    finished_at = Column(DateTime(timezone=True), nullable=True)
    status = Column(String(50), default="running", nullable=False)
    fetched_count = Column(Integer, default=0, nullable=False)
    new_count = Column(Integer, default=0, nullable=False)
    updated_count = Column(Integer, default=0, nullable=False)
    duplicate_count = Column(Integer, default=0, nullable=False)
    failed_count = Column(Integer, default=0, nullable=False)
    error_log = Column(JSON, nullable=True, default=list)

    source = relationship("Source", back_populates="pipeline_runs")

class AuditEvent(Base):
    __tablename__ = "audit_events"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    event_type = Column(String(100), nullable=False, index=True)
    payload = Column(JSON, nullable=True, default=dict)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)
