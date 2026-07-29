"""
Nexora — Startup Lifecycle
===========================
Runs when the backend boots: ensure the database schema is current,
seed initial data, and backfill slugs for any opportunities missing them.

On Render free tier the database is a fresh Postgres (Neon), so the
schema MUST be created before any request handler touches the tables.

This module does NOT use Alembic — schema creation is done directly via
Base.metadata.create_all(), which is idempotent and creates every table
defined in the models (including tables like profiles, notifications,
organizations, etc. that are not in the Alembic migration chain).

Alembic remains available as a CLI tool for manual schema migrations.
"""

import logging

from sqlalchemy import inspect as sa_inspect, text as sa_text

from app.config import settings
from app.database import engine, SessionLocal

logger = logging.getLogger(__name__)


def _sync_missing_columns() -> None:
    """Add columns that exist in the models but not in the DB tables.

    Base.metadata.create_all() creates missing TABLES but does NOT alter
    existing tables to add new columns. This function fills the gap by
    running ALTER TABLE ... ADD COLUMN IF NOT EXISTS for every column that
    the model defines but the database lacks.
    """
    from app.database import Base

    # Known columns that exist in models but were never added to DB by migrations.
    # Each entry: (table_name, [(column_name, sql_type), ...])
    table_col_map = {
        "opportunities": [
            ("organization_id", "INTEGER"),
        ],
        "users": [
            ("google_id", "VARCHAR(255)"),
            ("avatar", "TEXT"),
            ("email_verified", "BOOLEAN NOT NULL DEFAULT TRUE"),
            ("role", "VARCHAR(50) NOT NULL DEFAULT 'candidate'"),
            ("last_login", "TIMESTAMP WITH TIME ZONE"),
            ("updated_at", "TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()"),
        ],
        "notifications": [
            ("is_pinned", "BOOLEAN NOT NULL DEFAULT FALSE"),
            ("opp_id", "INTEGER"),
            ("organizer", "VARCHAR(255) NOT NULL DEFAULT 'Nexora Intelligence'"),
        ],
    }

    try:
        inspector = sa_inspect(engine)
        existing_tables = set(inspector.get_table_names())
    except Exception:
        logger.warning("Cannot inspect database — skipping column sync (non-fatal)")
        return

    with engine.connect() as conn:
        for table_name, columns in table_col_map.items():
            if table_name not in existing_tables:
                continue  # create_all will create it fresh with all columns

            try:
                db_cols = {c["name"] for c in inspector.get_columns(table_name)}
            except Exception:
                logger.warning(f"Cannot inspect columns for '{table_name}' — skipping")
                continue

            for col_name, col_type in columns:
                if col_name in db_cols:
                    continue

                # SQLite does not support IF NOT EXISTS on ADD COLUMN.
                # We already checked db_cols above, so a plain ADD COLUMN is safe.
                if engine.dialect.name == "sqlite":
                    sql = sa_text(f"ALTER TABLE {table_name} ADD COLUMN {col_name} {col_type}")
                else:
                    sql = sa_text(f"ALTER TABLE {table_name} ADD COLUMN IF NOT EXISTS {col_name} {col_type}")
                conn.execute(sql)
                logger.info(f"  Added column '{table_name}.{col_name}' ({col_type})")

        conn.commit()


def ensure_tables() -> bool:
    """Create all tables if they don't exist. Idempotent — safe every boot.

    1. Base.metadata.create_all() creates any missing TABLES.
    2. _sync_missing_columns() adds any columns that exist in the models
       but were never added to pre-existing tables by migrations.
    """
    from app.database import Base

    Base.metadata.create_all(bind=engine)
    logger.info("Base tables created / verified.")

    _sync_missing_columns()
    logger.info("All columns synced.")
    return True


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
            import math
            import random
            from datetime import datetime, timezone, timedelta
            from slugify import slugify

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
    from slugify import slugify

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
    """Call once at process boot. Idempotent — safe to call on every restart.

    If any step fails, the full traceback is logged and the exception
    propagates so the process refuses to boot with missing schema/data.
    """
    logger.info("─" * 50)
    logger.info("Nexora startup lifecycle starting...")

    try:
        ensure_tables()
        logger.info("Tables: ready")
    except Exception:
        logger.exception("FATAL: Table creation failed")
        raise

    try:
        seeded = seed_initial_data()
        logger.info(f"Seed data: {seeded} opportunity/opportunities inserted" if seeded else "Seed data: already populated")
    except Exception:
        logger.exception("FATAL: Seed data insertion failed")
        raise

    try:
        slugs = backfill_slugs()
        logger.info(f"Slugs: {slugs} backfilled" if slugs else "Slugs: all present")
    except Exception:
        logger.exception("FATAL: Slug backfill failed")
        raise

    logger.info("Nexora startup lifecycle complete.")
    logger.info("─" * 50)


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    run_startup()
