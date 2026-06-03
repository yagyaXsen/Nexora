from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from .. import crud, schemas, models
from ..database import get_db

router = APIRouter(prefix="/profile", tags=["Profile"])

@router.get("/", response_model=schemas.UserProfile)
def read_profile(db: Session = Depends(get_db)):
    """Fetch the active user profile, creating and seeding a default one if none exists."""
    profile = crud.get_user_profile(db)
    if not profile:
        # Create a default user profile to ensure matching recommendations are active
        default_profile = schemas.UserProfileCreate(
            name="Dr. Julian Sterling",
            email="julian.sterling@ethz.ch",
            bio="Post-doctoral researcher in Quantum Computing & Artificial Intelligence at ETH Zürich. Focused on scalable quantum algorithms and neural network architectures.",
            academic_status="Postdoc / Researcher",
            university="ETH Zürich",
            verified_academic_id="ETH-8849-STERLING",
            research_interests=["Quantum Computing", "AI", "Machine Learning", "Physics", "Computer Science"],
            base_city="Zürich",
            willing_to_relocate="Yes",
            preferred_regions=["Europe", "Switzerland", "North America", "United Kingdom"]
        )
        profile = crud.create_user_profile(db, default_profile)
    return profile

@router.put("/", response_model=schemas.UserProfile)
def update_profile(profile_update: schemas.UserProfileUpdate, db: Session = Depends(get_db)):
    """Update active user profile."""
    profile = crud.get_user_profile(db)
    if not profile:
        default_profile = schemas.UserProfileCreate(
            name="Dr. Julian Sterling",
            email="julian.sterling@ethz.ch",
            bio="Post-doctoral researcher in Quantum Computing & Artificial Intelligence at ETH Zürich. Focused on scalable quantum algorithms and neural network architectures.",
            academic_status="Postdoc / Researcher",
            university="ETH Zürich",
            verified_academic_id="ETH-8849-STERLING",
            research_interests=["Quantum Computing", "AI", "Machine Learning", "Physics", "Computer Science"],
            base_city="Zürich",
            willing_to_relocate="Yes",
            preferred_regions=["Europe", "Switzerland", "North America", "United Kingdom"]
        )
        profile = crud.create_user_profile(db, default_profile)
        
    updated = crud.update_user_profile(db, profile_update)
    if not updated:
        raise HTTPException(status_code=400, detail="Profile update failed")
    return updated
