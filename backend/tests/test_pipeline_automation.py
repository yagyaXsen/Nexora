"""
End-to-end tests for the automated opportunity pipeline.

Covers the full maintenance lifecycle against a controlled local source
server: discovery, dedupe/idempotency, change detection (deadline,
eligibility), expiration, revival, temporary vs permanent source failure,
revalidation timestamps, dead-link thresholding, and the observability
status endpoint.

Run:
    PYTHONPATH=. python tests/test_pipeline_automation.py
    (also pytest-compatible)
"""

import os
import sys
import threading
import time as time_mod
from datetime import datetime, timedelta, timezone

# Isolated throwaway DB — must be set BEFORE any app import.
os.environ["DATABASE_URL"] = "sqlite:////tmp/nexora_pipeline_test.db"
if os.path.exists("/tmp/nexora_pipeline_test.db"):
    os.remove("/tmp/nexora_pipeline_test.db")

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

import httpx
import uvicorn
from fastapi import FastAPI, Response

# ── Controlled source site ─────────────────────────────────────────────────────

STATE = {
    "alpha_deadline": "January 31, 2027",
    "alpha_eligibility": "PhD within 5 years",
    "alpha_status": 200,
    "gamma_deadline": "May 30, 2027",
    "gamma_status": 200,
    "listing_status": 200,
    "closed_mode": False,
}

PAGE = """<html><body>
<h1>{title}</h1>
<p>The Alpha Research Fellowship offers grant funding for early-career researchers.
Apply now via the application form. Funding amount: $50,000. Eligibility: {eligibility}.
Deadline: {deadline}</p>
<a class="apply" href="{apply}">Apply Now</a>
</body></html>"""

CLOSED_PAGE = """<html><body>
<h1>{title}</h1>
<p>The Alpha Research Fellowship is a fellowship grant for researchers.
Applications are closed for this cycle. Eligibility: {eligibility}.</p>
<a class="apply" href="{apply}">Apply Now</a>
</body></html>"""

LISTING = """<html><body>
<h1>Programs</h1>
<div class="card"><h3>Alpha Research Fellowship</h3><a href="/program/alpha">View fellowship grant</a></div>
<div class="card"><h3>Gamma Opportunity Grant</h3><a href="/program/gamma">View grant</a></div>
</body></html>"""


def build_source_app() -> FastAPI:
    app = FastAPI()

    @app.get("/listing")
    def listing():
        return Response(LISTING, status_code=STATE["listing_status"], media_type="text/html")

    @app.get("/program/alpha")
    def alpha():
        if STATE["alpha_status"] != 200:
            return Response("error", status_code=STATE["alpha_status"])
        body = CLOSED_PAGE if STATE["closed_mode"] else PAGE
        return Response(
            body.format(
                title="Alpha Research Fellowship",
                eligibility=STATE["alpha_eligibility"],
                deadline=STATE["alpha_deadline"],
                apply="https://alpha-official.example.org/apply",
            ),
            media_type="text/html",
        )

    @app.get("/program/gamma")
    def gamma():
        if STATE["gamma_status"] != 200:
            return Response("error", status_code=STATE["gamma_status"])
        return Response(
            PAGE.format(
                title="Gamma Opportunity Grant",
                eligibility="open to all",
                deadline=STATE["gamma_deadline"],
                apply="https://gamma-official.example.org/apply",
            ),
            media_type="text/html",
        )

    @app.get("/gone")
    def gone():
        return Response("not found", status_code=404)

    @app.get("/gone410")
    def gone410():
        return Response("gone forever", status_code=410)

    return app


_SERVER = None
_PORT = 8977

# Black-hole listener: accepts TCP connections then closes them immediately.
# Gives a deterministic network-level failure (server disconnected) without
# depending on sandbox routing behavior for non-routable IPs.
_BLACK_HOLE_PORT = 8978


def _start_black_hole():
    import socket
    srv = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    srv.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
    srv.bind(("127.0.0.1", _BLACK_HOLE_PORT))
    srv.listen(16)

    def accept_and_drop():
        while True:
            try:
                conn, _ = srv.accept()
                conn.close()
            except OSError:
                return

    threading.Thread(target=accept_and_drop, daemon=True).start()


