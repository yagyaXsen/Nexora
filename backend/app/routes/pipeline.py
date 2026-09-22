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
    scheduled_publishing_refresh,
    pipeline_state,
    scheduler,
)
from app.publishing.live_feed import get_live_records
from app.publishing.catalog import catalog as static_catalog
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

@router.post("/cron/publish", dependencies=[Depends(verify_admin_key)])
def trigger_publishing_refresh():
    """External cron entry point for the weekly publishing refresh.

    Idempotent: visibility is computed at read time; this endpoint only
    recomputes the feed and records measured publishing metrics."""
    return {"success": True, "data": scheduled_publishing_refresh()}

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

    last_publish_event = db.query(AuditEvent).filter(
        AuditEvent.event_type == "publishing_refresh"
    ).order_by(AuditEvent.created_at.desc()).first()

    # Measured live: what the publishing layer would publish right now.
    try:
        live_records = get_live_records(db)
        published_count = len(live_records)
        published_verified = sum(
            1 for r in live_records if (r.verification_status or "").startswith("officially")
        )
        static_published_count = len(static_catalog.records())
    except Exception:
        published_count = None
        published_verified = None
        static_published_count = None

    # ── Source & scrape observability (all measured, never fabricated) ──────
    last_failed_scrape = db.query(func.max(PipelineRun.started_at)).filter(
        PipelineRun.status == "failed"
    ).scalar()
    enabled_source_count = db.query(func.count(Source.id)).filter(Source.enabled == True).scalar() or 0
    succeeded_sources_24h = db.query(
        func.count(func.distinct(PipelineRun.source_id))
    ).filter(
        PipelineRun.started_at >= day_ago, PipelineRun.status == "completed"
    ).scalar() or 0

    # ── 24h lifecycle + verification counts (from recorded audit events) ────
    lifecycle_events_24h = db.query(AuditEvent).filter(
        AuditEvent.event_type == "lifecycle_sweep",
        AuditEvent.created_at >= day_ago,
    ).all()
    expired_24h = sum((e.payload or {}).get("expired_count", 0) for e in lifecycle_events_24h)
    revived_24h = sum((e.payload or {}).get("revived_count", 0) for e in lifecycle_events_24h)
    verified_24h = db.query(func.count(Opportunity.id)).filter(
        Opportunity.last_verified_at >= day_ago
    ).scalar() or 0

    publishing_failures_24h = db.query(func.count(AuditEvent.id)).filter(
        AuditEvent.event_type == "publishing_failure",
        AuditEvent.created_at >= day_ago,
    ).scalar() or 0

    # ── Per-source health (from recorded PipelineRun history) ────────────────
    recent_runs = db.query(PipelineRun).order_by(
        PipelineRun.started_at.desc()
    ).limit(500).all()
    runs_by_source: dict = {}
    for r in recent_runs:
        runs_by_source.setdefault(r.source_id, []).append(r)  # newest first

    source_health = []
    for source in db.query(Source).order_by(Source.id).all():
        runs = runs_by_source.get(source.id, [])
        src_last_attempt = runs[0].started_at if runs else None
        src_last_success = next(
            (r.finished_at or r.started_at for r in runs if r.status == "completed"), None
        )
        src_last_failure = next((r.started_at for r in runs if r.status == "failed"), None)
        consecutive_failures = 0
        for r in runs:
            if r.status == "failed":
                consecutive_failures += 1
            else:
                break
        last_error = None
        if runs and runs[0].status == "failed" and runs[0].error_log:
            last_error = (runs[0].error_log[0] or {}).get("fatal_error")

        if not source.enabled:
            health = "disabled"
        elif not runs:
            health = "never_run"
        elif consecutive_failures == 0:
            health = "healthy"
        elif consecutive_failures >= settings.DEAD_LINK_FAILURE_THRESHOLD:
            health = "persistently_failing"
        else:
            health = "temporarily_failing"

        source_health.append({
            "source_id": source.id,
            "name": source.name,
            "type": source.type,
            "enabled": source.enabled,
            "health": health,
            "last_attempt": src_last_attempt.isoformat() if src_last_attempt else None,
            "last_success": src_last_success.isoformat() if src_last_success else None,
            "last_failure": src_last_failure.isoformat() if src_last_failure else None,
            "consecutive_failures": consecutive_failures,
            "last_error": last_error,
        })

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
                "next_publishing_run": _next_run_time("publishing_job"),
            },
            "last_successful_scrape": last_success.isoformat() if last_success else None,
            "last_failed_scrape": last_failed_scrape.isoformat() if last_failed_scrape else None,
            "last_scrape_attempt": last_run.isoformat() if last_run else None,
            "sources": {
                "enabled_count": enabled_source_count,
                "succeeded_24h": succeeded_sources_24h,
                "failed_24h": len(failed_sources),
                "detail": source_health,
            },
            "last_lifecycle_check": (
                last_lifecycle_event.payload if last_lifecycle_event else pipeline_state.get("last_lifecycle")
            ),
            "publishing": {
                "currently_running": pipeline_state.get("publishing_running", False),
                "refresh_interval_hours": settings.PUBLISH_REFRESH_INTERVAL_HOURS,
                "next_publishing_run": _next_run_time("publishing_job"),
                "last_publish": (
                    last_publish_event.payload if last_publish_event else pipeline_state.get("last_publish")
                ),
                "published_count_live": published_count,
                "published_officially_verified": published_verified,
                "published_count_static": static_published_count,
                "publishing_failures_24h": publishing_failures_24h,
            },
            "last_24h": {
                "new_opportunities": int(totals_24h[0]),
                "updated_opportunities": int(totals_24h[1]),
                "duplicates": int(totals_24h[2]),
                "revalidated": int(totals_24h[3]),
                "verified_opportunities": verified_24h,
                "expired": expired_24h,
                "revived": revived_24h,
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
