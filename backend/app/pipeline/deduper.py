import logging
from datetime import datetime, timezone
from typing import Tuple, Optional
from urllib.parse import urlparse, urlunparse
from slugify import slugify
from rapidfuzz import fuzz
from sqlalchemy.orm import Session

from app.config import settings
from app.models import Opportunity, OpportunityStatus, Organization, Source, RawDocument, utc_now
from app.schemas import OpportunityExtract
from app.pipeline.lifecycle import recompute_status

logger = logging.getLogger(__name__)

# Phrases that mean the source itself says applications are closed even though
# no explicit (past) deadline could be parsed. When one of these appears in the
# fetched page, an existing record is marked expired instead of silently
# keeping its old (possibly stale) deadline.
SOURCE_CLOSED_PHRASES = [
    "applications are closed",
    "applications closed",
    "applications have closed",
    "no longer accepting applications",
    "applications are no longer",
    "deadline has passed",
    "closed for applications",
    "call is closed",
    "call closed",
]


# Opportunity.dedupe_key is String(255); a longer key would abort the whole
# transaction on Postgres. Both sides of every comparison go through this
# function, so capping here keeps matching consistent.
DEDUPE_KEY_MAX_LEN = 255


def canonicalize_url(url: str) -> str:
    try:
        parsed = urlparse(url.strip())
        # keep netloc + path (stripped of trailing slash)
        path = parsed.path.rstrip('/')
        key = f"{parsed.netloc.lower()}{path.lower()}"
    except Exception:
        key = url.strip().lower()
    return key[:DEDUPE_KEY_MAX_LEN]

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

        # 2. If not found, fuzzy match title + organizer.
        #    Scope includes EXPIRED rows: a source that reopened (or whose
        #    deadline moved) must UPDATE the existing record, not create a
        #    duplicate beside it. dead_link rows stay out of scope — they are
        #    usually junk/stale artifacts.
        if not existing_opp:
            target_str = f"{extract.title} {extract.organizer}".lower()
            recent_opps = db.query(Opportunity).filter(
                Opportunity.status.in_([
                    OpportunityStatus.ACTIVE.value,
                    OpportunityStatus.EXPIRING_SOON.value,
                    OpportunityStatus.EXPIRED.value,
                ])
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
        now = datetime.now(timezone.utc)

        source_says_closed = self._source_says_closed(raw_doc)

        if existing_opp:
            # Update existing record
            existing_opp.title = extract.title
            existing_opp.description = extract.description
            existing_opp.category = extract.category.value
            existing_opp.organizer = extract.organizer
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

            # Deadline: write the newly extracted value, but don't let a
            # "not found on page" (null) wipe a previously known date.
            if extract.deadline is not None:
                existing_opp.deadline = extract.deadline

            # "Applications closed" on the page is sticky (closed_by_source):
            # recompute_status, the daily sweep and revalidation all keep the
            # row expired until a scrape no longer finds the notice.
            was_closed = bool(existing_opp.closed_by_source)
            existing_opp.closed_by_source = source_says_closed
            if source_says_closed and not was_closed:
                logger.info(f"Source page says applications are closed for opp ID {existing_opp.id}")
            if was_closed and not source_says_closed and existing_opp.deadline is None:
                # The source withdrew its closed notice and gives no date —
                # it is accepting applications again.
                existing_opp.status = OpportunityStatus.ACTIVE.value
            # Refresh the derived status so the label always matches the data.
            recompute_status(existing_opp, now)

            # Keep the dedupe key aligned with the (possibly new) apply URL so
            # the next exact-match lookup hits instead of falling back to fuzz.
            if existing_opp.dedupe_key != dedupe_key:
                existing_opp.dedupe_key = dedupe_key

            existing_opp.last_checked_at = utc_now()
            existing_opp.last_verified_at = utc_now()
            existing_opp.link_check_failures = 0

            db.commit()
            db.refresh(existing_opp)
            return (existing_opp, False, True)

        # Create new record
        base_slug = slugify(extract.title)[:200] or "opportunity"
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
            closed_by_source=source_says_closed,
        )
        # Even a brand-new record can carry a deadline that already passed (or
        # a page saying applications are closed) — derive its status from
        # data, not blind optimism.
        recompute_status(new_opp, now)
        new_opp.last_checked_at = utc_now()
        new_opp.last_verified_at = utc_now()
        new_opp.link_check_failures = 0
        db.add(new_opp)
        db.commit()
        db.refresh(new_opp)
        return (new_opp, True, False)

    @staticmethod
    def source_says_closed(raw_doc: RawDocument) -> bool:
        return PipelineDeduper._source_says_closed(raw_doc)

    @staticmethod
    def _source_says_closed(raw_doc: RawDocument) -> bool:
        """Heuristic: does the fetched page explicitly announce closure?"""
        try:
            text = (raw_doc.raw_content or "").lower()
        except Exception:
            return False
        return any(phrase in text for phrase in SOURCE_CLOSED_PHRASES)

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