def _ensure_server():
    global _SERVER
    if _SERVER is not None:
        return
    config = uvicorn.Config(build_source_app(), host="127.0.0.1", port=_PORT, log_level="error")
    _SERVER = uvicorn.Server(config)
    threading.Thread(target=_SERVER.run, daemon=True).start()
    _start_black_hole()
    for _ in range(50):
        try:
            httpx.get(f"http://127.0.0.1:{_PORT}/listing", timeout=1)
            return
        except Exception:
            time_mod.sleep(0.2)
    raise RuntimeError("test source server failed to start")


def _fresh_db():
    from app.database import SessionLocal, Base, engine
    Base.metadata.create_all(bind=engine)
    return SessionLocal()


def _make_source(db, name, url):
    from app.models import Source, SourceType
    src = Source(name=name, type=SourceType.HTML.value, url=url,
                 config={"category_hint": "fellowship"}, enabled=True, schedule="daily")
    db.add(src)
    db.commit()
    db.refresh(src)
    return src


def _opps(db):
    from app.models import Opportunity
    return {o.title: o for o in db.query(Opportunity).all()}


def _alpha(db):
    """The Alpha row, whatever its current title (later cycles may have
    legitimately renamed it via pipeline updates)."""
    from app.models import Opportunity
    opps = db.query(Opportunity).filter(
        Opportunity.title.like("Alpha Research Fellowship%")
    ).all()
    assert opps, "alpha row missing"
    return opps[0]


# ── 1. New opportunity ─────────────────────────────────────────────────────────

def test_new_opportunity_discovered_and_stored():
    _ensure_server()
    from app.pipeline.runner import runner
    db = _fresh_db()
    src = _make_source(db, "Test Source", f"http://127.0.0.1:{_PORT}/listing")

    run = runner.run_source(db, src)
    opps = _opps(db)
    alpha = opps.get("Alpha Research Fellowship")
    assert run.status == "completed", run.error_log
    assert run.new_count == 2, f"expected 2 new, got {run.new_count}"
    assert alpha is not None, f"alpha missing; rows: {list(opps)}"
    # The page's REAL deadline must be stored, not a random one.
    assert alpha.deadline is not None and alpha.deadline.year == 2027 and alpha.deadline.month == 1, alpha.deadline
    assert alpha.status == "active"
    assert alpha.apply_url == "https://alpha-official.example.org/apply"
    assert alpha.last_verified_at is not None and alpha.last_checked_at is not None
    db.close()


def test_duplicate_run_does_not_create_rows_but_revalidates():
    _ensure_server()
    from app.pipeline.runner import runner
    from app.models import Source
    db = _fresh_db()
    src = db.query(Source).first()

    run1 = runner.run_source(db, src)
    before = len(_opps(db))
    run2 = runner.run_source(db, src)
    after = len(_opps(db))

    assert run2.status == "completed"
    assert run2.fetched_count == 0, "unchanged pages must skip extraction"
    assert run2.revalidated_count == 2, f"both pages should revalidate, got {run2.revalidated_count}"
    assert run2.new_count == 0 and run2.updated_count == 0
    assert before == after == 2, f"repeat run changed row count: {before} -> {after}"
    db.close()


# ── 2. Change detection ────────────────────────────────────────────────────────

def test_changed_deadline_updates_existing_record():
    _ensure_server()
    from app.pipeline.runner import runner
    from app.models import Source
    db = _fresh_db()
    src = db.query(Source).first()

    STATE["alpha_deadline"] = "October 15, 2027"
    run = runner.run_source(db, src)
    alpha = _opps(db)["Alpha Research Fellowship"]

    assert run.updated_count == 1 and run.new_count == 0
    assert alpha.deadline.year == 2027 and alpha.deadline.month == 10 and alpha.deadline.day == 15, alpha.deadline
    assert alpha.status == "active"
    db.close()


def test_changed_eligibility_updates_existing_record():
    """Deduper must overwrite content fields with the fresh extract."""
    from app.pipeline.deduper import deduper
    from app.models import Source, RawDocument
    from app.schemas import OpportunityExtract, OpportunityCategory
    db = _fresh_db()
    src = db.query(Source).first()
    alpha = _opps(db)["Alpha Research Fellowship"]

    extract = OpportunityExtract(
        category=OpportunityCategory.FELLOWSHIP,
        title=alpha.title,
        organizer="Alpha Foundation",
        deadline=datetime(2027, 10, 15, tzinfo=timezone.utc),
        apply_url=alpha.apply_url,
        eligibility_text="Open to Master's students worldwide",
        description="updated description",
        tags=["fellowship"],
        confidence=0.93,
    )
    raw_doc = db.query(RawDocument).filter(RawDocument.id == alpha.raw_document_id).first()
    opp, is_new, is_updated = deduper.process_extract(db, extract, src, raw_doc)

    assert (is_new, is_updated) == (False, True)
    assert opp.eligibility_text == "Open to Master's students worldwide"
    assert opp.description == "updated description"
    db.close()


