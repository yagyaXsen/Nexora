from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import PipelineRun, Opportunity, OpportunityStatus
from app.schemas import PipelineRunRead, OpportunityRead
from app.routes.deps import verify_admin_key
from app.scheduler import scheduled_daily_lifecycle_sweep, scheduled_ingest_all_sources

router = APIRouter(prefix="/api/pipeline", tags=["Pipeline"])

@router.post("/cron/ingest", dependencies=[Depends(verify_admin_key)])
def trigger_scheduled_ingest():
    """External cron entry point for hosts that sleep when idle."""
    return {"success": True, "data": scheduled_ingest_all_sources()}

@router.post("/cron/lifecycle", dependencies=[Depends(verify_admin_key)])
def trigger_lifecycle_sweep():
    """External cron entry point for lifecycle maintenance."""
    return {"success": True, "data": scheduled_daily_lifecycle_sweep()}

@router.get("/runs", response_model=List[PipelineRunRead])
def list_pipeline_runs(limit: int = 50, db: Session = Depends(get_db)):
    return db.query(PipelineRun).order_by(PipelineRun.started_at.desc()).limit(limit).all()

@router.get("/review", response_model=List[OpportunityRead])
def get_review_queue(db: Session = Depends(get_db)):
    return db.query(Opportunity).filter(Opportunity.needs_review == True).order_by(Opportunity.created_at.desc()).all()

@router.post("/review/{id}/approve", response_model=OpportunityRead, dependencies=[Depends(verify_admin_key)])
def approve_review_item(id: int, db: Session = Depends(get_db)):
    opp = db.query(Opportunity).filter(Opportunity.id == id).first()
    if not opp:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Opportunity ID {id} not found")
    
    opp.needs_review = False
    db.commit()
    db.refresh(opp)
    return opp

@router.post("/review/{id}/reject", status_code=status.HTTP_204_NO_CONTENT, dependencies=[Depends(verify_admin_key)])
def reject_review_item(id: int, db: Session = Depends(get_db)):
    opp = db.query(Opportunity).filter(Opportunity.id == id).first()
    if not opp:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Opportunity ID {id} not found")
    
    db.delete(opp)
    db.commit()
    return None
