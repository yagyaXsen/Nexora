"""Regression tests for the pipeline hardening fixes.

Each test reproduces a failure that was observed empirically before the fix:

  runner      a DB error on one page poisoned the session (run stuck
              'running'), per-page errors were never persisted, and a page
              whose processing failed was never retried; junk is now rejected
              once instead of retried; unchanged pages can be force re-extracted
  lifecycle   an "applications closed" verdict was undone by the next sweep;
              the link checker re-checked the same first N rows forever
  scheduler   a capped ingest batch never reached sources past the cap;
              cron endpoints reported success when the job failed
  publishing  aggregator URLs were published; an empty live feed was never
              cached
  extraction  mock mode fabricated category/funding/country/eligibility and
              stored fetcher metadata as the description; loosely shaped LLM
              output was discarded or overflowed DB columns
  fetcher     Scrapling was called with the wrong API (StealthyFetcher.get
              does not exist; browser fetchers take milliseconds)

The module uses its OWN database engine so its sources/opportunities cannot
leak into (or be disturbed by) the other test modules.
"""

import hashlib
import os
import sys
import tempfile
import threading
import time
from datetime import datetime, timedelta, timezone
from unittest.mock import MagicMock, patch

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

import httpx
import pytest
import uvicorn
from fastapi import FastAPI, Response
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

import app.scheduler as sched
from app.config import settings
from app.database import Base
from app.models import (
    AuditEvent, Opportunity, OpportunityCategory, PipelineRun, RawDocument, Source, SourceType,
    utc_now,
)
from app.pipeline import fetcher as fetcher_mod
from app.pipeline import runner as runner_mod
from app.pipeline.lifecycle import check_dead_links, run_daily_expiry_sweep
from app.pipeline.runner import fail_orphaned_runs, runner
from app.publishing.live_feed import eligible_for_publishing, get_live_records, invalidate_live_feed

_TMP = tempfile.mkdtemp(prefix="nexora-hardening-")
engine = create_engine(f"sqlite:///{_TMP}/hardening.db", connect_args={"check_same_thread": False})
Base.metadata.create_all(bind=engine)
Session = sessionmaker(bind=engine, autocommit=False, autoflush=False)

# ── Controlled source site ─────────────────────────────────────────────────────

PORT = 8983
CLOSED: set = set()   # page slugs currently announcing "applications are closed"
JUNK: set = set()     # page slugs serving non-opportunity content


def _title(slug: str) -> str:
    # Random-looking tokens: titles of different pages share no words, so the
    # fuzzy deduper can never merge two pages of these tests.
    h = hashlib.md5(slug.encode()).hexdigest()
    return f"Programme {h[:6]} {h[6:12]}"


def _build_site() -> FastAPI:
    site = FastAPI()

    @site.get("/l/{key}")
    def listing(key: str):
        cards = "".join(
            f'<div class="card"><h3>{_title(s)}</h3><a href="/p/{s}">View</a></div>'
            for s in (f"{key}-one", f"{key}-two")
        )
        return Response(f"<html><body>{cards}</body></html>", media_type="text/html")

    @site.get("/p/{slug}")
    def page(slug: str):
        if slug in JUNK:
            body = "<h1>Team kitchen notes</h1><p>We made soup today and nothing else happened.</p>"
        else:
            closed = "<p>Applications are closed for this cycle.</p>" if slug in CLOSED else ""
            body = (
                f"<h1>{_title(slug)}</h1><p>This research fellowship grant supports doctoral "
                f"researchers. Apply now. Funding: $10,000. Eligibility: open to PhD students. "
                f"Deadline: January 31, 2031</p>{closed}"
                f'<a href="https://{slug}-official.example.org/apply">Apply Now</a>'
            )
        return Response(f"<html><body>{body}</body></html>", media_type="text/html")

    @site.get("/ok")
    def ok():
        return Response("fine", media_type="text/plain")

    @site.get("/fail")
    def fail():
        return Response("down", status_code=500)

    return site


@pytest.fixture(scope="module", autouse=True)
def site():
    server = uvicorn.Server(uvicorn.Config(_build_site(), host="127.0.0.1", port=PORT, log_level="error"))
    threading.Thread(target=server.run, daemon=True).start()
    for _ in range(50):
        try:
            httpx.get(f"http://127.0.0.1:{PORT}/ok", timeout=1)
            break
        except Exception:
            time.sleep(0.2)
    yield
    server.should_exit = True


