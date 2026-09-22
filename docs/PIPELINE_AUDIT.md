# Nexora Pipeline — Complete Audit (Phases 1–6)

> Audit date: 2026-09-22 · Branch: `arena/01a0c72b-nexora` · Commit: `597c71d`
> Method: full code trace + **empirical verification** (the pipeline was executed against a
> controlled local source server that could simulate content changes, HTTP 404/500, and
> deadline changes). Every claim below is backed by code or an observed run.

---

## 0. Executive summary

There are **two disconnected "opportunity" systems** in this repo:

| | System A — Dynamic pipeline (DB) | System B — Published catalog (static JSON) |
|---|---|---|
| Storage | SQLite/Postgres `opportunities` table | `backend/nexora_verified_opportunities.json` (+ legacy file) |
| Built by | `app/pipeline/*` (fetch→extract→normalize→dedupe) | Offline, pre-verified dataset shipped in repo |
| Served by | `/api/opportunities/*` | `/api/published/*` + twin-merge on detail page |
| Frontend usage | search endpoint, detail fallback | **primary** — Dashboard/Explore/Detail read `/api/published` first |
| Freshness | scraped on trigger | frozen at commit time; status re-inferred only at process boot |

The scraping pipeline (System A) **works end-to-end but is not a maintenance system**: it
inserts and overwrites, never re-verifies unchanged pages, cannot revive an expired record,
treats a temporary source failure as new junk content, and a single dead-link probe failure
permanently marks records `dead_link` — which the **next boot then deletes**.

There is **no SSE anywhere** (README claims it; `grep` for `EventSource`/`text/event-stream`
returns nothing). There are **no frontend scrape controls** (`frontend/src/lib/api.js` never
calls `/api/sources` or `/api/pipeline`). README claims (Gemini, `backend/app/scraper.py`,
SSE) are **stale** — the actual extractor uses **Groq** (`ai_service.py`) and no
`scraper.py` exists in the tree or in git history.

---

## 1. CURRENT NEXORA PIPELINE

