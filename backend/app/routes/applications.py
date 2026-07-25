from datetime import datetime, timedelta, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy.orm import Session, joinedload

from app.database import get_db
from app.models import (
    Application, ApplicationStatus, Opportunity, OpportunityStatus, User, utc_now
)
from app.schemas import (
    ApplicationCreate, ApplicationUpdate, ApplicationRead, ApplyRequest, ApplyResponse
)
from app.auth import get_current_user

router = APIRouter(prefix="/api/applications", tags=["Applications"])

@router.get("", response_model=List[ApplicationRead])
def list_applications(
    status_filter: Optional[ApplicationStatus] = Query(None, alias="status", description="Filter by tracker status"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(Application)\
        .options(joinedload(Application.opportunity))\
        .filter(Application.user_id == current_user.id)

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
    db.commit()
    db.refresh(application)
    return application

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

    # Atomic increment — column-side arithmetic avoids a read-modify-write race.
    # Mirrors GET /api/opportunities/{id}/apply so both paths feed /trending.
    opportunity.click_count = Opportunity.click_count + 1

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
