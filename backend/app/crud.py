from sqlalchemy.orm import Session
from sqlalchemy import and_
from typing import List, Optional, Tuple
from uuid import UUID
from . import models, schemas
from datetime import datetime

# ==================== OPPORTUNITY CRUD ====================

def get_opportunity(db: Session, opportunity_id: UUID) -> Optional[models.Opportunity]:
    return db.query(models.Opportunity).filter(models.Opportunity.id == opportunity_id).first()

def get_opportunity_by_url(db: Session, url: str) -> Optional[models.Opportunity]:
    return db.query(models.Opportunity).filter(models.Opportunity.url == url).first()

def get_opportunities(
    db: Session, 
    skip: int = 0, 
    limit: int = 100, 
    category: Optional[str] = None, 
    country: Optional[str] = None
) -> Tuple[int, List[models.Opportunity]]:
    query = db.query(models.Opportunity)
    
    if category and category != "All":
        query = query.filter(models.Opportunity.category == category)
        
    if country and country != "All":
        if country.lower() == "global":
            query = query.filter(models.Opportunity.country.ilike("%global%"))
        else:
            query = query.filter(models.Opportunity.country.ilike(f"%{country}%"))
            
    total = query.count()
    opportunities = query.order_by(models.Opportunity.created_at.desc()).offset(skip).limit(limit).all()
    return total, opportunities

def create_opportunity(db: Session, opportunity: schemas.OpportunityCreate) -> models.Opportunity:
    db_opportunity = models.Opportunity(
        title=opportunity.title,
        organization=opportunity.organization,
        description=opportunity.description,
        url=opportunity.url,
        funding=opportunity.funding,
        deadline=opportunity.deadline,
        country=opportunity.country,
        category=opportunity.category,
        tags=opportunity.tags,
        eligibility=opportunity.eligibility
    )
    db.add(db_opportunity)
    db.commit()
    db.refresh(db_opportunity)
    return db_opportunity

def update_opportunity(
    db: Session, 
    opportunity_id: UUID, 
    opp_update: schemas.OpportunityUpdate
) -> Optional[models.Opportunity]:
    db_opportunity = get_opportunity(db, opportunity_id)
    if not db_opportunity:
        return None
        
    update_data = opp_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_opportunity, key, value)
        
    db.commit()
    db.refresh(db_opportunity)
    return db_opportunity

def delete_opportunity(db: Session, opportunity_id: UUID) -> bool:
    db_opportunity = get_opportunity(db, opportunity_id)
    if not db_opportunity:
        return False
    db.delete(db_opportunity)
    db.commit()
    return True


# ==================== SCRAPED SOURCE CRUD ====================

def get_scraped_sources(db: Session) -> List[models.ScrapedSource]:
    return db.query(models.ScrapedSource).all()

def create_scraped_source(db: Session, source: schemas.ScrapedSourceCreate) -> models.ScrapedSource:
    db_source = models.ScrapedSource(
        name=source.name,
        url=source.url,
        scraper_type=source.scraper_type
    )
    db.add(db_source)
    db.commit()
    db.refresh(db_source)
    return db_source

def update_scraped_source_status(
    db: Session, 
    source_id: int, 
    status: str,
    last_scraped: Optional[datetime] = None
) -> Optional[models.ScrapedSource]:
    db_source = db.query(models.ScrapedSource).filter(models.ScrapedSource.id == source_id).first()
    if not db_source:
        return None
    db_source.status = status
    if last_scraped:
        db_source.last_scraped = last_scraped
    db.commit()
    db.refresh(db_source)
    return db_source


# ==================== APPLICATION CRUD ====================

def get_upcoming_deadlines(db: Session) -> List[models.Opportunity]:
    """Get opportunities with upcoming deadlines for the user's applications."""
    from datetime import datetime, timedelta

    # Get all applications with their opportunities
    applications = get_applications(db)

    # Filter for applications with upcoming deadlines
    upcoming_deadlines = []
    today = datetime.now().date()

    for app in applications:
        if app.opportunity.deadline:
            days_until_deadline = (app.opportunity.deadline - today).days
            # Check if deadline is within the next 30 days
            if 0 <= days_until_deadline <= 30:
                upcoming_deadlines.append(app)

    return upcoming_deadlines

