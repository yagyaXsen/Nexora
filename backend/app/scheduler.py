import logging
import threading
from datetime import datetime, timedelta, timezone

from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.interval import IntervalTrigger
from sqlalchemy import func

from app.config import settings
from app.database import SessionLocal
from app.models import Source, PipelineRun, AuditEvent, utc_now
from app.pipeline.runner import runner, fail_orphaned_runs
from app.pipeline.lifecycle import run_daily_expiry_sweep, check_dead_links
from app.publishing.live_feed import publishing_refresh, invalidate_live_feed

logger = logging.getLogger(__name__)

scheduler = BackgroundScheduler()

# ── Observability state (in-process, best-effort) ─────────────────────────────
# Read by GET /api/pipeline/status. Shows what the automation is doing between
# DB writes. Resets on restart by design — durable history lives in
# pipeline_runs / audit_events.
pipeline_state = {
    "ingest_running": False,
    "lifecycle_running": False,
    "publishing_running": False,
    "last_ingest": None,      # {"finished_at", "sources_processed", "sources_failed"}
    "last_lifecycle": None,   # summary dict written by the sweep
    "last_publish": None,     # summary dict written by the publishing refresh
}

# One job of each kind at a time per process. APScheduler's max_instances only
# covers its own triggers; these locks also cover the cron endpoints, e.g. a
# GitHub-Actions retry that arrives while the first (timed-out) call is still
# scraping. A trigger that finds its job running is skipped, not queued.
_job_locks = {
    "ingest": threading.Lock(),
    "lifecycle": threading.Lock(),
    "publishing": threading.Lock(),
}
ALREADY_RUNNING = {"skipped": "already_running"}


def select_sources_for_batch(db, limit: int):
    """Enabled sources, least recently ATTEMPTED first, capped at `limit`.

    Ordering happens in SQL before the LIMIT, so a capped batch rotates
    through every source. It keys on the last attempt (any PipelineRun), not
    last_run_at (last success): a persistently failing source would otherwise
    sort first forever and starve healthy sources.
    """
    last_attempt = (
        db.query(
            PipelineRun.source_id.label("source_id"),
            func.max(PipelineRun.started_at).label("attempted_at"),
        )
        .group_by(PipelineRun.source_id)
        .subquery()
    )
    return (
        db.query(Source)
        .outerjoin(last_attempt, last_attempt.c.source_id == Source.id)
        .filter(Source.enabled == True)
        .order_by(
            last_attempt.c.attempted_at.isnot(None),
            last_attempt.c.attempted_at.asc(),
            Source.id.asc(),
        )
        .limit(limit)
        .all()
    )


def scheduled_ingest_all_sources():
    if not _job_locks["ingest"].acquire(blocking=False):
        logger.info("Scheduled ingest skipped: a batch is already running.")
        return dict(ALREADY_RUNNING)
    logger.info("Executing scheduled ingest for all enabled sources...")
    pipeline_state["ingest_running"] = True
    started = utc_now()
    db = SessionLocal()
    processed = 0
    failed = 0
    skipped = 0
    try:
        fail_orphaned_runs(db)
        sources = select_sources_for_batch(db, settings.CRON_MAX_SOURCES)
        # Double-trigger guard: when the internal scheduler AND the external
        # GitHub-Actions cron are both enabled (or a future deployment runs
        # multiple workers), two batches could fire close together. Skip
        # sources scraped within the minimum window — runs are idempotent,
        # but this avoids redundant network traffic and AI calls. Manual runs
        # via POST /api/sources/{id}/run bypass this guard.
        cutoff = utc_now() - timedelta(hours=settings.MIN_SOURCE_RESCRAPE_HOURS)
        for source in sources:
            last = source.last_run_at
            if last is not None and last.tzinfo is None:
                last = last.replace(tzinfo=timezone.utc)
            if last is not None and last > cutoff:
                skipped += 1
                continue
            try:
                run = runner.run_source(db, source)
                if run.status == "failed":
                    # The source is down (run recorded the error). Count it as
                    # failed, not processed — but keep retrying it in future
                    # batches; transient outages must recover.
                    failed += 1
                else:
                    processed += 1
            except Exception as e:
                db.rollback()
                failed += 1
                logger.error(f"Error running scheduled source ID {source.id}: {e}")
        if skipped:
            logger.info(f"Scheduled ingest skipped {skipped} source(s) scraped within the last {settings.MIN_SOURCE_RESCRAPE_HOURS}h.")
        return {"sources_processed": processed, "sources_failed": failed, "sources_skipped_recent": skipped}
    finally:
        db.close()
        pipeline_state["ingest_running"] = False
        pipeline_state["last_ingest"] = {
            "finished_at": utc_now().isoformat(),
            "started_at": started.isoformat(),
            "sources_processed": processed,
            "sources_failed": failed,
        }
        _job_locks["ingest"].release()


