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
 fetcher.py      listing / feed / sitemap → up to 15 program pages each
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

## 4. Running locally

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

## 5. Deployment

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

**Cloudflare Pages (frontend)** — build `cd frontend && npm install && npm run build`, output `frontend/dist`, variable `VITE_API_BASE_URL` = the Render URL. Never put secrets in `VITE_*` variables: they are compiled into the public JavaScript.

**GitHub Actions secrets** (Settings → Secrets and variables → Actions) — `NEXORA_API_URL` (the Render URL) and `NEXORA_ADMIN_SECRET_KEY` (same value as `ADMIN_SECRET_KEY`), used by the pipeline cron.

---

## 6. Operating the pipeline

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

## 7. Security

- **Admin access** is either a login whose account was provisioned from `ADMIN_EMAIL` / `ADMIN_PASSWORD`, or the `X-Admin-Key` header. Admin rights are never granted by email address, and there is no built-in account.
- **The admin console** (`/admin`) works on the deployed site for the admin login; on `localhost` during development it also works without logging in.
- **Secrets** live only in Render / GitHub environment settings — never in the repository or in `VITE_*` variables. `.env` files and local databases (`*.db`, `*.db.bak*`) are git-ignored.
- **Reporting:** please report security issues privately to the maintainer rather than in a public issue.
