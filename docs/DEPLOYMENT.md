# Nexora — Free Deployment Guide

> Everything you need to deploy Nexora on free tiers.
> **Total cost: $0/month.** Total setup time: ~60–90 minutes.

---

## What you'll end up with

- **Frontend:** Cloudflare Pages (e.g. `https://nexora-8y5.pages.dev`)
- **Backend:** Render web service (e.g. `https://nexora-vjf8.onrender.com`)
- **Database:** Neon Postgres (free tier, persistent)
- **Pipeline automation:** GitHub Actions cron calling the backend (Render's free instance sleeps, so the in-process scheduler is turned off there)
- **AI extraction/search:** Groq if you add a key; otherwise the heuristic parser (it never invents data, but records are less complete)
- **Email:** printed to the Render logs by default; real delivery via any SMTP account

---

## The accounts you need (in order)

### 1 · GitHub (host the code)

If you don't have an account, sign up at `github.com/signup`, then push the repo:

```bash
gh repo create nexora --private --source=. --remote=origin --push
```

### 2 · Neon (Postgres database)

1. `console.neon.tech/sign_up` → **Continue with GitHub** → **Create project** (`nexora-prod`, Postgres 16, AWS US East (Ohio)).
2. Copy the connection string from **Connection Details**. It looks like
   `postgresql://user:pass@ep-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require`.
   This is your `DATABASE_URL`.

### 3 · Groq API key (optional — LLM extraction and search)

1. `console.groq.com/keys` → **Create API Key** → copy the `gsk_...` key.
2. This is your `GROQ_API_KEY`. Without it, set nothing: the backend uses the heuristic parser.

### 4 · Render (host the backend)

1. `render.com/register` → sign up with GitHub.
2. **New +** → **Web Service** → pick the `nexora` repo, then:
   - **Root Directory:** `backend`
   - **Runtime:** Python 3
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
   - **Instance Type:** Free
3. Add these **Environment Variables**. Generate each secret with
   `python3 -c "import secrets; print(secrets.token_hex(32))"`.

   | Key | Value |
   |---|---|
   | `DATABASE_URL` | from step 2 |
   | `DEBUG` | `False` |
   | `SECRET_KEY` | a generated secret (signs login tokens) |
   | `ADMIN_SECRET_KEY` | a different generated secret (guards admin, pipeline and cron endpoints) |
   | `ADMIN_EMAIL` | the email you'll log in to the admin console with |
   | `ADMIN_PASSWORD` | a unique password, at least 12 characters |
   | `ENABLE_INTERNAL_SCHEDULER` | `False` |
   | `FRONTEND_URL` | your Cloudflare Pages URL (fill in after step 5; used in email links) |
   | `CORS_ORIGINS` | your Cloudflare Pages URL (fill in after step 5) |
   | `GROQ_API_KEY` + `USE_MOCK_AI` | optional: your key and `False` |

   **The backend refuses to start** on a deployed environment if `SECRET_KEY` or
   `ADMIN_SECRET_KEY` is empty or a public development default, or if
   `ADMIN_PASSWORD` is weak. The error in the Render logs names the variable.
   There is no built-in admin account: the admin login exists only when
   `ADMIN_EMAIL` and `ADMIN_PASSWORD` are set, and changing `ADMIN_PASSWORD`
   plus a restart rotates it.

   Optional email delivery (password resets, contact form):

   | Key | Value |
   |---|---|
   | `MAILER` | `smtp` |
   | `SMTP_HOST` / `SMTP_PORT` | e.g. `smtp.gmail.com` / `587` (STARTTLS is required) |
   | `SMTP_USER` / `SMTP_PASSWORD` | the account and its app password |
   | `MAIL_FROM` | optional; defaults to `SMTP_USER` |

   Optional pipeline tuning (defaults shown):

   | Key | Default | Purpose |
   |---|---|---|
   | `MIN_SOURCE_RESCRAPE_HOURS` | `5` | Skip sources scraped more recently than this |
   | `CRON_MAX_SOURCES` | `10` | Sources per ingest batch (least recently attempted first) |
   | `CRON_MAX_DEAD_LINK_CHECKS` | `30` | Apply-URL checks per lifecycle sweep (least recently checked first) |
   | `DEAD_LINK_FAILURE_THRESHOLD` | `3` | Consecutive transient failures before `dead_link` |
   | `EXPIRING_SOON_DAYS` | `7` | Deadline window for `expiring_soon` |
   | `PUBLISH_MIN_CONFIDENCE` | `0.75` | Minimum extraction confidence for a pipeline record to publish |
   | `LIVE_FEED_TTL_SECONDS` | `60` | Cache for the live part of the published feed |
   | `INGEST_INTERVAL_HOURS` / `LIFECYCLE_INTERVAL_HOURS` / `PUBLISH_REFRESH_INTERVAL_HOURS` | `6` / `24` / `168` | Only used when the internal scheduler is on |

4. **Create Web Service**, wait for the build, then open `https://<your-service>.onrender.com/api/health`.

The HTTP scraper works on Render as-is (httpx + BeautifulSoup). Browser-based
fetching (`use_js` / `use_stealth` sources) needs `requirements-dev.txt` and
Playwright browsers, which don't fit the free tier.

### 5 · Cloudflare Pages (host the frontend)

1. `dash.cloudflare.com/sign-up` → **Workers & Pages** → **Create application** → **Pages** → **Connect to Git** → pick the repo.
2. Build settings:
   - **Build command:** `cd frontend && npm install && npm run build`
   - **Build output directory:** `frontend/dist`
3. Environment variables:
   - `VITE_API_BASE_URL` = your Render URL
   - `VITE_GOOGLE_CLIENT_ID` = your Google OAuth client ID, if you use
     "Sign in with Google" (set the same value as `GOOGLE_CLIENT_ID` on Render)
   - `VITE_SITE_URL` = your Pages URL (optional; used for SEO tags)

   Never put an admin key in a `VITE_*` variable: every `VITE_*` value is
   compiled into the public JavaScript bundle.
4. **Save and Deploy**, then go back to Render and set `CORS_ORIGINS` and `FRONTEND_URL` to the Pages URL.

### 6 · GitHub Actions cron (pipeline automation)

In the GitHub repo → **Settings → Secrets and variables → Actions**, add:

| Secret | Value |
|---|---|
| `NEXORA_API_URL` | your Render URL, no trailing slash |
| `NEXORA_ADMIN_SECRET_KEY` | the same value as Render's `ADMIN_SECRET_KEY` |

`.github/workflows/pipeline-cron.yml` then runs ingest every 6 hours, the
lifecycle sweep daily, and the publishing refresh weekly. To run one now:
**Actions → Nexora pipeline cron → Run workflow** and pick `ingest`,
`lifecycle` or `publish`. A run fails (red) if the API reports the job failed
or never answers after three cold-start retries.

---

## ✅ Final verification

1. `https://<render>/api/health` returns `"status": "healthy"`.
2. Open the Pages URL → sign up → complete onboarding → browse, open an opportunity, save it to the tracker.
3. Log in with `ADMIN_EMAIL` / `ADMIN_PASSWORD` → you land on `/admin`.
4. Run the workflow manually with `ingest`, then check the pipeline:
   ```bash
   curl -s -H "X-Admin-Key: $ADMIN_SECRET_KEY" https://<render>/api/pipeline/status
   ```
   `sources.detail[]` shows each source's health and last error.

---

## 📋 Env-var cheat sheet

```
# Render (backend)
DATABASE_URL=postgresql://...neon.tech/neondb?sslmode=require
DEBUG=False
SECRET_KEY=<generated>
ADMIN_SECRET_KEY=<generated, different>
ADMIN_EMAIL=you@example.com
ADMIN_PASSWORD=<12+ characters>
ENABLE_INTERNAL_SCHEDULER=False
CORS_ORIGINS=https://nexora.pages.dev
FRONTEND_URL=https://nexora.pages.dev
# optional
GROQ_API_KEY=gsk_...
USE_MOCK_AI=False

# Cloudflare Pages (frontend)
VITE_API_BASE_URL=https://nexora-api.onrender.com

# GitHub Actions secrets
NEXORA_API_URL=https://nexora-api.onrender.com
NEXORA_ADMIN_SECRET_KEY=<same as ADMIN_SECRET_KEY>
```

---

## Upgrading an existing deployment

Earlier builds created an `admin@nexora.ai` / `admin123` account on every boot.
On the first boot of this version:

- that account is locked (random password) and loses its admin role, unless
  you set `ADMIN_EMAIL=admin@nexora.ai` with a new `ADMIN_PASSWORD`;
- set `ADMIN_EMAIL` / `ADMIN_PASSWORD` to get an admin login back;
- if the service fails to boot, the Render log lists which secret is missing
  or still a public default — set it and redeploy;
- set `DEBUG=False` if it isn't already.

---

## ⚠️ Free-tier notes

1. **Render sleeps** after 15 minutes idle; the first request takes ~30–60 s. The cron workflow retries through cold starts.
2. **Neon auto-suspends** when idle and wakes in about a second.
3. **Email** goes to the Render logs until `MAILER=smtp` is configured.

### Optional: copy your local data to Neon

```bash
pg_dump postgresql://localhost:5432/nexora_db > nexora_dump.sql
psql "postgresql://user:pass@ep-xxx.neon.tech/neondb?sslmode=require" < nexora_dump.sql
```

---

## 🔧 Troubleshooting

**Service won't start, log says "Refusing to start with unsafe production configuration":** set the variables it lists (see step 4).

**Frontend can't reach the backend (CORS errors):** `CORS_ORIGINS` must match the Pages URL exactly, without a trailing slash.

**Database connection refused:** `DATABASE_URL` must end with `?sslmode=require` for Neon.

**Extraction looks thin:** set `GROQ_API_KEY` and `USE_MOCK_AI=False`, then re-extract existing pages once per source:
`curl -X POST -H "X-Admin-Key: $ADMIN_SECRET_KEY" "https://<render>/api/sources/<id>/run?reextract=true"`.

**Cron workflow fails:** open the failed run. "must be set" means a repository secret is missing; `"success": false` includes the application error; "did not return a valid response" means the service never woke up.