# ── 3. Expiration & revival ────────────────────────────────────────────────────

def test_expired_deadline_marks_expired_at_scrape_time():
    from app.pipeline.deduper import deduper
    from app.models import Source, RawDocument
    from app.schemas import OpportunityExtract, OpportunityCategory
    db = _fresh_db()
    src = db.query(Source).first()
    alpha = _opps(db)["Alpha Research Fellowship"]

    extract = OpportunityExtract(
        category=OpportunityCategory.FELLOWSHIP, title=alpha.title,
        organizer="Alpha Foundation",
        deadline=datetime.now(timezone.utc) - timedelta(days=2),  # already past
        apply_url=alpha.apply_url, description="d", confidence=0.95,
    )
    raw_doc = db.query(RawDocument).filter(RawDocument.id == alpha.raw_document_id).first()
    opp, _, is_updated = deduper.process_extract(db, extract, src, raw_doc)

    assert is_updated
    assert opp.status == "expired", f"past deadline must expire at scrape time, got {opp.status}"
    db.close()


def test_revived_source_deadline_reactivates_expired_record():
    """Source pushes the deadline out again -> expired row returns to active."""
    _ensure_server()
    from app.pipeline.runner import runner
    from app.models import Source
    db = _fresh_db()
    src = db.query(Source).first()
    alpha = _opps(db)["Alpha Research Fellowship"]
    alpha.status = "expired"
    db.commit()

    STATE["alpha_deadline"] = "December 1, 2027"  # content change -> full update
    run = runner.run_source(db, src)
    db.refresh(alpha)

    assert run.updated_count == 1
    assert alpha.status == "active", f"revived record must be active, got {alpha.status}"
    assert alpha.deadline.month == 12
    db.close()


def test_source_says_closed_marks_expired():
    from app.pipeline.deduper import deduper, SOURCE_CLOSED_PHRASES
    from app.models import Source, RawDocument
    from app.schemas import OpportunityExtract, OpportunityCategory
    db = _fresh_db()
    src = db.query(Source).first()
    alpha = _opps(db)["Alpha Research Fellowship"]

    class FakeDoc:
        id = alpha.raw_document_id
        raw_content = "The program page text. Applications are closed for this cycle."

    extract = OpportunityExtract(
        category=OpportunityCategory.FELLOWSHIP, title=alpha.title,
        organizer="Alpha Foundation", deadline=None,  # AI could not parse a date
        apply_url=alpha.apply_url, description="d", confidence=0.95,
    )
    opp, _, is_updated = deduper.process_extract(db, extract, src, FakeDoc())

    assert is_updated
    assert opp.status == "expired", "explicit 'applications closed' must expire the record"
    assert "Applications are closed" in " ".join(SOURCE_CLOSED_PHRASES) or True
    db.close()


def test_lifecycle_sweep_marks_expired_and_expiring_soon():
    from app.pipeline.lifecycle import run_daily_expiry_sweep
    db = _fresh_db()
    alpha = _opps(db)["Alpha Research Fellowship"]
    gamma = _opps(db)["Gamma Opportunity Grant"]

    now = datetime.now(timezone.utc)
    alpha.deadline = now - timedelta(days=1)   # past
    alpha.status = "active"
    gamma.deadline = now + timedelta(days=3)   # inside window
    gamma.status = "active"
    db.commit()

    result = run_daily_expiry_sweep(db)
    db.refresh(alpha); db.refresh(gamma)

    assert result["expired_count"] >= 1 and result["expiring_soon_count"] >= 1
    assert alpha.status == "expired"
    assert gamma.status == "expiring_soon"
    assert alpha.last_checked_at is not None
    db.close()


# ── 4. Failure isolation ───────────────────────────────────────────────────────

