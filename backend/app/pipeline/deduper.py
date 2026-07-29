import logging
from typing import Tuple, Optional
from urllib.parse import urlparse, urlunparse
from slugify import slugify
from rapidfuzz import fuzz
from sqlalchemy.orm import Session

from app.config import settings
from app.models import Opportunity, OpportunityStatus, Organization, Source, RawDocument
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

        # Resolve organization_id by fuzzy-matching organizer name
        org_id = self._resolve_organization(db, extract.organizer)

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
            if org_id:
                existing_opp.organization_id = org_id

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
            raw_document_id=raw_doc.id,
            organization_id=org_id,
        )
        db.add(new_opp)
        db.commit()
        db.refresh(new_opp)
        return (new_opp, True, False)

    @staticmethod
    def _resolve_organization(db: Session, organizer_name: str) -> Optional[int]:
        """Fuzzy-match the organizer string against the Organization table.
        Returns the organization ID if a good match is found, else None."""
        if not organizer_name:
            return None

        # 1. Exact match first (fast path)
        org = db.query(Organization).filter(
            Organization.name.ilike(organizer_name)
        ).first()
        if org:
            return org.id

        # 2. Fuzzy match against name and slug
        target = organizer_name.lower()
        all_orgs = db.query(Organization).all()
        best_score = 0
        best_id = None

        for org in all_orgs:
            # Compare against both name and slug
            for candidate in (org.name, org.slug.replace('-', ' ')):
                score = fuzz.token_set_ratio(target, candidate.lower())
                if score > best_score:
                    best_score = score
                    best_id = org.id

        if best_score >= 75:
            logger.info(f"Organization fuzzy match: '{organizer_name}' → '{db.query(Organization).filter(Organization.id == best_id).first().name}' (score={best_score})")
            return best_id

        return None


deduper = PipelineDeduper()
