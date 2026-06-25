# Nexora — Page Map

The complete route architecture. ~20 routes across 4 zones, each app page
backed by a real, already-built FastAPI endpoint (prefix `/api`).

Status legend: ✅ live · 🟡 stubbed (`ComingSoon`) · ⛔ not started

> As of **Phase 0**, only `/` (Home) renders real content. Every other route
> is a navigable `ComingSoon` placeholder. The "Phase" column says when each
> becomes live.

---

## Zone 1 · Public / Marketing (unauthenticated)

| Route | Page | Backing data | Phase | Status |
|---|---|---|---|---|
| `/` | **Home** (the landing page) | static | 0 | ✅ |
| `/product` | Features / how-it-works deep-dive | static | 5 | 🟡 |
| `/pricing` | Pricing (Explorer free / Pro $19) | static | 5 | 🟡 |
| `/explore` | Public opportunity browse (SEO funnel) | `GET /opportunities/` | 5 | 🟡 |
| `/about` | About / mission / the discovery problem | static | 5 | 🟡 |
| `/contact` | Contact | static | 5 | 🟡 |
| `/terms` | Terms of Service | static | 5 | 🟡 |
| `/privacy` | Privacy Policy | static | 5 | 🟡 |

Home renders its **own** bespoke nav + footer (self-contained chrome). Every
other marketing route renders inside the shared `PublicLayout` (nav + footer).

## Zone 2 · Auth & Onboarding

| Route | Page | Backing data | Phase | Status |
|---|---|---|---|---|
| `/login` | Log in | `POST /auth/login` (new) | 1 | 🟡 |
| `/signup` | Sign up | `POST /auth/register` (new) | 1 | 🟡 |
| `/forgot-password` | Reset request | (new) | 1+ | 🟡 |
| `/onboarding` | Profile builder → powers recommendations | `PUT /profile/` | 1 | 🟡 (gated) |

## Zone 3 · The App (authenticated — `AppLayout` sidebar shell)

| Route | Page | Backing data | Phase | Status |
|---|---|---|---|---|
| `/app` | Dashboard — stats, top matches, deadlines | `/opportunities/stats` + `/recommendations` + `/reminders/upcoming` | 2 | 🟡 |
| `/app/opportunities` | Explorer — grid + filters + AI search | `GET /opportunities/` + `POST /opportunities/search` | 2 | 🟡 |
| `/app/opportunities/:id` | Opportunity detail | `GET /opportunities/{id}` | 2 | 🟡 |
| ↳ action | AI Draft Copilot (SOP/Cover/Email) | `POST /opportunities/{id}/draft` | 2 | 🟡 |
| ↳ action | Save to tracker | `POST /applications/` | 2 | 🟡 |
| `/app/tracker` | Application Tracker (Kanban) | `GET/POST/PUT/DELETE /applications/` | 2 | 🟡 |
| `/app/reminders` | Deadlines | `/reminders/upcoming` + `/overdue` | 3 | 🟡 |
| `/app/profile` | Profile & settings (+ reputation/badges) | `GET/PUT /profile/` | 3 | 🟡 |
| `/app/intelligence` | Intelligence Console — live SSE scraper feed | `/scraper/sources` + `/scraper/run` | 3 | 🟡 |

## Zone 4 · Community (authenticated; nested under `/app`)

| Route | Page | Backing data | Phase | Status |
|---|---|---|---|---|
| `/app/community` | Hub | `GET /community/stats/` | 4 | 🟡 |
| `/app/community/stories` (+`/:id`) | Success Stories | stories endpoints + vote | 4 | 🟡 |
| `/app/community/questions` (+`/:id`) | Q&A | questions/answers + accept + vote | 4 | 🟡 |
| `/app/community/mentors` (+`/:id`) | Mentors | mentors + mentorship requests + vote | 4 | 🟡 |
| `/app/community/tips` | Tips | tips + vote | 4 | 🟡 |

Any unknown path redirects to `/`.

---

## Backend endpoint inventory (what we wire to)

| Domain | Endpoints (prefix `/api`) |
|---|---|
| **Opportunities** | `GET /opportunities/` · `POST /opportunities/search` · `GET /opportunities/stats` · `GET /opportunities/recommendations` · `GET /opportunities/{id}` · `POST /opportunities/{id}/draft` |
| **Applications** | `GET /applications/` · `POST /applications/` · `PUT /applications/{id}` · `DELETE /applications/{id}` |
| **Profile** | `GET /profile/` · `PUT /profile/` |
| **Reminders** | `GET /reminders/upcoming` · `GET /reminders/overdue` |
| **Scraper** | `GET /scraper/sources` · `GET /scraper/run` (SSE) |
| **Community** | stories · questions+answers · accept-answer · mentors · mentorship requests · tips · `POST /community/vote/` · `GET /community/stats/` |
| **Auth** (new, Phase 1) | `POST /auth/register` · `POST /auth/login` · `GET /auth/me` |
