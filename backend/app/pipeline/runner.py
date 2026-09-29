import logging
from typing import List, Optional
from datetime import datetime, timedelta, timezone
from sqlalchemy.orm import Session

from app.models import Source, PipelineRun, Opportunity, RawDocument, RawDocumentStatus, utc_now
from app.pipeline.fetcher import fetcher, FetchError
from app.pipeline.extractor import extractor
from app.pipeline.normalizer import normalizer
from app.pipeline.deduper import deduper, canonicalize_url
from app.pipeline.lifecycle import recompute_status
from app.publishing.live_feed import invalidate_live_feed

logger = logging.getLogger(__name__)

# Unchanged pages whose previous processing never completed. They are retried
# instead of being skipped forever by the content-hash check: FETCHED means the
# process stopped before extraction, FAILED means extraction or dedupe raised.
# NORMALIZED (done) and REJECTED (junk — identical content gives the identical
# verdict) are not retried.
RETRYABLE_RAW_STATUSES = {RawDocumentStatus.FETCHED.value, RawDocumentStatus.FAILED.value}

# A run still marked 'running' after this long belongs to a process that died
# (redeploy, OOM, host sleep) — no source run takes anywhere near this long.
ORPHANED_RUN_AFTER_HOURS = 3


class PipelineRunner:
    def __init__(self):
        # Observability: how many source runs are executing right now across
        # threads (the scheduler runs jobs in a background pool and the cron
        # endpoints run in request threads).
        self.active_runs = 0

    def run_source(self, db: Session, source: Source, force_reextract: bool = False) -> PipelineRun:
        """Scrape one source and fold the results into the opportunity table.

        force_reextract=True sends unchanged pages through extraction again
        (e.g. after enabling Groq, or after changing the junk rules) instead of
        only re-validating them.
        """
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
        source_name = source.name

        # Counters and errors live here, not on the ORM row, until the run
        # finishes: a per-document rollback expires every loaded object and
        # would silently discard increments made since the last commit.
        counts = {"fetched": 0, "new": 0, "updated": 0, "duplicate": 0, "failed": 0, "revalidated": 0}
        errors: List[dict] = []

        self.active_runs += 1
        try:
            outcome = fetcher.fetch_source(db, source)

            # ── New / changed pages: full extract → normalize → dedupe ──────
            for raw_doc in outcome.raw_docs:
                self._process_document(db, source, raw_doc, counts, errors)

            # ── Unchanged pages: revalidate the existing opportunity ────────
            # The page content is byte-identical to the stored RawDocument, so
            # the stored data is still what the source publishes. Re-checking
            # means: refresh the verification timestamps and recompute the
            # deadline-driven status (no AI call needed). Pages whose earlier
            # processing never completed are retried instead.
            retry_docs: List[RawDocument] = []
            revalidated_ids = set()
            for raw_doc in outcome.unchanged_docs:
                if force_reextract:
                    retry_docs.append(raw_doc)
                    continue
                try:
                    opp_id = self._revalidate_opportunity(db, raw_doc)
                except Exception as rv_err:
                    db.rollback()
                    logger.error(f"Error revalidating raw doc {raw_doc.id}: {rv_err}")
                    continue
                if opp_id:
                    revalidated_ids.add(opp_id)
                elif raw_doc.status in RETRYABLE_RAW_STATUSES:
                    retry_docs.append(raw_doc)

            for raw_doc in retry_docs:
                self._process_document(db, source, raw_doc, counts, errors)

            # fetched = pages that went through extraction this run.
            counts["fetched"] = len(outcome.raw_docs) + len(retry_docs)
            counts["revalidated"] = len(revalidated_ids)

            source.last_run_at = datetime.now(timezone.utc)
            self._finish(db, run, "completed", counts, errors)
            # New/updated records can now be publishable — drop the feed cache
            # so the change surfaces on the next frontend request.
            invalidate_live_feed()
            logger.info(
                f"Pipeline run #{run.id} for source '{source_name}' completed: "
                f"fetched={counts['fetched']}, new={counts['new']}, updated={counts['updated']}, "
                f"duplicate={counts['duplicate']}, revalidated={counts['revalidated']}, "
                f"failed={counts['failed']}"
            )

        except Exception as run_err:
            # FetchError: the source itself is down (listing/feed/sitemap
            # unreachable). Anything else: an unexpected pipeline error. Either
            # way record a FAILED run with the error — but do NOT update
            # source.last_run_at, which means "last successful scrape". Other
            # sources are unaffected: each run_source call is isolated.
            db.rollback()
            logger.error(f"Pipeline run #{run.id} for source '{source_name}' failed: {run_err}")
            # The fatal error goes first: /api/pipeline/status reads error_log[0].
            self._finish(db, run, "failed", counts, [{"fatal_error": str(run_err)}] + errors)
            if not isinstance(run_err, FetchError):
                logger.exception("Unexpected pipeline error")
        finally:
            self.active_runs = max(0, self.active_runs - 1)

        return run

    @staticmethod
    def _process_document(db: Session, source: Source, raw_doc: RawDocument,
                          counts: dict, errors: List[dict]) -> None:
        raw_doc_id = raw_doc.id
        try:
            candidate = extractor.extract_candidates(raw_doc)
            extract = normalizer.normalize(
                db, candidate, source.name, raw_doc,
                category_hint=(source.config or {}).get("category_hint"),
            )

            if not extract:
                counts["failed"] += 1
                return

            opp, is_new, is_updated = deduper.process_extract(db, extract, source, raw_doc)
            if is_new:
                counts["new"] += 1
            elif is_updated:
                counts["updated"] += 1
            else:
                counts["duplicate"] += 1

        except Exception as doc_err:
            # A database error leaves the session unusable until it is rolled
            # back; without this every later page — and the run's own
            # bookkeeping — would fail too and the run would stay 'running'.
            db.rollback()
            logger.error(f"Error processing raw doc {raw_doc_id}: {doc_err}")
            counts["failed"] += 1
            errors.append({"raw_doc_id": raw_doc_id, "error": str(doc_err)})
            try:
                # Mark it retryable so the next run tries this page again even
                # though its content hash is unchanged.
                db.query(RawDocument).filter(RawDocument.id == raw_doc_id).update(
                    {RawDocument.status: RawDocumentStatus.FAILED.value},
                    synchronize_session=False,
                )
                db.commit()
            except Exception:
                db.rollback()

    @staticmethod
    def _finish(db: Session, run: PipelineRun, status: str, counts: dict, errors: List[dict]) -> None:
        try:
            run.status = status
            run.finished_at = datetime.now(timezone.utc)
            run.fetched_count = counts["fetched"]
            run.new_count = counts["new"]
            run.updated_count = counts["updated"]
            run.duplicate_count = counts["duplicate"]
            run.failed_count = counts["failed"]
            run.revalidated_count = counts["revalidated"]
            # Reassign (never mutate in place): SQLAlchemy does not track
            # in-place changes to a plain JSON column, so appends were dropped.
            run.error_log = list(errors)
            db.commit()
            db.refresh(run)
        except Exception:
            db.rollback()
            logger.exception(f"Could not record the outcome of pipeline run #{run.id}")

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
        # Only the row's own page decides its closed notice (a fallback match
        # by dedupe key may be a different page of the same program).
        if opp.raw_document_id == raw_doc.id:
            opp.closed_by_source = deduper.source_says_closed(raw_doc)
        recompute_status(opp, now)
        db.commit()
        return opp.id


def fail_orphaned_runs(db: Session, older_than_hours: float = ORPHANED_RUN_AFTER_HOURS) -> int:
    """Close runs left 'running' by a process that died mid-run.

    Without this they read as in-progress forever and skew the status
    endpoint. Called at boot and before every scheduled ingest batch.
    """
    cutoff = datetime.now(timezone.utc) - timedelta(hours=older_than_hours)
    stale = db.query(PipelineRun).filter(
        PipelineRun.status == "running",
        PipelineRun.started_at < cutoff,
    ).all()
    for r in stale:
        r.status = "failed"
        r.finished_at = utc_now()
        r.error_log = [{"fatal_error": "interrupted: the process stopped before the run finished"}] + list(r.error_log or [])
    if stale:
        db.commit()
        logger.warning(f"Marked {len(stale)} orphaned pipeline run(s) as failed.")
    return len(stale)


runner = PipelineRunner()
