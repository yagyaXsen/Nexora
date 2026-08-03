from typing import Optional, List
from fastapi import APIRouter, Depends, Query, HTTPException, status
from fastapi.responses import RedirectResponse, Response
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

import re

def _tokenize_query(q: str) -> List[str]:
    """Tokenize search query into distinct terms, excluding empty/single-char noise."""
    tokens = [t.lower() for t in re.findall(r"[a-zA-Z0-9\+\#]+", q)]
    stopwords = {"a", "an", "the", "in", "on", "at", "for", "to", "of", "and", "or", "is", "with"}
    meaningful = [t for t in tokens if t not in stopwords or len(tokens) == 1]
    return meaningful or tokens

def _score_opportunity(opp: Opportunity, terms: List[str], raw_query: str) -> float:
    """Calculate multi-field relevance score for an opportunity."""
    score = float(opp.confidence or 1.0) * 10.0
    raw_lower = raw_query.strip().lower()
    title_lower = (opp.title or "").lower()
    desc_lower = (opp.description or "").lower()
    org_lower = (opp.organizer or "").lower()
    country_lower = (opp.country or "").lower()
    elig_lower = (opp.eligibility_text or "").lower()
    tags_str = str(opp.tags or []).lower()
    funding_lower = (opp.funding_amount or "").lower()

    # Exact full-phrase match boosts
    if raw_lower in title_lower:
        score += 150.0
    elif raw_lower in org_lower:
        score += 80.0
    elif raw_lower in desc_lower:
        score += 40.0

    for term in terms:
        if term in title_lower:
            score += 35.0
            if title_lower.startswith(term):
                score += 20.0
        if term in org_lower:
            score += 25.0
        if term in tags_str:
            score += 20.0
        if term in country_lower:
            score += 15.0
        if term in funding_lower:
            score += 15.0
        if term in desc_lower:
            score += 8.0
        if term in elig_lower:
            score += 8.0

    return score

