"""FastAPI dependencies for resolving the current authenticated user."""
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

from .. import models
from ..database import get_db
from .security import decode_access_token

# auto_error=False so we can raise our own 401 with a clean message and the
# correct WWW-Authenticate header.
bearer_scheme = HTTPBearer(auto_error=False)

_CREDENTIALS_EXC = HTTPException(
    status_code=status.HTTP_401_UNAUTHORIZED,
    detail="Could not validate credentials",
    headers={"WWW-Authenticate": "Bearer"},
)


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> models.User:
    if credentials is None or not credentials.credentials:
        raise _CREDENTIALS_EXC

    subject = decode_access_token(credentials.credentials)
    if subject is None:
        raise _CREDENTIALS_EXC

    try:
        user_id = int(subject)
    except (TypeError, ValueError):
        raise _CREDENTIALS_EXC

    user = db.query(models.User).filter(models.User.id == user_id).first()
    if user is None or user.is_active != "Yes":
        raise _CREDENTIALS_EXC

    return user


def get_current_profile(
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> models.UserProfile:
    """The profile linked to the current user, creating a minimal one on first
    access so onboarding / recommendations have something to write to."""
    profile = (
        db.query(models.UserProfile)
        .filter(models.UserProfile.user_id == user.id)
        .first()
    )
    if profile is None:
        profile = models.UserProfile(
            user_id=user.id,
            name=user.full_name or user.email.split("@")[0],
            email=user.email,
            research_interests=[],
            preferred_regions=[],
        )
        db.add(profile)
        db.commit()
        db.refresh(profile)
    return profile
