# Nexora — Phase 1 User Flow

> **Scope:** one user, three verbs — **log in → search → apply.**
> **Constraint:** it all runs on **$0/month** until there's revenue. See §10 —
> that constraint invalidates three things the current code assumes.
>
> This document is the spec and ship checklist for Phase 1. The repository work
> is complete as of 25 July 2026; deployment configuration and live-stack
> verification remain before it can be called shipped.
>
> Written against the rebuilt backend (commit `fa56236`, FastAPI + SQLAlchemy +
> Alembic on SQLite) and the untracked `frontend/` tree, as of 25 July 2026.
>
> ⚠️ `docs/USER_FLOW.md` describes the **pre-reset v1** (Postgres, UUID keys,
> `/app/*` routes, `crud.py`, the three-track Apply Layer). None of that matches
> the current code. Treat this file as the source of truth for Phase 1; that one
> is history.

---

## 0. The thesis

Phase 1 is deliberately small. It proves one loop end to end:

```
  ┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
  │  LAND    │ ──▶ │  SEARCH  │ ──▶ │  LOG IN  │ ──▶ │  APPLY   │
  │ (public) │     │ (public) │     │  (gate)  │     │ (tracked)│
  └──────────┘     └──────────┘     └──────────┘     └──────────┘
       /            /explore          /login          organizer site
                                                      + tracker row
```

Two principles decide every design question below:

1. **Search is public. Commitment is gated.** Browsing and searching never hit
   an auth wall — that's the SEO and top-of-funnel surface. The moment a user
   does something that *belongs to them* (save, apply, track), they log in.
2. **Apply is a measured handoff, not a submission.** Nexora does not submit
   applications in Phase 1. It routes the user to the organizer and records that
   they went. The v1 "Apply Layer" (email submission, native forms, asset vault)
   is explicitly out of scope — see §7.

And one constraint that outranks both:

3. **Zero budget.** Every dependency must have a free tier that Phase 1 fits
   inside, and the app must degrade gracefully when a free limit is hit rather
   than erroring. This is not a deployment detail — it changes the database, the
   scheduler, and the AI path. See §10.

---

## 1. Scope

### In

| # | Capability | State today |
|---|---|---|
| 1 | Signup + login, JWT session, protected routes | ✅ works |
| 2 | Browse opportunities (paginated, filter by category/country) | ✅ works |
| 3 | Keyword search (SQL `ILIKE`) | ✅ works |
| 4 | AI natural-language search (intent parse → filters) | ✅ works, mock by default |
| 5 | Opportunity detail page by id **or** slug | ✅ works |
| 6 | Save an opportunity (idempotent) | ✅ works |
| 7 | Apply → redirect to organizer, count the click | ✅ gated and recorded through `POST /api/applications/apply` |
| 8 | Tracker reflects what the user applied to | ✅ upserts one `Applied` row and stamps `applied_at` once |
| 9 | Password reset (request link → set new password) | ✅ backend, migration, ConsoleMailer, and SMTP driver implemented; needs runtime verification |

### Implementation status — 25 July 2026

The app code now covers the Phase 1 loop. The remaining work is operational:

- [ ] Install backend dependencies and run `alembic upgrade head`.
- [ ] Exercise password reset end-to-end with `MAILER=console`.
- [ ] Deploy with Neon Postgres, production secrets, explicit CORS, and
      `VITE_API_BASE_URL`.
- [ ] Set `NEXORA_API_URL` and `NEXORA_ADMIN_SECRET_KEY` GitHub secrets, then
      confirm external cron produces `pipeline_runs`.
- [ ] Complete the manual Definition of Done checklist in §9 against the live stack.

### Out (Phase 2+)

Email verification · AI assistant/copilot · organizations & following ·
notifications · onboarding wizard · in-Nexora submission · asset vault ·
pricing/billing.

> Several of these have **frontend pages but no backend**, and the client
> currently **fakes success** for them. See §6.3 — that's a correctness problem,
> not just a missing feature.

---

## 2. Flow 1 · Login

### 2.1 Wire sequence

```
Signup                                     Login
──────                                     ─────
POST /api/auth/register                    POST /api/auth/login
  {name, email, password}                    Content-Type: x-www-form-urlencoded
  → 201 UserRead                             username=<EMAIL>&password=…
  → 409 if email exists                      → 200 {access_token, token_type}
        │                                     → 401 on bad credentials
        └──▶ auto-login (same call as →)            │
                                                    ▼
                                       localStorage["nexora_token"] = access_token
                                                    │
                                                    ▼
                                          GET /api/auth/me  → 200 UserRead
                                                    │
                                                    ▼
                                     AuthContext.user set → render app
```

**Note the form encoding.** `/api/auth/login` uses FastAPI's
`OAuth2PasswordRequestForm`, so the email travels in the field named `username`
(`backend/app/routes/auth.py:32`). `api.login()` already does this
(`frontend/src/lib/api.js:60`). Don't "fix" it to JSON without changing both.

**Register does not return a token** (`auth.py:12` → `UserRead`). The client
compensates by calling `login()` right after (`lib/auth.jsx:28-34`) — two round
trips. Acceptable for Phase 1; note it if signup latency matters.

### 2.2 Session mechanics

| Property | Value | Where |
|---|---|---|
| Transport | `Authorization: Bearer <jwt>` | `lib/api.js:26` |
| Storage | `localStorage["nexora_token"]` | `lib/api.js:1` |
| Algorithm | HS256, claim `sub` = user id (int, stringified) | `app/auth.py:29-32` |
| Lifetime | **1440 min (24 h)**, no refresh token | `config.py:13` |
| Restore | `AuthProvider` mount → `GET /me`; on failure `clearToken()` | `lib/auth.jsx:11-18` |
| Logout | client-side only — drop the token | `lib/auth.jsx:36-39` |

