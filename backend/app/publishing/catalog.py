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

    # Words too generic to identify a program on their own. Two shared title
    # tokens that are BOTH in this list are not evidence of a match (e.g. a
    # hypothetical "Max Planck Postdoctoral Fellowship" shares only
    # "postdoctoral"/"fellowship" with the Humboldt twin and must NOT latch on).
    # Region labels stored by onboarding (e.g. "Europe & UK") expand into the
    # concrete country/region keywords catalog records actually carry
    # (country_or_region like "Germany", "USA (San Francisco)", "Global").
    _REGION_KEYWORDS = {
        "europe": {"europe", "uk", "united kingdom", "germany", "switzerland", "france",
                   "netherlands", "italy", "spain", "sweden", "austria", "belgium",
                   "denmark", "norway", "finland", "ireland", "poland", "portugal",
                   "czech", "hungary", "greece", "estonia", "lithuania", "latvia",
                   "slovakia", "slovenia", "croatia", "serbia", "ukraine", "europ", "eu"},
        "north america": {"north america", "usa", "united states", "u.s.", "canada",
                          "america", "us"},
        "asia": {"asia", "japan", "china", "india", "singapore", "south korea", "korea",
                 "hong kong", "taiwan", "indonesia", "malaysia", "thailand", "vietnam",
                 "philippines", "australia", "new zealand", "apac", "pacific"},
        "middle east": {"middle east", "mena", "uae", "saudi arabia", "israel", "qatar",
                        "turkey", "egypt", "jordan", "kuwait", "bahrain", "oman",
                        "united arab emirates"},
        "global": {"global", "worldwide", "international", "remote"},
    }

    _GENERIC_TOKEN_STOPLIST = {
        "postdoctoral", "postdoc", "research", "fellowship", "fellowships",
        "grant", "grants", "scholarship", "scholarships", "program",
        "programme", "programs", "programmes", "phd", "doctoral",
        "studentship", "internship", "internships", "fund", "funding",
        "award", "awards", "prize", "prizes", "academic", "global",
        "international", "2026", "2027", "2028", "2029", "degree",
        "master", "masters", "bachelor", "summer", "winter", "fall",
        "spring", "batch", "cohort", "semester", "open", "apply",
        "application", "applications", "call", "calls", "year", "years",
        "scholars", "researchers", "excellence", "fellows", "ai", "ml",
        "data", "science", "sciences", "tech", "technology", "center",
        "centre", "institute", "university", "lab", "labs", "network",
        "innovation", "digital", "energy", "health", "climate",
    }

    def find_twin(
        self, title: str, organizer: str = "", category: Optional[str] = None
    ) -> Optional[PublishedOpportunity]:
        """Best-effort match of a legacy DB row to a published catalog record.

        Used to enrich legacy detail pages: the published catalog holds the
        verified, enriched twin of most legacy rows (different title/slug), so
        the legacy endpoint can surface the rich fields instead of the thin DB
        row.

        Matching is conservative to avoid wrong-program enrichment (which is
        worse than none): at least two shared title tokens AND either a shared
        provider token, >=3 shared title tokens, or a distinctive (non-generic)
        shared token such as "humboldt", "msca", or "cern".
        """
        self._ensure()
        if not title:
            return None
        title_tokens = _tokenize(title)
        org_tokens = _tokenize(organizer or "")

        best: Optional[PublishedOpportunity] = None
        best_score = 0.0
        for r in self._records:
            r_title_tokens = _tokenize(r.title or "")
            shared = title_tokens & r_title_tokens
            title_overlap = len(shared)
            if title_overlap < 2:
                continue
            r_org_tokens = _tokenize(r.provider_organization or "")
            org_overlap = len(org_tokens & r_org_tokens) if org_tokens and r_org_tokens else 0
            distinctive = any(
                tok not in self._GENERIC_TOKEN_STOPLIST for tok in shared
            )
            # Refuse weak title-only overlaps (e.g. only generic words).
            if org_overlap < 1 and title_overlap < 3 and not distinctive:
                continue
            # Weighted: title carries the most signal, provider breaks ties,
            # and matching opportunity_type adds a small bonus. Category is
            # NOT a hard filter — legacy rows often carry a slightly different
            # category than the enriched record's opportunity_type.
            score = title_overlap * 2.0 + org_overlap
            if category and r.opportunity_type == category:
                score += 1.0
            if score > best_score:
                best_score = score
                best = r
        return best

    # ── personalized matching ────────────────────────────────────────────
    def match_profile(
        self,
        focus_terms=None,
        skills=None,
        degree=None,
        countries=None,
        limit: int = 6,
        exclude_statuses=None,
    ) -> List:
        """Rank catalog records against a candidate's profile signals.

        Returns a list of (opportunity, score, reasons) tuples, highest score
        first. Signals are optional — an empty profile simply scores every
        record on generic quality (funding, verification, freshness) so the
        feed still returns useful defaults instead of failing.

        Scoring is intentionally transparent: each positive signal adds a
        human-readable reason, which the API surfaces to the UI.
        """
        self._ensure()
        exclude = set(exclude_statuses or ("closed",))

        focus = [str(t).lower() for t in (focus_terms or []) if t]
        skill_list = [str(s).lower() for s in (skills or []) if s]
        degree_tok = _tokenize(str(degree or ""))
        country_list = [str(c).lower() for c in (countries or []) if c]

        # Build the full set of tokens the candidate cares about.
        focus_tokens = set()
        for t in focus + skill_list:
            focus_tokens |= _tokenize(t)

        matched_focus: set = set()
        ranked: List = []

        for r in self._records:
            if r.status in exclude:
                continue

            score = 0.0
            reasons: List[str] = []

            # ── 1. Focus/domain fit (title, disciplines, tags, summary) ──
            opp_haystack = " ".join(
                [str(r.title or "")]
                + [str(getattr(r, f) or "") for f in (
                    "short_original_summary", "target_audience",
                    "eligibility_summary", "benefits_summary",
                    "host_institution", "provider_organization",
                )]
                + list(r.disciplines or [])
                + list(r.tags or [])
                + list(r.study_level or [])
            ).lower()
            opp_tokens = _tokenize(opp_haystack)
            if focus_tokens:
                hits = focus_tokens & opp_tokens
                if hits:
                    score += min(len(hits), 6) * 6.0
                    matched_focus |= hits
                    reasons.append(f"Matches your focus areas: {', '.join(sorted(hits)[:4])}")

            # ── 2. Degree / study level fit ──
            opp_level_tokens = _tokenize(" ".join(r.study_level or []) + " " + str(r.academic_requirements or ""))
            if degree_tok and (degree_tok & opp_level_tokens):
                score += 8.0
                reasons.append("Study level aligns with your degree")

            # ── 3. Country / region fit ──
            if country_list:
                country_hay = (str(r.country_or_region or "") + " " + str(r.citizenship_requirements or "")).lower()
                # Expand region labels ("Europe & UK", "Asia & Pacific"…) into
                # concrete country keywords so onboarding region picks actually
                # match catalog records like "Germany" or "USA (San Francisco)".
                wanted: set = set()
                for c in country_list:
                    cl = c.lower()
                    wanted.add(cl)  # literal term always kept
                    c_tokens = _tokenize(cl)
                    for region, keywords in self._REGION_KEYWORDS.items():
                        if c_tokens & set(_tokenize(region)) or any(k in cl for k in keywords if len(k) >= 4):
                            wanted |= keywords
                if wanted & set(_tokenize(country_hay)) or any(c in country_hay for c in wanted if len(c) >= 3):
                    score += 5.0
                    reasons.append("Location fits your target regions")
                elif "global" in country_hay or not r.country_or_region:
                    score += 1.5

            # ── 4. Funding quality ──
            funding_bonus = {
                "fully_funded": 10.0,
                "partially_funded": 7.0,
                "stipend": 6.0,
                "tuition_covered": 6.0,
                "grant_support": 4.0,
            }
            if r.funding_type in funding_bonus:
                score += funding_bonus[r.funding_type]

            # ── 5. Verification / trust ──
            conf = r.confidence_score or 0
            score += max(0.0, (conf - 60) / 10.0)  # +0 .. +4
            if (r.verification_status or "").startswith("officially"):
                score += 2.0

            # ── 6. Freshness / openness ──
            if r.status == "open":
                score += 5.0
            elif r.status == "rolling":
                score += 4.0
            elif r.status == "upcoming":
                score += 2.0

            ranked.append((score, r, reasons))

        ranked.sort(key=lambda x: (-x[0], -(x[1].confidence_score or 0), (x[1].title or "").lower()))

        # Normalize to the cohort's best score so the top recommendation reads
        # as a strong match ("100% Match") rather than a raw 46/70 quality
        # score. Scores of 0 stay 0; a dead tie still yields 100 for the best.
        best = ranked[0][0] if ranked else 0.0
        result = []
        for score, r, reasons in ranked[:limit]:
            pct = round(score / best * 100) if best > 0 else 0
            result.append((r, pct, reasons))

        # Drop generic tokens ("ai", "research", "fellowships"…) from the
        # surfaced focus terms — only distinctive matched words add signal.
        distinctive_focus = sorted(
            t for t in matched_focus if t not in self._GENERIC_TOKEN_STOPLIST
        )
        return result, distinctive_focus

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