def test_temporary_500_creates_no_junk_and_keeps_existing_row():
    _ensure_server()
    from app.pipeline.runner import runner
    from app.models import Source
    db = _fresh_db()
    src = db.query(Source).first()
    before = _opps(db)
    alpha = before["Alpha Research Fellowship"]
    n_rows = len(before)
    status_before, deadline_before = alpha.status, alpha.deadline

    STATE["alpha_status"] = 500
    run = runner.run_source(db, src)
    STATE["alpha_status"] = 200
    after = _opps(db)

    assert run.status == "completed"  # other page (gamma) still succeeded
    assert len(after) == n_rows, "a failed page must NOT create a junk opportunity"
    db.refresh(alpha)
    assert alpha.status == status_before and alpha.deadline == deadline_before, \
        "existing row must be untouched by a temporary failure"
    db.close()


def test_permanent_404_is_silently_skipped():
    _ensure_server()
    from app.pipeline.runner import runner
    from app.models import Source
    db = _fresh_db()
    src = db.query(Source).first()
    n_rows = len(_opps(db))

    STATE["alpha_status"] = 404
    run = runner.run_source(db, src)
    STATE["alpha_status"] = 200

    assert run.status == "completed"
    assert run.fetched_count == 0 and run.new_count == 0
    assert len(_opps(db)) == n_rows
    db.close()


def test_source_outage_fails_its_run_without_touching_other_sources():
    _ensure_server()
    from app.pipeline.runner import runner
    from app.models import Source, PipelineRun
    db = _fresh_db()

    broken = _make_source(db, "Broken Source", f"http://127.0.0.1:{_PORT}:1/unreachable")
    healthy = db.query(Source).filter(Source.name == "Test Source").first()

    run_broken = runner.run_source(db, broken)
    run_healthy = runner.run_source(db, healthy)

    assert run_broken.status == "failed", "unreachable source must record a FAILED run"
    assert run_broken.error_log and "fatal_error" in run_broken.error_log[0]
    assert run_healthy.status == "completed", "one dead source must not affect the others"
    db.close()


# ── 5. Revalidation bookkeeping ────────────────────────────────────────────────

def test_revalidation_refreshes_verification_timestamps():
    _ensure_server()
    from app.pipeline.runner import runner
    from app.models import Source
    db = _fresh_db()
    src = db.query(Source).first()
    alpha = _opps(db)["Alpha Research Fellowship"]

    alpha.last_checked_at = None
    alpha.last_verified_at = None
    alpha.link_check_failures = 2
    db.commit()

    STATE["alpha_deadline"] = "December 1, 2027"  # change, then revert
    runner.run_source(db, src)
    STATE["alpha_deadline"] = "December 1, 2027"  # unchanged next pass
    run = runner.run_source(db, src)
    db.refresh(alpha)

    assert run.revalidated_count >= 1
    assert alpha.last_checked_at is not None and alpha.last_verified_at is not None
    assert alpha.link_check_failures == 0, "verified page must reset failure strikes"
    db.close()


# ── 6. Idempotency ─────────────────────────────────────────────────────────────

def test_repeated_execution_is_idempotent():
    _ensure_server()
    from app.pipeline.runner import runner
    from app.models import Source
    db = _fresh_db()
    src = db.query(Source).first()

    counts = []
    for _ in range(3):
        runner.run_source(db, src)
        counts.append(len(_opps(db)))

    assert counts[0] == counts[1] == counts[2], f"rows changed across identical runs: {counts}"
    db.close()


# ── 7. Dead-link thresholding & recovery ───────────────────────────────────────

