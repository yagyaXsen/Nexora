"""Publishing layer (Loop B) — the ONE service that decides what appears in
the active frontend catalog.

Architecture:
    Database (lifecycle source of truth, maintained by the pipeline)
        ↓  eligible_for_publishing()
    Live DB records (pipeline-verified, active/expiring_soon only)
        ↓  enriched by their verified static twins, deduped by URL/title
    Published feed  =  live records  +  remaining static catalog records
        ↓
    /api/published/*  →  Frontend

Safety properties:
    * The static catalog is ALWAYS the base of the feed — a database error or
      an empty/failed pipeline can never wipe it (the live section is purely
      additive; on failure we serve static-only and log).
    * No snapshot file is written, so publishing cannot corrupt anything.
    * Expired / dead_link / unverified records are excluded by eligibility the
      moment the lifecycle marks them (cache TTL ≤ LIVE_FEED_TTL_SECONDS, and
      the pipeline invalidates the cache after every run/sweep).
    * Revived records (EXPIRED → revalidated → ACTIVE) become eligible again
      automatically — no code path remembers "this was once expired".

The weekly refresh job (scheduler.scheduled_publishing_refresh) does NOT gate
visibility — it measures and records publishing metrics (published count,
newly published, removed from feed) via the existing AuditEvent table.
"""

import logging
import threading
import time
from datetime import datetime, timezone
from typing import List, Optional, Tuple

from sqlalchemy.orm import Session, joinedload

from app.config import settings
from app.models import Opportunity, OpportunityStatus, Source
from app.publishing.models import PublishedOpportunity

logger = logging.getLogger(__name__)

# DB category values that need mapping to the frontend's published type names.
# Anything unmapped passes through (the frontend renders unknown types with a
# generic "Opportunity" label — honest, not fabricated).
_CATEGORY_TO_PUBLISHED = {
    "exchange": "exchange_program",
}

# Fields on the static twin that must never overwrite the live DB record.
# (Enrichment is fill-if-empty anyway, but these are documented as identity.)
_LIVE_IDENTITY_FIELDS = {
    "slug", "status", "deadline", "application_url", "official_source_url",
    "confidence_score", "verification_status", "last_verified_at",
    "discovered_via",
}


# ── Eligibility ────────────────────────────────────────────────────────────────

def eligible_for_publishing(opp: Opportunity) -> bool:
    """Should this opportunity appear in the active frontend catalog?

    Uses ONLY existing pipeline fields — no new scoring, no invented
    verification:

      * status: lifecycle-managed; only ACTIVE / EXPIRING_SOON are public.
        expired and dead_link records are excluded here (and NOT deleted —
        they stay in the DB for history/revival).
      * last_verified_at: set only when the pipeline actually reached the
        source page and confirmed the data (scrape-time or revalidation).
        Seed rows and never-rechecked rows are not published — they are
        either covered by the verified static catalog or not yet trustworthy.
      * needs_review: existing extraction-quality gate (confidence below
        CONFIDENCE_THRESHOLD flags this).
      * confidence >= PUBLISH_MIN_CONFIDENCE (mirrors the static catalog's
        own publish quality gate of 75/100).
      * a real http(s) apply URL and a sane title (the existing junk rules).
    """
    if opp.status not in (OpportunityStatus.ACTIVE.value, OpportunityStatus.EXPIRING_SOON.value):
        return False
    if opp.last_verified_at is None:
        return False
    if opp.source_id is None:
        # Seed rows (source_id=None, dedupe_key=slug) never came through the
        # pipeline; a later link-check 200 must not promote them to
        # "pipeline-verified" — their verified representation is the static
        # catalog. This keeps every published live record genuinely scraped.
        return False
    if opp.needs_review:
        return False
    if (opp.confidence or 0) < settings.PUBLISH_MIN_CONFIDENCE:
        return False
    url = (opp.apply_url or "").strip().lower()
    if not (url.startswith("http://") or url.startswith("https://")):
        return False
    title = (opp.title or "").strip()
    if not title or title.startswith("#"):
        return False
    # Data-quality gate: an empty description is extraction debris, not
    # content. "Unknown" is fine (stays None), but nothing must be published.
    if not (opp.description or "").strip():
        return False
    return True


