import logging
from datetime import timedelta
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Request, status
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import ContactMessage, User, utc_now
from app.auth import get_optional_current_user
from app.config import settings
from app.services.mailer import get_mailer

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/contact", tags=["Contact"])


class ContactIn(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    email: EmailStr
    subject: str = Field(default="General Inquiry", max_length=255)
    message: str = Field(min_length=1, max_length=10000)


class ContactOut(BaseModel):
    id: int
    status: str
    message: str


@router.post("", response_model=ContactOut, status_code=status.HTTP_201_CREATED)
def submit_contact(
    payload: ContactIn,
    request: Request,
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: Session = Depends(get_db),
):
    """Persist a contact-form submission and deliver it via the mailer.

    The row is written first so a message is never lost even if mail delivery
    fails (e.g. SMTP not configured). Mail delivery is best-effort.
    """
    # Basic abuse guards. Per-IP is approximated by email here (we don't store
    # the client IP), plus a coarse global cap over a rolling 10-minute window.
    ip = (request.client.host if request.client else "") or "unknown"
    window_start = utc_now() - timedelta(minutes=10)
    recent_from_same = db.query(ContactMessage).filter(
        ContactMessage.email == payload.email.strip(),
        ContactMessage.created_at >= window_start,
    ).count()
    if recent_from_same >= 5:
        raise HTTPException(
            status_code=429, detail="Too many messages from this address. Try again later."
        )
    recent_global = db.query(ContactMessage).filter(
        ContactMessage.created_at >= window_start
    ).count()
    if recent_global > 1000:
        raise HTTPException(status_code=429, detail="Too many messages. Try again later.")

    row = ContactMessage(
        name=payload.name.strip(),
        email=payload.email.strip(),
        subject=payload.subject.strip() or "General Inquiry",
        message=payload.message.strip(),
        user_id=current_user.id if current_user else None,
    )
    db.add(row)
    db.commit()
    db.refresh(row)

    # Best-effort email delivery (ConsoleMailer logs locally; SmtpMailer sends).
    try:
        mailer = get_mailer()
        html = (
            f"<h2>New Nexora contact message</h2>"
            f"<p><b>Name:</b> {row.name}</p>"
            f"<p><b>Email:</b> {row.email}</p>"
            f"<p><b>Subject:</b> {row.subject}</p>"
            f"<p><b>From IP:</b> {ip}</p>"
            f"<hr><p>{row.message}</p>"
        )
        mailer.send(
            to=settings.CONTACT_EMAIL or settings.MAIL_FROM or "aarongangwar@gmail.com",
            subject=f"[Nexora Contact] {row.subject} — {row.name}",
            html=html,
        )
    except Exception as e:
        logger.warning(f"Contact mail delivery failed for message {row.id}: {e}")

    return ContactOut(id=row.id, status="received", message="Message received. We'll get back to you shortly.")
