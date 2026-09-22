import logging
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload

from app.auth import get_current_user
from app.database import get_db
from app.models import Opportunity, User
from app.publishing.catalog import catalog
from app.publishing.live_feed import db_opportunity_to_published, merge_feed
from app.publishing.models import (
    PublishedMatchItem, PublishedMatchResponse, PublishedOpportunity,
    PublishedListResponse, PublishedStats,
)

router = APIRouter(prefix="/api/published", tags=["Published Opportunities"])
logger = logging.getLogger(__name__)


def _published_feed(db: Session):
    """The active catalog: static verified records + pipeline-published DB
    records. Never raises — if the live layer fails, the static catalog is
    served unchanged (an empty/failed pipeline can NOT wipe the feed)."""
    try:
        return merge_feed(db, catalog)
    except Exception:
        logger.exception("Published feed merge failed — serving static catalog only")
        return None


@router.get("/match", response_model=PublishedMatchResponse)
def match_published(
    limit: int = Query(6, ge=1, le=24),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Personalized ranking of the verified catalog against the candidate's
    profile. Authenticated: reads the logged-in user's Profile
    (field_of_study, interests, skills, academic_degree, citizenship,
    residence, target_countries) and scores each live record with
    catalog.match_profile(). Attaches an ai_match_score and human-readable
    reasons per item so the Dashboard feed is genuinely personalized rather
    than a generic page-1 listing.

    Profiles are optional: a candidate with no profile gets a quality-ranked
    default feed (profile_ready=false) instead of an error.
    """
    profile = None
    if current_user:
        user = db.query(User).options(joinedload(User.profile)).filter(User.id == current_user.id).first()
        profile = user.profile if user else None

    focus_terms = []
    skills = []
    countries = []
    degree = None

    if profile:
        focus_terms = [
            t for t in [
                profile.field_of_study,
                *(profile.interests or []),
            ] if t
        ]
        skills = list(profile.skills or [])
        degree = profile.academic_degree
        countries = [
            c for c in [
                profile.citizenship,
                profile.residence,
                *(profile.target_countries or []),
            ] if c
        ]

    ranked, matched_focus = catalog.match_profile(
        focus_terms=focus_terms,
        skills=skills,
        degree=degree,
        countries=countries,
        limit=limit,
        records=_published_feed(db),
    )

    items = [
        PublishedMatchItem(
            opportunity=opp,
            ai_match_score=score,
            ai_match_reasons=reasons,
        )
        for opp, score, reasons in ranked
    ]

    return PublishedMatchResponse(
        items=items,
        total=len(items),
        profile_ready=profile is not None,
        matched_focus_terms=sorted(matched_focus)[:8],
    )


@router.get("/opportunities", response_model=PublishedListResponse)
def list_published(
    category: Optional[str] = Query(None, description="Filter by opportunity_type"),
    country: Optional[str] = Query(None, description="Filter by country or region"),
    status: Optional[str] = Query(None, description="open | upcoming | rolling | closed | unclear"),
    q: Optional[str] = Query(None, description="Full-text search across title, provider, tags, etc."),
    funded_only: bool = Query(False, description="Only funded opportunities"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    result = catalog.list(
        category=category, country=country, status=status,
        q=q, page=page, page_size=page_size, funded_only=funded_only,
        records=_published_feed(db),
    )
    return PublishedListResponse(**result)


@router.get("/opportunities/{slug}", response_model=PublishedOpportunity)
def get_published(slug: str, db: Session = Depends(get_db)):
    """Detail for anything that appears (or appeared) in the published feed.

    Resolution order — same lifecycle truth as the list endpoint:
      1. the merged feed (static records AND pipeline-published live records,
         twins already enriched, live status/deadline winning),
      2. a DB-only record that is currently NOT eligible (expired/dead_link):
         served with status "closed" so history stays viewable but is never
         presented as active — no static JSON entry is required,
      3. 404.
    """
    feed = _published_feed(db) or []
    rec = next((r for r in feed if r.slug == slug), None)
    if rec is not None:
        # Static records get read-time freshness; live records already carry
        # pipeline lifecycle state.
        return catalog.fresh(rec) if catalog.get(slug) is not None else rec

    row = db.query(Opportunity).filter(Opportunity.slug == slug).first()
    if row is not None:
        return db_opportunity_to_published(row)

    raise HTTPException(status_code=404, detail=f"Opportunity '{slug}' not found")


@router.get("/opportunities/{slug}/related", response_model=List[PublishedOpportunity])
def related_published(slug: str, limit: int = Query(4, ge=1, le=12)):
    return catalog.related(slug, limit=limit)


@router.get("/stats", response_model=PublishedStats)
def published_stats(db: Session = Depends(get_db)):
    return catalog.stats(records=_published_feed(db))
