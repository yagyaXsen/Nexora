import hmac
from typing import Optional

from fastapi import Header, HTTPException, status
from app.config import settings


def admin_key_matches(provided: Optional[str]) -> bool:
    """Constant-time check of an X-Admin-Key value. Fails closed: with no
    ADMIN_SECRET_KEY configured, no key is ever accepted."""
    expected = settings.ADMIN_SECRET_KEY
    if not expected or not provided:
        return False
    return hmac.compare_digest(provided.encode("utf-8"), expected.encode("utf-8"))


def verify_admin_key(x_admin_key: Optional[str] = Header(None)):
    if not admin_key_matches(x_admin_key):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or missing X-Admin-Key header"
        )
    return True