def get_application(db: Session, application_id: UUID) -> Optional[models.Application]:
    return db.query(models.Application).filter(models.Application.id == application_id).first()

def get_application_by_opportunity(db: Session, opportunity_id: UUID) -> Optional[models.Application]:
    return db.query(models.Application).filter(models.Application.opportunity_id == opportunity_id).first()

def create_application(db: Session, application: schemas.ApplicationCreate) -> models.Application:
    # Check if application already exists for this opportunity
    existing = get_application_by_opportunity(db, application.opportunity_id)
    if existing:
        return existing
        
    db_app = models.Application(
        opportunity_id=application.opportunity_id,
        status=application.status,
        notes=application.notes,
        priority=application.priority,
        applied_date=application.applied_date
    )
    db.add(db_app)
    db.commit()
    db.refresh(db_app)
    return db_app

def update_application(
    db: Session, 
    application_id: UUID, 
    app_update: schemas.ApplicationUpdate
) -> Optional[models.Application]:
    db_app = get_application(db, application_id)
    if not db_app:
        return None
        
    update_data = app_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_app, key, value)
        
    db_app.updated_at = datetime.now()
    db.commit()
    db.refresh(db_app)
    return db_app

def delete_application(db: Session, application_id: UUID) -> bool:
    db_app = get_application(db, application_id)
    if not db_app:
        return False
    db.delete(db_app)
    db.commit()
    return True


# ==================== USER (AUTH) CRUD ====================

def get_user_by_email(db: Session, email: str) -> Optional[models.User]:
    # Emails are stored/compared case-insensitively (normalized to lower).
    return db.query(models.User).filter(models.User.email == email.lower().strip()).first()

def get_user_by_id(db: Session, user_id: int) -> Optional[models.User]:
    return db.query(models.User).filter(models.User.id == user_id).first()

def create_user(db: Session, email: str, full_name: str, password_hash: str) -> models.User:
    db_user = models.User(
        email=email.lower().strip(),
        full_name=full_name.strip() if full_name else None,
        password_hash=password_hash,
        is_active="Yes",
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user


# ==================== USER PROFILE CRUD ====================

def get_user_profile(db: Session) -> Optional[models.UserProfile]:
    return db.query(models.UserProfile).first()

def create_user_profile(db: Session, profile: schemas.UserProfileCreate) -> models.UserProfile:
    db_profile = models.UserProfile(
        name=profile.name,
        email=profile.email,
        bio=profile.bio,
        academic_status=profile.academic_status,
        university=profile.university,
        verified_academic_id=profile.verified_academic_id,
        research_interests=profile.research_interests,
        base_city=profile.base_city,
        willing_to_relocate=profile.willing_to_relocate,
        preferred_regions=profile.preferred_regions
    )
    db.add(db_profile)
    db.commit()
    db.refresh(db_profile)
    return db_profile

def update_user_profile(db: Session, profile_update: schemas.UserProfileUpdate) -> Optional[models.UserProfile]:
    db_profile = get_user_profile(db)
    if not db_profile:
        return None

    update_data = profile_update.model_dump()
    for key, value in update_data.items():
        setattr(db_profile, key, value)

    db.commit()
    db.refresh(db_profile)
    return db_profile

def get_upcoming_deadlines(db: Session) -> List[models.Application]:
    """Get applications with upcoming deadlines."""
    from datetime import datetime, timedelta

    # Get all applications with their opportunities
    applications = db.query(models.Application).order_by(models.Application.updated_at.desc()).all()

    # Filter for applications with upcoming deadlines
    upcoming_deadlines = []
    today = datetime.now().date()

    for app in applications:
        if app.opportunity.deadline:
            days_until_deadline = (app.opportunity.deadline - today).days
            # Check if deadline is within the next 30 days
            if 0 <= days_until_deadline <= 30:
                upcoming_deadlines.append(app)

    return upcoming_deadlines

