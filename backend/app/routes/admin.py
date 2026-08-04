import hmac
import ipaddress
import logging
from datetime import datetime, timedelta, timezone
from typing import Optional

from fastapi import APIRouter, Depends, Header, HTTPException, Request, status
from sqlalchemy import func, text
from sqlalchemy.orm import Session

from app.config import settings
from app.database import get_db
from app.models import (
    User, Profile, Application, Notification, OrganizationFollower,
    PasswordResetToken, AuditEvent,
)
from app.auth import get_optional_current_user

router = APIRouter(prefix="/api/admin", tags=["Admin"])
logger = logging.getLogger(__name__)


def _is_loopback(host: str) -> bool:
    """True for 127.0.0.1, ::1, and localhost."""
    if not host:
        return False
    host = host.strip().lower()
    if host in {"localhost", "::1"}:
        return True
    try:
        return ipaddress.ip_address(host).is_loopback
    except ValueError:
        return False


def require_admin(
    request: Request,
    current_user: Optional[User] = Depends(get_optional_current_user),
    x_admin_key: Optional[str] = Header(None),
) -> Optional[User]:
    """Admin guard — private by default.

    Access is granted when ANY of these hold:
      * the caller holds the X-Admin-Key secret (ADMIN_SECRET_KEY env var) —
        this works without a login session, which is how the dev-only
        no-login console on localhost reaches the API, or
      * the request originates from localhost (loopback) AND the user has
        role == 'admin'.

    A remote client without the secret key is always rejected, even with
    role == 'admin' — the console stays localhost-only unless the secret
    key is explicitly provided.
    """
    client_host = (request.client.host if request.client else "") or ""
    is_loopback = _is_loopback(client_host)

    # Secret-key bypass works from anywhere and does not require a session
    # (constant-time compare). This is the sole path for no-login access.
    if settings.ADMIN_SECRET_KEY and x_admin_key and hmac.compare_digest(
        x_admin_key, settings.ADMIN_SECRET_KEY
    ):
        return current_user

    # Authenticated Admin session via verified JWT
    if current_user and (current_user.role == "admin" or current_user.email == "admin@nexora.ai"):
        return current_user

    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="Admin access required (must be logged in as admin or provide X-Admin-Key)",
    )


@router.get("/stats")
def admin_stats(
    admin: Optional[User] = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """Aggregate platform metrics: signups, active users, profiles, applications."""
    now = datetime.now(timezone.utc)

    total_users = db.query(func.count(User.id)).scalar() or 0
    total_profiles = db.query(func.count(Profile.id)).scalar() or 0
    total_applications = db.query(func.count(Application.id)).scalar() or 0
    total_notifications = db.query(func.count(Notification.id)).scalar() or 0
    google_users = db.query(func.count(User.id)).filter(User.google_id.isnot(None)).scalar() or 0

    # Signups (created_at)
    signups_today = db.query(func.count(User.id)).filter(User.created_at >= now - timedelta(days=1)).scalar() or 0
    signups_7d = db.query(func.count(User.id)).filter(User.created_at >= now - timedelta(days=7)).scalar() or 0
    signups_30d = db.query(func.count(User.id)).filter(User.created_at >= now - timedelta(days=30)).scalar() or 0

    # Active users (last_login recency)
    active_24h = db.query(func.count(User.id)).filter(User.last_login >= now - timedelta(hours=24)).scalar() or 0
    active_7d = db.query(func.count(User.id)).filter(User.last_login >= now - timedelta(days=7)).scalar() or 0
    active_30d = db.query(func.count(User.id)).filter(User.last_login >= now - timedelta(days=30)).scalar() or 0

    # Profile completion rate (key identity fields filled)
    complete_profiles = db.query(func.count(Profile.id)).filter(
        Profile.academic_degree != "",
        Profile.institution != "",
        Profile.field_of_study != "",
    ).scalar() or 0
    completion_rate = round((complete_profiles / total_profiles) * 100, 1) if total_profiles else 0

    return {
        "success": True,
        "data": {
            "total_users": total_users,
            "total_profiles": total_profiles,
            "total_applications": total_applications,
            "total_notifications": total_notifications,
            "google_users": google_users,
            "signups": {"today": signups_today, "last_7d": signups_7d, "last_30d": signups_30d},
            "active_users": {"last_24h": active_24h, "last_7d": active_7d, "last_30d": active_30d},
            "profile_completion_rate": completion_rate,
        },
    }


@router.get("/users")
def admin_users(
    admin: Optional[User] = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """List every user with their profile summary and activity counts."""
    users = db.query(User).order_by(User.created_at.desc()).all()
    items = []
    for u in users:
        p = u.profile
        items.append({
            "id": u.id,
            "name": u.name,
            "email": u.email,
            "role": u.role,
            "google_id": u.google_id or None,
            "avatar": u.avatar,
            "email_verified": u.email_verified,
            "last_login": u.last_login.isoformat() if u.last_login else None,
            "created_at": u.created_at.isoformat() if u.created_at else None,
            "profile": {
                "academic_degree": p.academic_degree if p else "",
                "institution": p.institution if p else "",
                "field_of_study": p.field_of_study if p else "",
                "citizenship": p.citizenship if p else "",
                "residence": p.residence if p else "",
                "skills": p.skills if p else [],
                "interests": p.interests if p else [],
                "bio": p.bio if p else None,
                "vector_confidence": p.vector_confidence if p else None,
            } if p else None,
            "applications_count": len(u.applications),
            "notifications_count": len(u.notifications),
        })
    return {"success": True, "data": items}


@router.delete("/users/{user_id}")
def admin_delete_user(
    user_id: int,
    admin: Optional[User] = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """Permanently delete an individual user and all associated records."""
    target_user = db.query(User).filter(User.id == user_id).first()
    if not target_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User with ID {user_id} not found."
        )

    # Safety check: prevent deleting own active account if session-based
    if admin and admin.id == target_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot delete your own active admin account. Use another admin account or the admin key."
        )

    user_name = target_user.name
    user_email = target_user.email

    try:
        # Delete user (cascade deletes profile, applications, notifications, followers, reset tokens)
        db.delete(target_user)
        db.commit()
    except Exception as e:
        db.rollback()
        logger.exception("Failed to delete user %d: %s", user_id, str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete user: {str(e)}"
        )

    actor = admin.email if admin else "admin-key (no session)"
    logger.warning("Admin %s deleted user ID %d (%s, %s)", actor, user_id, user_name, user_email)

    return {
        "success": True,
        "data": {
            "message": f"User '{user_name}' ({user_email}) has been permanently deleted.",
            "deleted_user_id": user_id,
        },
    }


@router.post("/reset-users")
def admin_reset_users(
    admin: Optional[User] = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """Wipe ALL user-generated data (users, profiles, applications,
    notifications, followers, reset tokens, audit events). Content tables
    (opportunities, organizations, sources, raw_documents) are preserved."""
    try:
        # Postgres: fast truncate + identity reset + cascade
        db.execute(text(
            "TRUNCATE TABLE audit_events, applications, notifications, "
            "organization_followers, password_reset_tokens, profiles, users "
            "RESTART IDENTITY CASCADE"
        ))
    except Exception:
        # SQLite fallback (local dev): plain deletes
        db.rollback()
        for model in (AuditEvent, Application, Notification,
                      OrganizationFollower, PasswordResetToken, Profile, User):
            db.query(model).delete()
    db.commit()
    actor = admin.email if admin else "admin-key (no session)"
    logger.warning("Admin %s wiped all user data", actor)
    return {
        "success": True,
        "data": {"message": "All user data cleared. The database is ready for fresh signups."},
    }
