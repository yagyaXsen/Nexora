from datetime import datetime, timedelta, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy.orm import Session, joinedload

from app.database import get_db
from app.models import (
    Application, ApplicationStatus, Notification, Opportunity, OpportunityStatus,
    User, utc_now,
)
from app.publishing.catalog import catalog as published_catalog
from app.schemas import (
    ApplicationCreate, ApplicationUpdate, ApplicationRead, ApplyRequest, ApplyResponse
)
from app.auth import get_current_user


def _notify(db: Session, user_id: int, title: str, message: str,
            category: str = "status", priority: str = "medium",
            opp_id: int = None, organizer: str = "Nexora Intelligence",
            dedupe_hours: int = 24) -> None:
    """Create a notification, deduping identical (user, category, opp) rows
    within the given window so rapid re-saves don't spam the feed."""
    if dedupe_hours > 0:
        cutoff = datetime.now(timezone.utc) - timedelta(hours=dedupe_hours)
        existing = db.query(Notification).filter(
            Notification.user_id == user_id,
            Notification.title == title,
            Notification.opp_id == opp_id,
            Notification.created_at >= cutoff,
        ).first()
        if existing:
            return
    db.add(Notification(
        user_id=user_id,
        title=title,
        message=message,
        category=category,
        priority=priority,
        opp_id=opp_id,
        organizer=organizer,
    ))
    db.flush()

router = APIRouter(prefix="/api/applications", tags=["Applications"])