@router.get("", response_model=PaginatedOpportunities)
def list_opportunities(
    category: Optional[str] = Query(None, description="Filter by category"),
    country: Optional[str] = Query(None, description="Filter by country or region"),
    status: Optional[str] = Query(None, description="Filter by status (default excludes expired/dead_link)"),
    q: Optional[str] = Query(None, description="Search term for title, description, or organizer"),
    sort: Optional[str] = Query("relevance", description="Sort order: relevance, deadline_asc, created_desc, funding_desc"),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page"),
    db: Session = Depends(get_db)
):
    query = db.query(Opportunity).filter(
        Opportunity.needs_review == False,
        Opportunity.confidence >= 0.85,
        ~Opportunity.organizer.ilike("%Y Combinator News%"),
        ~Opportunity.title.ilike("%ruby%"),
        ~Opportunity.title.ilike("%shell colon%"),
        ~Opportunity.title.ilike("Stories%"),
        ~Opportunity.title.ilike("About%"),
        ~Opportunity.title.ilike("%Meet founders%"),
        ~Opportunity.title.ilike("%Discover what it means%")
    )

    if status:
        query = query.filter(Opportunity.status == status)
    else:
        # Default: active & expiring_soon
        query = query.filter(Opportunity.status.in_([OpportunityStatus.ACTIVE.value, OpportunityStatus.EXPIRING_SOON.value]))

    if category:
        query = query.filter(Opportunity.category == category)

    if country:
        query = query.filter(Opportunity.country.ilike(f"%{country}%"))

    terms = _tokenize_query(q) if q and q.strip() else []

    if terms:
        # Build multi-field text conditions for each token
        token_conditions = []
        for term in terms:
            search_pattern = f"%{term}%"
            token_conditions.append(
                or_(
                    Opportunity.title.ilike(search_pattern),
                    Opportunity.description.ilike(search_pattern),
                    Opportunity.organizer.ilike(search_pattern),
                    Opportunity.country.ilike(search_pattern),
                    Opportunity.funding_amount.ilike(search_pattern),
                    Opportunity.eligibility_text.ilike(search_pattern),
                    cast(Opportunity.tags, String).ilike(search_pattern),
                )
            )
        # Broad OR match across tokens to ensure maximum candidate retrieval
        query = query.filter(or_(*token_conditions))

    all_matched = query.all()

    # Apply sorting and relevance ranking
    if terms and sort == "relevance":
        all_matched.sort(key=lambda opp: _score_opportunity(opp, terms, q), reverse=True)
    elif sort == "deadline_asc":
        # Sort opportunities with upcoming deadlines first
        all_matched.sort(key=lambda opp: (opp.deadline is None, opp.deadline or ""))
    elif sort == "funding_desc":
        all_matched.sort(key=lambda opp: (opp.funding_amount is None, opp.funding_amount or ""), reverse=True)
    else:
        # Default created_at desc
        all_matched.sort(key=lambda opp: opp.created_at, reverse=True)

    total = len(all_matched)
    offset = (page - 1) * page_size
    items = all_matched[offset:offset + page_size]

    return PaginatedOpportunities(
        total=total,
        page=page,
        page_size=page_size,
        pages=max(1, -(-total // page_size)),  # ceiling division
        items=items
    )

@router.get("/suggestions")
def get_search_suggestions(
    q: str = Query(..., min_length=1, description="Query prefix to suggest completions for"),
    limit: int = Query(6, ge=1, le=20),
    db: Session = Depends(get_db)
):
    """Provide instantaneous search autocomplete suggestions for titles, host organizations, and tags."""
    terms = _tokenize_query(q)
    if not terms:
        return {"suggestions": []}

    pattern = f"%{terms[0]}%"
    opps = db.query(Opportunity).filter(
        Opportunity.needs_review == False,
        Opportunity.status.in_([OpportunityStatus.ACTIVE.value, OpportunityStatus.EXPIRING_SOON.value]),
        or_(
            Opportunity.title.ilike(pattern),
            Opportunity.organizer.ilike(pattern),
            Opportunity.country.ilike(pattern),
            cast(Opportunity.tags, String).ilike(pattern),
        )
    ).limit(30).all()

    suggestions = []
    seen = set()

    for opp in opps:
        # Add matching organizer
        if opp.organizer and opp.organizer.lower() not in seen:
            if terms[0] in opp.organizer.lower():
                suggestions.append({"text": opp.organizer, "type": "organization", "category": opp.category})
                seen.add(opp.organizer.lower())

        # Add matching title
        if opp.title and opp.title.lower() not in seen:
            if terms[0] in opp.title.lower():
                suggestions.append({"text": opp.title, "type": "opportunity", "category": opp.category})
                seen.add(opp.title.lower())

        # Add matching tags
        if opp.tags and isinstance(opp.tags, list):
            for tag in opp.tags:
                if isinstance(tag, str) and tag.lower() not in seen and terms[0] in tag.lower():
                    suggestions.append({"text": tag, "type": "tag", "category": opp.category})
                    seen.add(tag.lower())

        if len(suggestions) >= limit:
            break

    return {"suggestions": suggestions[:limit]}

@router.post("/search", response_model=SearchResponse)
def ai_search(payload: SearchRequest, db: Session = Depends(get_db)):
    """AI-powered natural language search with multi-field intent extraction and relevance ranking."""
    intent = ai_service.parse_search_query(payload.query)

    base = db.query(Opportunity).filter(
        Opportunity.needs_review == False,
        Opportunity.confidence >= 0.85,
        ~Opportunity.organizer.ilike("%Y Combinator News%"),
        ~Opportunity.title.ilike("%ruby%"),
        ~Opportunity.title.ilike("%shell colon%"),
        ~Opportunity.title.ilike("Stories%"),
        ~Opportunity.title.ilike("About%"),
        ~Opportunity.title.ilike("%Meet founders%"),
        ~Opportunity.title.ilike("%Discover what it means%"),
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
            Opportunity.funding_amount.ilike(pattern),
            Opportunity.country.ilike(pattern),
        ])
    for tag in intent.tags:
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

    items = query.all()

    # --- Broad fallback pass if strict yields 0 ---
    degraded = False
    if not items:
        degraded = True
        broad_conditions = list(text_conditions)
        if intent.category and intent.category in valid_categories:
            broad_conditions.append(Opportunity.category == intent.category)
        if intent.country:
            broad_conditions.append(Opportunity.country.ilike(f"%{intent.country}%"))
        if broad_conditions:
            items = base.filter(or_(*broad_conditions)).all()
        else:
            items = base.all()

    # Sort results by relevance score
    terms = _tokenize_query(payload.query)
    items.sort(key=lambda opp: _score_opportunity(opp, terms, payload.query), reverse=True)
    items = items[:20]

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

@router.post("/{opp_id}/click")
def track_click(opp_id: int, db: Session = Depends(get_db)):
    """Fire-and-forget click tracking endpoint called by navigator.sendBeacon.
    Increments click_count atomically and returns 204 with no body — the
    beacon response is never read by the browser. This is the single outbound
    exit point for click measurement (feeds /trending).
    """
    # Lightweight: no 404 check needed — if the opp doesn't exist, the
    # UPDATE simply affects zero rows and we still return 204.
    db.query(Opportunity).filter(Opportunity.id == opp_id).update(
        {Opportunity.click_count: Opportunity.click_count + 1},
        synchronize_session=False,
    )
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.get("/{opp_id}/apply")
def apply_redirect(opp_id: int, db: Session = Depends(get_db)):
    """Legacy redirect endpoint. Counts the click and 307-redirects the user
    to the organizer's apply_url. New code should use the direct apply_url
    from the API response + track_click for click tracking."""
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