def scheduled_daily_lifecycle_sweep():
    """Expiry sweep + link check. Raises on failure so the cron endpoint can
    report it (APScheduler logs job exceptions)."""
    if not _job_locks["lifecycle"].acquire(blocking=False):
        logger.info("Lifecycle sweep skipped: a sweep is already running.")
        return dict(ALREADY_RUNNING)
    logger.info("Executing scheduled daily lifecycle sweep...")
    pipeline_state["lifecycle_running"] = True
    db = SessionLocal()
    try:
        expiry = run_daily_expiry_sweep(db)
        dead_links = check_dead_links(db)
        summary = {**expiry, **dead_links}
        pipeline_state["last_lifecycle"] = {
            "finished_at": utc_now().isoformat(),
            **summary,
        }
        # Durable record for observability (survives restarts, queryable from
        # /api/pipeline/status).
        try:
            db.add(AuditEvent(
                event_type="lifecycle_sweep",
                payload={"finished_at": utc_now().isoformat(), **summary},
            ))
            db.commit()
        except Exception:
            db.rollback()
            logger.warning("Could not persist lifecycle audit event (non-fatal)")
        return summary
    except Exception as e:
        db.rollback()
        logger.error(f"Error during lifecycle sweep: {e}")
        pipeline_state["last_lifecycle"] = {"finished_at": utc_now().isoformat(), "error": str(e)}
        raise
    finally:
        db.close()
        pipeline_state["lifecycle_running"] = False
        _job_locks["lifecycle"].release()


def scheduled_publishing_refresh():
    """Recompute the published feed and record publishing metrics.

    Visibility is NOT gated on this job — the feed is computed at read time
    (expired/dead/revived records are reflected within the live-feed TTL,
    and the pipeline invalidates the cache after every run). This weekly job
    exists to measure the published catalog, surface its size and churn in
    observability, and keep the publishing cadence explicit and configurable.
    Idempotent: running it twice yields the same feed; only the metrics diff
    baseline moves. Raises on failure (after recording it) so the cron
    endpoint can report it.
    """
    if not _job_locks["publishing"].acquire(blocking=False):
        logger.info("Publishing refresh skipped: a refresh is already running.")
        return dict(ALREADY_RUNNING)
    logger.info("Executing scheduled publishing refresh...")
    pipeline_state["publishing_running"] = True
    db = SessionLocal()
    try:
        # Start from fresh data even if the TTL hasn't expired.
        invalidate_live_feed()
        summary = publishing_refresh(db)
        pipeline_state["last_publish"] = {
            "finished_at": utc_now().isoformat(),
            **summary,
        }
        return summary
    except Exception as e:
        db.rollback()
        logger.error(f"Error during publishing refresh: {e}")
        pipeline_state["last_publish"] = {"finished_at": utc_now().isoformat(), "error": str(e)}
        # Record the failure so it is observable via /api/pipeline/status.
        # The read-time feed stays valid regardless — nothing is corrupted.
        fail_db = SessionLocal()
        try:
            fail_db.add(AuditEvent(event_type="publishing_failure", payload={
                "finished_at": utc_now().isoformat(),
                "error": str(e),
            }))
            fail_db.commit()
        except Exception:
            fail_db.rollback()
            logger.warning("Could not persist publishing failure event (DB unreachable)")
        finally:
            fail_db.close()
        raise
    finally:
        db.close()
        pipeline_state["publishing_running"] = False
        _job_locks["publishing"].release()


def start_scheduler():
    if not scheduler.running:
        now = datetime.now(timezone.utc)

        ingest_start = now
        if not settings.RUN_INGEST_ON_STARTUP:
            ingest_start = now + timedelta(seconds=settings.INGEST_STARTUP_DELAY_SECONDS)

        scheduler.add_job(
            scheduled_ingest_all_sources,
            trigger=IntervalTrigger(hours=settings.INGEST_INTERVAL_HOURS, start_date=ingest_start),
            id="ingest_job",
            replace_existing=True,
            max_instances=1,
            coalesce=True,
            misfire_grace_time=3600,
        )
        if settings.RUN_INGEST_ON_STARTUP:
            scheduler.add_job(
                scheduled_ingest_all_sources,
                next_run_time=now,
                id="ingest_startup_job",
                replace_existing=True,
                max_instances=1,
            )
        scheduler.add_job(
            scheduled_daily_lifecycle_sweep,
            trigger=IntervalTrigger(hours=settings.LIFECYCLE_INTERVAL_HOURS, start_date=now + timedelta(minutes=5)),
            id="lifecycle_job",
            replace_existing=True,
            max_instances=1,
            coalesce=True,
            misfire_grace_time=3600,
        )
        scheduler.add_job(
            scheduled_publishing_refresh,
            trigger=IntervalTrigger(hours=settings.PUBLISH_REFRESH_INTERVAL_HOURS, start_date=now + timedelta(minutes=10)),
            id="publishing_job",
            replace_existing=True,
            max_instances=1,
            coalesce=True,
            misfire_grace_time=3600,
        )
        scheduler.start()
        logger.info(
            f"APScheduler started: ingest every {settings.INGEST_INTERVAL_HOURS}h, "
            f"lifecycle every {settings.LIFECYCLE_INTERVAL_HOURS}h, "
            f"publishing every {settings.PUBLISH_REFRESH_INTERVAL_HOURS}h "
            f"(first ingest at {ingest_start.isoformat()})."
        )

def stop_scheduler():
    if scheduler.running:
        scheduler.shutdown(wait=False)
        logger.info("APScheduler stopped.")