### 2.3 The return-to-intent contract

This is what makes "search → hit a gate → log in → resume" feel unbroken, and
it is already wired consistently:

```
ProtectedRoute  → <Navigate to="/login" state={{from: location.pathname}}/>   components/ProtectedRoute.jsx:17
Explore save    → navigate('/login', {state:{from: `/explore?${params}`}})    pages/Explore.jsx:90
Detail save     → navigate('/login', {state:{from: `/opportunities/${id}`}})  pages/OpportunityDetail.jsx:67
Login success   → navigate(from, {replace: true})                            pages/Login.jsx:73
```

**Rule for Phase 1:** every new auth gate must pass `state.from` with the *full*
path including query string. A gate that drops the user on `/dashboard` after
login has thrown away their intent.

### 2.4 Hardening required before ship

- **`SECRET_KEY` defaults to `"nexora_jwt_dev_secret_change_me"`**
  (`config.py:12`). Must come from the environment in any deployed build, and
  boot should refuse to start on the default outside `DEBUG`.
- **Mid-session expiry is unhandled.** The token is only validated on
  `AuthProvider` mount. If it expires while the tab is open, every gated call
  starts 401-ing and the UI shows failures without ever redirecting to login.
  Fix centrally in `request()` (`lib/api.js:48`): on 401, `clearToken()` and
  bounce to `/login`.
- **Demo credentials are hardcoded in the client** — `demo@nexora.ai` /
  `nexora2026` (`pages/Login.jsx:96`). Fine for a local demo; gate it behind a
  build flag before this is public.
- No rate limiting on `/login`. Acceptable at Phase 1 traffic; note it.

### 2.5 Password reset (in scope — backend to build)

Both frontend pages are **already complete** and their call signatures already
match `api.js`. This is a backend-only build.

| Piece | State |
|---|---|
| `pages/ForgotPassword.jsx` — email form, "check your inbox" state, resend | ✅ built |
| `pages/ResetPassword.jsx` — reads `?token=`, strength meter, confirm field | ✅ built |
| `api.forgotPassword(email)` / `api.resetPassword(token, password)` | ✅ wired (`lib/api.js:65-68`) |
| `POST /api/auth/forgot-password` / `POST /api/auth/reset-password` | ❌ **do not exist** |
| Any mailer, SMTP config, or email dependency | ❌ none in `requirements.txt` |

#### The flow

```
1. User at /forgot-password submits email
      POST /api/auth/forgot-password  {email}
      → 200 ALWAYS (see enumeration note below)
      │
      ├── if the email matches a user:
      │     generate token  = secrets.token_urlsafe(32)
      │     store  sha256(token)  in password_reset_tokens
      │     expires_at = now + 30 min,  used_at = NULL
      │     send link: {FRONTEND_URL}/reset-password?token=<raw token>
      │
      └── if not: do nothing, still return 200

2. User clicks the emailed link → /reset-password?token=…
      (page already reads the token from the query string — ResetPassword.jsx:8)

3. User submits a new password
      POST /api/auth/reset-password  {token, password}
      → 200 on success
      → 400 if token is unknown / expired / already used
      │
      ├── look up by sha256(token); reject if expires_at < now or used_at IS NOT NULL
      ├── user.hashed_password = hash_password(password)
      ├── mark used_at = now                    (single-use)
      └── invalidate that user's OTHER outstanding reset tokens

4. Page redirects to /login after 2.5s  (already implemented — ResetPassword.jsx:50)
```

#### New table

```python
class PasswordResetToken(Base):
    __tablename__ = "password_reset_tokens"

    id         = Column(Integer, primary_key=True, index=True)
    user_id    = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"),
                        nullable=False, index=True)
    token_hash = Column(String(64), unique=True, index=True, nullable=False)
    expires_at = Column(DateTime(timezone=True), nullable=False)
    used_at    = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)
```

Needs an Alembic revision. Add `password_reset_tokens` to `User` with
`cascade="all, delete-orphan"` so `DELETE /api/auth/me` stays clean.

#### Security rules — each one prevents a specific attack

These are the whole point of the feature; a reset flow that misses them is worse
than no reset flow.

| Rule | Prevents |
|---|---|
| **Store `sha256(token)`, never the raw token** | A leaked DB dump becomes a list of live account-takeover links. Same reasoning as hashing passwords. |
| **`/forgot-password` returns 200 for unknown emails** | Account enumeration — otherwise the endpoint is a free "is this person a user?" oracle. The UI already shows "check your inbox" unconditionally, so this needs no frontend change. |
| **30-minute expiry** | Shrinks the window on an intercepted or forwarded email. |
| **Single-use (`used_at`)** | A link in browser history or a shared inbox can't be replayed. |
| **Invalidate the user's other tokens on success** | Stops a stale earlier link from resetting the password again. |
| **`secrets.token_urlsafe(32)`** | 256 bits from a CSPRNG — not guessable. Never `random`, never a uuid4 hex. |
| **Rate-limit by email + IP** | Mailbox-flooding a user, and brute-forcing the token space. |
| **Constant-time compare on lookup** | Timing side-channels on the hash comparison. |
| **Don't log tokens** | The reset link in an access log or Sentry breadcrumb is a live credential. |

Optional but cheap: reset the user's active sessions after a successful reset.
With stateless JWTs and no denylist, existing tokens stay valid until they expire
— tolerable at 24 h, but a `password_changed_at` column compared against the JWT
`iat` would close it properly. Note it as a Phase 2 consideration.

