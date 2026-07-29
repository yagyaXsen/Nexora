"""
Nexora — Startup Lifecycle
===========================
Runs when the backend boots: ensure the database schema is current,
seed initial data, and backfill slugs for any opportunities missing them.

On Render free tier the database is a fresh Postgres (Neon), so the
migration MUST run before any request handler touches the tables.
"""

import logging
from alembic.config import Config as AlembicConfig
from alembic import command as alembic_command
from sqlalchemy import inspect

from app.config import settings
from app.database import engine, SessionLocal

logger = logging.getLogger(__name__)


def _restore_root_logger(
    root: logging.Logger,
    level: int,
    handlers: list[logging.Handler],
    propagate: bool,
) -> None:
    """Restore a previously saved root logger state."""
    root.setLevel(level)
    root.handlers.clear()
    for h in handlers:
        root.addHandler(h)
    root.propagate = propagate


def _save_root_logger() -> tuple:
    """Return (level, handlers_copy, propagate) for the root logger."""
    root = logging.getLogger()
    return root.level, root.handlers[:], root.propagate


def _try_alembic_upgrade() -> bool:
    """Run alembic upgrade head. Returns True on success.

    If alembic fails (due to schema conflicts, missing tables, or any other
    reason) we log the full traceback and return False so the caller can
    fall back to create_all + stamp.
    """
    saved = _save_root_logger()

    alembic_cfg = AlembicConfig("alembic.ini")
    alembic_cfg.set_main_option("sqlalchemy.url", settings.DATABASE_URL)
    alembic_cfg.attributes["skip_fileconfig"] = True

    try:
        alembic_command.upgrade(alembic_cfg, "head")
        _restore_root_logger(logging.getLogger(), *saved)
        logger.info("Alembic migrations up to date.")
        return True
    except Exception:
        _restore_root_logger(logging.getLogger(), *saved)
        logger.exception("Alembic upgrade failed — falling back to create_all + stamp")
        return False


def _create_all_and_stamp() -> bool:
    """Create ALL tables from models and stamp alembic head.

    Uses Base.metadata.create_all() which is idempotent — it skips tables
    that already exist. Then stamps the alembic head so future deploy cycles
    that use alembic upgrade directly will find a consistent revision.
    """
    from app.database import Base

    Base.metadata.create_all(bind=engine)
    logger.info("All tables created / verified via Base.metadata.create_all.")

    # Stamp alembic head so the migration chain is consistent
    try:
        alembic_cfg = AlembicConfig("alembic.ini")
        alembic_cfg.set_main_option("sqlalchemy.url", settings.DATABASE_URL)
        alembic_cfg.attributes["skip_fileconfig"] = True
        saved = _save_root_logger()
        alembic_command.stamp(alembic_cfg, "head")
        _restore_root_logger(logging.getLogger(), *saved)
        logger.info("Alembic stamped at head.")
    except Exception:
        logger.warning("Could not stamp alembic head (non-fatal — app will still boot).")

    return True


def run_migrations() -> bool:
    """Ensure the database schema is current.

    First tries alembic upgrade head (handles the migration chain cleanly).
    If that fails (e.g., NoInspectionAvailable because model metadata has
    tables not yet in the migration chain), falls back to
    Base.metadata.create_all() + alembic stamp head.
    """
    if not _has_table("alembic_version"):
        logger.info("No alembic_version table found — will stamp after setup.")

    if _try_alembic_upgrade():
        return True

    logger.warning("Alembic upgrade failed — using create_all fallback.")
    return _create_all_and_stamp()


def _has_table(table_name: str) -> bool:
    try:
        inspector = inspect(engine)
        return table_name in inspector.get_table_names()
    except Exception:
        return False


