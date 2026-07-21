import enum
from datetime import datetime, timezone
from sqlalchemy import (
    Column, Integer, String, Text, Boolean, Float, DateTime, Enum, ForeignKey, JSON
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
    confidence = Column(Float, default=1.0, nullable=False)
    needs_review = Column(Boolean, default=False, nullable=False, index=True)
    dedupe_key = Column(String(255), nullable=False, index=True)
    source_id = Column(Integer, ForeignKey("sources.id", ondelete="SET NULL"), nullable=True)
    raw_document_id = Column(Integer, ForeignKey("raw_documents.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False)

    source = relationship("Source", back_populates="opportunities")
    raw_document = relationship("RawDocument", back_populates="opportunities")

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