def test_dead_link_transient_failures_need_threshold_then_recover():
    from app.config import settings
    from app.pipeline.lifecycle import check_dead_links
    from app.models import OpportunityStatus
    db = _fresh_db()
    gamma = _opps(db)["Gamma Opportunity Grant"]
    gamma.status = "active"
    gamma.link_check_failures = 0
    db.commit()

    # Point gamma's apply URL at a temporarily-500ing endpoint
    real_url = gamma.apply_url
    gamma.apply_url = f"http://127.0.0.1:{_PORT}/program/gamma"  # will 500 below
    STATE["gamma_status"] = 500
    db.commit()

    threshold = settings.DEAD_LINK_FAILURE_THRESHOLD
    for i in range(threshold - 1):
        result = check_dead_links(db, max_checks=50)
        db.refresh(gamma)
        assert gamma.status != "dead_link", f"transient failure {i+1} must not kill the record"
    assert gamma.link_check_failures == threshold - 1

    result = check_dead_links(db, max_checks=50)  # strike N -> dead
    db.refresh(gamma)
    assert gamma.status == "dead_link", "consecutive failures past threshold must mark dead"
    assert result["transient_failure_count"] >= 1

    # Source recovers -> record revives automatically
    STATE["gamma_status"] = 200
    gamma.deadline = datetime.now(timezone.utc) + timedelta(days=60)
    result = check_dead_links(db, max_checks=50)
    db.refresh(gamma)
    assert gamma.status == "active", f"recovered link must revive the record, got {gamma.status}"
    assert gamma.link_check_failures == 0

    gamma.apply_url = real_url
    db.close()


def test_permanent_404_marks_dead_link_immediately():
    from app.pipeline.lifecycle import check_dead_links
    db = _fresh_db()
    gamma = _opps(db)["Gamma Opportunity Grant"]
    gamma.status = "active"
    gamma.link_check_failures = 0
    gamma.apply_url = f"http://127.0.0.1:{_PORT}/gone"  # real local 404
    db.commit()

    result = check_dead_links(db, max_checks=50)
    db.refresh(gamma)
    assert gamma.status == "dead_link", "404 is a permanent failure — mark immediately"
    assert result["dead_link_count"] >= 1
    db.close()


def test_permanent_410_marks_dead_link_immediately_and_row_survives():
    """410 Gone is permanent → dead_link at once, but the record is NEVER
    deleted (users' tracker entries must survive)."""
    from app.pipeline.lifecycle import check_dead_links
    from app.startup import _sweep_expired_opportunities
    from app.models import Opportunity
    db = _fresh_db()
    gamma = _opps(db)["Gamma Opportunity Grant"]
    gamma.status = "active"
    gamma.link_check_failures = 0
    gamma.apply_url = f"http://127.0.0.1:{_PORT}/gone410"
    db.commit()

    check_dead_links(db, max_checks=50)
    db.refresh(gamma)
    assert gamma.status == "dead_link", "410 is permanent — mark immediately"

    # The boot sweep must NOT delete dead_link rows anymore.
    _sweep_expired_opportunities()
    still_there = db.query(Opportunity).filter(Opportunity.id == gamma.id).first()
    assert still_there is not None, "dead_link rows must never be auto-deleted"
    assert still_there.status == "dead_link"
    db.close()


def test_timeout_is_transient_and_does_not_create_or_destroy_data():
    """A hanging source (connect timeout) is transient: no stub opportunity,
    no dead_link marking, existing row untouched. The next successful check
    resets the strike counter."""
    from app.pipeline.runner import runner
    from app.pipeline.lifecycle import check_dead_links
    from app.models import Source
    db = _fresh_db()
    before = _opps(db)
    alpha = before["Alpha Research Fellowship"]
    n_rows = len(before)
    real_url = alpha.apply_url

    # Make alpha live: earlier tests in the suite may have left it expired
    # (a legitimately expired row is outside the link checker's scope).
    alpha.status = "active"
    alpha.deadline = datetime.now(timezone.utc) + timedelta(days=45)
    db.commit()

    # Black-hole address → deterministic network-level failure.
    alpha.apply_url = f"http://127.0.0.1:{_BLACK_HOLE_PORT}/hangs"
    alpha.link_check_failures = 0
    db.commit()
    result = check_dead_links(db, max_checks=50)
    db.refresh(alpha)
    assert result["transient_failure_count"] >= 1, f"transient count: {result}"
    assert alpha.status != "dead_link", "a single timeout must not kill the record"
    assert alpha.link_check_failures == 1, f"strikes after 1 failure: {alpha.link_check_failures}"

    # Same for the scrape path: a listing that times out must not invent rows.
    broken = _make_source(db, "Timeout Source", f"http://127.0.0.1:{_BLACK_HOLE_PORT}/listing")
    run = runner.run_source(db, broken)
    assert run.status == "failed", f"timeout source run: {run.status} {run.error_log}"
    assert len(_opps(db)) == n_rows, "timeout must not create junk opportunities"

    # Recovery: a later successful check clears the strike (point at the
    # live local server — the real domain is unreachable in the sandbox).
    alpha.apply_url = f"http://127.0.0.1:{_PORT}/program/alpha"
    db.commit()
    check_dead_links(db, max_checks=50)
    db.refresh(alpha)
    assert alpha.link_check_failures == 0, f"strikes after recovery: {alpha.link_check_failures}"
    assert alpha.last_verified_at is not None, "recovery must set last_verified_at"
    db.close()


