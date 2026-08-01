"""Loader for the verified/enriched opportunity dataset.

Reads `nexora_verified_opportunities.json` (produced by the AI sourcing +
verification pipeline), validates each record against hard usability rules,
and returns normalized Python dicts ready for the catalog.

Storage-agnostic contract:
    load_records(path) -> (records: list[dict], rejections: list[PublishedRejection])
Replacing the JSON file with Postgres/Supabase later means implementing this
one function against SQL — nothing downstream changes.
"""

import json
import logging
import re
from datetime import date, datetime
from pathlib import Path
from typing import Dict, List, Optional, Tuple

from app.publishing.models import PublishedRejection

logger = logging.getLogger(__name__)

DEFAULT_PATH = Path(__file__).resolve().parents[2] / "nexora_verified_opportunities.json"

# Canonical Nexora opportunity types (frontend contract).
ALLOWED_TYPES = {
    "scholarship", "fellowship", "grant", "accelerator", "incubator",
    "competition", "hackathon", "conference", "research_program",
    "bootcamp", "workshop", "exchange_program", "global_youth_program",
}

# Fields that may arrive as a comma-separated string and must become arrays.
ARRAY_FIELDS = (
    "disciplines", "study_level", "required_documents", "application_steps",
    "tags", "related_links", "ai_match_reasons", "before_you_apply_checklist",
    "prep_tips", "missing_or_unclear_info", "badge_labels", "eligible_countries",
    "degree_level", "fields_of_interest",
)

# Fields that are arrays of strings in the source JSON.
SKIP_SCALAR = {"accepted_records", "rejected_records", "summary"}


def _to_list(value) -> List[str]:
    if value is None:
        return []
    if isinstance(value, list):
        return [str(v).strip() for v in value if str(v).strip()]
    if isinstance(value, str):
        return [v.strip() for v in re.split(r"[,\n;|]", value) if v.strip()]
    return [str(value)]


def _to_bool(value) -> Optional[bool]:
    if value is None:
        return None
    if isinstance(value, bool):
        return value
    if isinstance(value, (int, float)):
        return bool(value)
    return str(value).strip().lower() in {"1", "true", "yes", "y", "on"}


def _clean(value) -> Optional[str]:
    if value is None:
        return None
    if isinstance(value, str):
        s = value.strip()
        return s or None
    if isinstance(value, (int, float)):
        return str(value)
    return None


def _iso_date(value) -> Optional[str]:
    """Accept ISO strings, datetime objects, or date objects; return YYYY-MM-DD."""
    if value is None:
        return None
    if isinstance(value, datetime):
        return value.date().isoformat()
    if isinstance(value, date):
        return value.isoformat()
    if isinstance(value, (int, float)):
        # UNIX timestamp
        try:
            return datetime.utcfromtimestamp(float(value)).date().isoformat()
        except Exception:
            return None
    if isinstance(value, str):
        s = value.strip()
        if not s:
            return None
        # Already a date prefix (e.g. "2026-10-06T11:00:00" or "2026-10-06")
        m = re.match(r"^(\d{4}-\d{2}-\d{2})", s)
        if m:
            return m.group(1)
        # Full month name: "October 6, 2026"
        try:
            return datetime.strptime(s, "%B %d, %Y").date().isoformat()
        except ValueError:
            pass
        try:
            return datetime.strptime(s, "%b %d, %Y").date().isoformat()
        except ValueError:
            pass
    return None


def _slugify(text: str, existing: set) -> str:
    slug = re.sub(r"[^a-z0-9]+", "-", text.lower()).strip("-")
    slug = re.sub(r"-{2,}", "-", slug)[:120] or "opportunity"
    base, n = slug, 2
    while slug in existing:
        slug = f"{base}-{n}"
        n += 1
    existing.add(slug)
    return slug


def _infer_status(rec: dict) -> str:
    """Derive a stable status from the record's own status + deadline."""
    status = str(rec.get("status") or "").strip().lower()
    deadline = rec.get("deadline")

    if status in {"closed", "expired", "expired_or_archived", "archived"}:
        return "closed"

    # A real date that has passed => closed.
    if deadline and deadline < date.today().isoformat():
        return "closed"

    if status in {"rolling", "open_rolling"} or rec.get("rolling_deadline") is True:
        return "rolling"
    if status == "open":
        return "open"
    if status == "upcoming":
        return "upcoming"
    if status == "unclear":
        return "unclear"

    # No explicit status: infer from presence of a future deadline.
    if deadline:
        return "open"
    if rec.get("application_readiness") == "application_not_yet_open":
        return "upcoming"
    return "unclear"