def seed_initial_data() -> int:
    """Insert seed sources and seed opportunities if the DB is empty.

    Returns the number of seed opportunities inserted.
    """
    db = SessionLocal()
    try:
        # ── Seed sources ────────────────────────────────────────────────
        from app.models import Source, SourceType

        seed_sources = [
            {
                "name": "CERN Careers Portal",
                "type": SourceType.HTML.value,
                "url": "https://careers.cern/",
                "config": {"category_hint": "fellowship"},
                "enabled": True,
                "schedule": "daily",
            },
            {
                "name": "DAAD Scholarship Database",
                "type": SourceType.HTML.value,
                "url": "https://www.daad.de/en/study-and-research-in-germany/scholarships/",
                "config": {"category_hint": "grant"},
                "enabled": True,
                "schedule": "daily",
            },
            {
                "name": "Opportunity Desk Fellowships",
                "type": SourceType.HTML.value,
                "url": "https://opportunitydesk.org/category/fellowships/",
                "config": {"category_hint": "fellowship"},
                "enabled": True,
                "schedule": "daily",
            },
            {
                "name": "Y Combinator Applications",
                "type": SourceType.HTML.value,
                "url": "https://www.ycombinator.com/apply",
                "config": {"category_hint": "accelerator"},
                "enabled": True,
                "schedule": "daily",
            },
        ]

        sources_added = 0
        for src_data in seed_sources:
            existing = db.query(Source).filter(Source.url == src_data["url"]).first()
            if not existing:
                db.add(Source(**src_data))
                sources_added += 1
        if sources_added:
            db.commit()
            logger.info(f"Seeded {sources_added} new source(s).")

        # ── Seed opportunities ──────────────────────────────────────────
        from app.seed_data import SEED_OPPORTUNITIES
        from app.models import Opportunity

        existing_count = db.query(Opportunity).count()
        if existing_count == 0 and SEED_OPPORTUNITIES:
            from app.models import Organization
            from app.schemas import OpportunityCreate
            import math
            import random
            from datetime import datetime, timezone, timedelta
            from python_slugify import slugify

            inserted = 0
            for opp_data in SEED_OPPORTUNITIES:
                slug = slugify(opp_data["title"])[:200]
                base_slug = slug
                counter = 1
                while db.query(Opportunity).filter(Opportunity.slug == slug).first():
                    slug = f"{base_slug}-{counter}"
                    counter += 1

                org_slug = slugify(opp_data.get("organizer", "unknown"))
                org = db.query(Organization).filter(
                    Organization.slug == org_slug
                ).first()
                org_id = org.id if org else None

                deadline = None
                if "deadline" in opp_data and opp_data["deadline"]:
                    try:
                        deadline = datetime.fromisoformat(opp_data["deadline"])
                    except (ValueError, TypeError):
                        deadline = datetime.now(timezone.utc) + timedelta(
                            days=random.randint(15, 120)
                        )

                opp = Opportunity(
                    title=opp_data["title"],
                    slug=slug,
                    description=opp_data.get("description", ""),
                    category=opp_data.get("category", "grant"),
                    organizer=opp_data.get("organizer", ""),
                    deadline=deadline,
                    apply_url=opp_data.get("apply_url", opp_data.get("url", "")),
                    country=opp_data.get("country"),
                    funding_amount=opp_data.get("funding_amount"),
                    eligibility_text=opp_data.get("eligibility_text"),
                    tags=opp_data.get("tags", []),
                    status="active",
                    confidence=opp_data.get("confidence", 0.95),
                    dedupe_key=slug,
                    organization_id=org_id,
                    source_id=None,
                    raw_document_id=None,
                )
                db.add(opp)
                inserted += 1

            db.commit()
            logger.info(f"Seeded {inserted} opportunity/opportunities.")
            return inserted

        return 0
    finally:
        db.close()


def backfill_slugs() -> int:
    """Update any opportunities that have a null or empty slug."""
    from app.models import Opportunity
    from python_slugify import slugify

    db = SessionLocal()
    try:
        fixed = 0
        opps = db.query(Opportunity).filter(
            (Opportunity.slug.is_(None)) | (Opportunity.slug == "")
        ).all()
        for opp in opps:
            base = slugify(opp.title or f"opportunity-{opp.id}")[:200]
            slug = base
            counter = 1
            while db.query(Opportunity).filter(
                Opportunity.slug == slug, Opportunity.id != opp.id
            ).first():
                slug = f"{base}-{counter}"
                counter += 1
            opp.slug = slug
            fixed += 1
        if fixed:
            db.commit()
            logger.info(f"Backfilled {fixed} slug(s).")
        return fixed
    finally:
        db.close()


def run_startup():
    """Call once at process boot. Idempotent — safe to call on every restart."""
    logger.info("─" * 50)
    logger.info("Nexora startup lifecycle starting...")

    migrated = run_migrations()
    logger.info(f"Migrations: {'ran' if migrated else 'already current'}")

    seeded = seed_initial_data()
    logger.info(f"Seed data: {seeded} opportunity/opportunities inserted" if seeded else "Seed data: already populated")

    slugs = backfill_slugs()
    logger.info(f"Slugs: {slugs} backfilled" if slugs else "Slugs: all present")

    logger.info("Nexora startup lifecycle complete.")
    logger.info("─" * 50)


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    run_startup()
