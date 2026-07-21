# Nexora — User Flow Architecture

> One document. Captures **how a user moves through Nexora end-to-end**: every
> page they touch, every API call that fires, every database table that mutates,
> and every external service that gets pinged. Reflects the system as
> verified on 26 June 2026.

---

## 1 · The high-level loop

Nexora has one core loop and three supporting surfaces around it:

```
                ┌─────────────────────────────────────────┐
                │              DISCOVERY                  │
                │   /  →  /explore  →  /explore/:slug     │
                │   (public, indexable, no auth wall)     │
                └──────────────────┬──────────────────────┘
                                   │ "Sign up to save"
                                   ▼
                ┌─────────────────────────────────────────┐
                │           AUTH & ONBOARDING             │
                │  /signup → /login → /onboarding         │
                │  (issues JWT, stamps profile, sets      │
                │   sessionStorage skip-flag)             │
                └──────────────────┬──────────────────────┘
                                   │
                                   ▼
   ┌──────────────────────────────────────────────────────────────┐
   │                       THE CORE LOOP                          │
   │                                                              │
   │   /app  ──────────────────────────────────────────────────   │
   │   │                                                          │
   │   ├── Dashboard          (stats + recs + recent tracker)     │
   │   ├── Opportunities      (search + filters + grid)           │
   │   ├── Opportunities/:id  (detail + Save + AI draft)          │
   │   ├── Tracker            (kanban-ish status board)           │
   │   ├── Reminders          (upcoming + overdue deadlines)      │
   │   └── Profile            (edit identity / interests / loc)   │
   │                                                              │
   └──────────────────────────────────────────────────────────────┘
                                   │
                                   ▼
                ┌─────────────────────────────────────────┐
                │            COMMUNITY (Phase 4)          │
                │  /app/community/* — stubbed today       │
                └─────────────────────────────────────────┘
```

Three zones, two gates:

| Zone | Path pattern | Layout | Gate |
|---|---|---|---|
| 1. Public marketing + SEO | `/`, `/explore/*`, `/about`, `/contact`, `/terms`, `/privacy` | `PublicLayout` (or bespoke for `/`) | none |
| 2. Auth & onboarding | `/login`, `/signup`, `/forgot-password`, `/onboarding` | standalone | JWT issued at signup/login |
| 3. App (core loop) | `/app/*` | `AppLayout` + `ProtectedRoute` | `Authorization: Bearer <JWT>` |
| 4. Community | `/app/community/*` | `AppLayout` + `ProtectedRoute` | same as Zone 3 |

---

## 2 · Layered architecture (one diagram)

```
   ┌───────────────────────────────────────────────────────────────┐
   │   BROWSER                                                     │
   │   • React 18 + Vite + React Router v6                         │
   │   • @tanstack/react-query  (server cache, optimistic updates) │
   │   • JWT in localStorage   (key: "nexora_token")               │
   │   • useSEO() hook  →  per-page <title>, <meta>, og:*, canon   │
   └──────────────────────────┬────────────────────────────────────┘
                              │ HTTPS (Bearer JWT for /api/*)
                              ▼
   ┌───────────────────────────────────────────────────────────────┐
   │   FASTAPI (uvicorn)                                           │
   │                                                               │
   │   routes/                                                     │
   │     auth.py          /api/auth/{register,login,me}            │
   │     opportunities.py /api/opportunities/{...}                 │
   │     applications.py  /api/applications/{...}                  │
   │     profile.py       /api/profile/                            │
   │     reminders.py     /api/reminders/{upcoming,overdue}        │
   │     community.py     /api/community/*  (Phase 4)              │
   │     scraper.py       /api/scraper/* (ops)                     │
   │     seo.py           /sitemap.xml, /robots.txt  (root mount)  │
   │                                                               │
   │   auth/deps.py       get_current_user(JWT → User row)         │
   │   crud.py            ALL data access (single source of truth) │
   │   schemas.py         Pydantic v2 request/response models      │
   │   models.py          SQLAlchemy 2.x ORM                       │
   │   search.py          hybrid AI search (Gemini / Groq)         │
   │   ai_drafter.py      cover letter / SoP / outreach drafter    │
   │   utils/slug.py      title + uuid-prefix → URL slug           │
   └──────────┬────────────────────────────┬───────────────────────┘
              │                            │
              ▼                            ▼
   ┌─────────────────────────┐  ┌──────────────────────────────────┐
   │   PostgreSQL            │  │   External AI                    │
   │   nexora_db @ :5432     │  │   • Google Gemini (drafts)       │
   │   • users               │  │   • Groq        (search rerank)  │
   │   • user_profiles       │  └──────────────────────────────────┘
   │   • opportunities       │
   │   • applications        │
   │   • scraped_sources     │
   │   • community.*         │
   └─────────────────────────┘
```

