import logging
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger

from app.config import settings
from app.database import SessionLocal
from app.models import Source
from app.pipeline.runner import runner
from app.pipeline.lifecycle import run_daily_expiry_sweep, check_dead_links

logger = logging.getLogger(__name__)

scheduler = BackgroundScheduler()

def scheduled_ingest_all_sources():
    logger.info("Executing scheduled ingest for all enabled sources...")
    db = SessionLocal()
    try:
        sources = db.query(Source).filter(Source.enabled == True).limit(settings.CRON_MAX_SOURCES).all()
        completed = 0
        for source in sources:
            try:
                runner.run_source(db, source)
                completed += 1
            except Exception as e:
                logger.error(f"Error running scheduled source ID {source.id}: {e}")
        return {"sources_processed": completed}
    finally:
        db.close()

def scheduled_daily_lifecycle_sweep():
    logger.info("Executing scheduled daily lifecycle sweep...")
    db = SessionLocal()
    try:
        expiry = run_daily_expiry_sweep(db)
        dead_links = check_dead_links(db, max_checks=settings.CRON_MAX_DEAD_LINK_CHECKS)
        return {**expiry, "dead_link_count": dead_links}
    except Exception as e:
        logger.error(f"Error during lifecycle sweep: {e}")
    finally:
        db.close()

def start_scheduler():
    if not scheduler.running:
        # Schedule ingestion every day at midnight (or every 6 hours)
        scheduler.add_job(
            scheduled_ingest_all_sources,
            trigger=CronTrigger(hour="0", minute="0"),
            id="daily_ingest_job",
            replace_existing=True
        )
        # Schedule lifecycle sweep every day at 1:00 AM
        scheduler.add_job(
            scheduled_daily_lifecycle_sweep,
            trigger=CronTrigger(hour="1", minute="0"),
            id="daily_lifecycle_job",
            replace_existing=True
        )
        scheduler.start()
        logger.info("APScheduler started successfully.")

def stop_scheduler():
    if scheduler.running:
        scheduler.shutdown(wait=False)
        logger.info("APScheduler stopped.")
