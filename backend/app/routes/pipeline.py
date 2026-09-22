from typing import List
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.config import settings
from app.database import get_db
from app.models import PipelineRun, Opportunity, OpportunityStatus, AuditEvent, Source
from app.schemas import PipelineRunRead, OpportunityRead
from app.routes.deps import verify_admin_key
from app.scheduler import (
    scheduled_daily_lifecycle_sweep,
    scheduled_ingest_all_sources,
    pipeline_state,
    scheduler,
)
from app.pipeline.runner import runner

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

@router.get("/status")
def pipeline_status(db: Session = Depends(get_db)):
    """Automation observability: is the pipeline alive, when did it last run,
    and what did it do? Aggregates the existing PipelineRun / AuditEvent
    records plus the in-memory scheduler state — no new tracking infra."""
    now = datetime.now(timezone.utc)
    day_ago = now - timedelta(hours=24)

    last_success = db.query(func.max(PipelineRun.finished_at)).filter(
        PipelineRun.status == "completed"
    ).scalar()
    last_run = db.query(func.max(PipelineRun.started_at)).scalar()

    totals_24h = db.query(
        func.coalesce(func.sum(PipelineRun.new_count), 0),
        func.coalesce(func.sum(PipelineRun.updated_count), 0),
        func.coalesce(func.sum(PipelineRun.duplicate_count), 0),
        func.coalesce(func.sum(PipelineRun.revalidated_count), 0),
        func.coalesce(func.sum(PipelineRun.failed_count), 0),
    ).filter(PipelineRun.started_at >= day_ago).first()

    failed_sources = []
    enabled_sources = db.query(Source).filter(Source.enabled == True).all()
    for source in enabled_sources:
        latest = db.query(PipelineRun).filter(
            PipelineRun.source_id == source.id
        ).order_by(PipelineRun.started_at.desc()).first()
        if latest and latest.status == "failed":
            failed_sources.append({
                "source_id": source.id,
                "source_name": source.name,
                "last_run_at": latest.started_at.isoformat(),
                "error": (latest.error_log or [{}])[0].get("fatal_error", "unknown"),
            })

    last_lifecycle_event = db.query(AuditEvent).filter(
        AuditEvent.event_type == "lifecycle_sweep"
    ).order_by(AuditEvent.created_at.desc()).first()

    status_counts = dict(db.query(Opportunity.status, func.count(Opportunity.id)).group_by(Opportunity.status).all())
    expired = status_counts.get(OpportunityStatus.EXPIRED.value, 0)
    total_opps = sum(status_counts.values())

    return {
        "success": True,
        "data": {
            "currently_running": {
                "ingest": pipeline_state.get("ingest_running", False) or runner.active_runs > 0,
                "lifecycle": pipeline_state.get("lifecycle_running", False),
                "active_source_runs": runner.active_runs,
            },
            "scheduler": {
                "internal_enabled": settings.ENABLE_INTERNAL_SCHEDULER,
                "running": scheduler.running,
                "ingest_interval_hours": settings.INGEST_INTERVAL_HOURS,
                "lifecycle_interval_hours": settings.LIFECYCLE_INTERVAL_HOURS,
                "next_ingest_run": _next_run_time("ingest_job"),
                "next_lifecycle_run": _next_run_time("lifecycle_job"),
            },
            "last_successful_scrape": last_success.isoformat() if last_success else None,
            "last_scrape_attempt": last_run.isoformat() if last_run else None,
            "last_lifecycle_check": (
                last_lifecycle_event.payload if last_lifecycle_event else pipeline_state.get("last_lifecycle")
            ),
            "last_24h": {
                "new_opportunities": int(totals_24h[0]),
                "updated_opportunities": int(totals_24h[1]),
                "duplicates": int(totals_24h[2]),
                "revalidated": int(totals_24h[3]),
                "failed_documents": int(totals_24h[4]),
                "failed_sources": failed_sources,
            },
            "in_memory_last_ingest": pipeline_state.get("last_ingest"),
            "opportunities": {
                "total": total_opps,
                "status_counts": status_counts,
                "expired": expired,
                "never_verified": db.query(Opportunity).filter(
                    Opportunity.last_verified_at == None
                ).count(),
            },
        },
    }


def _next_run_time(job_id: str):
    if not scheduler.running:
        return None
    job = scheduler.get_job(job_id)
    return job.next_run_time.isoformat() if job and job.next_run_time else None

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