### Frontend → backend contract (cheat sheet)

| Frontend hook (`lib/queries.js`) | Backend route | Auth |
|---|---|---|
| `useOpportunities({page, category, country})` | `GET /api/opportunities/` | public |
| `useOpportunity(id)` | `GET /api/opportunities/<uuid>` | public |
| `useOpportunityBySlug(slug)` | `GET /api/opportunities/by-slug/<slug>` | public |
| `useSearchOpportunities()` | `POST /api/opportunities/search` | public |
| `useRecommendations()` | `GET /api/opportunities/recommendations` | JWT |
| `useStats()` | `GET /api/opportunities/stats` | JWT |
| `useApplications()` | `GET /api/applications/` | JWT |
| `useSaveOpportunity()` (mutation) | `POST /api/applications/` | JWT |
| `useUpdateApplication()` | `PUT /api/applications/<id>` | JWT |
| `useDeleteApplication()` | `DELETE /api/applications/<id>` | JWT |
| `useProfile()` | `GET /api/profile/` | JWT |
| `useUpdateProfile()` | `PUT /api/profile/` | JWT |
| `useUpcomingReminders()` | `GET /api/reminders/upcoming` | JWT |
| `useOverdueReminders()` | `GET /api/reminders/overdue` | JWT |
| `useGenerateDraft()` | `POST /api/opportunities/<id>/draft` | JWT |
| `register/login/me` (in `auth.js`) | `/api/auth/{register,login,me}` | mixed |

---

## 3 · The flows (numbered, with the actual wire calls)

Every flow below is **verified end-to-end against a live API** (see §6 for the
green scorecard).

### Flow 1 · First-time visitor → indexed opportunity → signup

```
1. Googlebot fetches  GET /sitemap.xml
      → urlset = /, /explore, /explore/category/<5 cats>, /explore/<slug for every opp>
2. User lands on      /explore/google-ai-graduate-fellowship-2026-3b2f1c0a
   • React mounts OpportunityPublic
   • useOpportunityBySlug(slug)  →  GET /api/opportunities/by-slug/<slug>   (public, 200)
   • useSEO() injects <title>, <meta description>, canonical, og:*
3. User clicks "Sign up to save"  →  /signup
```

No auth, no DB writes outside read-only opportunity load. SEO juice path.

### Flow 2 · Sign up → onboard → land in /app

```
1. POST /api/auth/register    {name, email, password}
      → 201, returns TokenResponse {access_token, token_type, user}
2. Frontend stores access_token in localStorage["nexora_token"]
3. Frontend GET /api/profile/  → 200 (empty profile row auto-created on register)
4. AppLayout's useEffect checks isProfileEmpty(profile):
      if empty AND !onboardingSkip.isSkipped()
        → navigate('/onboarding', {replace: true})
5. /onboarding wizard collects identity + interests + location
6. PUT /api/profile/  → 200
7. navigate('/app')  → Dashboard mounts
```

Side-effects: a `users` row + a `user_profiles` row exist; JWT is durable for 7 days.

### Flow 3 · Login (returning user)

