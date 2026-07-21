import logging
from datetime import datetime, timezone
from sqlalchemy.orm import Session

from app.models import Source, PipelineRun
from app.pipeline.fetcher import fetcher
from app.pipeline.extractor import extractor
from app.pipeline.normalizer import normalizer
from app.pipeline.deduper import deduper

logger = logging.getLogger(__name__)

class PipelineRunner:
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
            error_log=[]
        )
        db.add(run)
        db.commit()
        db.refresh(run)

        try:
            raw_docs = fetcher.fetch_source(db, source)
            run.fetched_count = len(raw_docs)

            for raw_doc in raw_docs:
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

            source.last_run_at = datetime.now(timezone.utc)
            run.status = "completed"
            run.finished_at = datetime.now(timezone.utc)
            db.commit()
            db.refresh(run)
            logger.info(f"Pipeline run #{run.id} for source '{source.name}' completed: fetched={run.fetched_count}, new={run.new_count}, updated={run.updated_count}, failed={run.failed_count}")

        except Exception as run_err:
            logger.error(f"Pipeline run #{run.id} for source '{source.name}' failed: {run_err}")
            run.status = "failed"
            run.finished_at = datetime.now(timezone.utc)
            run.error_log.append({"fatal_error": str(run_err)})
            db.commit()
            db.refresh(run)

        return run

runner = PipelineRunner()
