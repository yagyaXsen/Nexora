from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import User, Organization, OrganizationFollower
from app.schemas import OrganizationRead
from app.auth import get_current_user

router = APIRouter(prefix="/api/organizations", tags=["Organizations"])


@router.get("", response_model=List[OrganizationRead])
def list_organizations(
    q: Optional[str] = Query(None, description="Search by name or category"),
    db: Session = Depends(get_db),
):
    query = db.query(Organization)
    if q:
        pattern = f"%{q}%"
        query = query.filter(
            Organization.name.ilike(pattern) |
            Organization.category.ilike(pattern) |
            Organization.headquarters.ilike(pattern)
        )
    return query.order_by(Organization.follower_count.desc()).all()


@router.get("/{slug_or_id}", response_model=OrganizationRead)
def get_organization(slug_or_id: str, db: Session = Depends(get_db)):
    if slug_or_id.isdigit():
        org = db.query(Organization).filter(Organization.id == int(slug_or_id)).first()
    else:
        org = db.query(Organization).filter(Organization.slug == slug_or_id).first()
    if not org:
        raise HTTPException(status_code=404, detail=f"Organization '{slug_or_id}' not found")
    return org


@router.post("/{org_id}/follow", status_code=status.HTTP_201_CREATED)
def follow_organization(
    org_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    org = db.query(Organization).filter(Organization.id == org_id).first()
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")

    existing = db.query(OrganizationFollower).filter(
        OrganizationFollower.user_id == current_user.id,
        OrganizationFollower.organization_id == org_id
    ).first()
    if existing:
        return {"success": True, "following": True, "follower_count": org.follower_count}

    follower = OrganizationFollower(user_id=current_user.id, organization_id=org_id)
    db.add(follower)
    org.follower_count += 1
    db.commit()
    return {"success": True, "following": True, "follower_count": org.follower_count}


@router.delete("/{org_id}/follow", status_code=status.HTTP_200_OK)
def unfollow_organization(
    org_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    org = db.query(Organization).filter(Organization.id == org_id).first()
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")

    existing = db.query(OrganizationFollower).filter(
        OrganizationFollower.user_id == current_user.id,
        OrganizationFollower.organization_id == org_id
    ).first()
    if existing:
        db.delete(existing)
        org.follower_count = max(0, org.follower_count - 1)
        db.commit()

    return {"success": True, "following": False, "follower_count": org.follower_count}


@router.get("/{org_id}/following")
def check_following(
    org_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    existing = db.query(OrganizationFollower).filter(
        OrganizationFollower.user_id == current_user.id,
        OrganizationFollower.organization_id == org_id
    ).first()
    return {"following": bool(existing)}
