from typing import List, Optional
from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload

import logging
from app.database import get_db
from app.models import User, Profile, Application, Opportunity, Notification, OpportunityStatus, utc_now
from app.schemas import UserRead, ProfileRead, ProfileUpdate, DashboardSummary
from app.auth import get_current_user

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/profile", tags=["Profile"])


@router.get("/me", response_model=UserRead)
def get_my_profile(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Return the authenticated user along with their embedded profile."""
    user = db.query(User).options(joinedload(User.profile)).filter(User.id == current_user.id).first()
    return user


@router.patch("/me", response_model=ProfileRead)
def update_my_profile(
    payload: ProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Upsert the candidate profile for the current user."""
    profile = db.query(Profile).filter(Profile.user_id == current_user.id).first()

    if not profile:
        profile = Profile(user_id=current_user.id)
        db.add(profile)

    update_data = payload.model_dump(exclude_unset=True, exclude_none=True)
    # Allow updating user.name via full_name field
    if "full_name" in update_data:
        current_user.name = update_data.pop("full_name")

    for key, value in update_data.items():
        if hasattr(profile, key):
            setattr(profile, key, value)

    db.commit()
    db.refresh(profile)
    return profile


@router.get("/dashboard", response_model=DashboardSummary)
def get_dashboard_summary(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Aggregate dashboard summary metrics for the current user."""
    now = datetime.now(timezone.utc)
    window_end = now + timedelta(days=14)

    all_apps = db.query(Application).filter(Application.user_id == current_user.id).all()

    saved_count = len(all_apps)
    applied_statuses = {"Applied", "Assessment", "Interview", "Offer", "Accepted"}
    applied_count = sum(1 for a in all_apps if a.status in applied_statuses)

    upcoming_count = db.query(Application)\
        .join(Opportunity, Application.opportunity_id == Opportunity.id)\
        .filter(
            Application.user_id == current_user.id,
            Application.status.notin_(["Accepted", "Rejected", "Archived"]),
            Opportunity.deadline.isnot(None),
            Opportunity.deadline >= now,
            Opportunity.deadline <= window_end,
        ).count()

    total_indexed = db.query(Opportunity).filter(
        Opportunity.status.in_([OpportunityStatus.ACTIVE.value, OpportunityStatus.EXPIRING_SOON.value]),
        Opportunity.needs_review == False
    ).count()

    yesterday = now - timedelta(days=1)
    new_today = db.query(Opportunity).filter(
        Opportunity.created_at >= yesterday,
        Opportunity.needs_review == False
    ).count()

    # Real personalized signal count: rank the verified catalog against this
    # user's profile and count how many records score above the meaningful
    # threshold (a strong focus/domain overlap). Falls back to 0 for a profile
    # with no signals, never to the saved-apps count.
    ai_matched_count = 0
    try:
        from app.publishing.catalog import catalog

        focus_terms = []
        skills = []
        degree = None
        countries = []
        profile = current_user.profile if hasattr(current_user, "profile") else None
        if profile:
            focus_terms = [
                *(profile.interests or []),
                profile.field_of_study or "",
            ]
            skills = list(profile.skills or [])
            degree = profile.academic_degree
            countries = [
                *(profile.target_countries or []),
                profile.residence or "",
                profile.citizenship or "",
            ]
        focus_terms = [t for t in focus_terms if t]
        skills = [s for s in skills if s]
        countries = [c for c in countries if c]
        if focus_terms or skills or degree or countries:
            ranked, _focus = catalog.match_profile(
                focus_terms=focus_terms,
                skills=skills,
                degree=degree,
                countries=countries,
                limit=1000,
            )
            ai_matched_count = sum(1 for _opp, score, _reasons in ranked if score >= 30)
    except Exception:
        logger.exception("ai_matched_count computation failed")

    return DashboardSummary(
        ai_matched_count=ai_matched_count,
        saved_count=saved_count,
        applied_count=applied_count,
        upcoming_deadlines_count=upcoming_count,
        total_indexed=total_indexed,
        new_today=new_today,
    )
