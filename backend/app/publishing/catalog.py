"""Opportunity catalog — the in-memory, read-optimized index over the
published dataset. Storage-agnostic: it consumes the plain dicts produced by
`loader.load_records()`, so swapping JSON for Postgres/Supabase later only
changes where `records` comes from.
"""

import logging
import re
from pathlib import Path
from typing import Dict, List, Optional

from app.publishing.loader import load_records
from app.publishing.models import PublishedOpportunity, PublishedRejection, PublishedStats

logger = logging.getLogger(__name__)

SEARCHABLE_FIELDS = (
    "title",
    "provider_organization",
    "opportunity_type",
    "country_or_region",
    "target_audience",
)
ARRAY_SEARCH_FIELDS = ("tags", "disciplines", "study_level")


def _tokenize(text: str) -> set:
    return set(re.findall(r"[a-z0-9]{2,}", text.lower()))


class OpportunityCatalog:
    """Read-only catalog of published opportunities with search, filters,
    related-item scoring, and stats. Thread-safe for reads (loaded once)."""

    def __init__(self, source_path: Optional[Path] = None):
        self._source_path = source_path
        self._records: List[PublishedOpportunity] = []
        self._rejections: List[PublishedRejection] = []
        self._by_slug: Dict[str, PublishedOpportunity] = {}
        self._loaded = False

    # ── loading ────────────────────────────────────────────────────────────
    def load(self) -> None:
        if self._loaded:
            return
        raw_records, rejections = load_records(self._source_path)
        self._records = [PublishedOpportunity(**r) for r in raw_records]
        self._rejections = rejections
        self._by_slug = {r.slug: r for r in self._records}
        self._loaded = True
        logger.info("Catalog ready: %d live opportunities", len(self._records))

    def _ensure(self):
        if not self._loaded:
            self.load()

    @property
    def rejections(self) -> List[PublishedRejection]:
        self._ensure()
        return self._rejections

    # ── listing / filtering ────────────────────────────────────────────────
    def list(
        self,
        category: Optional[str] = None,
        country: Optional[str] = None,
        status: Optional[str] = None,
        q: Optional[str] = None,
        page: int = 1,
        page_size: int = 20,
        funded_only: bool = False,
    ) -> Dict:
        self._ensure()
        items = list(self._records)

        if category:
            items = [r for r in items if r.opportunity_type == category]
        if country:
            c = country.lower()
            items = [r for r in items if r.country_or_region and c in r.country_or_region.lower()]
        if status:
            items = [r for r in items if r.status == status]
        if funded_only:
            items = [r for r in items if r.funding_type in {"fully_funded", "partially_funded", "stipend"}]
        if q:
            tokens = _tokenize(q)
            if tokens:
                def _score(r: PublishedOpportunity) -> int:
                    hay = " ".join(
                        [str(getattr(r, f) or "") for f in SEARCHABLE_FIELDS]
                        + [" ".join(getattr(r, f) or []) for f in ARRAY_SEARCH_FIELDS]
                    ).lower()
                    toks = _tokenize(hay)
                    return len(tokens & toks)
                scored = [(r, _score(r)) for r in items]
                scored = [(r, s) for r, s in scored if s > 0]
                scored.sort(key=lambda x: (-x[1], x[0].title.lower()))
                items = [r for r, _ in scored]
            else:
                items = []

        total = len(items)
        pages = max(1, -(-total // page_size))
        start = (page - 1) * page_size
        page_items = items[start:start + page_size]

        categories = {}
        for r in self._records:
            categories[r.opportunity_type] = categories.get(r.opportunity_type, 0) + 1

        return {
            "items": [r.model_dump() if hasattr(r, "model_dump") else r.dict() for r in page_items],
            "total": total,
            "page": page,
            "page_size": page_size,
            "pages": pages,
            "categories": dict(sorted(categories.items())),
        }

    def get(self, slug: str) -> Optional[PublishedOpportunity]:
        self._ensure()
        return self._by_slug.get(slug)

    # ── related ────────────────────────────────────────────────────────────
    def related(self, slug: str, limit: int = 4) -> List[PublishedOpportunity]:
        self._ensure()
        base = self._by_slug.get(slug)
        if not base:
            return []

        base_type = base.opportunity_type or ""
        base_country = (base.country_or_region or "").lower()
        base_tokens = _tokenize(" ".join((base.tags or []) + (base.disciplines or [])))
        base_audience = _tokenize(base.target_audience or "")
        base_level = set(base.study_level or [])

        scored = []
        for r in self._records:
            if r.slug == slug:
                continue
            score = 0
            if r.opportunity_type == base_type:
                score += 3
            if r.country_or_region and base_country and base_country in r.country_or_region.lower():
                score += 2
            elif r.country_or_region and base_country:
                score += 1
            r_tokens = _tokenize(" ".join((r.tags or []) + (r.disciplines or [])))
            score += len(base_tokens & r_tokens)
            r_audience = _tokenize(r.target_audience or "")
            score += len(base_audience & r_audience)
            if base_level and (set(r.study_level or []) & base_level):
                score += 1
            if score > 0:
                scored.append((score, r))

        scored.sort(key=lambda x: (-x[0], x[1].title.lower()))
        return [r for _, r in scored[:limit]]

    # ── stats ──────────────────────────────────────────────────────────────
    def stats(self) -> PublishedStats:
        self._ensure()
        by_type: Dict[str, int] = {}
        by_status: Dict[str, int] = {}
        fully_funded = 0
        verified = 0
        for r in self._records:
            by_type[r.opportunity_type or "other"] = by_type.get(r.opportunity_type or "other", 0) + 1
            by_status[r.status] = by_status.get(r.status, 0) + 1
            if r.funding_type == "fully_funded":
                fully_funded += 1
            if (r.verification_status or "").startswith("officially"):
                verified += 1
        return PublishedStats(
            total=len(self._records),
            by_type=dict(sorted(by_type.items())),
            by_status=dict(sorted(by_status.items())),
            fully_funded=fully_funded,
            verified_count=verified,
            needs_review_count=sum(1 for r in self._records if r.confidence_score and r.confidence_score < 75),
        )


# Singleton — read-only, loaded lazily on first request.
catalog = OpportunityCatalog()
