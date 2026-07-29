"""
Backfill Direct Apply URLs
==========================
Visits each opportunity's existing apply_url, hunts for a real "Apply Now"
button on that page, and updates the DB row if a better direct link is found.

Run from the backend/ directory:
    PYTHONPATH=. python app/pipeline/backfill_apply_urls.py

Options (env vars):
    DRY_RUN=1   — print what would change, don't write to DB
    LIMIT=10    — only process the first N opportunities
"""

import logging
import os
import sys

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-7s  %(message)s",
    datefmt="%H:%M:%S",
)
logger = logging.getLogger("backfill")


def run():
    dry_run = os.getenv("DRY_RUN", "0") == "1"
    limit = int(os.getenv("LIMIT", "0"))

    # Import here so the script works with PYTHONPATH=. from backend/
    from app.database import SessionLocal
    from app.models import Opportunity
    from app.pipeline.fetcher import fetcher

    db = SessionLocal()
    try:
        query = db.query(Opportunity)
        if limit:
            query = query.limit(limit)
        opportunities = query.all()

        logger.info(f"Processing {len(opportunities)} opportunities  (dry_run={dry_run})")
        updated = 0
        unchanged = 0
        failed = 0

        for opp in opportunities:
            original_url = opp.apply_url
            if not original_url:
                logger.warning(f"  [{opp.id}] No apply_url — skipping")
                failed += 1
                continue

            logger.info(f"  [{opp.id}] {opp.title[:60]}")
            logger.info(f"         current : {original_url}")

            try:
                resolved = fetcher.resolve_apply_url(original_url)
            except Exception as e:
                logger.warning(f"         FAILED  : {e}")
                failed += 1
                continue

            if resolved == original_url:
                logger.info(f"         result  : unchanged")
                unchanged += 1
                continue

            logger.info(f"         result  : {resolved}  ← NEW")

            if not dry_run:
                opp.apply_url = resolved
                db.commit()

            updated += 1

        logger.info("")
        logger.info(
            f"Done — updated={updated}  unchanged={unchanged}  failed={failed}"
            + ("  (DRY RUN — no writes)" if dry_run else "")
        )

    finally:
        db.close()


if __name__ == "__main__":
    run()
