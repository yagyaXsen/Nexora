from typing import Optional, List
from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy import or_, func
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Opportunity, OpportunityStatus, OpportunityCategory
from app.schemas import OpportunityRead, OpportunityStats, PaginatedOpportunities

router = APIRouter(prefix="/api/opportunities", tags=["Opportunities"])

@router.get("", response_model=PaginatedOpportunities)
def list_opportunities(
    category: Optional[str] = Query(None, description="Filter by category"),
    country: Optional[str] = Query(None, description="Filter by country or region"),
    status: Optional[str] = Query(None, description="Filter by status (default excludes expired/dead_link)"),
    q: Optional[str] = Query(None, description="Search term for title, description, or organizer"),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page"),
    db: Session = Depends(get_db)
):
    query = db.query(Opportunity).filter(Opportunity.needs_review == False)

    if status:
        query = query.filter(Opportunity.status == status)
    else:
        # Default: active & expiring_soon
        query = query.filter(Opportunity.status.in_([OpportunityStatus.ACTIVE.value, OpportunityStatus.EXPIRING_SOON.value]))

    if category:
        query = query.filter(Opportunity.category == category)

    if country:
        query = query.filter(Opportunity.country.ilike(f"%{country}%"))

    if q:
        search_pattern = f"%{q}%"
        query = query.filter(
            or_(
                Opportunity.title.ilike(search_pattern),
                Opportunity.description.ilike(search_pattern),
                Opportunity.organizer.ilike(search_pattern)
            )
        )

    total = query.count()
    offset = (page - 1) * page_size
    items = query.order_by(Opportunity.created_at.desc()).offset(offset).limit(page_size).all()

    return PaginatedOpportunities(
        total=total,
        page=page,
        page_size=page_size,
        items=items
    )

@router.get("/stats", response_model=OpportunityStats)
def get_opportunity_stats(db: Session = Depends(get_db)):
    total = db.query(Opportunity).count()
    active_count = db.query(Opportunity).filter(Opportunity.status == OpportunityStatus.ACTIVE.value, Opportunity.needs_review == False).count()
    expiring_soon_count = db.query(Opportunity).filter(Opportunity.status == OpportunityStatus.EXPIRING_SOON.value, Opportunity.needs_review == False).count()
    expired_count = db.query(Opportunity).filter(Opportunity.status == OpportunityStatus.EXPIRED.value).count()
    dead_link_count = db.query(Opportunity).filter(Opportunity.status == OpportunityStatus.DEAD_LINK.value).count()
    needs_review_count = db.query(Opportunity).filter(Opportunity.needs_review == True).count()

    # Category breakdown
    cat_counts = db.query(Opportunity.category, func.count(Opportunity.id))\
        .filter(Opportunity.needs_review == False)\
        .group_by(Opportunity.category).all()
    categories_breakdown = {cat: count for cat, count in cat_counts}

    return OpportunityStats(
        total_opportunities=total,
        active_count=active_count,
        expiring_soon_count=expiring_soon_count,
        expired_count=expired_count,
        dead_link_count=dead_link_count,
        needs_review_count=needs_review_count,
        categories_breakdown=categories_breakdown
    )

@router.get("/{id_or_slug}", response_model=OpportunityRead)
def get_opportunity(id_or_slug: str, db: Session = Depends(get_db)):
    if id_or_slug.isdigit():
        opp = db.query(Opportunity).filter(Opportunity.id == int(id_or_slug)).first()
    else:
        opp = db.query(Opportunity).filter(Opportunity.slug == id_or_slug).first()

    if not opp:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Opportunity '{id_or_slug}' not found"
        )
    return opp