# ── DB → published mapping ─────────────────────────────────────────────────────

def db_opportunity_to_published(opp: Opportunity) -> PublishedOpportunity:
    """Map a live DB row onto the frontend-safe published record shape.

    Only real fields are mapped — absent data stays None rather than being
    invented. The static-twin enrichment step may fill the gaps afterwards.
    """
    confidence = int(round((opp.confidence or 0) * 100))
    verified_iso = None
    if opp.last_verified_at is not None:
        dt = opp.last_verified_at
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
        verified_iso = dt.date().isoformat()

    source_name = None
    if opp.source is not None:
        source_name = opp.source.name

    return PublishedOpportunity(
        slug=opp.slug,
        title=opp.title,
        provider_organization=opp.organizer or None,
        opportunity_type=_CATEGORY_TO_PUBLISHED.get(opp.category, opp.category),
        application_url=opp.apply_url or None,
        country_or_region=opp.country or None,
        eligibility_summary=opp.eligibility_text or None,
        short_original_summary=opp.description or None,
        deadline=opp.deadline.date().isoformat() if opp.deadline else None,
        # Lifecycle truth: eligible records map to open; expired/dead_link map
        # to closed so a history detail view never presents them as active.
        status=(
            "open"
            if opp.status in (OpportunityStatus.ACTIVE.value, OpportunityStatus.EXPIRING_SOON.value)
            else "closed"
        ),
        funding_amount=opp.funding_amount or None,
        tags=list(opp.tags or []),
        confidence_score=confidence,
        verification_status=(
            "officially_verified" if confidence >= 90 else "partially_verified"
        ),
        last_verified_at=verified_iso,
        discovered_via=f"pipeline:{source_name}" if source_name else "pipeline",
    )


# ── TTL-cached live record set ─────────────────────────────────────────────────

_cache_lock = threading.Lock()
_cache: dict = {"at": 0.0, "records": []}


def invalidate_live_feed() -> None:
    """Drop the cached live record set so the next read re-queries the DB.

    Called by the pipeline after ingestion runs and lifecycle sweeps, so
    newly discovered / expired / revived records are reflected immediately
    instead of at TTL expiry.
    """
    with _cache_lock:
        _cache["at"] = 0.0
        _cache["records"] = []


def get_live_records(db: Session, force: bool = False) -> List[PublishedOpportunity]:
    """Return the current eligible DB records as published-shape records.

    Cached for LIVE_FEED_TTL_SECONDS (single-process; the feed is read-heavy
    and the pipeline invalidates the cache when data changes). On ANY error
    the previous cached set is served (or an empty list on first failure) —
    a broken live feed degrades to the static catalog, never to an error page
    and never to a wiped feed.
    """
    now = time.monotonic()
    with _cache_lock:
        if not force and _cache["records"] and now - _cache["at"] < settings.LIVE_FEED_TTL_SECONDS:
            return list(_cache["records"])

    try:
        rows = (
            db.query(Opportunity)
            .options(joinedload(Opportunity.source))
            .filter(
                Opportunity.status.in_([
                    OpportunityStatus.ACTIVE.value,
                    OpportunityStatus.EXPIRING_SOON.value,
                ])
            )
            .all()
        )
        records = [db_opportunity_to_published(o) for o in rows if eligible_for_publishing(o)]
    except Exception:
        logger.exception("Live publishing feed query failed — serving stale/static catalog")
        return list(_cache["records"])

    with _cache_lock:
        _cache["at"] = time.monotonic()
        _cache["records"] = list(records)
    return list(records)


# ── Merge with the static verified catalog ─────────────────────────────────────

def _canonical(url: Optional[str]) -> Optional[str]:
    if not url:
        return None
    from app.pipeline.deduper import canonicalize_url
    return canonicalize_url(url)


