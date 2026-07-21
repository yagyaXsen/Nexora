# Nexora — Project Overview

> A full-stack opportunity discovery and application platform.
> Built as a personal project to explore system design, AI integration, and production-grade SaaS architecture.
>
> **Author:** yagya sen
> **Stack:** FastAPI · React 18 · PostgreSQL · Groq · Google Gemini · Cloudflare R2 · Resend · Stripe
> **Status:** Personal project · 50+ days of focused engineering · documented in this repo

---

## 1. What Nexora is

Nexora is a unified platform for discovering and applying to opportunities — scholarships, fellowships, grants, accelerators, hackathons, conferences, and similar. The interesting problem isn't the directory part (Google solves that). The interesting problem is the **transactional** part: each opportunity has its own application channel (email submission, custom web form, third-party portal), and applicants pay the cost of that fragmentation in time, errors, and missed deadlines.

The project explores how a single application UX can route to multiple submission backends behind one button, while preserving auditability, consent, and delivery tracking.

---

## 2. Problem framing (technical)

The application ecosystem has four properties that make it interesting from a systems-design perspective:

1. **Heterogeneous submission protocols.** Each opportunity provider chose its own mechanism: an email address, a Google Form, a bespoke web app, a PDF download-and-mail. There is no `POST /apply` standard.
2. **Long-tail provider distribution.** Tens of thousands of providers, no single point of integration possible.
3. **Asymmetric data needs.** Applicants want one profile that fills every form. Providers want their bespoke fields.
4. **Delivery and audit requirements.** Submissions on a user's behalf require explicit consent per send and a verifiable record of what was actually transmitted.

Nexora is built around a single abstraction (the Apply Layer) that handles all four.

---

## 3. The Apply Layer (the core architectural idea)

Every opportunity is auto-classified into one of three submission tracks at ingest time, based on a rules-based classifier that scans description, URL, and eligibility text:

| Track | When it applies | What the backend does |
|---|---|---|
| **Email submission** | Provider published an apply address | Builds a structured packet (cover letter + cached profile + attachments from the Asset Vault), sends via Resend from a DMARC-verified domain, tracks delivery via webhook |
| **Native form** | Provider has onboarded with Nexora | Renders the provider's form schema as a React form; submission lands in their dashboard |
| **External staging** | Provider has their own web form, no integration | Opens the source URL in a new tab and stages drafts + attachment download links in a side panel for one-click copy; auto-marks Applied on tab return |

The frontend presents one button — "Apply via Nexora" — and routes to the right inner view based on the opportunity's `apply_method` column. The user never sees the classifier.

### Why this is interesting

- The three tracks share an audit trail (`application_submissions` table) with the same shape, regardless of which backend pathway fired.
- The mailer and storage are pluggable interfaces: `ConsoleMailer` / `ResendMailer`, `LocalDiskStorage` / `R2Storage`. Switching providers is a config change, not a route rewrite.
- Per-submission consent is captured as version-tagged constants (`lib/consent.js`) and persisted with every send, so the exact wording the user agreed to is reconstructable later.

---

## 4. Tech stack and rationale

### Backend · FastAPI + SQLAlchemy 2.x + PostgreSQL

- **FastAPI** for the type-checked, OpenAPI-generated API surface.
- **SQLAlchemy 2.x** ORM with Pydantic v2 schemas for clean serialization boundaries.
- **PostgreSQL** as the system of record. Idempotent migrations applied on startup via `inspect()` + raw `ALTER TABLE` — Alembic-free for simplicity but safe across deploys.

### Frontend · React 18 + Vite + React Query

- **React 18** with concurrent rendering.
- **Vite** for sub-second dev builds.
- **React Query** for server-state caching, invalidation, and optimistic updates — replaces ~80% of Redux-shaped state.
- **React Router v6** with public + authenticated layouts split at the route tree.
- Plain CSS with design tokens (no UI framework) so the bundle stays small.

### AI · Groq + Google Gemini

- **Groq** (Llama-class) for fast inference on opportunity search/ranking.
- **Gemini** for higher-quality cover letter drafting with user-profile injection and opportunity-specific grounding.
- Fallback `USE_MOCK_AI=True` mode so the product runs offline without API keys.

### Object storage · Cloudflare R2 (S3-compatible)

- `R2Storage` driver via boto3 in production.
- `LocalDiskStorage` driver for development.
- Per-user keyspace: `users/{user_id}/{uuid}_{filename}` — prevents cross-user collision and makes ops debugging easy.

### Email · Resend

- DMARC-verified sending from a custom domain.
- Webhook receiver verifies signatures and updates `delivery_status` (queued / sent / delivered / bounced / opened).

### Auth · JWT + bcrypt

- HS256 JWT with environment-loaded secret key (no hardcoded dev secret in production).
- bcrypt 4.0.1 for password hashing.
- `get_current_user` dependency injection across protected routes.

### Payments · Stripe (scaffolded)

