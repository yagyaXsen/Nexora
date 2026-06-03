from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID
from .. import crud, schemas
from ..database import get_db

router = APIRouter(prefix="/applications", tags=["Applications"])

@router.get("/", response_model=List[schemas.ApplicationResponse])
def read_applications(db: Session = Depends(get_db)):
    """Retrieve all saved opportunities in the application tracker, populated with opportunity info."""
    return crud.get_applications(db)


@router.post("/", response_model=schemas.ApplicationResponse, status_code=status.HTTP_201_CREATED)
def create_application(
    app_in: schemas.ApplicationCreate,
    db: Session = Depends(get_db)
):
    """Add a new opportunity to the application tracker."""
    # 1. Verify opportunity exists
    db_opp = crud.get_opportunity(db, opportunity_id=app_in.opportunity_id)
    if not db_opp:
        raise HTTPException(status_code=404, detail="Opportunity not found")
        
    # 2. Create tracker application
    db_app = crud.create_application(db, application=app_in)
    
    # Return populated application response
    return db_app


@router.put("/{application_id}", response_model=schemas.ApplicationResponse)
def update_application(
    application_id: UUID,
    app_update: schemas.ApplicationUpdate,
    db: Session = Depends(get_db)
):
    """Update details of an application (status, notes, priority, applied date)."""
    db_app = crud.update_application(db, application_id=application_id, app_update=app_update)
    if not db_app:
        raise HTTPException(status_code=404, detail="Application tracker record not found")
    return db_app


@router.delete("/{application_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_application(application_id: UUID, db: Session = Depends(get_db)):
    """Remove an opportunity from the tracker."""
    success = crud.delete_application(db, application_id=application_id)
    if not success:
        raise HTTPException(status_code=404, detail="Application tracker record not found")
    return None