#### Email delivery — keep it swappable

There is no mailer today. Mirror the pluggable-driver pattern the v1 codebase
used, because it keeps local dev free of external dependencies:

```
app/services/mailer.py
    Mailer            (abstract: send(to, subject, html) )
    ConsoleMailer     → logs the reset URL to stdout      ← dev default
    SmtpMailer        → real delivery (Resend / SES / any SMTP)
    get_mailer()      → picks a driver from settings.MAILER
```

New settings in `config.py`: `MAILER: str = "console"`, `FRONTEND_URL: str =
"http://localhost:5173"` (used to build the link — must not be hardcoded), plus
SMTP credentials when the real driver lands.

**`ConsoleMailer` is what makes this testable in Phase 1.** The whole reset loop
can be exercised end-to-end by copying the URL out of the backend log — no
domain, no DNS, no provider account. Ship that first; wire real SMTP when a
sending domain exists.

#### Then remove the fake-success catches

`api.forgotPassword` and `api.resetPassword` currently end in
`.catch(() => ({ success: true }))` (`lib/api.js:65-68`). Once the endpoints are
real those must go — otherwise a genuinely expired token still renders "Password
Updated!" and the user is stranded. Both pages already have working `error`
branches (`ForgotPassword.jsx:21-23`, `ResetPassword.jsx:51-53`); they just never
get to run.

The **"Forgot password?" link on `Login.jsx` stays** — it will work.

---

## 3. Flow 2 · Search

Search is **public** — no token required on any of these. That's intentional.

### 3.1 Two engines, one box

`/explore` picks a path based on whether `?q=` is present (`pages/Explore.jsx:49`):

```
              ┌─────────────────────────────────────────────┐
   no q  ────▶│ GET /api/opportunities                      │  filter + browse
              │   ?category&country&status&page&page_size    │  SQL only
              └─────────────────────────────────────────────┘
              ┌─────────────────────────────────────────────┐
   has q ────▶│ POST /api/opportunities/search  {query}     │  AI intent parse
              │   → {query, intent, degraded, total, items} │  then SQL
              └─────────────────────────────────────────────┘
```

Both exclude `needs_review == True` and, by default, restrict to
`status in (active, expiring_soon)` — expired and dead-link rows never surface
(`routes/opportunities.py:27-33`, `95-98`).

### 3.2 How AI search actually resolves

`POST /api/opportunities/search` (`routes/opportunities.py:88`) is a two-pass
query, which is the interesting part:

```
1. ai_service.parse_search_query(q)  →  SearchIntent
      {category, country, tags[], keywords[], funding_required}

2. STRICT pass — intent fields become AND-ed filters:
      category = intent.category           (only if a valid enum member)
      country ILIKE %intent.country% OR ILIKE %global%
      funding_amount IS NOT NULL           (if funding_required)
      AND ( OR-ed text match over title / description / organizer /
            eligibility_text / tags-as-JSON )
      → limit 20, newest first

3. If STRICT returns zero rows:
      BROAD pass — the same conditions, but OR-ed instead of AND-ed
      → degraded = true
      → if there were no conditions at all, return the newest 20
```

**`degraded: true` is a first-class UI signal, not a debug flag.** It means "we
couldn't honour your filters, here's the neighbourhood." The results page must
say so — otherwise a search for *"AI fellowships in Japan"* silently returns
Norwegian grants and reads as a broken product. Surface a line like
*"No exact matches — showing related opportunities."*

### 3.3 The AI is mocked by default

`USE_MOCK_AI: bool = True` and `GROQ_API_KEY: str = ""` (`config.py:8-9`), and
`ai_service` falls back to mock whenever either is set that way
(`ai_service.py:16`). So out of the box, intent parsing is a **keyword
heuristic** (`_mock_parse_search`), not an LLM. Live mode is Groq
`llama-3.3-70b-versatile` (`ai_service.py:160`).

Consequence for Phase 1: **the search UX must be good with the mock on.** Never
let a demo depend on a key being present. Also — no timeout/latency budget is
enforced around the Groq call today; add one (fail open to the mock parse)
before enabling it, or a slow provider becomes a slow search box.

### 3.4 Search → detail

```
card click        → navigate(`/opportunities/${opp.slug || opp.id}`)   components/OpportunityCard.jsx:14
detail page load  → GET /api/opportunities/{id_or_slug}                routes/opportunities.py:191
                    digit-only → lookup by id, else by slug
```

⚠️ **Route-ordering hazard.** `/{id_or_slug}` is declared last, *after*
`/stats`, `/search`, and `/trending` (`routes/opportunities.py:63, 88, 155, 191`).
That ordering is what keeps `/api/opportunities/stats` from being parsed as a
slug lookup. **Any new literal sub-route must be added above line 191.** Worth a
comment in the file so it survives the next edit.

### 3.5 Prefer slugs in URLs

`OpportunityCard` already prefers `opp.slug` over `opp.id`. Keep it that way —
slug URLs are the indexable, shareable ones, and `slug` is `unique` + `NOT NULL`
on the model (`models.py:161`), so it's always available.

---

## 4. Flow 3 · Apply

This is where Phase 1 earns its keep, and where the current code is thinnest.

### 4.1 What exists today

```
User clicks "Apply via Nexora"
  → <a href="/api/opportunities/{id}/apply" target="_blank">      OpportunityDetail.jsx:355
  → GET /api/opportunities/{id}/apply                            routes/opportunities.py:170
        404 if no such opportunity
        410 if status is expired | dead_link
        click_count = click_count + 1   (atomic, no read-modify-write race)
        307 → opp.apply_url
  → new tab lands on the organizer's site
```

