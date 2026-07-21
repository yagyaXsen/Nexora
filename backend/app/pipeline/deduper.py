import logging
from typing import Tuple, Optional
from urllib.parse import urlparse, urlunparse
from slugify import slugify
from rapidfuzz import fuzz
from sqlalchemy.orm import Session

from app.config import settings
from app.models import Opportunity, OpportunityStatus, Source, RawDocument
from app.schemas import OpportunityExtract

logger = logging.getLogger(__name__)

def canonicalize_url(url: str) -> str:
    try:
        parsed = urlparse(url.strip())
        # keep scheme, netloc, path (stripped of trailing slash)
        path = parsed.path.rstrip('/')
        return f"{parsed.netloc.lower()}{path.lower()}"
    except Exception:
        return url.strip().lower()

class PipelineDeduper:
    def process_extract(
        self,
        db: Session,
        extract: OpportunityExtract,
        source: Source,
        raw_doc: RawDocument
    ) -> Tuple[Opportunity, bool, bool]:
        """
        Returns (Opportunity, is_new: bool, is_updated: bool)
        """
        dedupe_key = canonicalize_url(extract.apply_url)
        
        # 1. Exact dedupe key match
        existing_opp = db.query(Opportunity).filter(Opportunity.dedupe_key == dedupe_key).first()

        # 2. If not found, fuzzy match title + organizer
        if not existing_opp:
            target_str = f"{extract.title} {extract.organizer}".lower()
            recent_opps = db.query(Opportunity).filter(
                Opportunity.status.in_([OpportunityStatus.ACTIVE.value, OpportunityStatus.EXPIRING_SOON.value])
            ).all()

            for opp in recent_opps:
                opp_str = f"{opp.title} {opp.organizer}".lower()
                ratio = fuzz.token_set_ratio(target_str, opp_str)
                if ratio >= 85:
                    logger.info(f"Fuzzy match (score={ratio}) between '{extract.title}' and existing ID {opp.id} '{opp.title}'")
                    existing_opp = opp
                    break

        needs_review = extract.confidence < settings.CONFIDENCE_THRESHOLD

        if existing_opp:
            # Update existing record
            existing_opp.title = extract.title
            existing_opp.description = extract.description
            existing_opp.category = extract.category.value
            existing_opp.organizer = extract.organizer
            existing_opp.deadline = extract.deadline
            existing_opp.apply_url = extract.apply_url
            existing_opp.country = extract.country
            existing_opp.funding_amount = extract.funding_amount
            existing_opp.eligibility_text = extract.eligibility_text
            existing_opp.tags = extract.tags
            existing_opp.confidence = extract.confidence
            existing_opp.needs_review = needs_review
            existing_opp.source_id = source.id
            existing_opp.raw_document_id = raw_doc.id

            db.commit()
            db.refresh(existing_opp)
            return (existing_opp, False, True)

        # Create new record
        base_slug = slugify(extract.title) or "opportunity"
        slug = base_slug
        counter = 1
        while db.query(Opportunity).filter(Opportunity.slug == slug).first():
            slug = f"{base_slug}-{counter}"
            counter += 1

        new_opp = Opportunity(
            title=extract.title,
            slug=slug,
            description=extract.description,
            category=extract.category.value,
            organizer=extract.organizer,
            deadline=extract.deadline,
            apply_url=extract.apply_url,
            country=extract.country,
            funding_amount=extract.funding_amount,
            eligibility_text=extract.eligibility_text,
            tags=extract.tags,
            status=OpportunityStatus.ACTIVE.value,
            confidence=extract.confidence,
            needs_review=needs_review,
            dedupe_key=dedupe_key,
            source_id=source.id,
            raw_document_id=raw_doc.id
        )
        db.add(new_opp)
        db.commit()
        db.refresh(new_opp)
        return (new_opp, True, False)

deduper = PipelineDeduper()
