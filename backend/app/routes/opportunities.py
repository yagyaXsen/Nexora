from typing import Optional, List
from fastapi import APIRouter, Depends, Query, HTTPException, status
from fastapi.responses import RedirectResponse
from sqlalchemy import or_, func, cast, String
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Opportunity, OpportunityStatus, OpportunityCategory
from app.schemas import (
    OpportunityRead, OpportunityStats, PaginatedOpportunities,
    SearchRequest, SearchResponse
)
from app.ai_service import ai_service

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
        pages=max(1, -(-total // page_size)),  # ceiling division
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

@router.post("/search", response_model=SearchResponse)
def ai_search(payload: SearchRequest, db: Session = Depends(get_db)):
    """AI-powered natural language search. Parses the query into structured
    intent (category, country, tags, keywords, funding) and builds SQL filters.
    Falls back to a broad keyword search when the strict filters yield nothing."""
    intent = ai_service.parse_search_query(payload.query)

    base = db.query(Opportunity).filter(
        Opportunity.needs_review == False,
        Opportunity.status.in_([OpportunityStatus.ACTIVE.value, OpportunityStatus.EXPIRING_SOON.value])
    )

    valid_categories = {c.value for c in OpportunityCategory}

    # Text conditions shared by strict and broad passes
    text_conditions = []
    for kw in intent.keywords:
        pattern = f"%{kw}%"
        text_conditions.extend([
            Opportunity.title.ilike(pattern),
            Opportunity.description.ilike(pattern),
            Opportunity.organizer.ilike(pattern),
            Opportunity.eligibility_text.ilike(pattern),
        ])
    for tag in intent.tags:
        # tags stored as JSON list; quoted match avoids partial-token hits
        text_conditions.append(cast(Opportunity.tags, String).ilike(f'%"{tag}"%'))

    # --- Strict pass ---
    query = base
    if intent.category and intent.category in valid_categories:
        query = query.filter(Opportunity.category == intent.category)
    if intent.country and intent.country.lower() != "global":
        query = query.filter(or_(
            Opportunity.country.ilike(f"%{intent.country}%"),
            Opportunity.country.ilike("%global%")
        ))
    if intent.funding_required:
        query = query.filter(Opportunity.funding_amount.isnot(None))
    if text_conditions:
        query = query.filter(or_(*text_conditions))

    items = query.order_by(Opportunity.created_at.desc()).limit(20).all()

    # --- Broad fallback pass ---
    degraded = False
    if not items:
        degraded = True
        broad_conditions = list(text_conditions)
        if intent.category and intent.category in valid_categories:
            broad_conditions.append(Opportunity.category == intent.category)
        if intent.country:
            broad_conditions.append(Opportunity.country.ilike(f"%{intent.country}%"))
        if broad_conditions:
            items = base.filter(or_(*broad_conditions))\
                .order_by(Opportunity.created_at.desc()).limit(20).all()
        else:
            items = base.order_by(Opportunity.created_at.desc()).limit(20).all()

    return SearchResponse(
        query=payload.query,
        intent=intent,
        degraded=degraded,
        total=len(items),
        items=items
    )

@router.get("/trending", response_model=List[OpportunityRead])
def trending_opportunities(
    limit: int = Query(10, ge=1, le=50, description="How many to return"),
    db: Session = Depends(get_db)
):
    """Most-clicked live opportunities. Powered by the click_count that
    /{id}/apply increments on every outbound apply redirect."""
    return db.query(Opportunity)\
        .filter(
            Opportunity.needs_review == False,
            Opportunity.status.in_([OpportunityStatus.ACTIVE.value, OpportunityStatus.EXPIRING_SOON.value])
        )\
        .order_by(Opportunity.click_count.desc(), Opportunity.created_at.desc())\
        .limit(limit).all()

@router.get("/{opp_id}/apply")
def apply_redirect(opp_id: int, db: Session = Depends(get_db)):
    """Count the click, then 307-redirect the user to the organizer's apply_url.
    This is the single outbound exit point — front the 'Apply' button with it so
    every click is measured (feeds /trending) without a separate tracking call."""
    opp = db.query(Opportunity).filter(Opportunity.id == opp_id).first()
    if not opp:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Opportunity ID {opp_id} not found"
        )
    if opp.status in (OpportunityStatus.EXPIRED.value, OpportunityStatus.DEAD_LINK.value):
        raise HTTPException(
            status_code=status.HTTP_410_GONE,
            detail=f"This opportunity is no longer available (status: {opp.status})"
        )
    # atomic increment avoids a read-modify-write race under concurrent clicks
    opp.click_count = Opportunity.click_count + 1
    db.commit()
    return RedirectResponse(url=opp.apply_url, status_code=status.HTTP_307_TEMPORARY_REDIRECT)

# Keep this catch-all route last: literal paths such as /stats, /search, and
# /trending must be matched before a value can be treated as a slug.
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
