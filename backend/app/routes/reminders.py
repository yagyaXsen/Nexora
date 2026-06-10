from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timedelta, date
from .. import crud, schemas, models
from ..database import get_db

router = APIRouter(prefix="/reminders", tags=["Reminders"])

@router.get("/upcoming", response_model=List[schemas.Reminder])
def get_upcoming_reminders(db: Session = Depends(get_db)):
    """Get upcoming deadline reminders for the user's pinned applications."""
    # Get user profile for reminder preferences
    profile = crud.get_user_profile(db)
    if not profile:
        raise HTTPException(status_code=404, detail="User profile not found")

    # Get all applications with their opportunities
    applications = crud.get_applications(db)

    # Filter for applications with upcoming deadlines
    upcoming_reminders = []
    today = datetime.now().date()

    for app in applications:
        if app.opportunity.deadline:
            days_until_deadline = (app.opportunity.deadline - today).days
            # Check if deadline is within the next 30 days
            if 0 <= days_until_deadline <= 30:
                # Create reminder entry
                reminder = schemas.Reminder(
                    id=app.id,
                    opportunity_id=app.opportunity_id,
                    title=app.opportunity.title,
                    organization=app.opportunity.organization,
                    deadline=app.opportunity.deadline,
                    days_until_deadline=days_until_deadline,
                    priority=app.priority,
                    status=app.status
                )
                upcoming_reminders.append(reminder)

    # Sort by days until deadline
    upcoming_reminders.sort(key=lambda x: x.days_until_deadline)
    return upcoming_reminders

@router.get("/overdue", response_model=List[schemas.Reminder])
def get_overdue_reminders(db: Session = Depends(get_db)):
    """Get overdue deadline reminders for the user's pinned applications."""
    # Get user profile for reminder preferences
    profile = crud.get_user_profile(db)
    if not profile:
        raise HTTPException(status_code=404, detail="User profile not found")

    # Get all applications with their opportunities
    applications = crud.get_applications(db)

    # Filter for applications with overdue deadlines
    overdue_reminders = []
    today = datetime.now().date()

    for app in applications:
        if app.opportunity.deadline:
            days_until_deadline = (app.opportunity.deadline - today).days
            # Check if deadline has passed
            if days_until_deadline < 0:
                # Create reminder entry
                reminder = schemas.Reminder(
                    id=app.id,
                    opportunity_id=app.opportunity_id,
                    title=app.opportunity.title,
                    organization=app.opportunity.organization,
                    deadline=app.opportunity.deadline,
                    days_until_deadline=days_until_deadline,
                    priority=app.priority,
                    status=app.status
                )
                overdue_reminders.append(reminder)

    return overdue_reminders