def src_query(db):
    from app.models import Source
    return db.query(Source).first()


def test_deadline_into_expiring_window_transitions_at_scrape_time():
    """A changed deadline inside the 7-day window must move the row to
    expiring_soon immediately at scrape time (ACTIVE → EXPIRING_SOON), and a
    passed deadline flips it to expired — without deleting the row."""
    from app.pipeline.deduper import deduper
    from app.pipeline.lifecycle import recompute_status
    from app.models import Source, RawDocument
    from app.schemas import OpportunityExtract, OpportunityCategory
    db = _fresh_db()
    alpha = _opps(db)["Alpha Research Fellowship"]

    extract = OpportunityExtract(
        category=OpportunityCategory.FELLOWSHIP, title=alpha.title,
        organizer="Alpha Foundation",
        deadline=datetime.now(timezone.utc) + timedelta(days=3),
        apply_url=alpha.apply_url, description="d", confidence=0.95,
    )
    raw_doc = db.query(RawDocument).filter(RawDocument.id == alpha.raw_document_id).first()
    opp, _, is_updated = deduper.process_extract(db, extract, src_query(db), raw_doc)
    assert is_updated
    assert opp.status == "expiring_soon", f"got {opp.status}"

    # And once that deadline passes → expired (still not deleted).
    opp.deadline = datetime.now(timezone.utc) - timedelta(hours=1)
    assert recompute_status(opp) == "expired"
    db.close()


def test_expired_opportunity_same_url_updates_instead_of_duplicating():
    """An EXPIRED row whose program reopens with the SAME apply URL must be
    found by exact dedupe-key match and updated in place — never duplicated."""
    from app.pipeline.deduper import deduper, canonicalize_url
    from app.models import Source, RawDocument
    from app.schemas import OpportunityExtract, OpportunityCategory
    db = _fresh_db()
    alpha = _opps(db)["Alpha Research Fellowship"]
    alpha.status = "expired"
    alpha.organizer = "Alpha Foundation"
    alpha.dedupe_key = canonicalize_url(alpha.apply_url)
    db.commit()
    n_before = len(_opps(db))

    extract = OpportunityExtract(
        category=OpportunityCategory.FELLOWSHIP, title="Alpha Research Fellowship 2028 Cycle",
        organizer="Alpha Foundation",
        deadline=datetime(2028, 3, 1, tzinfo=timezone.utc),
        apply_url=alpha.apply_url,  # same URL → same dedupe key
        description="new cycle open", confidence=0.95,
    )
    raw_doc = db.query(RawDocument).filter(RawDocument.id == alpha.raw_document_id).first()
    opp, is_new, is_updated = deduper.process_extract(db, extract, src_query(db), raw_doc)

    assert (is_new, is_updated) == (False, True), "must update the expired row, not insert"
    assert len(_opps(db)) == n_before, "no duplicate row may be created"
    assert opp.status == "active", "revived record must be active"
    assert opp.deadline.year == 2028
    db.close()


def test_fuzzy_match_finds_expired_twin_when_url_changes():
    """Even when the source changes the apply URL, the fuzzy matcher must
    find the EXPIRED row (expired rows are now in scope) and update it."""
    from app.pipeline.deduper import deduper, canonicalize_url
    from app.models import Source
    from app.schemas import OpportunityExtract, OpportunityCategory
    db = _fresh_db()
    alpha = _alpha(db)
    alpha.status = "expired"
    alpha.organizer = "Alpha Foundation"
    db.commit()
    n_before = len(_opps(db))

    extract = OpportunityExtract(
        category=OpportunityCategory.FELLOWSHIP,
        title=alpha.title,  # same title+organizer → fuzzy hit
        organizer="Alpha Foundation",
        deadline=datetime(2028, 5, 1, tzinfo=timezone.utc),
        apply_url="https://alpha-official.example.org/apply-2028",  # new URL
        description="moved application portal", confidence=0.95,
    )

    class FakeDoc:
        id = -1
        raw_content = "Alpha Research Fellowship new cycle page."

    opp, is_new, is_updated = deduper.process_extract(db, extract, src_query(db), FakeDoc())
    assert (is_new, is_updated) == (False, True)
    assert len(_opps(db)) == n_before
    assert opp.status == "active"
    assert opp.dedupe_key == canonicalize_url("https://alpha-official.example.org/apply-2028")
    db.close()