@pytest.fixture
def db():
    session = Session()
    yield session
    session.close()


def _source(db, key: str) -> Source:
    src = Source(name=f"src {key}", type=SourceType.HTML.value, url=f"http://127.0.0.1:{PORT}/l/{key}",
                 config={"category_hint": "fellowship"}, enabled=True, schedule="daily")
    db.add(src)
    db.commit()
    db.refresh(src)
    return src


def _opp_for(db, slug: str):
    return db.query(Opportunity).filter(Opportunity.title == _title(slug)).first()


# ── Runner ─────────────────────────────────────────────────────────────────────

def test_page_db_error_is_rolled_back_recorded_and_retried(db):
    src = _source(db, "rb")
    real = runner_mod.deduper.process_extract
    calls = {"n": 0}

    def db_error_once(session, extract, source, raw_doc):
        calls["n"] += 1
        if calls["n"] == 1:
            # A genuine DB failure mid-run (stands in for a Postgres varchar
            # overflow): the session is unusable until rolled back.
            session.add(Opportunity(title=None, slug=f"broken-{time.time()}", description="d",
                                    organizer="o", apply_url="u", dedupe_key="k"))
            session.flush()
        return real(session, extract, source, raw_doc)

    with patch.object(runner_mod.deduper, "process_extract", side_effect=db_error_once):
        run1 = runner.run_source(db, src)

    assert run1.status == "completed" and run1.finished_at is not None
    assert (run1.new_count, run1.failed_count) == (1, 1), "the other page must still be processed"
    fresh = Session()
    persisted = fresh.get(PipelineRun, run1.id)
    assert len(persisted.error_log) == 1 and persisted.error_log[0]["raw_doc_id"], persisted.error_log
    fresh.close()
    assert _opp_for(db, "rb-one") is None

    run2 = runner.run_source(db, src)  # page unchanged, but its processing failed → retried
    assert (run2.fetched_count, run2.new_count, run2.revalidated_count) == (1, 1, 1)
    assert _opp_for(db, "rb-one") is not None

    run3 = runner.run_source(db, src)  # everything done → no reprocessing churn
    assert (run3.fetched_count, run3.failed_count, run3.revalidated_count) == (0, 0, 2)


def test_junk_page_is_rejected_once_and_not_retried(db):
    JUNK.add("jk-two")
    try:
        src = _source(db, "jk")
        run1 = runner.run_source(db, src)
        assert (run1.new_count, run1.failed_count) == (1, 1)
        statuses = {d.status for d in db.query(RawDocument).filter(RawDocument.source_id == src.id)}
        assert statuses == {"normalized", "rejected"}

        run2 = runner.run_source(db, src)
        assert (run2.fetched_count, run2.failed_count, run2.revalidated_count) == (0, 0, 1)
    finally:
        JUNK.discard("jk-two")


def test_force_reextract_reprocesses_unchanged_pages(db):
    src = _source(db, "fx")
    assert runner.run_source(db, src).new_count == 2
    assert runner.run_source(db, src).fetched_count == 0
    forced = runner.run_source(db, src, force_reextract=True)
    assert (forced.fetched_count, forced.updated_count, forced.new_count) == (2, 2, 0)


def test_orphaned_running_runs_are_closed(db):
    src = _source(db, "or")
    old = PipelineRun(source_id=src.id, status="running", started_at=utc_now() - timedelta(hours=5), error_log=[])
    live = PipelineRun(source_id=src.id, status="running", started_at=utc_now() - timedelta(minutes=10), error_log=[])
    db.add_all([old, live])
    db.commit()

    assert fail_orphaned_runs(db) == 1
    db.refresh(old)
    db.refresh(live)
    assert old.status == "failed" and "interrupted" in old.error_log[0]["fatal_error"]
    assert live.status == "running", "a run still in progress must not be touched"


# ── Lifecycle ──────────────────────────────────────────────────────────────────