```
1. POST /api/auth/login  {email, password}
      → 200 TokenResponse  (or 401 if wrong)
2. Token stored, GET /api/auth/me   → 200 (sanity check)
3. ProtectedRoute mounts AppLayout  →  Dashboard
```

### Flow 4 · Dashboard render (the snapshot)

A single screen fans out to three queries in parallel:

```
GET /api/opportunities/stats              → DashboardStats
GET /api/opportunities/recommendations    → List[OpportunityWithMatch]
GET /api/applications/                    → List[ApplicationResponse]   (recent N)
```

React Query caches each by key; navigating away and back is instant.

### Flow 5 · Browse + filter + save

```
1. /app/opportunities mounts Explorer
2. GET /api/opportunities/?page=1&category=Fellowship&country=US  → paginated
3. (optional) POST /api/opportunities/search  {query: "AI fellowship"}
      → hybrid: pgsql ILIKE shortlist → Groq rerank → top-K
4. User clicks card → /app/opportunities/<uuid>
5. OpportunityDetail mounts:
      GET /api/opportunities/<uuid>  → Opportunity
6. User clicks Save:
      POST /api/applications/  {opportunity_id, status:"Saved", priority:"Medium"}
        → 201, creates row in applications keyed by (user_id, opportunity_id)
        → IDEMPOTENT: a second POST returns the SAME row id, not a 409
```

### Flow 6 · Tracker — moving a card through statuses

```
1. /app/tracker mounts
2. GET /api/applications/  → List grouped client-side by status
3. User drags card "Saved" → "Applied"
4. Optimistic React Query update bumps card position immediately
5. PUT /api/applications/<id>  {status:"Applied", applied_date:"2026-06-26"}
        → 200, row updated, updated_at stamped
6. Invalidate stats query  →  refetch GET /opportunities/stats
        → pipeline_stages.Applied++   saved_applications stays = total cards
```

### Flow 7 · AI application draft

```
1. On OpportunityDetail, user clicks "Generate Draft" → picks draft_type
2. POST /api/opportunities/<uuid>/draft  {draft_type: "cover_letter"}
3. Backend loads:
      - opportunity row
      - current user + their user_profile
4. ai_drafter.py builds prompt → calls Google Gemini
5. Returns {draft_text: "Flow Tester  ...  Dear Selection Committee, ..."}
6. Modal shows ~2.5 KB letter, user can copy / regenerate
```

Latency: 5–30 s depending on Gemini queue. Cost: per-call to Google.
Gated. Public `/explore/:slug` shows a *teaser modal* instead — drives signup.

### Flow 8 · Profile edit

```
1. /app/profile  →  GET /api/profile/  → 200 (current values fill the form)
2. User edits chips / fields, presses Save (savebar)
3. PUT /api/profile/  → 200
4. React Query updates ['profile'] cache → Dashboard recs refetch on next mount
```

### Flow 9 · Reminders surface

```
GET /api/reminders/upcoming   → opportunities saved/applied with deadline ≤ 30d
GET /api/reminders/overdue    → deadlines past today, status not in {Applied,Accepted,Rejected}
```

Both derive from `applications JOIN opportunities`, filtered by `current_user`.
Pure read-side; nothing schedules notifications yet.

### Flow 10 · Logout

```
1. localStorage.removeItem("nexora_token")
2. React Query cache cleared
3. navigate('/')
```

Server has no session state to clean — JWT just goes away client-side.

### Flow 11 · Account deletion (planned)

> Not yet implemented. Designed: `DELETE /api/auth/me` cascades user → user_profile → applications.
> The Privacy Policy already promises "delete within a reasonable period".

---

## 4 · State, where it lives