Two things are genuinely well done here and should be preserved:

- **The atomic increment** (`opp.click_count = Opportunity.click_count + 1`,
  line 187) — column-side arithmetic, safe under concurrent clicks.
- **One outbound exit point.** Every apply click is measured with no separate
  tracking call, and `click_count` is what powers `/trending`
  (`routes/opportunities.py:155-168`). Nice, closed loop.

### 4.2 The problem

**Applying does not touch the user's tracker, and does not require a login.**

`GET /{id}/apply` has no `Depends(get_current_user)`. It doesn't know who
clicked. So:

| Consequence | Why it matters |
|---|---|
| A user applies; the tracker still shows the row as `Saved`, or shows nothing at all | The product's core promise — "nothing slips past a deadline" — is false. The tracker is blind to the single most important event. |
| Anonymous visitors can apply | Fine as a funnel choice, but then there's no account to attach the record to. |
| `click_count` is inflatable by anyone, including bots | `/trending` is trivially gameable, and it's public with no rate limit. |
| `applied_at` never gets stamped by the real apply path | The column exists (`models.py:195`) and `PATCH /applications/{id}` auto-stamps it (`applications.py:107-109`), but only if the user manually moves the card. |

### 4.3 The Phase 1 design

Keep the anchor-based navigation (it survives popup blockers, which a
`window.open()` after an `await` does not), and record intent alongside it.

**Add one endpoint** — `POST /api/applications/apply`, authenticated:

```python
# routes/applications.py
@router.post("/apply", response_model=ApplyResponse)
def apply_to_opportunity(
    payload: ApplyRequest,                       # {opportunity_id}
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Upsert the tracker row straight to Applied and hand back the outbound URL.
    Idempotent: clicking Apply twice is not an error and does not re-stamp."""
    # 404 if opportunity missing; 410 if expired | dead_link  (mirror /{id}/apply)
    # upsert Application(user_id, opportunity_id) → status = Applied
    # stamp applied_at only when it is still NULL
    # increment click_count atomically
    # return {apply_url, application_id, status}
```

**Frontend** (`OpportunityDetail.jsx`, `OpportunityCard.jsx`):

```jsx
<a
  href={applyUrl(opp.id)}          // unchanged — the navigation still works
  target="_blank" rel="noopener noreferrer"
  onClick={(e) => {
    if (!user) {                    // gate: capture intent, then send to login
      e.preventDefault()
      navigate('/login', { state: { from: `/opportunities/${opp.slug || opp.id}` } })
      return
    }
    api.applyToOpportunity(opp.id)  // fire-and-forget; nav is not blocked
  }}
>
```

Why this shape:

- The `<a>` keeps working even if the POST fails or is slow — **the user always
  reaches the organizer.** Recording is best-effort; navigation is not.
- Gating on `!user` matches the save flow exactly (`Explore.jsx:88-92`), so both
  gates behave the same and return the user to the same place.
- `POST /applications/apply` needs no popup-blocker workaround because it never
  opens a window.
- Upsert-to-`Applied` in one call beats POST-then-PATCH: one round trip, and no
  window where the row exists as `Saved` but the user has already left.

**Then decide the anonymous case.** Two defensible options — pick one and write
it down:

- **(a) Gate apply entirely** (recommended for Phase 1). Simple, every apply is
  attributable, `click_count` stops being anonymous-writable. Costs some
  top-of-funnel conversion.
- **(b) Allow anonymous apply**, keep `GET /{id}/apply` public for those users,
  and accept that their apply is unrecorded. Then `click_count` needs at least
  IP-based rate limiting to stay meaningful.

### 4.4 Status vocabulary — use a subset

`ApplicationStatus` defines **ten** states (`models.py:41-51`: Saved, Preparing,
Ready to Apply, Applied, Assessment, Interview, Offer, Accepted, Rejected,
Archived). Phase 1 should only ever *write* three:

```
Saved  ──(user clicks Apply)──▶  Applied  ──(user updates)──▶  Accepted | Rejected
```

Leave the other seven in the enum — they're free, and Phase 2's tracker board
will use them. Just don't build UI for states the user has no way to reach yet.

### 4.5 Deadline safety

`GET /api/applications/upcoming?days=N` already exists
(`applications.py:28-47`): joins `applications → opportunities`, filters to the
current user, excludes `Accepted`/`Rejected`, returns rows with a deadline
inside the window, soonest first. It's a solid read-side primitive.

It is **pull-only** — nothing notifies anyone. For Phase 1 that's fine: surface
it on the post-apply screen and in the tracker. Email/push fanout is Phase 2.

---

## 5. State map

| State | Lives in | Lifetime | Notes |
|---|---|---|---|
| JWT | `localStorage["nexora_token"]` | 24 h, no refresh | §2.4 — handle expiry |
| Current user | `AuthContext` (React state) | page session | rehydrated via `GET /me` |
| Search query | URL `?q=` via `useSearchParams` | shareable | ✅ correct — searches are linkable |
| Filters | URL query params | shareable | same |
| Saved-id set | `useState` in `Explore` | page session | refetched per mount |
| Compare tray | `useState` in `Explore` (max 3) | page session | UI-only, not persisted |
| Identity | `users` table | persistent | bcrypt hash only, never returned |
| Tracker rows | `applications`, `UNIQUE(user_id, opportunity_id)` | persistent | the constraint is what makes save idempotent |
| Index | `opportunities` | persistent | pipeline-managed |
| Click counts | `opportunities.click_count` | persistent | feeds `/trending` |

