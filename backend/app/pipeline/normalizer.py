import logging
from typing import Optional
from sqlalchemy.orm import Session
from app.models import RawDocument, RawDocumentStatus
from app.schemas import OpportunityExtract
from app.ai_service import ai_service
from app.pipeline.extractor import ExtractedCandidate

logger = logging.getLogger(__name__)


class PipelineNormalizer:
    def normalize(
        self,
        db: Session,
        candidate: ExtractedCandidate,
        source_name: str,
        raw_doc: RawDocument,
    ) -> Optional[OpportunityExtract]:
        extract: Optional[OpportunityExtract] = None
        attempts = 2

        # Use the direct apply URL resolved by the fetcher as the authoritative
        # candidate URL — this is what gets stored as apply_url in the DB.
        authoritative_url = candidate.direct_apply_url or candidate.candidate_url

        for attempt in range(attempts):
            try:
                extract = ai_service.extract_opportunity(
                    text_content=candidate.cleaned_text,
                    source_name=source_name,
                    candidate_url=authoritative_url,
                )
                if extract:
                    # Override whatever the AI returned for apply_url with the
                    # fetcher-resolved direct link. The AI sometimes hallucinates
                    # or picks a homepage; the fetcher's resolved URL is ground truth.
                    if authoritative_url and authoritative_url != candidate.candidate_url:
                        extract.apply_url = authoritative_url
                    break
            except Exception as e:
                logger.warning(f"Normalization attempt {attempt + 1} failed for raw doc ID {raw_doc.id}: {e}")

        if not extract:
            raw_doc.status = RawDocumentStatus.FAILED.value
            db.commit()
            return None

        raw_doc.status = RawDocumentStatus.NORMALIZED.value
        db.commit()
        return extract


normalizer = PipelineNormalizer()