def test_source_closed_notice_is_sticky_until_the_page_reopens(db):
    CLOSED.add("cl-one")
    try:
        src = _source(db, "cl")
        runner.run_source(db, src)
        opp = _opp_for(db, "cl-one")
        assert opp.closed_by_source and opp.status == "expired", "new record must honor the notice"
        assert opp.deadline.year == 2031, "the (future) deadline is kept for history"

        run_daily_expiry_sweep(db)            # used to revive it (future deadline)
        db.refresh(opp)
        assert opp.status == "expired"

        assert runner.run_source(db, src).revalidated_count == 2   # unchanged page
        db.refresh(opp)
        assert opp.status == "expired" and not eligible_for_publishing(opp)
    finally:
        CLOSED.discard("cl-one")

    runner.run_source(db, src)                # page no longer says closed
    db.refresh(opp)
    assert not opp.closed_by_source and opp.status == "active" and eligible_for_publishing(opp)


def test_link_check_rotates_through_all_rows(db):
    ids = []
    for i in range(6):
        o = Opportunity(title=f"Link rotation {i}", slug=f"link-rotation-{i}", description="d",
                        organizer="o", apply_url=f"http://127.0.0.1:{PORT}/ok", status="active",
                        dedupe_key=f"link-rotation-{i}")
        db.add(o)
        db.commit()
        ids.append(o.id)

    for _ in range(3):
        check_dead_links(db, max_checks=2)

    db.expire_all()
    checked = db.query(Opportunity).filter(Opportunity.id.in_(ids), Opportunity.last_checked_at != None).count()
    assert checked == 6, f"only {checked}/6 rows were ever link-checked"


def test_transient_failures_crossing_threshold_are_counted_dead(db):
    o = Opportunity(title="Flaky link", slug="flaky-link", description="d", organizer="o",
                    apply_url=f"http://127.0.0.1:{PORT}/fail", status="active", dedupe_key="flaky-link",
                    link_check_failures=settings.DEAD_LINK_FAILURE_THRESHOLD - 1)
    db.add(o)
    db.commit()

    result = check_dead_links(db, max_checks=1)
    db.refresh(o)
    assert o.status == "dead_link"
    assert result["dead_link_count"] == 1


# ── Scheduler & cron endpoints ─────────────────────────────────────────────────

def test_ingest_batches_rotate_without_starving_healthy_sources(db, monkeypatch):
    monkeypatch.setattr(sched, "SessionLocal", Session)
    monkeypatch.setattr(settings, "CRON_MAX_SOURCES", 2)
    monkeypatch.setattr(settings, "MIN_SOURCE_RESCRAPE_HOURS", 0)
    previously_enabled = [s.id for s in db.query(Source).filter(Source.enabled == True)]
    db.query(Source).update({Source.enabled: False})
    db.commit()
    for name in ("fail-0", "fail-1", "ok-0", "ok-1"):
        _source(db, name)

    attempted = []

    def fake_run(session, source):
        attempted.append(source.name)
        ok = source.name.startswith("src ok")
        run = PipelineRun(source_id=source.id, status="completed" if ok else "failed",
                          started_at=utc_now(), error_log=[])
        if ok:
            source.last_run_at = utc_now()
        session.add(run)
        session.commit()
        return run

    try:
        with patch.object(sched.runner, "run_source", side_effect=fake_run):
            sched.scheduled_ingest_all_sources()
            sched.scheduled_ingest_all_sources()
            assert set(attempted) == {"src fail-0", "src fail-1", "src ok-0", "src ok-1"}, attempted
            sched.scheduled_ingest_all_sources()
            assert attempted[-2:] == ["src fail-0", "src fail-1"], "least recently attempted go next"
    finally:
        db.query(Source).filter(Source.id.in_(previously_enabled)).update(
            {Source.enabled: True}, synchronize_session=False)
        db.commit()


def test_cron_endpoints_report_job_failures(monkeypatch):
    from app.main import app
    monkeypatch.setattr(sched, "SessionLocal", Session)
    client = TestClient(app)
    key = {"X-Admin-Key": settings.ADMIN_SECRET_KEY}

    with patch.object(sched, "run_daily_expiry_sweep", side_effect=RuntimeError("db down")):
        resp = client.post("/api/pipeline/cron/lifecycle", headers=key)
    assert resp.status_code == 500 and resp.json()["success"] is False

    with patch.object(sched, "publishing_refresh", side_effect=RuntimeError("merge exploded")):
        resp = client.post("/api/pipeline/cron/publish", headers=key)
    assert resp.status_code == 500 and resp.json()["success"] is False
    s = Session()
    assert s.query(AuditEvent).filter(AuditEvent.event_type == "publishing_failure").count() >= 1
    s.close()

    # The failure released the job lock: the next trigger runs normally.
    ok = client.post("/api/pipeline/cron/lifecycle", headers=key)
    assert ok.status_code == 200 and ok.json()["success"] is True
    assert "expired_count" in ok.json()["data"]


