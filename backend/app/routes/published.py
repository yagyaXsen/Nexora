from typing import List, Optional

from fastapi import APIRouter, HTTPException, Query

from app.publishing.catalog import catalog
from app.publishing.models import PublishedOpportunity, PublishedListResponse, PublishedStats

router = APIRouter(prefix="/api/published", tags=["Published Opportunities"])


@router.get("/opportunities", response_model=PublishedListResponse)
def list_published(
    category: Optional[str] = Query(None, description="Filter by opportunity_type"),
    country: Optional[str] = Query(None, description="Filter by country or region"),
    status: Optional[str] = Query(None, description="open | upcoming | rolling | closed | unclear"),
    q: Optional[str] = Query(None, description="Full-text search across title, provider, tags, etc."),
    funded_only: bool = Query(False, description="Only funded opportunities"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
):
    result = catalog.list(
        category=category, country=country, status=status,
        q=q, page=page, page_size=page_size, funded_only=funded_only,
    )
    return PublishedListResponse(**result)


@router.get("/opportunities/{slug}", response_model=PublishedOpportunity)
def get_published(slug: str):
    opp = catalog.get(slug)
    if not opp:
        raise HTTPException(status_code=404, detail=f"Opportunity '{slug}' not found")
    return opp


@router.get("/opportunities/{slug}/related", response_model=List[PublishedOpportunity])
def related_published(slug: str, limit: int = Query(4, ge=1, le=12)):
    return catalog.related(slug, limit=limit)


@router.get("/stats", response_model=PublishedStats)
def published_stats():
    return catalog.stats()