**Tenant isolation** is enforced per query, not by a global filter: every
`applications` route filters `Application.user_id == current_user.id` and
returns **404 (not 403)** on someone else's row (`applications.py:90-98`,
`121-129`). That's the right call — 403 would let an attacker enumerate which
ids exist. Any new user-scoped endpoint must follow the same pattern.

---

## 6. Gaps to close before Phase 1 ships

Ordered by how much damage they do. The first two are **data-loss and
silent-rot** bugs that only appear once deployed on a free tier — they outrank
every feature gap.

### 6.0 SQLite on an ephemeral filesystem loses everything — **deployment P0**

§10.1. Migrate to Neon free Postgres and add a boot guard that refuses to start
with a `sqlite://` URL outside DEBUG. **Nothing else matters if accounts vanish
on every spin-down.**

### 6.1 Apply doesn't reach the tracker — **implemented**

`POST /api/applications/apply` is authenticated and idempotently creates or
updates the tracker row to `Applied`, stamps `applied_at` only once, increments
the click count, and returns the organizer URL. The frontend gates anonymous
users through login while preserving their return path.

### 6.2 The scheduler never fires on a sleeping instance — **implemented, needs deployment**

§10.2. In-process APScheduler cron (`scheduler.py:41-53`) cannot run while the
free instance is spun down, so the index never updates *and* expired
opportunities are never swept. Admin-keyed endpoints and
`.github/workflows/pipeline-cron.yml` now provide the external trigger; configure
the two repository secrets and verify it after deployment.

### 6.3 Flows that fake success — **implemented**

`frontend/src/lib/api.js:65-70`:

```js
forgotPassword: (email) =>
  request('/api/auth/forgot-password', {...}).catch(() => ({ success: true })),
resetPassword: (token, password) =>
  request('/api/auth/reset-password',  {...}).catch(() => ({ success: true })),
verifyEmail: (code) =>
  request('/api/auth/verify-email',    {...}).catch(() => ({ success: true })),
```

Password reset endpoints now exist and client errors are surfaced. The
out-of-scope assistant route/widget and fabricated detail-page eligibility,
document-readiness, and match claims were removed from the Phase 1 surface.

Two different fixes, because these now have two different fates:

- **Password reset is in scope** (§2.5) — build the endpoints, then delete the
  two `.catch()` fallbacks so real errors surface. Keep the pages and the
  "Forgot password?" link.
- **Email verification and the AI assistant stay out of scope** — remove the
  `verifyEmail` fallback, and either drop `/verify-email` and `/assistant` from
  `App.jsx` or have them render an honest "coming soon". Hide the copilot
  buttons at `OpportunityDetail.jsx:329-341`.

### 6.4 401s don't log the user out — **implemented**

§2.4. Central fix in `request()`.

### 6.5 `degraded` search results are unlabelled — **implemented**

§3.2. One line of UI copy; prevents the search box reading as broken.

### 6.6 AI search has no rate-limit fallback — **implemented**

§10.3. One org-wide Groq quota shared by all users, called on every search. Needs
a timeout, a fail-open to the mock parser, and a query cache before Groq is
enabled at all.

### 6.7 Production config is unsafe — **code safeguards implemented; configure before deploy**

- `SECRET_KEY` dev default (`config.py:12`) — must fail closed outside DEBUG.
- `allow_origins=["*"]` **with** `allow_credentials=True` (`main.py:54-60`).
  Browsers reject that combination for credentialed requests, and it's wrong on
  purpose-built origins anyway. Pin to the real frontend origin.
- `applyUrl()` returns a **relative** `/api/...` path (`lib/api.js:139`). Works
  in dev via the Vite proxy (`vite.config.js:8-13`), works in prod **only**
  behind a same-origin reverse proxy. The $0 stack splits frontend and backend
  across hosts (§10.5), so this **must** become a configurable `VITE_API_BASE_URL`.

### 6.8 Repo hygiene — **pending commit**

The entire `frontend/` tree is untracked, and `backend/nexora.db`,
`__pycache__/`, and a built `frontend/dist/` are sitting in the working tree.
Get the source committed and the artifacts ignored before this grows.

---

## 7. Explicitly not Phase 1

Recording these so they don't creep in mid-build:

- **In-Nexora submission** (email packets, native provider forms, external
  staging) — the v1 Apply Layer. Phase 1 hands off to the organizer, full stop.
- **Asset vault** (CV/transcript upload, R2 storage).
- **AI drafting** (cover letters, SoPs). `OpportunityDetail` has copilot buttons
  wired to nothing (`OpportunityDetail.jsx:329-341`) — hide them.
- **Organizations, following, notifications** — tables and routes exist
  (`routes/organizations.py`, `routes/notifications.py`), but they are not part
  of login→search→apply. Leave them dormant.
