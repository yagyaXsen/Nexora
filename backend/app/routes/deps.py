from fastapi import Header, HTTPException, status
from app.config import settings

def verify_admin_key(x_admin_key: str = Header(None)):
    if settings.ADMIN_SECRET_KEY and x_admin_key != settings.ADMIN_SECRET_KEY:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or missing X-Admin-Key header"
        )
    return True