- Service layer abstracts Stripe behind a `Billing` interface so tier changes don't touch route logic.

---

## 5. System architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      Client · React 18 SPA                      │
│  Pages: Landing · Explore · Dashboard · Tracker · Profile       │
│         OpportunityDetail · AssetVault · ApplyDrawer            │
│                                                                 │
│  Lib:   api.js · queries.js · auth.jsx · consent.js · useSEO.js │
└───────────────────────────────┬─────────────────────────────────┘
                                │ HTTPS + JWT bearer
┌───────────────────────────────▼─────────────────────────────────┐
│                  FastAPI Backend · /api                         │
│                                                                 │
│  Routes:    auth · opportunities · applications · assets        │
│             scraper · profile · reminders · community · seo     │
│                                                                 │
│  Services:  storage (Storage interface)                         │
│             mailer (Mailer interface)                           │
│             billing (Stripe scaffold)                           │
│                                                                 │
│  Utils:     slug · classifier (apply_method auto-tagging)       │
└──┬───────────┬──────────┬──────────────────┬───────────────────┘
   │           │          │                  │
   ▼           ▼          ▼                  ▼
┌───────┐ ┌────────┐ ┌─────────┐ ┌────────────────────────┐
│Postgres│ │  R2   │ │ Resend  │ │ Groq + Gemini · AI APIs│
│ (Neon  │ │(files)│ │ (email) │ │ (search · drafting)    │
│  prod) │ │       │ │+webhook │ │                        │
└───────┘ └────────┘ └─────────┘ └────────────────────────┘
```

---

## 6. Data model (the tables that matter)

```
opportunities          (10,000+ rows scraped)
  ├── apply_method        ('email_submission' | 'native' | 'external_form')
  ├── apply_email
  ├── apply_form_schema   (JSON)
  ├── slug                (SEO-friendly URL)
  └── ...

users (auth identity)
user_profiles (rich onboarding fields, FK → users)

applications (per-user tracker)
  ├── user_id FK
  ├── opportunity_id FK
  ├── status (Saved | Planning | Applied | Interview | Accepted | Rejected)
  └── submissions ← relationship

user_assets (the vault)
  ├── user_id FK
  ├── kind (cv | transcript | portfolio | reference_letter | other)
  └── storage_key  (R2 object key)

application_submissions (the audit trail)
  ├── user_id FK
  ├── application_id FK
  ├── submission_method
  ├── payload_json (consent record + answers + drafts)
  ├── attachments (snapshot at send time, not FK)
  ├── delivery_status (queued | sent | delivered | bounced | opened | staged_external | failed)
  ├── provider_reference (Resend message id)
  └── ...

