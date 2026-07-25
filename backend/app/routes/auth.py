import hashlib
import logging
import secrets
from datetime import timedelta

from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.database import get_db
from app.config import settings
from app.models import PasswordResetToken, User, utc_now
from app.schemas import (
    ForgotPasswordRequest, ResetPasswordRequest, TokenResponse, UserRead,
    UserRegister, UserUpdate,
)
from app.services.mailer import get_mailer
from app.services.rate_limit import password_reset_limiter
from app.auth import hash_password, verify_password, create_access_token, get_current_user

router = APIRouter(prefix="/api/auth", tags=["Auth"])
logger = logging.getLogger(__name__)

@router.post("/register", response_model=UserRead, status_code=status.HTTP_201_CREATED)
def register(user_in: UserRegister, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == user_in.email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email already exists"
        )

    user = User(
        name=user_in.name,
        email=user_in.email,
        hashed_password=hash_password(user_in.password)
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user

@router.post("/login", response_model=TokenResponse)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    """Log in with email + password. The `username` form field carries the email."""
    user = db.query(User).filter(User.email == form_data.username).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return TokenResponse(access_token=create_access_token(user.id))

@router.post("/forgot-password")
def forgot_password(
    payload: ForgotPasswordRequest,
    request: Request,
    db: Session = Depends(get_db),
):
    """Always return the same result to avoid turning this endpoint into an
    account-enumeration oracle."""
    email_key = payload.email.lower()
    client_ip = request.client.host if request.client else "unknown"
    allowed = password_reset_limiter.allow(
        f"reset:email:{email_key}", settings.PASSWORD_RESET_RATE_LIMIT,
        settings.PASSWORD_RESET_RATE_WINDOW_SECONDS,
    ) and password_reset_limiter.allow(
        f"reset:ip:{client_ip}", settings.PASSWORD_RESET_RATE_LIMIT,
        settings.PASSWORD_RESET_RATE_WINDOW_SECONDS,
    )
    user = db.query(User).filter(User.email == payload.email).first() if allowed else None
    if user:
        raw_token = secrets.token_urlsafe(32)
        token_hash = hashlib.sha256(raw_token.encode("utf-8")).hexdigest()
        reset_token = PasswordResetToken(
            user_id=user.id,
            token_hash=token_hash,
            expires_at=utc_now() + timedelta(minutes=settings.RESET_TOKEN_EXPIRE_MINUTES),
        )
        db.add(reset_token)
        db.commit()

        reset_url = f"{settings.FRONTEND_URL.rstrip('/')}/reset-password?token={raw_token}"
        try:
            get_mailer().send(
                user.email,
                "Reset your Nexora password",
                f"<p>Use this one-time link to reset your password. It expires in "
                f"{settings.RESET_TOKEN_EXPIRE_MINUTES} minutes.</p>"
                f'<p><a href="{reset_url}">Reset password</a></p>',
            )
        except Exception:
            # Preserve the same response for all email addresses and do not
            # leave a token that was never delivered active in the database.
            logger.exception("Password-reset delivery failed")
            db.delete(reset_token)
            db.commit()
    return {"success": True}

@router.post("/reset-password")
def reset_password(payload: ResetPasswordRequest, db: Session = Depends(get_db)):
    token_hash = hashlib.sha256(payload.token.encode("utf-8")).hexdigest()
    now = utc_now()
    reset_token = db.query(PasswordResetToken).filter(
        PasswordResetToken.token_hash == token_hash,
        PasswordResetToken.used_at.is_(None),
        PasswordResetToken.expires_at >= now,
    ).first()
    if not reset_token:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This password-reset link is invalid, expired, or has already been used.",
        )

    reset_token.user.hashed_password = hash_password(payload.password)
    reset_token.used_at = now
    # A successful reset invalidates any earlier links for the same account.
    db.query(PasswordResetToken).filter(
        PasswordResetToken.user_id == reset_token.user_id,
        PasswordResetToken.id != reset_token.id,
        PasswordResetToken.used_at.is_(None),
    ).update({PasswordResetToken.used_at: now}, synchronize_session=False)
    db.commit()
    return {"success": True}

@router.get("/me", response_model=UserRead)
def read_me(current_user: User = Depends(get_current_user)):
    return current_user

@router.patch("/me", response_model=UserRead)
def update_me(
    update: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if update.name is not None:
        current_user.name = update.name

    if update.new_password is not None:
        if not update.current_password:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="current_password is required to set a new password",
            )
        if not verify_password(update.current_password, current_user.hashed_password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Current password is incorrect",
            )
        current_user.hashed_password = hash_password(update.new_password)

    db.commit()
    db.refresh(current_user)
    return current_user

@router.delete("/me", status_code=status.HTTP_204_NO_CONTENT)
def delete_me(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # cascade="all, delete-orphan" on User.applications removes tracker rows too
    db.delete(current_user)
    db.commit()
    return None