```
CURRENT NEXORA PIPELINE
=======================

DISCOVERY
---------
How opportunities are discovered: DB `sources` rows (seeded 4 at boot: CERN, DAAD,
Opportunity Desk, YC). No automatic source discovery — a human adds rows via
POST /api/sources. Source "schedule" column exists ("daily") but is NEVER read.
Files: backend/app/seed_data.py, backend/app/startup.py (seed_initial_data),
       backend/app/routes/sources.py
Functions: seed_initial_data(), create_source()

SCRAPING
--------
Active scraper: PipelineFetcher (fetcher.py). Per-source config chooses backend:
  {}                → Scrapling `Fetcher` (TLS-impersonating HTTP)
  {"use_js": true}  → Scrapling `DynamicFetcher` (Playwright)
  {"use_stealth": true} → Scrapling `StealthyFetcher` (Cloudflare bypass)
**BUT** `scrapling` is NOT in `backend/requirements.txt` (moved to
`requirements-dev.txt` because Playwright breaks Render builds) → in every
deployed/local default install the real backend is **httpx + BeautifulSoup**
(fetcher.py fallback path). HTML sources do a 2-level crawl (listing page →
deep-fetch each card ≤15); RSS uses feedparser + deep-fetch; sitemap parses
`<loc>` entries + deep-fetch.
Files: backend/app/pipeline/fetcher.py
Functions: PipelineFetcher.fetch_source(), _fetch_html(), _fetch_rss(),
           _fetch_sitemap(), _deep_fetch_program_page(), _fetch_page(),
           PageResult.find_apply_url(), find_cards()
Implemented-but-not-active: Scrapling/Playwright/Stealthy (only with dev extras).

EXTRACTION
----------
Active extraction method: extractor.py cleans text (first 8000 chars, strips the
`DIRECT_APPLY_URL:` header) → ai_service.extract_opportunity():
  * Groq `llama-3.3-70b-versatile` JSON mode when USE_MOCK_AI=False AND
    GROQ_API_KEY set;
  * **otherwise a mock parser** (default `USE_MOCK_AI=True`) that fabricates
    data: title = first text line verbatim, deadline = *random* now+15..75 days
    (hash-derived), funding = random $5k–$55k. Verified empirically: a page
    saying "January 31, 2027" was stored as `2026-11-30` (random).
Files: backend/app/pipeline/extractor.py, backend/app/ai_service.py
Functions: PipelineExtractor.extract_candidates(), clean_text(),
           AIService.extract_opportunity(), _mock_extraction(),
           is_invalid_junk_url() (5-tier junk filter)

NORMALIZATION
-------------
Current implementation: normalizer.py — retries AI extraction twice; overrides
apply_url with the fetcher-resolved direct apply link; marks RawDocument
normalized/failed. Pydantic validation via schemas.OpportunityExtract.
Files: backend/app/pipeline/normalizer.py, backend/app/schemas.py
Functions: PipelineNormalizer.normalize()

DEDUPLICATION
-------------
Current implementation: deduper.py
  1. exact match on `dedupe_key` = canonicalize_url(apply_url)
     (netloc+path, lowercased, trailing / stripped) — plain index, **no DB
     unique constraint**;
  2. fallback: rapidfuzz token_set_ratio ≥ 85 over `title + organizer`
     of all ACTIVE/EXPIRING_SOON rows (expired rows are invisible to the
     fuzzy matcher → duplicates get created, verified empirically).
  3. RawDocuments are separately de-duplicated per source by sha256
     content_hash — unchanged pages never re-enter extraction.
Files: backend/app/pipeline/deduper.py, backend/app/pipeline/fetcher.py
Functions: PipelineDeduper.process_extract(), canonicalize_url(),
           _resolve_organization(), fetch_source() hash check

DATABASE
--------
Insert:  deduper.process_extract() → new Opportunity (status=active), slug
         uniquified by counter.
Update:  same function — when a match is found it **overwrites every content
         field unconditionally** (title, description, category, organizer,
         deadline, apply_url, country, funding, eligibility, tags, confidence,
         source_id, raw_document_id). No change detection, no diffing, and
         **status is never touched** (an EXPIRED row stays EXPIRED even if the
         source now shows a future deadline — verified empirically).
Upsert:  effectively "update-in-place upsert" keyed by dedupe_key/fuzzy title.
Relevant models: Opportunity, Source, RawDocument, PipelineRun, Organization
        (models.py). Opportunity has `updated_at` (onupdate) but NO
        last_checked/last_verified columns. Source has `last_run_at`.
        Seed rows use `slug` as dedupe_key (not a URL) so exact URL dedupe
        can never match them.

VERIFICATION
------------
Current implementation: **NONE for DB opportunities.** No recheck, no
verification timestamp, no "confirm data still true" step. The only
verification-ish data (`last_verified_at`, `verification_status`,
`verification_notes`) lives in the **static published JSON**, produced offline.
Automatic/manual: manual, offline, once (dataset shipped in repo).

EXPIRATION
----------
Current implementation: lifecycle.py
  run_daily_expiry_sweep(): deadline < now + status in (active, expiring_soon)
    → expired; deadline within 7 days → expiring_soon; sends user deadline
    notifications.
  check_dead_links(): HEAD/GET apply_url of ≤30 active rows; **any** HTTP ≥400
    OR **any exception (timeout/DNS)** → immediately status=dead_link.
  startup._sweep_expired_opportunities(): on every boot, mark expired AND
    **DELETE every dead_link row** (and rows whose title starts with '#'),
    cascading user Applications.
Automatic/manual: automatic (cron/boot), but destructive on transient errors.
Verified empirically: one 500 → dead_link → deleted on next boot.

SCHEDULING
----------
Scheduler found: APScheduler BackgroundScheduler
Where: backend/app/scheduler.py
How started: FastAPI lifespan (main.py) if settings.ENABLE_INTERNAL_SCHEDULER
  (default True; DEPLOYMENT.md says set it **False** on Render, where the free
  instance sleeps and the process-local cron would never fire).
Frequency: hardcoded cron — ingest daily 00:00, lifecycle daily 01:00.
  Jobs: scheduled_ingest_all_sources() → runner.run_source() per enabled
  source (≤ CRON_MAX_SOURCES=10, per-source try/except = failure isolation);
  scheduled_daily_lifecycle_sweep() → expiry sweep + dead-link check.
Actually active: **YES while the process is alive** (verified: jobs registered,
next_run_time correct). NOT persistent, NOT multi-worker safe, does not survive
process sleep; ignores per-source `schedule` column.
Evidence: scheduler.py start_scheduler(); main.py lifespan; boot test log.

MANUAL PIPELINE
---------------
Manual trigger: POST /api/sources/{id}/run (admin key) → runner.run_source().
Endpoint: backend/app/routes/sources.py trigger_source_run()
Frontend trigger: **NONE** — the frontend never calls it. Effectively curl-only.

AUTOMATED PIPELINE
------------------
Actual automated trigger #1: in-process APScheduler (above).
Actual automated trigger #2: GitHub Actions `.github/workflows/pipeline-cron.yml`
  cron `17 */6 * * *` → POST {NEXORA_API_URL}/api/pipeline/cron/ingest and
  cron `43 1 * * *` → POST /api/pipeline/cron/lifecycle, both with
  X-Admin-Key: NEXORA_ADMIN_SECRET_KEY, guarded by verify_admin_key
  (routes/pipeline.py). Active only if both repo secrets are configured;
  requires the Render service to be awake (the curl itself wakes it).
Actual automated trigger #3: FastAPI startup lifespan → run_startup() →
  _sweep_expired_opportunities() (expiry + destructive junk/dead purge).
  No scrape happens at boot.
```