community/* tables (scaffolded, not yet wired)
```

Per-user data isolation is enforced at the query layer: every protected endpoint filters by `user_id = current_user.id`. Pre-multi-tenant seed rows survive with `user_id = NULL` and are invisible to every per-user query — a deliberate design choice over a destructive cleanup migration.

---

## 7. What's implemented

### Backend

- **Auth:** register, login, JWT issuance, `/me`, password hashing (bcrypt).
- **Opportunities:** list, search, filter by category and country, UUID and slug detail routes, recommendations engine (profile-vs-opportunity scoring), stats.
- **Applications:** Kanban tracker CRUD with per-user ownership.
- **Profile:** rich profile editor with re-scoring of recommendations on update.
- **Reminders:** upcoming + overdue deadlines computed from saved opportunities.
- **Assets:** multipart upload to R2 (or LocalDisk), MIME allowlist, 10MB cap, signed-URL downloads, ownership-gated delete.
- **Scraper:** Playwright-based ingestion with SSE live progress; source registry.
- **SEO:** `sitemap.xml` and `robots.txt` mounted at the API root, slug-routed public opportunity pages.
- **Community:** stories, questions, answers, mentors, tips — tables and routes scaffolded.
- **Migrations:** idempotent boot-time DDL — adds new columns and indexes only when missing.
- **AI:** cover letter drafting (Gemini), search/ranking (Groq), mock-mode fallback.

### Frontend

- **Public:** landing page, marketing pages (About, Contact), Terms, Privacy, public Explore (`/explore`, `/explore/category/:c`, `/explore/:slug`).
- **Auth:** Login, Signup, ForgotPassword, multi-step Onboarding.
- **Application:** Dashboard with personalized recommendations, Opportunities Explorer with filters, OpportunityDetail page, Tracker (Kanban), Profile editor, AssetVault.
- **Apply Layer (frontend scaffolded):** ApplyDrawer with track-routed inner views, EmailApplyForm with AI draft + attachment picker + consent UI, ExternalApplyStaging, NativeApplyForm skeleton.

### Operational

- Idempotent startup migrations.
- Health endpoint reporting DB, storage, mailer status.
- Service-layer health introspection (`get_storage().health()`, `get_mailer().health()`).
- Environment-driven feature flags (mock AI, Resend vs Console mailer, R2 vs LocalDisk).

---

## 8. What's intentionally NOT implemented

- Provider portal UI (data model exists; UI is a multi-week project).
- Browser extension for autofill on external forms.
- Mobile apps (web-responsive web only).
- Multi-language drafts.
- Distributed tracing / OpenTelemetry (Sentry is enough at this stage).

These are flagged as "future work" rather than gaps — the project demonstrates the architecture choices that would support adding them without rewriting.

---

## 9. Engineering decisions worth highlighting

### Idempotent startup migrations instead of Alembic

For a single-deploy project, Alembic adds operational complexity without proportional benefit. The startup hooks `_ensure_application_user_id()`, `_ensure_opportunity_slugs()`, `_ensure_apply_layer_columns()`, and `_ensure_apply_layer_backfill()` use SQLAlchemy `inspect()` to add columns and indexes only when missing, then backfill data. Safe across re-runs; trivial to audit; adds Alembic later when the team grows.

### Service-layer abstractions over hard-coded vendor calls

`Storage` and `Mailer` are abstract base classes with concrete drivers chosen at startup by a factory function reading env vars. Routes call `get_storage().put(...)` and `get_mailer().send(...)`. This:
- keeps dev cheap (LocalDisk + ConsoleMailer = zero external dependencies),
- makes provider swaps a one-line env change,
- means routes never see boto3 or Resend HTTP calls,
- supports proper unit tests against the interface.

### Per-submission consent as a versioned constant

Sending applications on someone's behalf is sensitive. Rather than embedding consent strings inline, `frontend/src/lib/consent.js` exports `CONSENT_VERSION`, `CONSENT_CHECKBOX_LABEL`, per-track `CONSENT_PREAMBLE` functions, and a `buildConsentRecord()` that returns a serializable object stored verbatim in `application_submissions.payload_json.consent`. The exact wording the user agreed to is reconstructable forever, even after the constants change.

### Slug-routed public pages with idempotent slug backfill

Opportunities carry a `slug` column populated by a slugify(title) + UUID-hex suffix. The startup hook backfills NULL slugs on every boot — no-op when there's nothing to do. Cheap, safe, and means `/explore/:slug` URLs work the moment new opportunities land in the index.

### Frontend: React Query as state management

The app uses React Query for all server state and `useState`/context for the small slice of UI state that's truly client-only. There is no Redux. Cache invalidation is a one-liner per mutation (`qc.invalidateQueries({queryKey: QK.applications})`). Optimistic updates are 5 lines. The mental model is smaller than the typical Redux setup and the code reflects it.

---

## 10. Repository layout

```
backend/
  app/
    main.py                  ← FastAPI app + startup hooks
    config.py                ← Pydantic settings
    database.py              ← SQLAlchemy engine + session
    models.py                ← ORM models
    schemas.py               ← Pydantic schemas
    crud.py                  ← Data access helpers
    auth/                    ← JWT + bcrypt + get_current_user dep
    routes/                  ← One module per domain
      auth.py, opportunities.py, applications.py,
      assets.py, profile.py, reminders.py,
      community.py, scraper.py, seo.py
    services/                ← Pluggable backend drivers
      storage.py             ← LocalDisk + R2
      mailer.py              ← Console + Resend
    utils/
      slug.py, classifier.py
    ai_service.py            ← Groq + Gemini wrappers
    scraper.py               ← Playwright ingestion

frontend/
  src/
    App.jsx                  ← Route tree
    components/
      ui/                    ← Reusable kit (Button, Card, Modal, ...)
      app/                   ← App-specific (ApplyDrawer, AssetUploader, ...)
      Landing*, Hero*, Footer* ← Marketing components
      layout/                ← PublicLayout, AppLayout, ProtectedRoute
    pages/
      marketing/, auth/, app/, explore/, legal/
    lib/
      api.js, queries.js, auth.jsx, consent.js, useSEO.js

docs/
  MASTER_PLAN.md             ← this file
  APPLY_LAYER_V1.md          ← Apply Layer technical design
  USER_FLOW.md               ← End-to-end user flows
  PAGES.md                   ← UI map
```

---

## 11. Running locally

```bash
# Backend (in one terminal)
cd backend
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
# Configure DATABASE_URL in .env (defaults to localhost:5432/nexora_db)
python run.py
# → http://localhost:8000  (Swagger at /docs)

# Frontend (in another terminal)
cd frontend
npm install
npm run dev
# → http://localhost:5173
```

The app boots with `USE_MOCK_AI=True` and no Resend / R2 / Stripe keys required — all are optional and the service layer falls back to mock/local drivers.

---

## 12. Companion docs in this folder

- `APPLY_LAYER_V1.md` — technical design of the three-track submission engine
- `USER_FLOW.md` — every flow from anonymous browse → signup → save → apply → tracked
- `PAGES.md` — page-by-page UI map

Together with this file, they describe the system at a depth where another engineer could pick it up and extend any layer without reverse-engineering the code.