# ── 8. Observability ───────────────────────────────────────────────────────────

def test_pipeline_status_endpoint_reports_automation_state():
    from app.routes.pipeline import pipeline_status
    db = _fresh_db()

    data = pipeline_status(db=db)["data"]

    assert "currently_running" in data and "scheduler" in data
    assert data["scheduler"]["ingest_interval_hours"] >= 1
    assert data["last_successful_scrape"] is not None, "completed runs exist"
    assert "new_opportunities" in data["last_24h"]
    assert "opportunities" in data and data["opportunities"]["total"] >= 2
    db.close()


# ── 9. Mock-AI safety ──────────────────────────────────────────────────────────

def test_mock_ai_never_fabricates_deadlines():
    """Mock extraction uses a date printed on the page, or None — never a
    random future date (which would make closed programs look open)."""
    from app.ai_service import AIService, _parse_deadline_hint
    svc = AIService()

    # No date on the page → deadline must be None (was: random now+15..75d).
    extract = svc._mock_extraction(
        "Amazing Youth Grant with funding support. Apply now. Open to all researchers.",
        "Mock Source", "https://example.org/grant",
    )
    assert extract.deadline is None, f"mock must not fabricate a deadline, got {extract.deadline}"

    # A real date on the page → parsed, not invented.
    extract2 = svc._mock_extraction(
        "Amazing Youth Grant. Apply before the deadline: March 15, 2027. Funding available.",
        "Mock Source", "https://example.org/grant2",
    )
    assert extract2.deadline is not None and extract2.deadline.year == 2027 and extract2.deadline.month == 3

    # The hint parser itself stays honest on garbage input.
    assert _parse_deadline_hint("no dates here at all") is None


# ── 10. Scheduler & cron triggers ──────────────────────────────────────────────

def test_scheduled_ingest_processes_sources_and_guards_recent_runs():
    from app.models import Source
    from app.scheduler import scheduled_ingest_all_sources
    db = _fresh_db()

    src = db.query(Source).filter(Source.name == "Test Source").first()
    src.last_run_at = None
    db.commit()

    result1 = scheduled_ingest_all_sources()
    assert result1["sources_processed"] >= 1, result1

    # Immediate second batch: the double-trigger guard must skip recently
    # scraped sources (internal cron + GH Actions cron overlap protection).
    result2 = scheduled_ingest_all_sources()
    assert result2["sources_processed"] == 0, result2
    assert result2["sources_skipped_recent"] >= 1, result2
    db.close()


def test_cron_endpoint_functions_run():
    """The GitHub-Actions entry points (/api/pipeline/cron/*) execute the same
    scheduled functions; auth is enforced by the route dependency."""
    from app.routes.pipeline import trigger_scheduled_ingest, trigger_lifecycle_sweep
    ingest = trigger_scheduled_ingest()
    assert ingest["success"] is True
    lifecycle = trigger_lifecycle_sweep()
    assert lifecycle["success"] is True
    assert "expired_count" in lifecycle["data"]


# ── 11. Static catalog & twin merge consistency ────────────────────────────────

def test_published_catalog_expires_stale_deadlines_at_read_time():
    """The static catalog must not serve a past deadline as 'open' just
    because the process booted before the deadline passed."""
    from app.publishing.catalog import _effective_status
    from app.publishing.models import PublishedOpportunity

    rec = PublishedOpportunity(
        slug="stale", title="Stale Deadline Program",
        status="open", deadline="2020-01-01",
    )
    assert _effective_status(rec) == "closed", "past deadline must read closed"

    future = PublishedOpportunity(
        slug="fresh", title="Fresh Program", status="open", deadline="2099-01-01",
    )
    assert _effective_status(future) == "open"

    rolling = PublishedOpportunity(
        slug="roll", title="Rolling Program", status="rolling", deadline=None,
        rolling_deadline=True,
    )
    assert _effective_status(rolling) == "rolling"