def _infer_confidence(rec: dict) -> int:
    c = rec.get("confidence_score")
    if isinstance(c, (int, float)) and 0 <= c <= 100:
        return int(c)
    return 50


def normalize_record(raw: dict, slug_index: set) -> Optional[Dict]:
    """Validate one raw record and produce a normalized publishable dict.

    Returns None when the record is unusable (caller records the rejection).
    """
    if not isinstance(raw, dict):
        return None

    title = _clean(raw.get("title"))
    if not title or title.lower() in {"untitled opportunity", "untitled"}:
        return None

    app_url = _clean(raw.get("application_url"))
    src_url = _clean(raw.get("official_source_url"))
    if not app_url and not src_url:
        return None

    otype = _clean(raw.get("opportunity_type"))
    if otype and otype not in ALLOWED_TYPES:
        return None

    # Build a canonical slug.
    canonical = _clean(raw.get("canonical_slug"))
    slug = _slugify(canonical or title, slug_index)

    out: Dict = {}
    for key, value in raw.items():
        if key in SKIP_SCALAR:
            continue
        if key in ARRAY_FIELDS:
            out[key] = _to_list(value)
        elif key in {"rolling_deadline", "external_application", "requires_account_creation"}:
            out[key] = _to_bool(value)
        elif key in {
            "deadline", "start_date", "end_date", "application_opens",
            "application_closes", "last_verified_at",
        }:
            out[key] = _iso_date(value)
        elif isinstance(value, str):
            out[key] = value.strip() if value.strip() else None
        elif value is not None:
            out[key] = value

    out["slug"] = slug
    out["title"] = title
    out["opportunity_type"] = otype or "other"
    out["application_url"] = app_url
    out["official_source_url"] = src_url
    out["confidence_score"] = _infer_confidence(raw)
    out["status"] = _infer_status(out)
    out["mode"] = (out.get("mode") or "unknown").lower() if out.get("mode") else "unknown"

    # Verification label used for trust badges.
    vs = _clean(raw.get("verification_status"))
    if vs:
        out["verification_status"] = vs
    else:
        out["verification_status"] = (
            "officially_verified" if out["confidence_score"] >= 90
            else "partially_verified" if out["confidence_score"] >= 75
            else "needs_review"
        )

    return out


def load_records(
    path: Optional[Path] = None,
) -> Tuple[List[Dict], List[PublishedRejection]]:
    """Load, validate, and normalize the verified dataset.

    Returns (records, rejections). Never raises on bad data — unusable rows
    are collected as PublishedRejection entries so the pipeline is transparent.
    """
    p = Path(path) if path else DEFAULT_PATH
    if not p.exists():
        logger.warning("Published dataset not found at %s — publishing empty catalog.", p)
        return [], []

    try:
        with open(p, "r", encoding="utf-8") as f:
            payload = json.load(f)
    except (json.JSONDecodeError, OSError) as e:
        logger.error("Failed to read published dataset %s: %s", p, e)
        return [], []

    if isinstance(payload, dict):
        raw_records = payload.get("accepted_records") or []
    elif isinstance(payload, list):
        raw_records = payload
    else:
        raw_records = []

    records: List[Dict] = []
    rejections: List[PublishedRejection] = []
    slug_index: set = set()

    for raw in raw_records:
        if not isinstance(raw, dict):
            rejections.append(PublishedRejection(
                input_title=str(raw)[:80],
                rejection_reason="insufficient_verification",
                notes="Record is not a JSON object.",
            ))
            continue

        title = _clean(raw.get("title")) or "Untitled"
        provider = _clean(raw.get("provider_organization")) or "Unknown provider"
        url = _clean(raw.get("application_url")) or _clean(raw.get("official_source_url"))

        normalized = normalize_record(raw, slug_index)
        if normalized is None:
            rejections.append(PublishedRejection(
                input_title=title,
                input_provider=provider,
                input_url=url,
                rejection_reason="insufficient_verification",
                notes="Missing title or both application_url and official_source_url.",
            ))
            continue

        records.append(normalized)

    logger.info("Published catalog: %d accepted, %d rejected from %s", len(records), len(rejections), p.name)
    return records, rejections
