"""Authentication routes: register, login, and the current-user endpoint.

Phase 1 is single-profile-aware: registration creates an authenticated User,
while the app continues to use the shared UserProfile (which onboarding
personalizes via PUT /profile/). Per-user profile/tracker isolation is a later
phase — the User.id ↔ UserProfile.user_id link and get_current_profile
dependency are already in place for it.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from .. import crud, schemas, models
from ..database import get_db
from ..auth.security import hash_password, verify_password, create_access_token
from ..auth.deps import get_current_user

router = APIRouter(prefix="/auth", tags=["Auth"])


def _user_me(user: models.User) -> schemas.UserMe:
    return schemas.UserMe(
        id=user.id,
        email=user.email,
        name=user.full_name,
        created_at=user.created_at,
    )


@router.post("/register", response_model=schemas.TokenResponse, status_code=status.HTTP_201_CREATED)
def register(payload: schemas.RegisterRequest, db: Session = Depends(get_db)):
    existing = crud.get_user_by_email(db, payload.email)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email already exists.",
        )

    user = crud.create_user(
        db,
        email=payload.email,
        full_name=payload.name,
        password_hash=hash_password(payload.password),
    )

    token = create_access_token(subject=user.id)
    return schemas.TokenResponse(access_token=token, user=_user_me(user))


@router.post("/login", response_model=schemas.TokenResponse)
def login(payload: schemas.LoginRequest, db: Session = Depends(get_db)):
    user = crud.get_user_by_email(db, payload.email)
    # Verify even when the user is missing-ish to keep the error generic;
    # we never reveal whether the email or the password was wrong.
    if user is None or not verify_password(payload.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password.",
        )
    if user.is_active != "Yes":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This account is disabled.",
        )

    token = create_access_token(subject=user.id)
    return schemas.TokenResponse(access_token=token, user=_user_me(user))


@router.get("/me", response_model=schemas.UserMe)
def me(current_user: models.User = Depends(get_current_user)):
    return _user_me(current_user)