def _enrich_from_twin(rec: PublishedOpportunity, twin: PublishedOpportunity) -> PublishedOpportunity:
    """Fill empty fields on the live record from its verified static twin.

    The twin is the richer, hand-verified representation (benefits, steps,
    documents…). Live DB data always wins on identity, status, deadline and
    verification — only EMPTY fields are filled, never overwritten.
    """
    updates = {}
    for key, val in twin.model_dump().items():
        if key in _LIVE_IDENTITY_FIELDS:
            continue
        current = getattr(rec, key, None)
        if current in (None, [], "") and val not in (None, [], ""):
            updates[key] = val
    if not updates:
        return rec
    return rec.model_copy(update=updates)


def merge_feed(db: Session, catalog) -> List[PublishedOpportunity]:
    """Build the complete published feed.

    Base  : the static verified catalog (read-time freshness already applied
            by the catalog's status helpers — expired deadlines read closed).
    Layer : live DB records. A live record whose URL (or verified title twin)
            matches a static record REPLACES it — the static twin's enrich-
            ment is merged in, and the live status/deadline win. This is what
            makes revival work in the primary feed: a reopened program's DB
            row (active) takes over its closed static twin.
    """
    static_records = list(catalog.records())
    live_records = get_live_records(db)

    # Index static records by canonical URL for exact matching.
    static_by_url: dict = {}
    for rec in static_records:
        for url in (rec.application_url, rec.official_source_url):
            key = _canonical(url)
            if key and key not in static_by_url:
                static_by_url[key] = rec

    replaced_slugs: set = set()
    merged_live: List[PublishedOpportunity] = []

    for rec in live_records:
        twin = None
        key = _canonical(rec.application_url)
        if key:
            twin = static_by_url.get(key)
        if twin is None:
            twin = catalog.find_twin(
                title=rec.title, organizer=rec.provider_organization or ""
            )
        if twin is not None:
            replaced_slugs.add(twin.slug)
            rec = _enrich_from_twin(rec, twin)
        merged_live.append(rec)

    kept_static = [r for r in static_records if r.slug not in replaced_slugs]
    return kept_static + merged_live


# ── Weekly publishing refresh (metrics + audit, not a visibility gate) ─────────

def publishing_refresh(db: Session) -> dict:
    """Recompute the published feed and record measured metrics.

    Idempotent: the feed itself is a pure function of the DB; the only side
    effect is one AuditEvent row per run so consecutive runs diff against the
    previous run's slug set (newly_published / removed_from_feed are real
    measurements, never fabricated).

    Called by the weekly scheduler job and POST /api/pipeline/cron/publish.
    A failed run records nothing and changes nothing — the feed is computed
    at read time and stays valid regardless.
    """
    from app.models import AuditEvent, utc_now

    # Measure against fresh data — bypass the read TTL cache.
    invalidate_live_feed()
    records = merge_feed(db, _catalog_for_refresh())
    slugs = sorted(r.slug for r in records)

    previous = (
        db.query(AuditEvent)
        .filter(AuditEvent.event_type == "publishing_refresh")
        .order_by(AuditEvent.created_at.desc())
        .first()
    )
    prev_slugs = set((previous.payload or {}).get("slugs", [])) if previous else set()

    payload = {
        "finished_at": utc_now().isoformat(),
        "published_count": len(slugs),
        "newly_published": len([s for s in slugs if s not in prev_slugs]) if previous else len(slugs),
        "removed_from_feed": len([s for s in prev_slugs if s not in slugs]) if previous else 0,
        "live_count": len(get_live_records(db, force=True)),
        "slugs": slugs,
    }
    db.add(AuditEvent(event_type="publishing_refresh", payload=payload))
    db.commit()
    logger.info(
        f"Publishing refresh: {payload['published_count']} published "
        f"({payload['newly_published']} new, {payload['removed_from_feed']} removed, "
        f"{payload['live_count']} from live pipeline feed)."
    )
    return {k: v for k, v in payload.items() if k != "slugs"}


def _catalog_for_refresh():
    """The real catalog singleton, imported lazily to avoid import cycles."""
    from app.publishing.catalog import catalog
    return catalog
