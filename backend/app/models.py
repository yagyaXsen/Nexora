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


class UserProfile(Base):
    __tablename__ = "user_profiles"

    id = Column(Integer, primary_key=True, index=True)
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
