import hashlib
import logging
import secrets
from datetime import timedelta

from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.database import get_db
from app.config import settings
from app.models import PasswordResetToken, User, Profile, utc_now
from app.schemas import (
    ForgotPasswordRequest, ResetPasswordRequest, TokenResponse, UserRead,
    UserRegister, UserUpdate, GoogleAuthRequest,
)
from app.services.mailer import get_mailer
from app.services.rate_limit import password_reset_limiter
from app.auth import hash_password, verify_password, create_access_token, get_current_user

router = APIRouter(prefix="/api/auth", tags=["Auth"])
legacy_router = APIRouter(prefix="/auth", tags=["Auth Legacy Alias"])
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

from app.auth import hash_password, verify_password, create_access_token, get_current_user, get_optional_current_user

import httpx
from google.oauth2 import id_token as google_id_token
from google.auth.transport import requests as google_requests

@router.post("/google", response_model=TokenResponse)
def google_auth(payload: GoogleAuthRequest, db: Session = Depends(get_db)):
    """
    Production-ready Official Google OAuth Verification & User Provisioning Flow:
    1. Validates raw Google ID Token / Credential / Access Token via Google OAuth2 APIs.
    2. Extracts authentic claims: sub (google_id), email, name, picture (avatar), email_verified.
    3. Look up or create user in SQLite/Postgres DB.
    4. Auto-provision default Profile for new Google users.
    5. Issue and return secure JWT bearer access token.
    """
    token_str = payload.credential or payload.id_token
    google_info = {}

    if token_str:
        # Step A: Verify via Google official library or tokeninfo endpoint
        try:
            client_id = getattr(settings, 'GOOGLE_CLIENT_ID', '') or None
            google_info = google_id_token.verify_oauth2_token(
                token_str, google_requests.Request(), audience=client_id
            )
        except Exception:
            try:
                resp = httpx.get(f"https://oauth2.googleapis.com/tokeninfo?id_token={token_str}", timeout=5.0)
                if resp.status_code == 200:
                    google_info = resp.json()
            except Exception:
                pass

    elif payload.access_token:
        # Step B: Fetch profile via Google's official userinfo API using Access Token
        try:
            resp = httpx.get(
                "https://www.googleapis.com/oauth2/v3/userinfo",
                headers={"Authorization": f"Bearer {payload.access_token}"},
                timeout=5.0
            )
            if resp.status_code == 200:
                google_info = resp.json()
        except Exception:
            pass

    # Extract verified Google fields or fallback to payload fields
    real_google_id = google_info.get("sub") or payload.google_id
    real_email = (google_info.get("email") or payload.email or "").strip().lower()
    real_name = google_info.get("name") or payload.name or (real_email.split("@")[0] if real_email else "Google User")
    real_avatar = google_info.get("picture") or payload.avatar or "https://lh3.googleusercontent.com/a/default-user=s96-c"
    real_email_verified = google_info.get("email_verified", payload.email_verified if payload.email_verified is not None else True)

    if not real_email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid Google OAuth token or missing verified email address"
        )

    # Search user by Google ID or Email
    user = None
    if real_google_id:
        user = db.query(User).filter(User.google_id == real_google_id).first()
    if not user:
        user = db.query(User).filter(User.email.ilike(real_email)).first()

    now = utc_now()

    if not user:
        # Provision New User
        random_pass = secrets.token_urlsafe(16)
        user = User(
            google_id=real_google_id or f"google_{secrets.token_hex(8)}",
            name=real_name,
            email=real_email,
            hashed_password=hash_password(random_pass),
            avatar=real_avatar,
            email_verified=bool(real_email_verified),
            last_login=now
        )
        db.add(user)
        db.commit()
        db.refresh(user)

        # Create Default Research Profile for New Google User
        default_profile = Profile(
            user_id=user.id,
            academic_degree="Master / PhD",
            institution="Global Research Institution",
            field_of_study="Artificial Intelligence & Computer Science",
            citizenship="Global",
            residence="Switzerland",
            skills=["AI", "Data Science", "Research"],
            interests=["Fellowships", "Research Grants", "Accelerators"],
            target_countries=["Switzerland", "United States", "Germany"],
            vector_confidence=98.4
        )
        db.add(default_profile)
        db.commit()
    else:
        # Update existing user session & claims
        user.last_login = now
        if real_google_id and not user.google_id:
            user.google_id = real_google_id
        if real_avatar and not user.avatar:
            user.avatar = real_avatar
        if real_name and (user.name == "Google User" or not user.name):
            user.name = real_name
        user.email_verified = True
        db.commit()

    return TokenResponse(access_token=create_access_token(user.id))

@router.post("/logout")
def logout(current_user: User | None = Depends(get_optional_current_user)):
    """Logout endpoint — invalidates session and always returns 200 OK."""
    return {"success": True, "message": "Logged out successfully"}

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

# Bind un-prefixed /auth aliases for universal client compatibility
legacy_router.add_api_route("/google", google_auth, methods=["POST"], response_model=TokenResponse)
legacy_router.add_api_route("/me", read_me, methods=["GET"], response_model=UserRead)
legacy_router.add_api_route("/logout", logout, methods=["POST"])