---

## 2. Trigger inventory

```
Trigger: In-process APScheduler (ingest)
File:   backend/app/scheduler.py                          Function: start_scheduler() / scheduled_ingest_all_sources()
Starts: FastAPI lifespan (main.py) when ENABLE_INTERNAL_SCHEDULER=true (default)
Freq:   cron 00:00 daily                                  Status: ACTIVE while process alive
Evidence: boot test — jobs registered, next fire 2026-09-23 00:00

Trigger: In-process APScheduler (lifecycle)
File:   backend/app/scheduler.py                          Function: scheduled_daily_lifecycle_sweep()
Freq:   cron 01:00 daily                                  Status: ACTIVE while process alive
Evidence: same boot test

Trigger: GitHub Actions cron → HTTP cron endpoints
File:   .github/workflows/pipeline-cron.yml               Function: trigger_scheduled_ingest() / trigger_lifecycle_sweep() (routes/pipeline.py)
Freq:   ingest every 6h (:17), lifecycle daily 01:43      Status: DEPLOYMENT-DEPENDENT
Needs:  repo secrets NEXORA_API_URL + NEXORA_ADMIN_SECRET_KEY (not verifiable from code)

Trigger: Manual source run (admin key)
File:   backend/app/routes/sources.py                     Function: trigger_source_run()
Freq:   manual                                            Status: ACTIVE but NO frontend calls it

Trigger: Manual cron endpoint calls
File:   backend/app/routes/pipeline.py                    Function: POST /api/pipeline/cron/ingest|lifecycle
Status: ACTIVE (this is the documented external-cron path for sleeping hosts)

Trigger: FastAPI startup sweep
File:   backend/app/startup.py                            Function: _sweep_expired_opportunities()
Freq:   every boot                                        Status: ACTIVE (also DELETES dead_link + '#' titles)

Trigger: Frontend "scrape" button / SSE stream
Status: DOES NOT EXIST (README's SSE claim is stale; api.js has no pipeline calls)
```

---

## 3. Existing-opportunity trace (what actually happens today when the scraper re-runs)

Empirically verified (see §5):