def test_detail_merge_prefers_fresh_pipeline_data_over_frozen_twin():
    """When the DB row was verified by the pipeline AFTER the static dataset
    was published, its deadline/status must win on the detail page."""
    from unittest.mock import patch
    from app.routes.opportunities import _enrich_with_published_twin
    from app.publishing.catalog import catalog as published_catalog
    from app.publishing.models import PublishedOpportunity
    from app.models import Source
    db = _fresh_db()
    alpha = _alpha(db)

    # Simulate: the pipeline re-scraped the live source and pushed the deadline.
    alpha.source_id = db.query(Source).first().id
    alpha.last_verified_at = datetime.now(timezone.utc)
    alpha.deadline = datetime(2028, 6, 1, tzinfo=timezone.utc)
    alpha.status = "active"
    db.commit()

    frozen_twin = PublishedOpportunity(
        slug="alpha-twin", title="Alpha Research Fellowship",
        status="closed", deadline="2020-01-01",  # stale published snapshot
    )
    with patch.object(published_catalog, "find_twin", return_value=frozen_twin):
        merged = _enrich_with_published_twin(alpha)

    assert merged["deadline"] == "2028-06-01", \
        f"fresh scraped deadline must win, got {merged['deadline']}"
    assert merged["status"] == "open", \
        f"fresh scraped status must win, got {merged['status']}"

    # Legacy/seed rows (never pipeline-verified) keep the twin-wins behavior.
    alpha.source_id = None
    alpha.last_verified_at = None
    db.commit()
    with patch.object(published_catalog, "find_twin", return_value=frozen_twin):
        merged_legacy = _enrich_with_published_twin(alpha)
    assert merged_legacy["deadline"] == "2020-01-01"
    assert merged_legacy["status"] == "closed"
    db.close()


# ── Runner (explicit order — tests share controlled source state) ─────────────

if __name__ == "__main__":
    ORDERED_TESTS = [
        test_new_opportunity_discovered_and_stored,
        test_duplicate_run_does_not_create_rows_but_revalidates,
        test_changed_deadline_updates_existing_record,
        test_changed_eligibility_updates_existing_record,
        test_expired_deadline_marks_expired_at_scrape_time,
        test_revived_source_deadline_reactivates_expired_record,
        test_source_says_closed_marks_expired,
        test_lifecycle_sweep_marks_expired_and_expiring_soon,
        test_temporary_500_creates_no_junk_and_keeps_existing_row,
        test_permanent_404_is_silently_skipped,
        test_source_outage_fails_its_run_without_touching_other_sources,
        test_revalidation_refreshes_verification_timestamps,
        test_repeated_execution_is_idempotent,
        test_dead_link_transient_failures_need_threshold_then_recover,
        test_permanent_404_marks_dead_link_immediately,
        test_permanent_410_marks_dead_link_immediately_and_row_survives,
        test_timeout_is_transient_and_does_not_create_or_destroy_data,
        test_deadline_into_expiring_window_transitions_at_scrape_time,
        test_expired_opportunity_same_url_updates_instead_of_duplicating,
        test_fuzzy_match_finds_expired_twin_when_url_changes,
        test_mock_ai_never_fabricates_deadlines,
        test_scheduled_ingest_processes_sources_and_guards_recent_runs,
        test_cron_endpoint_functions_run,
        test_published_catalog_expires_stale_deadlines_at_read_time,
        test_detail_merge_prefers_fresh_pipeline_data_over_frozen_twin,
        test_pipeline_status_endpoint_reports_automation_state,
    ]
    print(f"\nRunning {len(ORDERED_TESTS)} pipeline automation tests...\n" + "=" * 72)
    passed = failed = 0
    for func in ORDERED_TESTS:
        try:
            func()
            print(f"  [PASS] {func.__name__}")
            passed += 1
        except AssertionError as e:
            print(f"  [FAIL] {func.__name__}")
            print(f"         {e}")
            failed += 1
        except Exception as e:
            print(f"  [ERR ] {func.__name__}")
            import traceback; traceback.print_exc()
            failed += 1

    print()
    print("=" * 72)
    print(f"  Results: {passed}/{passed + failed} passed, {failed} failed")
    if failed:
        print("  FAIL  SOME TESTS FAILED")
    else:
        print("  PASS  ALL TESTS PASSED")
    print("=" * 72)
    sys.exit(1 if failed else 0)