def test_overlapping_trigger_is_skipped_not_run_twice():
    from app.main import app
    client = TestClient(app)
    with sched._job_locks["ingest"]:
        assert sched.scheduled_ingest_all_sources() == {"skipped": "already_running"}
        resp = client.post("/api/pipeline/cron/ingest", headers={"X-Admin-Key": settings.ADMIN_SECRET_KEY})
    assert resp.status_code == 200
    assert resp.json()["data"] == {"skipped": "already_running"}


# ── Publishing ─────────────────────────────────────────────────────────────────

def _publishable(url: str) -> bool:
    return eligible_for_publishing(Opportunity(
        title="Real Fellowship", description="desc", status="active", source_id=1, confidence=0.9,
        needs_review=False, apply_url=url, last_verified_at=datetime.now(timezone.utc),
    ))


def test_aggregator_apply_urls_are_not_published():
    assert not _publishable("https://opportunitydesk.org/2026/09/01/some-fellowship/")
    assert not _publishable("https://www.opportunitydesk.org/some-fellowship/")
    assert not _publishable("https://devpost.com/hackathons/x")
    assert _publishable("https://fellowship.example.org/apply")
    assert _publishable("https://notopportunitydesk.org/apply"), "suffix match must respect domain boundaries"


def test_empty_live_feed_is_cached():
    fake_db = MagicMock()
    fake_db.query.return_value.options.return_value.filter.return_value.all.return_value = []
    invalidate_live_feed()
    try:
        assert get_live_records(fake_db) == []
        assert get_live_records(fake_db) == []
        assert fake_db.query.call_count == 1, "an empty result must be cached like any other"
        invalidate_live_feed()
        get_live_records(fake_db)
        assert fake_db.query.call_count == 2
    finally:
        invalidate_live_feed()


# ── Extraction ─────────────────────────────────────────────────────────────────

REALISTIC_RAW = (
    "DIRECT_APPLY_URL: https://a.org/apply\n\n# Alpha Research Fellowship\n"
    "**Source:** Opportunity Desk Fellowships\n**Program URL:** https://a.org/p\n"
    "**Apply URL:** https://a.org/apply\n\n# Program Page\n**Program URL:** https://a.org/p\n"
    "**Apply URL:** https://a.org/apply\n\nAlpha Research Fellowship\n"
    "The Alpha Research Fellowship offers grant funding for early-career researchers. "
    "Funding amount: $50,000. Apply now. Eligibility: PhD within 5 years. Deadline: January 31, 2027"
)


def test_mock_extraction_reports_only_facts_on_the_page():
    from app.ai_service import AIService
    from app.pipeline.extractor import extractor

    raw = RawDocument(id=1, url="https://a.org/p", canonical_url="https://a.org/apply",
                      raw_content=REALISTIC_RAW, content_hash="x", source_id=1)
    candidate = extractor.extract_candidates(raw)
    ex = AIService()._mock_extraction(candidate.cleaned_text, "Opportunity Desk Fellowships",
                                      "https://a.org/apply", "grant")

    assert ex.category == OpportunityCategory.FELLOWSHIP, "title keyword beats the source hint"
    assert ex.funding_amount == "$50,000", "was a hash-random amount"
    assert ex.country is None, "was a hash-random country"
    assert ex.eligibility_text == "Eligibility: PhD within 5 years"
    assert ex.description.startswith("The Alpha Research Fellowship offers"), ex.description
    assert "**" not in ex.description
    assert ex.confidence < 0.90, "heuristic records must never read as officially verified"

    bare = AIService()._mock_extraction(
        "Some Programme\nA page with plenty of words but nothing concrete about money or dates.",
        "Src", "https://x.org", None)
    assert (bare.funding_amount, bare.eligibility_text, bare.country, bare.deadline) == (None, None, None, None)
    assert bare.confidence == 0.75


@pytest.mark.parametrize("title,expected", [
    ("Grand Challenges Fellowship", "fellowship"),     # head noun (last keyword) wins
    ("Research Grant Competition", "competition"),
    ("ICML Travel Grant", "travel"),                   # specific phrase beats "grant"
    ("Programme 3fa9c2 81bd0e", "accelerator"),        # no keyword → the source hint
])
def test_heuristic_category_follows_title_head_noun(title, expected):
    from app.ai_service import _infer_category
    assert _infer_category(title, "", "accelerator").value == expected


