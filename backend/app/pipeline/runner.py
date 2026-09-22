import logging
from typing import Optional
from datetime import datetime, timezone
from sqlalchemy.orm import Session

from app.models import Source, PipelineRun, Opportunity, utc_now
from app.pipeline.fetcher import fetcher, FetchError
from app.pipeline.extractor import extractor
from app.pipeline.normalizer import normalizer
from app.pipeline.deduper import deduper, canonicalize_url
from app.pipeline.lifecycle import recompute_status
from app.publishing.live_feed import invalidate_live_feed

logger = logging.getLogger(__name__)

class PipelineRunner:
    def __init__(self):
        # Observability: how many source runs are executing right now across
        # threads (the scheduler runs jobs in a background pool and the cron
        # endpoints run in request threads).
        self.active_runs = 0

    def run_source(self, db: Session, source: Source) -> PipelineRun:
        run = PipelineRun(
            source_id=source.id,
            started_at=datetime.now(timezone.utc),
            status="running",
            fetched_count=0,
            new_count=0,
            updated_count=0,
            duplicate_count=0,
            failed_count=0,
            revalidated_count=0,
            error_log=[]
        )
        db.add(run)
        db.commit()
        db.refresh(run)

        self.active_runs += 1
        try:
            outcome = fetcher.fetch_source(db, source)
            run.fetched_count = len(outcome.raw_docs)

            # ── New / changed pages: full extract → normalize → dedupe ──────
            for raw_doc in outcome.raw_docs:
                try:
                    candidate = extractor.extract_candidates(raw_doc)
                    extract = normalizer.normalize(db, candidate, source.name, raw_doc)

                    if not extract:
                        run.failed_count += 1
                        continue

                    opp, is_new, is_updated = deduper.process_extract(db, extract, source, raw_doc)
                    if is_new:
                        run.new_count += 1
                    elif is_updated:
                        run.updated_count += 1
                    else:
                        run.duplicate_count += 1

                except Exception as doc_err:
                    logger.error(f"Error processing raw doc {raw_doc.id}: {doc_err}")
                    run.failed_count += 1
                    run.error_log.append({
                        "raw_doc_id": raw_doc.id,
                        "error": str(doc_err)
                    })

            # ── Unchanged pages: revalidate the existing opportunity ────────
            # The page content is byte-identical to the stored RawDocument, so
            # the stored data is still what the source publishes. Re-checking
            # means: refresh the verification timestamps and recompute the
            # deadline-driven status (no AI call needed).
            revalidated_ids = set()
            for raw_doc in outcome.unchanged_docs:
                try:
                    opp_id = self._revalidate_opportunity(db, raw_doc)
                    if opp_id:
                        revalidated_ids.add(opp_id)
                except Exception as rv_err:
                    logger.error(f"Error revalidating raw doc {raw_doc.id}: {rv_err}")
            run.revalidated_count = len(revalidated_ids)

            source.last_run_at = datetime.now(timezone.utc)
            run.status = "completed"
            run.finished_at = datetime.now(timezone.utc)
            db.commit()
            db.refresh(run)
            # New/updated records can now be publishable — drop the feed cache
            # so the change surfaces on the next frontend request.
            invalidate_live_feed()
            logger.info(
                f"Pipeline run #{run.id} for source '{source.name}' completed: "
                f"fetched={run.fetched_count}, new={run.new_count}, updated={run.updated_count}, "
                f"duplicate={run.duplicate_count}, revalidated={run.revalidated_count}, failed={run.failed_count}"
            )

        except FetchError as fetch_err:
            # The source itself is down (listing/feed/sitemap unreachable).
            # Record a FAILED run with the error — but do NOT update
            # source.last_run_at, which means "last successful scrape".
            # Other sources are unaffected: each run_source call is isolated.
            logger.error(f"Pipeline run #{run.id} for source '{source.name}' failed: {fetch_err}")
            run.status = "failed"
            run.finished_at = datetime.now(timezone.utc)
            run.error_log = [{"fatal_error": str(fetch_err)}]
            db.commit()
            db.refresh(run)
        except Exception as run_err:
            logger.error(f"Pipeline run #{run.id} for source '{source.name}' failed: {run_err}")
            run.status = "failed"
            run.finished_at = datetime.now(timezone.utc)
            run.error_log = [{"fatal_error": str(run_err)}]
            db.commit()
            db.refresh(run)
        finally:
            self.active_runs = max(0, self.active_runs - 1)

        return run

    @staticmethod
    def _revalidate_opportunity(db: Session, raw_doc) -> Optional[int]:
        """Refresh an existing opportunity whose source page is unchanged.

        The page was reachable and byte-identical, so:
          * last_checked_at / last_verified_at = now (the record was revisited
            and the source confirmed it),
          * link_check_failures resets (the page just answered),
          * status recomputes from the deadline — a deadline that slipped into
            the past marks expired WITHOUT waiting for the daily sweep, and a
            deadline the source pushed forward revives an expired record.

        Returns the opportunity id, or None when no opportunity is linked.
        """
        opp = db.query(Opportunity).filter(
            Opportunity.raw_document_id == raw_doc.id
        ).first()
        if not opp:
            key = canonicalize_url(raw_doc.canonical_url or raw_doc.url)
            opp = db.query(Opportunity).filter(Opportunity.dedupe_key == key).first()
        if not opp:
            return None

        now = datetime.now(timezone.utc)
        opp.last_checked_at = utc_now()
        opp.last_verified_at = utc_now()
        opp.link_check_failures = 0
        recompute_status(opp, now)
        db.commit()
        return opp.id

runner = PipelineRunner()