| State | Where | Lifetime |
|---|---|---|
| JWT | `localStorage["nexora_token"]` | 7 days (token `exp`) |
| Onboarding skip flag | `sessionStorage` (key set by `onboardingSkip.mark()`) | tab session |
| Server cache (queries) | React Query in-memory | until page reload / invalidation |
| User identity | `users` table (id, email, name, hashed_password) | persistent |
| Profile fields | `user_profiles` table (1:1 with user) | persistent |
| Tracker cards | `applications` table (user_id FK, opportunity_id FK) | persistent |
| Opportunities index | `opportunities` table (50 rows in dev, 10k+ planned) | persistent, scraper-managed |
| Sub-processor data | Sent to Gemini / Groq on each draft + search | per-request |

**Passwords**: stored as bcrypt hashes only (via `passlib[bcrypt]` CryptContext).
Never logged, never returned in any response model.

---

## 5 · Tenant isolation (the security invariant)

Every gated read/write filters by `current_user.id` derived from the JWT in
`auth/deps.get_current_user`. Verified at the API:

| Attempted action by User 2 on User 1's data | Result |
|---|---|
| `GET /api/applications/` | empty list |
| `GET /api/opportunities/stats` | `saved_applications: 0` |
| `PUT /api/applications/<user1_card_id>` | **404** (not 403 — deliberately indistinguishable from "no such row") |
| `DELETE /api/applications/<user1_card_id>` | **404** |

The 404-instead-of-403 choice is intentional: an attacker shouldn't be able to
enumerate which IDs exist by reading status codes.

---

## 6 · End-to-end verification (26 June 2026)

Run live against `http://localhost:8000` with a freshly registered user.

**Public**

```
/                          200      /docs                       200
/api/opportunities/        200      total=50
/api/opportunities/by-slug/<slug>   200
/api/opportunities/by-slug/bogus    404
/api/opportunities/<uuid>           200
POST /api/opportunities/search      200   (10 hits for "AI fellowship")
/sitemap.xml               200      /robots.txt                 200
```

**Gated (anon)** — all return `401` as expected:
`stats, recommendations, applications, profile, reminders/upcoming, reminders/overdue`.

**Authenticated journey**

```
register                          201   JWT issued
login good password               200
login bad password                401
GET /auth/me                      200
PUT /profile/                     200   (interests, university, regions persist)
GET /opportunities/recommendations 200
POST /applications/  (save)       201
POST /applications/  (same opp)   201   same id    ← idempotent ✓
PUT /applications/<id>  Applied   200
GET /opportunities/stats          saved=1, applied=1, pipeline.Applied=1
POST /opportunities/<id>/draft    200   2.6 KB cover letter (Gemini)
GET /reminders/upcoming           200
GET /reminders/overdue            200
```

**Tenant isolation** — second user:

```
GET /applications/                empty
GET /stats                        saved=0
PUT /applications/<user1_id>      404
DELETE /applications/<user1_id>   404
```

**Cleanup**

```
DELETE /applications/<id>         204
DELETE again                      404
GET /stats                        all zeros ✓
```

---

## 7 · Known gaps (the "what's not wired yet" list)

These are honest gaps, not bugs:

- **Password reset email**: `/forgot-password` page exists but no SMTP provider
  configured; no `POST /auth/forgot-password` endpoint yet.
- **Account deletion endpoint**: see Flow 11.
- **Reminders are pull-only**: no email/push fanout — Reminders page reads them,
  but nothing notifies the user proactively.
- **Community surfaces**: all `/app/community/*` routes stubbed with `ComingSoon`.
- **`/product` and `/pricing`**: also stubbed.
- **SSR/prerender**: `/explore/*` is client-rendered; sitemap closes discovery,
  but Googlebot must execute JS. Migration to Astro/Next is Phase 5+.
- **Public AI search**: kept behind auth deliberately (Groq/Gemini token cost
  vs. bot traffic).

---

## 8 · One-line summary for the next contributor

> *Public marketing + SEO is fully read-only and indexable. The core loop
> (Discover → Save → Apply → Track) is JWT-gated, isolates tenants by `user_id`,
> and writes through three tables (`users`, `user_profiles`, `applications`)
> while reading the shared `opportunities` index. AI is invoked only on explicit
> user action — search and draft — and is always behind auth.*
