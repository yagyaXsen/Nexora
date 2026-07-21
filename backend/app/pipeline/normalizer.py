import logging
from typing import Optional
from sqlalchemy.orm import Session
from app.models import RawDocument, RawDocumentStatus
from app.schemas import OpportunityExtract
from app.ai_service import ai_service
from app.pipeline.extractor import ExtractedCandidate

logger = logging.getLogger(__name__)

class PipelineNormalizer:
    def normalize(self, db: Session, candidate: ExtractedCandidate, source_name: str, raw_doc: RawDocument) -> Optional[OpportunityExtract]:
        extract: Optional[OpportunityExtract] = None
        attempts = 2
        for attempt in range(attempts):
            try:
                extract = ai_service.extract_opportunity(
                    text_content=candidate.cleaned_text,
                    source_name=source_name,
                    candidate_url=candidate.candidate_url
                )
                if extract:
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