- **Onboarding wizard** — nothing in Phase 1 requires a profile. `Profile` rows
  carry conspicuous hardcoded defaults ("ETH Zurich", "Postdoctoral Research
  Fellow", `vector_confidence = 98.4` — `models.py:74-83`) that must not leak
  into any UI as if they were real user data.
- **Email verification** — §6.3. (Password reset **is** in scope: §2.5.)
- Pricing / billing.

---

## 8. Build order

Each step is independently shippable. Step 0 comes first because everything else
is built on sand without it.

**Step 0 — Make persistence real.** ⏳ Provision Neon free Postgres, point
`DATABASE_URL` at it, run `alembic upgrade head`, commit the two untracked
migration files (§6.8), and add the boot guard that refuses a `sqlite://` URL
outside DEBUG. Keep SQLite locally. *Every step below assumes data survives a
restart.*

**Step 1 — Truthfulness pass.** ✅ Strip the `verifyEmail` fake-success
catch, remove or stub `/verify-email` and `/assistant`, hide the dead copilot
buttons. *Nothing else ships until the app stops claiming things that aren't
true.* (Leave the two password-reset catches in place until Step 3 lands — then
delete them.)

**Step 2 — Apply becomes real.** ✅ Add `POST /api/applications/apply`
(auth, upsert→`Applied`, stamp `applied_at` once, atomic click increment, return
`apply_url`). Wire the `onClick` on both `OpportunityDetail` and
`OpportunityCard`. Decide §4.3's anonymous question and write the answer down.

**Step 3 — Password reset.** ✅ `password_reset_tokens` table + Alembic
revision → `services/mailer.py` with `ConsoleMailer` → the two endpoints →
delete the `.catch()` fallbacks from `api.js`. Both frontend pages need no
changes. Verify end-to-end by copying the link out of the backend log.

**Step 4 — Session correctness.** ✅ Central 401 handling; §2.4 env-driven
`SECRET_KEY` with a boot-time guard.

**Step 5 — Externalise the scheduler.** ✅ Add the two admin-keyed cron
endpoints, a GitHub Actions workflow that hits them on a schedule, and gate
`start_scheduler()` behind a setting so it only runs locally. Cap the work per
invocation so one run can't exhaust the Groq quota or the instance's memory.

**Step 6 — Search polish + quota safety.** ✅ Surface `degraded`; §10.3 add a
timeout, fail-open to the mock parser, and an in-memory cache for repeated
queries; add the route-ordering comment above `routes/opportunities.py:191`.

**Step 7 — Close the loop.** ✅ Apply updates the tracker immediately; the tracker
and the deadline, fed by `GET /api/applications/upcoming`.

**Step 8 — Deploy on the $0 stack.** ⏳ Static frontend on Cloudflare Pages,
backend on Render free, `VITE_API_BASE_URL` + explicit CORS (§6.7), and
`FRONTEND_URL` so reset links point at the real origin. Swap `ConsoleMailer` →
Brevo only when there are real users to email.

---

## 9. Definition of done

Phase 1 ships when all of these are true, verified by hand against a running
stack. The code items are implemented; leave these unchecked until they are
observed in the local and deployed environments.

- [ ] A new user can register, and is logged in immediately afterwards.
- [ ] A returning user can log in; a wrong password gives a clear 401 message.
- [ ] An **anonymous** visitor can browse `/explore`, run a keyword search, run
      a natural-language search, and open any detail page — with zero auth
      prompts.
- [ ] A search with no exact matches visibly says so (`degraded` surfaced), and
      never presents fallback results as exact hits.
- [ ] Search state lives in the URL: reloading or sharing `/explore?q=…`
      reproduces the same results.
- [ ] Hitting a gate (save or apply) while anonymous → `/login` → after login
      the user lands **back where they were**, query string intact.
- [ ] Clicking Apply while logged in: a new tab opens on the organizer's site
      **and** a tracker row exists with `status = "Applied"` and `applied_at`
      stamped.
- [ ] Clicking Apply twice creates exactly one tracker row and does not re-stamp
      `applied_at`.
- [ ] Applying to an expired opportunity returns 410 and the UI explains it,
      rather than opening a dead tab.
- [ ] User B cannot read or mutate User A's applications (404, not 403).
- [ ] An expired token results in a clean redirect to `/login`, not a wall of
      failed requests.
- [ ] A user who forgot their password can request a link, follow it, set a new
      password, and log in with it.
- [ ] Requesting a reset for an **unregistered** email returns the same "check
      your inbox" screen as a registered one (no enumeration).
- [ ] A reset link works exactly once; replaying it shows a real error, not
      "Password Updated!".
- [ ] An expired (>30 min) reset token shows a real error and a path to request
      a fresh link.
- [ ] The reset loop is fully exercisable with `MAILER=console` — no SMTP
      account, domain, or DNS required.
- [ ] Every visible number comes from the API. No fabricated stats, no hardcoded
      "ETH Zurich" profile defaults rendered as user data.
- [ ] No UI element claims success for an operation with no backend.
- [ ] The whole loop works with `USE_MOCK_AI=True` and no API keys present.

**Zero-budget survival checks** — these can only be verified *after* deploy, and
they are the ones that quietly fail:

- [ ] Create an account, wait for the instance to spin down (>15 min idle), come
      back — **the account and its tracker rows still exist.** (§10.1)
- [ ] A redeploy does not lose any user data.
- [ ] The ingest and lifecycle jobs demonstrably run while the instance is
      otherwise idle — check `pipeline_runs` for rows with recent timestamps.
      (§10.2)
- [ ] Expired opportunities actually leave search results, proving the lifecycle
      sweep fired.
- [ ] With Groq enabled and the quota deliberately exhausted (or the key made
      invalid), search still returns results via the mock parser — no 500s.
      (§10.3)
- [ ] A cold start does not show a broken page: the static frontend renders and
      the data surfaces show skeletons until the API wakes. (§10.5)
- [ ] Nothing in the deployed stack costs money. Confirm no credit card is on
      file with any provider.

---

## 10. The zero-budget constraint

**Phase 1 must run on $0/month.** This is not just a hosting choice — it
invalidates three things the current code assumes. Each one is a silent failure:
nothing crashes, the app just quietly stops doing its job.

### 10.1 SQLite will lose all user data — **P0, blocks deploy**

`DATABASE_URL: str = "sqlite:///./nexora.db"` (`config.py:7`) writes to a file on
local disk. Every free host — Render, Fly, Railway — gives you an **ephemeral
filesystem**: local file changes are lost on every redeploy, restart, *and
spin-down*. Free web services also can't attach a persistent disk.

So on a free tier, `nexora.db` is wiped roughly every 15 minutes of inactivity.
Every account, every saved opportunity, every tracker row — gone. The app will
look like it works during a demo and lose everything overnight.

**Fix:** move to a managed free Postgres. `psycopg2-binary` is already in
`requirements.txt:5` and `DATABASE_URL` already switches drivers, so this is a
connection-string change plus `alembic upgrade head`.

| Option | Free allowance | Idle behaviour | Verdict for Nexora |
|---|---|---|---|
| **Neon** | 0.5 GB storage, 100 CU-hours/mo | Scale-to-zero after 5 min, resumes in ~1 s | **Recommended.** Resume is fast enough to be invisible, and it never needs manual waking. |
| Supabase | 500 MB, 2 active projects | **Pauses after 7 days idle — manual resume** | Risky. A quiet week takes the app offline until you click a button. |
| Render Postgres | 1 GB | — | **Expires 30 days after creation.** Disqualified for anything you care about. |

Keep SQLite for **local development** — it's zero-setup and the ORM hides the
difference. Just never let it reach a deployed environment. Add a boot-time guard
alongside the `SECRET_KEY` one (§2.4): refuse to start if `DEBUG` is false and
`DATABASE_URL` starts with `sqlite`.

### 10.2 The ingestion pipeline will never run — **P0 for content**

`scheduler.py` uses in-process APScheduler with cron triggers at midnight and
1 AM (`scheduler.py:41-53`). Free instances spin down after ~15 minutes of no
traffic. **A sleeping process has no scheduler.** At 00:00 there is no Nexora
running, so:

- `scheduled_ingest_all_sources` never fires → no new opportunities, ever.
- `scheduled_daily_lifecycle_sweep` never fires → nothing is ever marked
  `expired` or `dead_link`.

The second one is the more insidious failure. The index silently rots: expired
opportunities keep appearing as `active` in search results, and users click
through to dead deadlines. That destroys trust faster than an empty index does.

**Fix — invert the trigger.** Move the schedule *outside* the app:

```
1. Add authenticated trigger endpoints (reuse the existing X-Admin-Key
   dependency from routes/deps.py):
      POST /api/pipeline/cron/ingest
      POST /api/pipeline/cron/lifecycle

2. Drive them from a free external scheduler:
      GitHub Actions  →  schedule: cron  →  curl the endpoint
      (free for public repos; the repo already exists)

3. Keep APScheduler for local dev only — gate start_scheduler() behind
   settings.ENABLE_INTERNAL_SCHEDULER, default false in deployed envs.
```

Bonus: the cron ping doubles as a keep-alive, so a real user's first request is
less likely to hit a cold start.

**Cap the work per invocation.** Free instances are memory- and CPU-tight, and
`check_dead_links` already takes a `max_checks` argument (`scheduler.py:32`) —
keep that discipline for ingestion too, and let frequent small runs replace one
big nightly sweep.

### 10.3 AI search must survive rate limits — **P1**

Groq's free tier is roughly **30 requests/minute**, with a daily request cap that
varies by model — commonly cited as 14,400/day for small models, but reportedly
as low as ~1,000/day for larger ones. Crucially, **limits apply at the
organisation level, not per user**, and `ai_service.py:160` requests
`llama-3.3-70b-versatile` — one of the more constrained models. Extra API keys
don't raise the ceiling.

Since `POST /api/opportunities/search` calls the LLM on **every** search
(`opportunities.py:93`), a modest traffic spike — or one bot crawling the search
box — exhausts the day's quota and every subsequent search 429s.

**This is why `USE_MOCK_AI: bool = True` (`config.py:9`) is the correct default,
and it should stay the default.** Concretely:

- **Fail open, never fail hard.** Wrap the Groq call in try/except with a
  timeout; on 429, timeout, or any error, fall back to `_mock_parse_search`. A
  keyword-heuristic result is a fine search. A 500 is not.
- **Cache identical queries.** Search traffic is Zipf-distributed — a small
  in-memory dict keyed on the normalised query absorbs most of the load for free.
- **Skip the LLM for trivially short queries.** "phd" doesn't need intent
  parsing; go straight to SQL `ILIKE`, which is what `GET /api/opportunities`
  already does well.
- **Consider mock-only in production for Phase 1.** The two-pass SQL query in
  §3.2 is genuinely good on its own. Turn Groq on when there's budget to absorb
  the cap.

Same reasoning applies to `extract_opportunity` in the ingestion pipeline
(`ai_service.py:26`) — it's per-document, so a single ingest run over a few
hundred documents can burn the entire daily quota in one go. That makes §10.2's
per-run cap a *quota* constraint, not just a memory one.

### 10.4 Password reset email — genuinely free

Good news: reset emails are the lowest-volume mail a product sends. Any free
tier covers it.

| Provider | Free tier | Domain needed? |
|---|---|---|
| **Brevo** | 300/day (~9,000/mo) | **No** — verified *sender address* (a Gmail works) |
| **Resend** | 3,000/mo, 100/day | 1 free custom domain; `resend.dev` test sender only mails your own address |
| Mailtrap | ~150/day, sandbox | No — but it *catches* mail, doesn't deliver |
| SendGrid | ❌ **free tier retired May 2025** | — 60-day trial only |

**Recommendation:** `ConsoleMailer` for Phase 1 (§2.5), then **Brevo** with a
verified sender address when real users appear — it's the only one that needs no
DNS at all. Expect mediocre deliverability without SPF/DKIM on your own domain;
reset mails may land in spam, so the UI should say "check your spam folder."

The `Mailer` interface in §2.5 is what makes this a one-line config change, so
don't over-think the provider choice now.

### 10.5 Cold starts are a product problem

Free instances take **~30–60 seconds** to wake. That's the first impression for
any visitor arriving after an idle period — a blank page or a timeout on the
landing page.

Mitigations that cost nothing:

- The §10.2 cron ping keeps the instance warm during active hours.
- **Deploy the frontend separately** on Cloudflare Pages / Netlify / Vercel free
  — static hosting never sleeps. The landing page and `/explore` shell render
  instantly while the API wakes.
- That split **breaks the relative `/api` path** in `applyUrl()`
  (`lib/api.js:139`), since the frontend is no longer same-origin with the API.
  Introduce `VITE_API_BASE_URL` and make CORS explicit (§6.7). This is the
  decision in Appendix B #2 — the zero-budget path forces the split answer.
- Skeletons on every data surface, which the landing plan already specifies.
- Render also grants 750 instance-hours/month per workspace; **one** always-on
  service fits, two do not. Budget for a single backend instance.

### 10.6 The $0 stack

```
Frontend    Cloudflare Pages / Netlify        static, never sleeps, free
Backend     Render / Fly.io free web service  sleeps @15min, ~750 hrs/mo
Database    Neon free Postgres                0.5 GB, scale-to-zero @5min
Cron        GitHub Actions scheduled workflow  free on public repos
Email       ConsoleMailer → Brevo (300/day)   no DNS required
AI          USE_MOCK_AI=True                   $0; Groq later, fail-open
Errors      Sentry free tier (5k events/mo)   optional
```

Ceiling of this stack: comfortably a few thousand monthly visitors and a few
hundred users. The first thing to break is Neon's 0.5 GB, and `raw_documents`
(`models.py:140` — stores full `raw_content` per fetched page) is what will fill
it. Add a retention sweep that drops `raw_content` once a document reaches
`normalized`; keep the hash and URL for dedupe. Worth doing before the pipeline
runs at any scale.

---

## Appendix A — Phase 1 endpoint surface

Everything Phase 1 touches. Anything not on this list should not be called.

| Endpoint | Auth | Flow | Status |
|---|---|---|---|
| `POST /api/auth/register` | — | login | ✅ |
| `POST /api/auth/login` | — | login | ✅ form-encoded |
| `GET /api/auth/me` | JWT | login | ✅ |
| `POST /api/auth/forgot-password` | — | reset | ✅ implemented; runtime verification pending |
| `POST /api/auth/reset-password` | — | reset | ✅ implemented; runtime verification pending |
| `GET /api/opportunities` | — | search | ✅ |
| `POST /api/opportunities/search` | — | search | ✅ mock by default |
| `GET /api/opportunities/{id_or_slug}` | — | search | ✅ keep last in file |
| `GET /api/opportunities/stats` | — | landing | ✅ |
| `GET /api/opportunities/trending` | — | landing | ✅ |
| `GET /api/opportunities/{id}/apply` | — | apply | ✅ public outbound redirect + click measurement |
| `POST /api/applications` | JWT | save | ✅ idempotent |
| `DELETE /api/applications/by-opportunity/{id}` | JWT | unsave | ✅ |
| `GET /api/applications` | JWT | tracker | ✅ |
| `PATCH /api/applications/{id}` | JWT | tracker | ✅ stamps `applied_at` |
| `GET /api/applications/upcoming` | JWT | deadlines | ✅ |
| `POST /api/applications/apply` | **JWT** | **apply** | ✅ implemented |
| `POST /api/pipeline/cron/ingest` | **admin key** | **ops** | ✅ implemented; GitHub secret setup pending |
| `POST /api/pipeline/cron/lifecycle` | **admin key** | **ops** | ✅ implemented; GitHub secret setup pending |
| `GET /api/health` | — | ops | ✅ doubles as a warm-up ping |

## Appendix B — Decisions to record during build

1. ~~**Anonymous apply: gate it or allow it?**~~ **Settled:** gate it. The
   frontend preserves the visitor's return path through login, and every apply
   is attributable to a tracker row.
2. ~~**Deploy topology:** same-origin proxy or configurable API base?~~
   **Settled by §10.5** — the $0 stack puts the static frontend on a different
   host from the API, so `VITE_API_BASE_URL` + explicit CORS is required. (§6.7)
3. **Groq live or mock for the Phase 1 demo?** Recommendation: **mock**. The
   two-pass SQL search (§3.2) is good on its own, and the free quota is org-wide.
   If live, the timeout + fail-open + cache must land first. (§10.3)
4. ~~**SQLite or Postgres for the first deploy?**~~ **Settled by §10.1** —
   Postgres (Neon free). SQLite on an ephemeral filesystem loses all user data.
   SQLite stays for local dev only.
5. **Which mail provider when `ConsoleMailer` retires?** Recommendation:
   **Brevo** — 300/day free and the only option needing no DNS, just a verified
   sender address. Resend is nicer to work with if you'll verify a domain.
   SendGrid is out: its free tier was retired in May 2025. (§10.4)
6. **Reset token lifetime — 30 min?** Shorter is safer but strands users whose
   mail is delayed. 30 min is the recommended default. (§2.5)
7. **When does `raw_documents.raw_content` get purged?** It's the thing that will
   fill Neon's 0.5 GB first. Recommendation: drop the body once a document
   reaches `normalized`, keep hash + URL for dedupe. (§10.6)
8. **Public repo or private?** GitHub Actions scheduled workflows are free
   without limits on **public** repos; private repos draw down a monthly minutes
   allowance. Affects the §10.2 cron plan.