def test_extract_schema_tolerates_llm_output_quirks():
    from app.schemas import OpportunityExtract
    ex = OpportunityExtract(category="Scholarship", title="T" * 900, organizer="O" * 400,
                            deadline="Rolling basis", apply_url="https://x.org", country="C" * 300,
                            funding_amount="F" * 400, description="d", tags="AI, ML", confidence=0.9)
    assert ex.category == OpportunityCategory.SCHOLARSHIP
    assert (len(ex.title), len(ex.organizer), len(ex.country), len(ex.funding_amount)) == (500, 255, 100, 255)
    assert ex.deadline is None and ex.tags == ["AI", "ML"]

    ex2 = OpportunityExtract(category="hackathon", title="T", organizer="O", deadline="2026-12-31",
                             apply_url="https://x.org", description="d", confidence="0.8")
    assert ex2.category == OpportunityCategory.COMPETITION
    assert ex2.deadline == datetime(2026, 12, 31, tzinfo=timezone.utc)


def test_dedupe_key_fits_its_column():
    from app.pipeline.deduper import canonicalize_url
    assert len(canonicalize_url("https://example.org/" + "a" * 600)) == 255


# ── Fetcher (Scrapling API contract) ───────────────────────────────────────────

class _FakePage:
    status = 200

    def get_all_text(self, ignore_tags=()):
        return "page text"

    def css(self, selector):
        return []


def _fake_fetcher(method: str, calls: list, raises: Exception = None):
    def call(cls, url, **kwargs):
        calls.append((cls.__name__, method, kwargs))
        if raises:
            raise raises
        return _FakePage()

    def no_instances(self, *a, **k):
        raise AssertionError("Scrapling 0.4 fetchers must be used via classmethods")

    return type(f"Fake{method.title()}", (), {method: classmethod(call), "__init__": no_instances})


def test_scrapling_backends_called_with_their_real_api(monkeypatch):
    calls = []
    monkeypatch.setattr(fetcher_mod, "_SCRAPLING_AVAILABLE", True)
    monkeypatch.setattr(fetcher_mod, "_ScraplingFetcher", _fake_fetcher("get", calls))
    monkeypatch.setattr(fetcher_mod, "_PlayWrightFetcher", _fake_fetcher("fetch", calls))
    monkeypatch.setattr(fetcher_mod, "_StealthyFetcher", _fake_fetcher("fetch", calls))

    for kwargs in ({}, {"use_js": True}, {"use_stealth": True}):
        assert fetcher_mod._fetch_page("https://example.org", timeout=25.0, **kwargs) is not None

    assert [(m, kw["timeout"]) for _, m, kw in calls] == [
        ("get", 25.0),        # HTTP Fetcher: seconds
        ("fetch", 25000),     # DynamicFetcher: milliseconds
        ("fetch", 25000),     # StealthyFetcher: milliseconds (it has no .get)
    ]


def test_real_scrapling_exposes_the_methods_we_call():
    scrapling = pytest.importorskip("scrapling")
    assert callable(getattr(scrapling.Fetcher, "get", None))
    assert callable(getattr(scrapling.DynamicFetcher, "fetch", None))
    assert callable(getattr(scrapling.StealthyFetcher, "fetch", None))
    assert not hasattr(scrapling.StealthyFetcher, "get")


def test_browser_backend_failure_falls_back_to_plain_http(monkeypatch):
    calls = []
    monkeypatch.setattr(fetcher_mod, "_SCRAPLING_AVAILABLE", True)
    monkeypatch.setattr(fetcher_mod, "_StealthyFetcher",
                        _fake_fetcher("fetch", calls, raises=RuntimeError("browser not installed")))

    page = fetcher_mod._fetch_page(f"http://127.0.0.1:{PORT}/p/fb-one", use_stealth=True)
    assert page is not None and page.backend == "bs4"
    assert _title("fb-one") in page.text
    # bs4 >= 4.12 has a non-callable .css attribute; the bs4 page must still
    # use the bs4 code path.
    assert page.find_apply_url(f"http://127.0.0.1:{PORT}/p/fb-one") == "https://fb-one-official.example.org/apply"
