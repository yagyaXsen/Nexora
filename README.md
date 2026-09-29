# Nexora: AI-Driven Opportunity Discovery & Tracking System

[![CI](https://github.com/yagyaXsen/Nexora/actions/workflows/ci.yml/badge.svg)](https://github.com/yagyaXsen/Nexora/actions/workflows/ci.yml)

**Live:** [nexora-8y5.pages.dev](https://nexora-8y5.pages.dev) · **API:** [nexora-vjf8.onrender.com/api/health](https://nexora-vjf8.onrender.com/api/health) (free tier — the first request after idle takes ~30–60 s)

Nexora is an intelligent, high-fidelity platform that automates the collection, extraction, categorization, semantic searching, and tracking of academic and professional opportunities (scholarships, research fellowships, startup accelerators, hackathons, and corporate grants). 

---

## 1. Product Vision: The Core Problem & Solution

### The Scattered Web Problem
Ambitious students, researchers, and early-stage founders waste dozens of hours manually scouring disparate websites (university portals, LinkedIn, NGO websites, accelerator boards, government announcements). 
* **Fragmentation**: Information exists, but there is no centralized database.
* **Unstructured Content**: Webpages are messy and conversational. Humans can read them, but computers cannot easily filter them (e.g., extracting *"funding amount"*, *"deadline dates"*, or *"demographic eligibility"* from 3,000-word articles).
* **Search Blindspots**: Conventional SQL queries look for exact matches. When a student types *"paid fellowships for Indian developers in USA"*, standard database indices miss relevant entries unless they contain that exact string.
* **Leaking Funnels**: Discovering opportunities is only half the struggle. Candidates lose track of deadlines, documents, and application states, managing them in scattered spreadsheets, Notion lists, or notes.

### Nexora’s Solution
Nexora answers this with a **Collect → Extract → Deduplicate → Maintain → Publish → Track** pipeline:
1. **Automated discovery**: configured sources (HTML listings, RSS feeds, sitemaps) are crawled on a schedule and each program page is fetched.
2. **Structured extraction**: page text is turned into a validated `OpportunityExtract` record, using Groq (`llama-3.3-70b-versatile`) when configured, or a heuristic parser that only reports facts printed on the page.
3. **Continuous maintenance**: records are re-verified against their source, expired when their deadline passes or the source says applications are closed, revived when a program reopens, and link-checked with a transient-failure threshold.
4. **Publishing**: the frontend reads one published feed that merges the hand-verified static catalog with pipeline records that pass strict quality gates.
5. **Tracking**: candidates save opportunities to a tracker, move them through application stages, and get deadline reminders.

### What users get
| Page | What it does |
|---|---|
| **Explore** (`/explore`) | Search and filter the published catalog by type, country, status and funding. |
| **Opportunity detail** | Eligibility, benefits, deadline, application steps, verification status and related opportunities. |
| **Dashboard** | Opportunities ranked against the user's profile (field, skills, degree, target countries), with the reasons for each match. |
| **Tracker** | Kanban board from *Saved* to *Accepted*, notes per application, and a count of deadlines due in the next 14 days. |
| **Notifications** | Deadline reminders for tracked applications. |
| **Accounts** | Email/password or Google sign-in, onboarding, profile, settings, password reset by email. |

---

## 2. Architecture

```
 Sources (DB table; 4 seeded)        GitHub Actions cron ──► /api/pipeline/cron/{ingest,lifecycle,publish}
        │                            APScheduler (in-process, optional) ──┘
        ▼
 fetcher.py      listing / sitemap → up to 15 program pages; RSS → up to 20 entries
                 Scrapling (if installed) or httpx + BeautifulSoup
        │        content hash: unchanged page → re-validate only (no AI call)
        ▼
 extractor.py    clean text, lift the resolved direct apply URL
 normalizer.py   junk filter → Groq JSON extraction, or heuristic parser
        ▼
 deduper.py      match by canonical apply URL, else fuzzy title + organizer
                 → insert or update; status recomputed from the data
        ▼
 opportunities table  (SQLite locally, Postgres when deployed)
        │
 lifecycle.py    expiry sweep · "applications closed" · revival · link checks
        ▼
 live_feed.py    eligible records (verified, open, confidence ≥ 0.75, official URL)
   + catalog.py  static verified catalog (backend/nexora_verified_opportunities.json)
        ▼
 /api/published/*  ──►  React frontend (Explore, Dashboard, Detail, Tracker)
```

### Data model
| Table | Holds |
|---|---|
| `sources` | What to scrape: name, type (`html` / `rss` / `sitemap`), URL, per-source `config`, enabled flag, last successful run |
| `raw_documents` | Every fetched page version (content hash, text, status `fetched` / `normalized` / `failed` / `rejected`) |
| `opportunities` | Extracted records: title, organizer, deadline, apply URL, status, confidence, verification timestamps, link-check strikes, `closed_by_source` |
| `pipeline_runs` | One row per source run: counts (fetched / new / updated / duplicate / revalidated / failed) and error log |
| `audit_events` | Lifecycle-sweep and publishing results, publishing failures |
| `users`, `profiles`, `applications`, `notifications` | Accounts, candidate profiles, tracker entries, reminders |
| `organizations`, `organization_followers`, `contact_messages`, `password_reset_tokens` | Organization pages, follows, contact form, password resets |

The schema is created and extended automatically at startup (`backend/app/startup.py`); no manual migration step is needed.

## 3. Components

| Component | Where | What it does |
|---|---|---|
| Fetcher | `backend/app/pipeline/fetcher.py` | Per-source config picks the backend: `{}` HTTP, `{"use_js": true}` browser rendering, `{"use_stealth": true}` anti-bot browser (the last two need `requirements-dev.txt`). A failed listing marks the run failed; a failed program page is skipped, never turned into a junk record. |
| Extraction | `backend/app/ai_service.py`, `pipeline/extractor.py`, `pipeline/normalizer.py` | Groq when `USE_MOCK_AI=false` and `GROQ_API_KEY` is set; otherwise a heuristic parser that fills only what it finds (deadline, amount, eligibility sentence) and leaves the rest empty. Non-opportunity pages are rejected once and not retried while unchanged. |
| Dedupe | `backend/app/pipeline/deduper.py` | Exact match on the canonical apply URL, then fuzzy title + organizer (including expired rows, so a reopened program updates its old record). |
| Runner | `backend/app/pipeline/runner.py` | One isolated run per source, recorded in `pipeline_runs`. Per-page errors are rolled back, logged on the run, and the page is retried on the next run. `POST /api/sources/{id}/run?reextract=true` re-extracts unchanged pages (e.g. after enabling Groq). |
| Lifecycle | `backend/app/pipeline/lifecycle.py` | Status from deadline (`active` / `expiring_soon` / `expired`); a source page saying applications are closed keeps the row expired until the notice disappears; link checks rotate least-recently-checked first and need 3 consecutive transient failures before `dead_link`. |
| Scheduling | `backend/app/scheduler.py`, `.github/workflows/pipeline-cron.yml` | Ingest every 6h, lifecycle daily, publishing metrics weekly. Hosts that sleep (Render free) use the GitHub Actions cron; each job runs at most once at a time per process, and a failed job returns HTTP 500 so the workflow run fails visibly. |
| Publishing | `backend/app/publishing/` | `eligible_for_publishing()` is the single gate for pipeline records; the static catalog is always the base, so a pipeline or DB failure can never empty the feed. |
| Observability | `GET /api/pipeline/status` (admin key) | Running jobs, next runs, last success/failure, per-source health, 24h counts, publishing metrics. |

The detailed audit and design history is in [`docs/PIPELINE_AUDIT.md`](docs/PIPELINE_AUDIT.md); deployment is in [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md).

### Tech stack
- **Backend:** Python 3.11+, FastAPI, SQLAlchemy 2, PostgreSQL (Neon) in production / SQLite locally, APScheduler, httpx + BeautifulSoup (Scrapling optional), Groq (optional)
- **Frontend:** React 19, Vite 8, React Router 7, Tailwind CSS 3, Framer Motion
- **Hosting:** Render (API), Cloudflare Pages (frontend), Neon (database), GitHub Actions (pipeline cron + CI)

### Repository layout
```
backend/
  app/
    pipeline/     fetcher, extractor, normalizer, deduper, runner, lifecycle
    publishing/   static catalog + live feed (what the frontend shows)
    routes/       REST API (auth, published, opportunities, applications, pipeline, admin, …)
    config.py     settings + production safety checks
    startup.py    schema sync, seeding, admin provisioning (runs on every boot)
  tests/          pytest suite (SQLite or Postgres)
  nexora_verified_opportunities.json   hand-verified static catalog
frontend/src/     pages/, components/, lib/ (API client)
docs/             DEPLOYMENT.md, PIPELINE_AUDIT.md
.github/workflows ci.yml (tests on every push), pipeline-cron.yml (scheduled pipeline)
```

---

## 4. The automated pipeline, end to end

### Triggers and schedule
| Job | Production trigger (GitHub Actions, UTC) | In-process scheduler (`ENABLE_INTERNAL_SCHEDULER=true`) | Endpoint |
|---|---|---|---|
| **Ingest** — scrape sources | `17 */6 * * *` (00:17, 06:17, 12:17, 18:17) | every `INGEST_INTERVAL_HOURS` (6), first run 120 s after boot | `POST /api/pipeline/cron/ingest` |
| **Lifecycle** — expiry, reminders, link checks | `43 1 * * *` (daily 01:43) | every `LIFECYCLE_INTERVAL_HOURS` (24), first run 5 min after boot | `POST /api/pipeline/cron/lifecycle` |
| **Publish** — publishing metrics | `7 3 * * 0` (Sundays 03:07) | every `PUBLISH_REFRESH_INTERVAL_HOURS` (168), first run 10 min after boot | `POST /api/pipeline/cron/publish` |

Render's free tier sleeps, so production runs with the in-process scheduler off and the GitHub workflow (`.github/workflows/pipeline-cron.yml`) calling the endpoints with the `X-Admin-Key` header. Each job runs at most once at a time per process: a second trigger while one is running returns `{"skipped": "already_running"}`. A failed job returns HTTP 500, so the workflow run turns red.

### Seeded sources
Four sources are created on first boot: **CERN Careers Portal**, **DAAD Scholarship Database**, **Opportunity Desk Fellowships** and **Y Combinator Applications** (all `html`). Add more with `POST /api/sources` (see [Operating the pipeline](#7-operating-the-pipeline)).

### What one ingest batch does
1. Closes runs left `running` for more than 3 hours by a process that died.
2. Picks up to `CRON_MAX_SOURCES` (10) enabled sources, **least recently attempted first**, so every source gets its turn and failing sources cannot starve healthy ones. Sources scraped successfully within `MIN_SOURCE_RESCRAPE_HOURS` (5) are skipped, so overlapping triggers don't re-scrape.
3. Runs each source in isolation — one source failing never stops the others:
   - **Fetch the listing.** HTML: find cards (`item_selector`, `title_selector`, `link_selector` in the source config, with sensible defaults) and follow up to 15 links; RSS: up to 20 entries; sitemap: up to 15 `<loc>` URLs. Navigation, blog, login and similar links are skipped. If the listing itself is unreachable, the run is recorded as **failed** with the error, and the source is retried next batch.
   - **Fetch each program page** and resolve its direct apply link (configured `apply_link_selector`, then "Apply now"-style link text, then links containing "apply"). A page that errors (404, 500, timeout) is skipped — it can never become a junk record or overwrite good data.
   - **Compare with what's stored** using a content hash, then handle each page:

| Page | What happens |
|---|---|
| New or changed | Stored as a new raw document → junk filter → extraction (Groq, or the heuristic parser) → dedupe → the opportunity is inserted or updated and its status recomputed |
| Unchanged | No extraction or AI call. The existing opportunity is **re-verified**: `last_checked_at` / `last_verified_at` refreshed, link-check strikes reset, "applications closed" notice re-read, status recomputed |
| Unchanged, but its last processing failed | Processed again (a failure is always retried) |
| Not an opportunity (forum, blog, nav page…) | Marked `rejected` once; not retried while the page stays the same |
| Error while processing | Rolled back and logged on the run; the rest of the run continues; retried next run |

4. Records the run in `pipeline_runs` (fetched / new / updated / duplicate / revalidated / failed counts and per-page errors) and refreshes the website's live feed within seconds.

**Extraction details.** The page text (first 8,000 characters, 4,000 sent to the LLM) goes to Groq `llama-3.3-70b-versatile` in JSON mode when `USE_MOCK_AI=false` and `GROQ_API_KEY` is set; odd LLM fields (e.g. a "Rolling" deadline) become empty instead of discarding the extraction, and values are trimmed to fit the database. Otherwise the heuristic parser reads only what is printed on the page — title, a deadline date, an amount ("$50,000", "Fully Funded"), an eligibility sentence, and a category from the title, the source's `category_hint`, or the text — and leaves everything else empty. The apply link resolved by the fetcher always wins over the LLM's. To re-run extraction on unchanged pages (e.g. after adding a Groq key): `POST /api/sources/{id}/run?reextract=true`.

**Dedupe.** An extraction matches an existing opportunity by canonical apply URL (host + path, lower-case), otherwise by fuzzy title + organizer similarity (≥ 85) — including expired records, so a program that reopens updates its old record instead of creating a duplicate. Records with confidence below `CONFIDENCE_THRESHOLD` (0.70) get `needs_review` and stay off the website until approved via `/api/pipeline/review`.

### Opportunity status rules
| Status | When |
|---|---|
| `active` | Deadline more than `EXPIRING_SOON_DAYS` (7) away, or no deadline known |
| `expiring_soon` | Deadline within 7 days |
| `expired` | Deadline passed, **or** the source page says applications are closed ("applications are closed", "deadline has passed", …). The closed notice is sticky until a scrape no longer finds it |
| `dead_link` | Apply link returns 404/410, or fails 3 checks in a row (`DEAD_LINK_FAILURE_THRESHOLD`) with 5xx/timeouts. Recovers automatically when the link works again |

Expired and dead records are never deleted: they stay for history and come back to life when the source changes. The only deletions are records rejected from the review queue and leftover `#`-titled extraction junk removed at startup.

### The daily lifecycle job
1. **Expiry sweep** — applies the status rules above to every record: expires past deadlines, flags the 7-day window, revives records whose deadline moved into the future (unless the source says closed).
2. **Deadline reminders** — users with a tracked application (*Saved*, *Preparing*, *Ready to Apply*) closing within 7 days get a notification, at most one per opportunity per week.
3. **Link checks** — up to `CRON_MAX_DEAD_LINK_CHECKS` (30) apply links, least recently checked first, so the whole table is covered over time.
4. Records the results as an `audit_events` row (visible in `/api/pipeline/status`).

### What reaches the website
The frontend reads one feed from `/api/published/*`:
- **Base:** the hand-verified static catalog (`backend/nexora_verified_opportunities.json` + `nexora_legacy_enriched.json`). Its open/closed status is recomputed from the deadline on every request, so a passed deadline reads *closed* the same day.
- **Plus live pipeline records** that pass every gate in `eligible_for_publishing()`: status `active` or `expiring_soon`; verified against the source page (`last_verified_at`); scraped from a real source (seed rows never publish); not `needs_review`; confidence ≥ `PUBLISH_MIN_CONFIDENCE` (0.75); an http(s) apply link that is not an aggregator site; a real title and a non-empty description.
- A live record that matches a static record (same apply URL or matching title) **replaces** it, taking the static record's richer fields (benefits, steps, documents) while its own status and deadline win — this is how a reopened program shows as open again.
- The live part is cached for `LIVE_FEED_TTL_SECONDS` (60) and refreshed immediately after every run, sweep or link check. If the database or pipeline fails, the static catalog is still served — the feed can never be emptied.
- The weekly **publish** job doesn't gate anything; it records the feed size and churn (published / newly published / removed) for monitoring.

### At startup (every boot)
Creates missing tables and columns → locks the legacy default admin and provisions the `ADMIN_EMAIL` account → seeds organizations, the four sources and seed opportunities (only if missing) → fills missing slugs → runs the expiry sweep and removes `#`-titled junk records → closes orphaned runs → starts the in-process scheduler if enabled. Every step is safe to repeat.

### Monitoring
`GET /api/pipeline/status` (admin key) returns: jobs running now, next scheduled runs, last successful / failed scrape, 24-hour counts (new, updated, revalidated, expired, revived, failed), per-source health (`healthy`, `temporarily_failing`, `persistently_failing` after 3 consecutive failures, `never_run`, `disabled`) with the last error, lifecycle results, publishing metrics, and opportunity counts by status. Detailed design history and every verified bug fix: [`docs/PIPELINE_AUDIT.md`](docs/PIPELINE_AUDIT.md).

---

## 5. Running locally

Prerequisites: Python 3.11+ and Node.js 20.19+ or 22.12+ (required by Vite 8). No database server is needed — local development uses SQLite (`backend/nexora.db`) by default.

### Backend
```bash
cd backend
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt          # add requirements-dev.txt for Scrapling/browser fetching
python3 run.py                           # http://localhost:8000  (API docs at /docs)
```

Optional `backend/.env`:
```env
GROQ_API_KEY=gsk_...          # with USE_MOCK_AI=false, enables LLM extraction and search parsing
USE_MOCK_AI=false
ADMIN_EMAIL=you@example.com   # creates an admin login on boot (there is no default admin account)
ADMIN_PASSWORD=a-long-unique-passphrase
```
On localhost the admin console at `/admin` also works without logging in (dev-only, via the development admin key).

### Frontend
```bash
cd frontend
npm install
npm run dev                              # http://localhost:5173
```
Set `VITE_API_BASE_URL` if the API is not on `http://localhost:8000`.

### Tests
```bash
cd backend
pip install -r requirements.txt pytest
python -m pytest tests/
```
The suite runs against a throwaway database (see `tests/conftest.py`) and never touches `backend/nexora.db`.
Production runs on Postgres; to run the same suite against a Postgres database (it is wiped first, so its name must contain `test`):
```bash
NEXORA_TEST_DATABASE_URL=postgresql://user@localhost:5432/nexora_test python -m pytest tests/
```
CI (`.github/workflows/ci.yml`) runs the backend suite on Python 3.11 and 3.13 against both SQLite and PostgreSQL 16, plus the frontend lint and production build, on every push.

---

## 6. Deployment

Full step-by-step guide: [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md). In short:

**Render (backend)** — root directory `backend`, build `pip install -r requirements.txt`, start `uvicorn app.main:app --host 0.0.0.0 --port $PORT`, and these environment variables:

| Variable | Required | Notes |
|---|---|---|
| `DATABASE_URL` | yes | Neon connection string (`postgresql://…?sslmode=require`) |
| `SECRET_KEY` | yes | Random secret; signs login tokens |
| `ADMIN_SECRET_KEY` | yes | Different random secret; guards admin, pipeline and cron endpoints |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | for admin login | Creates the admin account on boot (password ≥ 12 characters). There is no default admin. |
| `DEBUG` | yes | `False` |
| `ENABLE_INTERNAL_SCHEDULER` | yes | `False` — Render's free tier sleeps, so GitHub Actions drives the pipeline |
| `CORS_ORIGINS`, `FRONTEND_URL` | yes | The Cloudflare Pages URL |
| `GROQ_API_KEY` + `USE_MOCK_AI=False` | optional | LLM extraction; without it the heuristic parser is used |
| `MAILER=smtp` + `SMTP_*` | optional | Real email for password resets and the contact form |

The server **refuses to start** in a deployed environment if `SECRET_KEY` or `ADMIN_SECRET_KEY` is missing or a development default, or if `ADMIN_PASSWORD` is weak; the Render log names the variable.

**Cloudflare Pages (frontend)** — build `cd frontend && npm install && npm run build`, output `frontend/dist`, and these variables (all public — never put secrets in `VITE_*` variables, they are compiled into the JavaScript):

| Variable | Notes |
|---|---|
| `VITE_API_BASE_URL` | The Render URL. On a deployed domain an empty or localhost value falls back to `https://nexora-vjf8.onrender.com` |
| `VITE_GOOGLE_CLIENT_ID` | Google OAuth client ID for "Sign in with Google" (the backend's `GOOGLE_CLIENT_ID` must match) |
| `VITE_SITE_URL` | Canonical site URL for SEO tags (defaults to the current origin) |
| `VITE_ADMIN_NO_LOGIN`, `VITE_ADMIN_KEY` | Development only — ignored by production builds |

**GitHub Actions secrets** (Settings → Secrets and variables → Actions) — `NEXORA_API_URL` (the Render URL) and `NEXORA_ADMIN_SECRET_KEY` (same value as `ADMIN_SECRET_KEY`), used by the pipeline cron.

---

## 7. Operating the pipeline

The **Nexora pipeline cron** workflow calls the API on a schedule: ingest every 6 hours, lifecycle sweep daily, publishing metrics weekly. Each call also wakes the sleeping Render instance. To run a job now: **Actions → Nexora pipeline cron → Run workflow** and pick `ingest`, `lifecycle` or `publish`. A red run means the API reported a failure or never answered.

Useful admin calls (replace `$KEY` with `ADMIN_SECRET_KEY`, `$API` with the Render URL):
```bash
# Pipeline health: running jobs, last success/failure, per-source health and last error
curl -H "X-Admin-Key: $KEY" $API/api/pipeline/status

# Recent runs with their counts and error logs
curl -H "X-Admin-Key: $KEY" $API/api/pipeline/runs

# Scrape one source now; add ?reextract=true to re-extract unchanged pages (e.g. after enabling Groq)
curl -X POST -H "X-Admin-Key: $KEY" "$API/api/sources/<id>/run?reextract=true"

# Add a source (type: html | rss | sitemap)
curl -X POST -H "X-Admin-Key: $KEY" -H "Content-Type: application/json" \
  -d '{"name":"Example Fellowships","type":"html","url":"https://example.org/fellowships","config":{"category_hint":"fellowship"}}' \
  $API/api/sources
```

A source whose listing fails is recorded as a failed run and retried on the next batch; after 3 consecutive failures `/api/pipeline/status` reports it as `persistently_failing` with the last error.

---

## 8. API reference

Interactive docs with every parameter: `/docs` on the API (e.g. `http://localhost:8000/docs`). 🔑 = admin (`X-Admin-Key` header, or an admin login for `/api/admin/*`); 👤 = logged-in user (`Authorization: Bearer <token>`).

| Area | Endpoints |
|---|---|
| Health | `GET /api/health` |
| Auth | `POST /api/auth/register`, `/login`, `/google`, `/logout`, `/forgot-password`, `/reset-password`; `GET` / `PATCH` / `DELETE /api/auth/me` 👤 |
| Published catalog (what the website shows) | `GET /api/published/opportunities` (filters: `category`, `country`, `status`, `q`, `funded_only`, paging), `/opportunities/{slug}`, `/opportunities/{slug}/related`, `/stats`; `GET /api/published/match` 👤 (ranked for the user's profile) |
| Pipeline database records | `GET /api/opportunities`, `/{id_or_slug}`, `/suggestions`, `/trending`, `/stats`; `POST /api/opportunities/search` (natural-language search); `GET /{id}/apply` (redirect + click tracking) |
| Tracker 👤 | `GET` / `POST /api/applications`, `GET /upcoming`, `POST` / `DELETE /by-slug/{slug}`, `POST /apply`, `PATCH` / `DELETE /{id}` |
| Profile & notifications 👤 | `GET` / `PATCH /api/profile/me`, `GET /api/profile/dashboard`; `GET /api/notifications`, `/unread-count`, `PATCH /{id}/read`, `/read-all` |
| Organizations | `GET /api/organizations`, `/{slug_or_id}`; follow / unfollow 👤 |
| Contact | `POST /api/contact` |
| Sources | `GET /api/sources`; `POST /api/sources` 🔑, `PATCH /{id}` 🔑, `POST /{id}/run[?reextract=true]` 🔑 |
| Pipeline 🔑 | `POST /api/pipeline/cron/ingest`, `/cron/lifecycle`, `/cron/publish`; `GET /status`, `/runs`, `/review`; `POST /review/{id}/approve`, `/reject` |
| Admin 🔑 | `GET /api/admin/stats`, `/users`; `DELETE /users/{id}`; `POST /reset-users` (deletes all users) |

---

## 9. Configuration reference

Backend settings are environment variables (or `backend/.env` locally); defaults are in `backend/app/config.py`.

<details>
<summary>All backend settings</summary>

| Variable | Default | Purpose |
|---|---|---|
| `DATABASE_URL` | `sqlite:///./nexora.db` | Database; `postgres://` / `postgresql://` URLs are used with the psycopg2 driver |
| `DEBUG` | `true` | Verbose logging; set `false` when deployed |
| `SECRET_KEY` | dev value | Signs login tokens — **must** be changed when deployed |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `1440` | Login lifetime |
| `ADMIN_SECRET_KEY` | dev value | `X-Admin-Key` for admin/pipeline/cron — **must** be changed when deployed |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | empty | Admin login provisioned at boot (password ≥ 12 characters when deployed) |
| `CORS_ORIGINS` | localhost + `nexora-8y5.pages.dev` | Allowed browser origins (comma-separated) |
| `FRONTEND_URL` | `http://localhost:5173` | Used for links in emails |
| `GOOGLE_CLIENT_ID` | empty | Verifies Google sign-in tokens |
| `GROQ_API_KEY` / `USE_MOCK_AI` | empty / `true` | LLM extraction and search parsing; heuristic parser otherwise |
| `AI_TIMEOUT_SECONDS` | `8` | Groq request timeout |
| `AI_QUERY_CACHE_TTL_SECONDS` / `AI_QUERY_CACHE_MAX_ENTRIES` / `AI_MIN_QUERY_LENGTH_FOR_LLM` | `900` / `256` / `5` | Search-intent cache and minimum query length for the LLM |
| `CONFIDENCE_THRESHOLD` | `0.70` | Below this an extraction goes to the review queue |
| `PUBLISH_MIN_CONFIDENCE` | `0.75` | Minimum confidence for a pipeline record to be published |
| `ENABLE_INTERNAL_SCHEDULER` | `true` | In-process scheduler (set `false` on sleeping hosts) |
| `INGEST_INTERVAL_HOURS` / `LIFECYCLE_INTERVAL_HOURS` / `PUBLISH_REFRESH_INTERVAL_HOURS` | `6` / `24` / `168` | In-process scheduler cadence |
| `RUN_INGEST_ON_STARTUP` / `INGEST_STARTUP_DELAY_SECONDS` | `false` / `120` | First in-process ingest timing |
| `CRON_MAX_SOURCES` | `10` | Sources per ingest batch |
| `MIN_SOURCE_RESCRAPE_HOURS` | `5` | Skip sources scraped successfully more recently |
| `CRON_MAX_DEAD_LINK_CHECKS` | `30` | Apply links checked per lifecycle run |
| `EXPIRING_SOON_DAYS` | `7` | Window for `expiring_soon` and deadline reminders |
| `DEAD_LINK_FAILURE_THRESHOLD` | `3` | Consecutive transient link failures before `dead_link` (also the "persistently failing" source threshold) |
| `LIVE_FEED_TTL_SECONDS` | `60` | Cache for the live part of the published feed |
| `MAILER` | `console` | `console` (prints emails to the log) or `smtp` |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASSWORD` / `MAIL_FROM` / `MAIL_FROM_NAME` | — / `587` / — / — / — / `Nexora` | SMTP delivery (STARTTLS required) |
| `CONTACT_EMAIL` | project address | Where contact-form messages are delivered |
| `RESET_TOKEN_EXPIRE_MINUTES` | `30` | Password-reset link lifetime |
| `PASSWORD_RESET_RATE_LIMIT` / `PASSWORD_RESET_RATE_WINDOW_SECONDS` | `3` / `600` | Reset requests allowed per email and per client |

</details>

---

## 10. Security

- **Admin access** is either a login whose account was provisioned from `ADMIN_EMAIL` / `ADMIN_PASSWORD`, or the `X-Admin-Key` header. Admin rights are never granted by email address, and there is no built-in account.
- **The admin console** (`/admin`) works on the deployed site for the admin login; on `localhost` during development it also works without logging in.
- **Secrets** live only in Render / GitHub environment settings — never in the repository or in `VITE_*` variables. `.env` files and local databases (`*.db`, `*.db.bak*`) are git-ignored.
- **Reporting:** please report security issues privately to the maintainer rather than in a public issue.