```
Existing opportunity
        ↓
Scraper re-fetches the source listing + program pages
        ↓
content_hash(raw page) already in raw_documents for this source?
        ├─ YES → RawDocument SKIPPED. Nothing else happens: no comparison,
        │        no update, no verify, no last_checked (NOTHING is touched,
        │        not even a timestamp).  [RUN 2: fetched=0]
        └─ NO  (page content changed, or first time)
                 → new RawDocument → extractor → AI extract
                 → deduper: dedupe_key exact match, else fuzzy title (ACTIVE rows only)
                      ├─ match → OVERWRITES all content fields with the new
                      │          extract (no diff). deadline may be REPLACED by
                      │          a fabricated one in mock mode. status NEVER
                      │          recomputed → expired rows stay expired, and an
                      │          update never sets status back to active.
                      │          [RUN 3: updated=1; RUN 4: expired row NOT revived]
                      └─ no match → INSERT duplicate (fuzzy can't see expired rows)
                                 [RUN 5: a 500 stub page created a NEW bogus row]
```

**Existing opportunities are only "rechecked" by accident** — when the page's
raw bytes change. There is no deliberate recheck, verification, or status
recompute pass.

---

## 4. Expiration / failure behavior per case (verified)

| Case | What actually happens |
|---|---|
| **A. deadline < today** | Nothing until a sweep runs (01:00 cron, GH cron 01:43, or boot). Sweep flips active/expiring_soon → expired. Frontend: `/api/opportunities` **hides** expired by default (status filter); detail page returns the row (detail merges the static twin's status, which is only recomputed at process boot). DB **is** changed by the sweep. |
| **B. source deadline Sept 30 → Oct 15** | Only if the page bytes changed: new RawDocument → AI re-extract → existing row **updated** with new deadline. Status is NOT recomputed (stays whatever it was). If row was expired → **stays expired forever**. In default mock mode the "new deadline" is a random date, not Oct 15. |
| **C. source says "Applications closed"** | Treated as ordinary content change. In mock mode a random future deadline is fabricated → row looks open. With real AI, deadline=null/past → written, but status not recomputed until the next sweep. No closed-detection. |
| **D. source returns 404** | Deep-fetch gets None → `fetch_source` produces **0 items**; run reports `completed, fetched=0` (failure invisible — not even an error_log entry). Existing rows untouched (good), but the outage is unobservable. |
| **E. source returns 500 / times out** | **WORST case.** Deep-fetch fails → a stub item (`raw_content=''` + synthesized header) still enters the pipeline: in mock mode a NEW bogus opportunity gets created from the stub (dedupe missed because fuzzy only scans ACTIVE rows) — verified. If the existing row is ACTIVE, the stub extraction would instead **overwrite the good row with garbage**. Separately, `check_dead_links` treats **any** exception/5xx as a dead link (immediate `dead_link`), and the next **boot deletes the row** — a temporary failure can permanently delete an opportunity + its user Applications. |
| Isolation | One source failing does NOT stop other sources (scheduler try/excepts per source; runner try/excepts per document). Verified. |

---

## 5. Empirical run log (controlled local source server)

```
RUN 1 initial:            completed fetched=2 new=2     → rows created; deadlines are RANDOM (mock), not the page's real dates; titles carry '# ' artifact
RUN 2 unchanged:          completed fetched=0           → nothing touched (no revalidation)
RUN 3 deadline changed:   completed fetched=1 updated=1 → row updated, but with another RANDOM deadline
RUN 4 expired + revived source: fetched=0              → content-hash skip; expired row NOT resurrected
RUN 5 HTTP 500 on page:   completed fetched=1 new=1     → JUNK DUPLICATE CREATED from stub (dedupe blind to expired rows)
RUN 6 HTTP 404 on page:   completed fetched=0           → silent, nothing recorded
RUN 7 listing 500:        completed fetched=0           → silent, source.last_run_at still updated
Lifecycle sweep:          expiring_soon transition works; expired transition only from active/expiring_soon
check_dead_links:         DNS error + HTTP 500 → both rows → dead_link immediately
startup sweep:            all dead_link rows DELETED (incl. their Applications)
```

---

## 6. Gap list (current vs desired "continuously maintained")

1. **No revalidation** — unchanged pages are skipped with zero bookkeeping; no
   `last_checked_at` / `last_verified_at` anywhere on the DB model.
2. **No status recompute at scrape time** — expired rows never revive when a
   source shows a new future deadline; deadline updates don't transition status.
3. **Broken-source corruption** — 500 on a program page manufactures a stub
   opportunity (duplicate or clobber); silent `completed` runs hide outages.
4. **Transient-failure dead-link marking + destructive purge** — one timeout →
   `dead_link` → deleted (with user Applications) at next boot.
5. **Scheduling is hardcoded and partial** — internal cron times not
   configurable; no configurable revalidation cadence; `Source.schedule` unused;
   GH-Actions path depends on secrets; no observable "is it running / when did
   it last run" endpoint.
6. **Mock extraction pollutes data** (random deadlines, `#`-prefixed titles that
   the boot sweep later deletes as junk).
7. **Observability** — PipelineRun rows exist but nothing aggregates them
   (last successful scrape, new/updated/expired counts, failed sources,
   currently-running flag).

---

# IMPLEMENTATION ADDENDUM (Phases 8–16)

> Everything below was implemented and verified on this branch after the audit above.
> No new scraper, no new scheduler, no parallel pipeline — the existing ones were extended.

## What changed, file by file

| File | Change |
|---|---|
| `backend/app/config.py` | New settings: `INGEST_INTERVAL_HOURS` (6), `LIFECYCLE_INTERVAL_HOURS` (24), `RUN_INGEST_ON_STARTUP` (false), `INGEST_STARTUP_DELAY_SECONDS` (120), `MIN_SOURCE_RESCRAPE_HOURS` (5.0), `EXPIRING_SOON_DAYS` (7), `DEAD_LINK_FAILURE_THRESHOLD` (3). Loud boot warning when `USE_MOCK_AI` is active outside DEBUG. |
| `backend/app/models.py` | `Opportunity`: `last_checked_at`, `last_verified_at`, `link_check_failures`. `PipelineRun`: `revalidated_count`. |
| `backend/app/startup.py` | `_sync_missing_columns` adds the new columns on existing DBs (same boot pattern as before). `_sweep_expired_opportunities` now delegates to the ONE shared lifecycle sweep and **no longer deletes `dead_link` rows**; only `#`-title artifacts are purged. |
| `backend/app/pipeline/lifecycle.py` | `recompute_status()` — single source of truth for deadline→status (expired ≤ now, expiring_soon ≤ +7d, else active). Sweep gains an `EXPIRED → ACTIVE` revival pass. `check_dead_links` rewritten: 404/410 = permanent (immediate `dead_link`), everything else = transient (strike counter, `dead_link` only after N consecutive failures), success resets strikes + refreshes verification and revives dead rows. |
| `backend/app/pipeline/fetcher.py` | `FetchError` (source-level outage) vs per-page failure. `_deep_fetch_program_page` returns `None` on failure instead of an empty stub (kills the junk-opportunity bug). `fetch_source` returns `FetchOutcome(raw_docs, unchanged_docs)` so unchanged pages can be revalidated without re-extraction. Listing/feed/sitemap outages raise `FetchError`. |
| `backend/app/pipeline/runner.py` | Revalidation pass for unchanged pages (refresh timestamps, reset strikes, recompute status — no AI call). Source outage → run `failed` with error, `last_run_at` untouched. `error_log` reassignment fix (SQLAlchemy JSON mutation was silently dropped — pre-existing bug). `runner.active_runs` counter for observability. |
| `backend/app/pipeline/deduper.py` | Updates recompute status at scrape time (deadline-driven, incl. revival). Expired rows are now in fuzzy-match scope (no duplicate beside an expired twin). `null` deadline no longer wipes a known date unless the page says applications are closed (`SOURCE_CLOSED_PHRASES`). `dedupe_key` re-synced when the apply URL changes. Verification timestamps refreshed on every scrape-path update. |
| `backend/app/pipeline/extractor.py` | Strips markdown `#` title artifacts (they were later deleted as junk by the boot sweep). |
| `backend/app/ai_service.py` | Mock extraction parses a real date from the page (`_parse_deadline_hint`) and **never fabricates one** when absent (was: random now+15..75d). |
| `backend/app/scheduler.py` | Interval config from settings, misfire grace, `max_instances=1`, fair LRU source rotation, double-trigger guard (`MIN_SOURCE_RESCRAPE_HOURS`), failed/completed accounting, in-memory `pipeline_state`, lifecycle results persisted as `AuditEvent`. |
| `backend/app/routes/pipeline.py` | New `GET /api/pipeline/status` (running flags, scheduler next-runs, last successful scrape, 24h new/updated/duplicate/revalidated/failed counts, failed sources, lifecycle results, opportunity status counts). |
| `backend/app/schemas.py` | `PipelineRunRead.revalidated_count`. |
| `backend/app/publishing/catalog.py` | `_effective_status()` recomputes open/closed **at read time** from each record's deadline (load-time statuses went stale as days passed). Applied to `list`, `get`, `related`, `match_profile`, `stats`. |
| `backend/app/routes/opportunities.py` | Twin merge: rows that the pipeline verified against their live source (`source_id` + `last_verified_at` set) now win `deadline`/`status` over the frozen static twin; legacy/seed rows keep the old twin-wins behavior. |
| `backend/tests/test_pipeline_automation.py` | New suite: 26 end-to-end tests against a controlled local source server (see below). |

## Frontend data flow (verified, unchanged architecture)

```
Dashboard  → /api/published/match       → static catalog (+read-time status freshness)
Explore    → /api/published/opportunities → static catalog; falls back to DB /api/opportunities
Detail     → /api/published/opportunities/{slug} → static catalog;
             legacy /api/opportunities/{id} merge: frozen twin OR fresher DB row (pipeline-verified wins)
Tracker/notifications → DB applications/deadline reminders (unchanged)
```

Source of truth: the **verified static dataset stays the display catalog**; the **DB is the live,
continuously maintained dataset**. Consistency is enforced at the two points where they meet
(catalog read-time status, twin-merge freshness) — no frontend rewrite.

## Operational model

- **Process alive** (local dev, always-on host): APScheduler ingests every `INGEST_INTERVAL_HOURS`,
  lifecycle sweeps every `LIFECYCLE_INTERVAL_HOURS`. `ENABLE_INTERNAL_SCHEDULER=false` disables it.
- **Sleeping host** (Render free): deploy with `ENABLE_INTERNAL_SCHEDULER=false`; GitHub Actions
  cron (`.github/workflows/pipeline-cron.yml`, every 6h + daily) POSTs `/api/pipeline/cron/ingest`
  and `/api/pipeline/cron/lifecycle` with `X-Admin-Key`. Both triggers share the same functions and
  cannot double-scrape a source inside `MIN_SOURCE_RESCRAPE_HOURS`.
- **Multi-worker**: deployment is single-worker uvicorn today; the `last_run_at` guard keeps a
  future multi-worker setup from duplicating batch work.
- **After restart**: all state that matters is in the DB (`pipeline_runs`, `audit_events`,
  `last_run_at`, verification timestamps). Only `pipeline_state` (in-memory) resets.

## Test evidence (26 automated tests, all passing)

new opportunity (real page deadline stored) · unchanged run revalidates without extraction ·
changed deadline updates existing row · changed eligibility updates existing row ·
past deadline → expired at scrape time · expired row revived by source change (ACTIVE again) ·
"applications closed" phrase → expired · sweep expired/expiring_soon/revival ·
temporary 500 → no junk row, existing row untouched, sibling page continues ·
404 page silently skipped · source outage → FAILED run visible, other sources unaffected ·
revalidation refreshes timestamps and resets strikes · 3 identical runs → identical row count ·
transient link failures need 3 consecutive strikes then auto-recover ·
404/410 apply URLs → dead_link immediately, row never deleted (boot sweep no longer purges) ·
timeout/black-hole → transient, no data change, recovery clears strikes ·
deadline into 7-day window → expiring_soon at scrape time · same-URL reopen updates the expired
row (no duplicate) · URL-changed reopen found via fuzzy match (no duplicate) ·
mock AI returns page dates or None (never random) · scheduled ingest runs + double-trigger guard ·
cron endpoints work with admin key (401 without) · catalog read-time status freshness ·
twin-merge prefers pipeline-fresh data (legacy rows keep twin-wins) · status endpoint reports all.

Existing suite `tests/test_junk_url_filter.py`: 27/27 still passing.