@router.get("", response_model=List[ApplicationRead])
def list_applications(
    status_filter: Optional[ApplicationStatus] = Query(None, alias="status", description="Filter by tracker status"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Guard against orphaned rows (opportunity deleted after cascade): an
    # application whose opportunity no longer exists would serialize with
    # opportunity=None and 500 the whole list. Only surface rows that still
    # have a live opportunity.
    query = db.query(Application)\
        .options(joinedload(Application.opportunity))\
        .filter(Application.user_id == current_user.id)\
        .filter(Application.opportunity.has())

    if status_filter:
        query = query.filter(Application.status == status_filter.value)

    return query.order_by(Application.updated_at.desc()).all()

@router.get("/upcoming", response_model=List[ApplicationRead])
def upcoming_deadlines(
    days: int = Query(14, ge=1, le=90, description="Deadline window in days"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    now = datetime.now(timezone.utc)
    window_end = now + timedelta(days=days)

    return db.query(Application)\
        .options(joinedload(Application.opportunity))\
        .join(Opportunity, Application.opportunity_id == Opportunity.id)\
        .filter(
            Application.user_id == current_user.id,
            Application.status.notin_([ApplicationStatus.ACCEPTED.value, ApplicationStatus.REJECTED.value]),
            Opportunity.deadline != None,
            Opportunity.deadline >= now,
            Opportunity.deadline <= window_end
        )\
        .order_by(Opportunity.deadline.asc()).all()

@router.post("", response_model=ApplicationRead, status_code=status.HTTP_201_CREATED)
def save_opportunity(
    app_in: ApplicationCreate,
    response: Response,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Idempotent save: return the existing row instead of erroring
    existing = db.query(Application).filter(
        Application.user_id == current_user.id,
        Application.opportunity_id == app_in.opportunity_id
    ).first()
    if existing:
        response.status_code = status.HTTP_200_OK
        return existing

    opportunity = db.query(Opportunity).filter(Opportunity.id == app_in.opportunity_id).first()
    if not opportunity:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Opportunity ID {app_in.opportunity_id} not found"
        )

    application = Application(
        user_id=current_user.id,
        opportunity_id=app_in.opportunity_id,
        status=app_in.status.value,
        notes=app_in.notes
    )
    db.add(application)
    _notify(
        db, current_user.id,
        title="Opportunity saved to tracker",
        message=f"{opportunity.title} is now in your Application Tracker.",
        category="status", priority="medium", opp_id=opportunity.id,
        organizer=opportunity.organizer or "Nexora Intelligence",
    )
    db.commit()
    db.refresh(application)
    return application

def _ensure_catalog_opportunity(db: Session, slug: str) -> Opportunity:
    """Create (or return) a DB opportunity row backed by the published catalog
    record for the given slug.

    The verified catalog is JSON-only — published records have no DB `id` — but
    tracker rows (applications) need a real `opportunity_id` FK. So we hydrate a
    thin DB row from the catalog record's fields the tracker actually renders
    (title, organizer, country, deadline, apply_url). The row is marked
    needs_review=True so it never surfaces on public opportunity lists — it
    exists purely to back the user's tracker/save state.
    """
    opp = db.query(Opportunity).filter(Opportunity.slug == slug).first()
    if opp:
        return opp

    rec = published_catalog.get(slug)
    if not rec:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Published opportunity '{slug}' not found",
        )

    data = rec.model_dump()

    # Catalog deadlines are normalized to "YYYY-MM-DD" strings by the loader;
    # hydrate them into a timezone-aware datetime so the tracker's Upcoming
    # Deadlines widget (/api/applications/upcoming, Dashboard sidebar) which
    # filters on Opportunity.deadline != None picks saved records up.
    deadline = None
    raw_deadline = data.get("deadline")
    if raw_deadline:
        try:
            deadline = datetime.strptime(str(raw_deadline)[:10], "%Y-%m-%d").replace(tzinfo=timezone.utc)
        except ValueError:
            deadline = None

    opp = Opportunity(
        title=data.get("title") or slug.replace("-", " ").title(),
        slug=slug,
        description=(
            data.get("short_original_summary")
            or data.get("benefits_summary")
            or data.get("eligibility_summary")
            or "Verified opportunity."
        ),
        category=data.get("opportunity_type") or "grant",
        organizer=data.get("provider_organization") or "Verified organizer",
        deadline=deadline,
        apply_url=data.get("application_url") or data.get("official_source_url") or "",
        country=data.get("country_or_region"),
        funding_amount=None,
        eligibility_text=data.get("eligibility_summary"),
        tags=data.get("tags") or [],
        status=OpportunityStatus.ACTIVE.value,
        confidence=min(1.0, (data.get("confidence_score") or 50) / 100.0),
        needs_review=True,
        dedupe_key=f"catalog-{slug}",
    )
    db.add(opp)
    db.commit()
    db.refresh(opp)
    return opp


@router.post("/by-slug/{slug}", response_model=ApplicationRead, status_code=status.HTTP_201_CREATED)
def save_published_by_slug(
    slug: str,
    response: Response,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Save a published-catalog opportunity (slug-keyed, no DB id) to the
    tracker. Hydrates a real opportunity row from the catalog record so the
    applications FK and tracker UI work exactly like legacy saves. Idempotent:
    returns the existing row instead of duplicating.
    """
    opp = _ensure_catalog_opportunity(db, slug)

    existing = db.query(Application).filter(
        Application.user_id == current_user.id,
        Application.opportunity_id == opp.id,
    ).first()
    if existing:
        response.status_code = status.HTTP_200_OK
        return existing

    application = Application(
        user_id=current_user.id,
        opportunity_id=opp.id,
        status=ApplicationStatus.SAVED.value,
    )
    db.add(application)
    _notify(
        db, current_user.id,
        title="Opportunity saved to tracker",
        message=f"{opp.title} is now in your Application Tracker.",
        category="status", priority="medium", opp_id=opp.id,
        organizer=opp.organizer or "Nexora Intelligence",
    )
    db.commit()
    db.refresh(application)
    return application


@router.delete("/by-slug/{slug}", status_code=status.HTTP_204_NO_CONTENT)
def unsave_published_by_slug(
    slug: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Remove a published-catalog opportunity from the tracker by slug."""
    opp = db.query(Opportunity).filter(Opportunity.slug == slug).first()
    if opp:
        application = db.query(Application).filter(
            Application.opportunity_id == opp.id,
            Application.user_id == current_user.id,
        ).first()
        if application:
            db.delete(application)
            db.commit()
    return None


@router.post("/apply", response_model=ApplyResponse)
def apply_to_opportunity(
    payload: ApplyRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Record that the user is applying, and hand back the organizer's URL.

    The frontend navigates via its own <a href>, so this call is best-effort from
    the browser's point of view — a failure here must never stop the user
    reaching the organizer. Idempotent: clicking Apply twice moves the row to
    Applied once and does not re-stamp applied_at.

    Declared above /{application_id} so "apply" is never parsed as an id.
    """
    opportunity = db.query(Opportunity).filter(Opportunity.id == payload.opportunity_id).first()
    if not opportunity:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Opportunity ID {payload.opportunity_id} not found"
        )
    if opportunity.status in (OpportunityStatus.EXPIRED.value, OpportunityStatus.DEAD_LINK.value):
        raise HTTPException(
            status_code=status.HTTP_410_GONE,
            detail=f"This opportunity is no longer available (status: {opportunity.status})"
        )

    application = db.query(Application).filter(
        Application.user_id == current_user.id,
        Application.opportunity_id == payload.opportunity_id
    ).first()

    already_applied = bool(application and application.applied_at)

    if application is None:
        application = Application(
            user_id=current_user.id,
            opportunity_id=payload.opportunity_id,
            status=ApplicationStatus.APPLIED.value,
            applied_at=utc_now(),
        )
        db.add(application)
    else:
        # Don't regress someone who is already further along (Interview, Offer…)
        if application.status in (ApplicationStatus.SAVED.value, ApplicationStatus.PREPARING.value,
                                 ApplicationStatus.READY_TO_APPLY.value):
            application.status = ApplicationStatus.APPLIED.value
        if application.applied_at is None:
            application.applied_at = utc_now()

    if not already_applied:
        _notify(
            db, current_user.id,
            title="Application submitted",
            message=f"You marked {opportunity.title} as applied. Good luck — track the outcome in your Tracker.",
            category="status", priority="medium", opp_id=opportunity.id,
            organizer=opportunity.organizer or "Nexora Intelligence",
        )

    db.commit()
    db.refresh(application)

    return ApplyResponse(
        application_id=application.id,
        opportunity_id=application.opportunity_id,
        status=application.status,
        applied_at=application.applied_at,
        apply_url=opportunity.apply_url,
        already_applied=already_applied,
    )

@router.patch("/{application_id}", response_model=ApplicationRead)
def update_application(
    application_id: int,
    app_in: ApplicationUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    application = db.query(Application).filter(
        Application.id == application_id,
        Application.user_id == current_user.id
    ).first()
    if not application:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Application ID {application_id} not found"
        )

    update_data = app_in.model_dump(exclude_unset=True)
    if "status" in update_data and update_data["status"]:
        update_data["status"] = update_data["status"].value

    for key, value in update_data.items():
        setattr(application, key, value)

    # Auto-stamp applied_at when moving to applied
    if application.status == ApplicationStatus.APPLIED.value and application.applied_at is None:
        application.applied_at = utc_now()

    db.commit()
    db.refresh(application)
    return application

@router.delete("/{application_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_application(
    application_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    application = db.query(Application).filter(
        Application.id == application_id,
        Application.user_id == current_user.id
    ).first()
    if not application:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Application ID {application_id} not found"
        )

    db.delete(application)
    db.commit()
    return None

@router.delete("/by-opportunity/{opportunity_id}", status_code=status.HTTP_204_NO_CONTENT)
def unsave_by_opportunity(
    opportunity_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    application = db.query(Application).filter(
        Application.opportunity_id == opportunity_id,
        Application.user_id == current_user.id
    ).first()
    if application:
        db.delete(application)
        db.commit()
    return None
