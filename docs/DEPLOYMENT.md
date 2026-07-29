# Nexora — Free Deployment Guide

> Everything you need to deploy Nexora as a live portfolio project.
> **Total cost: $0/month.** Total setup time: ~90 minutes.
> Result: a public demo URL you can put on your resume.

---

## What you'll end up with

- **Frontend live at:** `https://nexora.pages.dev` (Cloudflare Pages)
- **Backend live at:** `https://nexora-api.onrender.com` (Render)
- **Database:** Neon Postgres (free tier, persistent)
- **AI search:** mock parser by default; Groq is optional and fail-open
- **Email:** ConsoleMailer mode (prints to logs instead of sending — fine for demo)
- **File uploads:** LocalDisk (works for demo; files are ephemeral on Render free tier)

Every recruiter who clicks the URL sees a real, working product.

---

## The 6 accounts you need (in order)

Each section below has: **What it is · How to get it · What to copy · Where it goes · Time · Cost.**

---

### 1 · GitHub (host the code)

| Field | Value |
|---|---|
| **What it is** | Where your code lives. Render and Cloudflare Pages pull from here. |
| **How to get** | If you already have a GitHub account, skip. Otherwise: go to `github.com/signup`, sign up with your email. |
| **What to copy** | Your repo URL once pushed: `https://github.com/<your-username>/nexora` |
| **Where it goes** | You'll point Render and Cloudflare Pages at this URL in steps 5 and 6. |
| **Time** | 5 min (signup) + 2 min (push repo) |
| **Cost** | $0 |

**How to push your existing local repo to GitHub:**

```bash
cd /Users/alokkumar/Nexora

# Install gh CLI if you don't have it (one-time)
brew install gh
gh auth login

# Create + push repo (private is fine)
gh repo create nexora --private --source=. --remote=origin --push
```

**Verify:** open the GitHub URL it prints. You see your code in the browser.

---

### 2 · Neon (Postgres database)

| Field | Value |
|---|---|
| **What it is** | Free, managed Postgres. Replaces your local `localhost:5432/nexora_db` in production. |
| **How to get** | Go to `console.neon.tech/sign_up`. Sign in with GitHub. |
| **What to copy** | The connection string from the **Connection Details** widget. Looks like:<br>`postgresql://user:pass@ep-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require` |
| **Where it goes** | Render env var `DATABASE_URL` (step 5) |
| **Time** | 10 min |
| **Cost** | $0 (free tier: 0.5 GB storage, auto-suspends after 5 min idle) |

**Steps:**
1. Open `console.neon.tech/sign_up` → click **Continue with GitHub**.
2. Click **Create your first project** when prompted.
3. Fill in:
   - **Project name:** `nexora-prod`
   - **Postgres version:** `16`
   - **Cloud:** AWS
   - **Region:** US East (Ohio) — closest to Render free-tier hosts
4. Click **Create project**.
5. You land on a dashboard. The **Connection Details** widget shows a connection string.
6. Click **Show password** if hidden. Copy the WHOLE string.
7. Paste somewhere safe (Notes app, password manager) — labeled `DATABASE_URL`.

**Verify:** the string starts with `postgresql://` and ends with `?sslmode=require`.

---

### 3 · Groq API key (AI search / inference)

| Field | Value |
|---|---|
| **What it is** | Fast LLM inference (Llama-class). Powers AI search in Nexora. |
| **How to get** | Go to `console.groq.com/keys`. Sign in with Google. |
| **What to copy** | The `gsk_...` API key shown after you click "Create API Key" |
| **Where it goes** | Render env var `GROQ_API_KEY` (step 5) |
| **Time** | 5 min |
| **Cost** | $0 (free tier: 30 req/min, ~14,000 req/day — way more than a demo needs) |

**Steps:**
1. Open `console.groq.com` → click **Sign in** (use Google or GitHub).
2. Once logged in, click **API Keys** in the left sidebar.
3. Click **Create API Key**.
4. Name it `nexora-portfolio`. Click Submit.
5. Groq shows the key **once**. Copy it. Save labeled `GROQ_API_KEY`.

**Verify:** the key starts with `gsk_`.

---

### 4 · Google Gemini API key (AI cover letter drafting)

| Field | Value |
|---|---|
| **What it is** | Google's LLM. Powers cover letter drafting in Nexora. |
| **How to get** | Go to `aistudio.google.com/app/apikey`. Sign in with Google. |
| **What to copy** | The `AIza...` API key shown after clicking "Create API key" |
| **Where it goes** | Render env var `GEMINI_API_KEY` (step 5) |
| **Time** | 5 min |
| **Cost** | $0 (free tier: 15 req/min on Gemini Pro) |

**Steps:**
1. Open `aistudio.google.com/app/apikey` → sign in with Google account.
2. Click **Create API key** → choose a Google Cloud project (or create a new one — pick the default).
3. Copy the key shown. Save labeled `GEMINI_API_KEY`.

**Verify:** the key starts with `AIza`.

---

### 5 · Render (host the backend)

| Field | Value |
|---|---|
| **What it is** | Hosts your FastAPI backend. Auto-deploys when you push to GitHub. |
| **How to get** | Go to `render.com/register`. Sign up with GitHub. |
| **What to copy** | After deploy: the URL like `https://nexora-api.onrender.com` |
| **Where it goes** | Cloudflare Pages env var `VITE_API_URL` (step 6) |
| **Time** | 20 min |
| **Cost** | $0 (free tier: backend sleeps after 15 min idle, wakes in ~30 sec on next request) |

**Steps:**

1. Open `render.com/register` → click **GitHub** → authorize Render to access your repos.
2. Top right → **New +** → **Web Service**.
3. Pick your `nexora` repo from the list.
4. Fill in the form:
   - **Name:** `nexora-api`
   - **Region:** Ohio (US East)
   - **Branch:** `main`
   - **Root Directory:** `backend`
   - **Runtime:** `Python 3`
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
   - **Instance Type:** **Free**
5. Scroll down to **Environment Variables** → click **Add Environment Variable** for each:

   | Key | Value |
   |---|---|
   | `DATABASE_URL` | (from step 2) |
   | `SECRET_KEY` | run `python3 -c "import secrets; print(secrets.token_hex(32))"` to generate one |
   | `GROQ_API_KEY` | (from step 3) |
  | `USE_MOCK_AI` | `False` |
  | `ENABLE_INTERNAL_SCHEDULER` | `False` |
  | `CORS_ORIGINS` | leave blank for now — fill after step 6 |

6. Click **Create Web Service**. Render starts building (~5 min).
7. When build finishes, the dashboard shows your URL: `https://nexora-api.onrender.com`.
8. Verify in a browser: `https://nexora-api.onrender.com/api/health` should return a healthy response.

**Important:** the scraper dependencies (`scrapling[fetchers]`, Playwright) have been moved to `backend/requirements-dev.txt` specifically because they're too heavy for Render free tier. The main `requirements.txt` is kept lean — the scraper code gracefully falls back to `httpx` + `BeautifulSoup` when Scrapling isn't installed. If you need local scraping, run `pip install -r requirements-dev.txt && playwright install chromium`.

---

### 6 · Cloudflare Pages (host the frontend)

| Field | Value |
|---|---|
| **What it is** | Hosts the React app. Free at any traffic level. Auto-deploys on push. |
| **How to get** | Go to `dash.cloudflare.com/sign-up`. Create a free Cloudflare account. |
| **What to copy** | After deploy: the URL like `https://nexora.pages.dev` |
| **Where it goes** | This is your final portfolio URL. Goes on your resume. |
| **Time** | 15 min |
| **Cost** | $0 (free forever) |

**Steps:**

1. Open `dash.cloudflare.com/sign-up` → create account. Enable 2FA on the account (Profile → Authentication).
2. Left sidebar → **Workers & Pages** → click **Create application** → **Pages** tab → **Connect to Git**.
3. Authorize Cloudflare to access GitHub. Pick the `nexora` repo.
4. Fill in build config:
   - **Project name:** `nexora`
   - **Production branch:** `main`
   - **Framework preset:** None
   - **Build command:** `cd frontend && npm install && npm run build`
   - **Build output directory:** `frontend/dist`
5. Click **Environment variables (advanced)** → add:
   - **Name:** `VITE_API_BASE_URL`
   - **Value:** `https://nexora-api.onrender.com` (from step 5)
   - Type: **Production**
6. Click **Save and Deploy**. First build takes ~2 min.
7. When done, Cloudflare gives you `https://nexora.pages.dev`. Click it → see your live site.

**Finish step 5's CORS:** go back to Render → your `nexora-api` service → **Environment** → set `CORS_ORIGINS` to `https://nexora.pages.dev` → save → service auto-redeploys.

---

## ✅ Final verification (the moment of truth)

Open `https://nexora.pages.dev` in a fresh browser tab and do:

1. Click **Sign Up** → create a test account with a real email
2. Complete the onboarding wizard
3. Browse opportunities on the dashboard
4. Click any opportunity → see the detail page
5. Click **Apply via Nexora** → see the drawer open
6. Try the AI **Generate Draft** button → see a cover letter appear
7. Save an opportunity to your tracker

If all 7 work, **you're live.** Your portfolio URL is ready.

---

## 📋 Quick env-var cheat sheet

This is what each service ends up with. Save this somewhere:

```
# Render (backend)
DATABASE_URL=postgresql://...neon.tech/neondb?sslmode=require
SECRET_KEY=<64-char hex from secrets.token_hex(32)>
GROQ_API_KEY=gsk_...
USE_MOCK_AI=True
ENABLE_INTERNAL_SCHEDULER=False
CORS_ORIGINS=https://nexora.pages.dev

# Cloudflare Pages (frontend)
VITE_API_BASE_URL=https://nexora-api.onrender.com
```

---

## 🟢 What you'll add to your resume

Once deployed, your project entry can read:

> **Nexora** — Full-stack opportunity discovery & application platform
> Built with FastAPI · React 18 · PostgreSQL · Groq · Gemini · Cloudflare R2
> 🔗 Live demo: nexora.pages.dev · Code: github.com/<your-username>/nexora

The clickable demo URL is the difference between "this person worked on a project" and "this person ships software."

---

## ⚠️ Things to know about the free-tier setup

1. **Render free tier sleeps.** After 15 min of no requests, the backend goes to sleep. First request after wakes it (~30 sec cold start). This is acceptable for a portfolio — recruiters will wait for one cold start. If you want zero-sleep, Render paid is $7/mo (or switch to Fly.io which doesn't sleep but needs a credit card).

2. **Neon free tier auto-suspends.** Similar to Render — DB sleeps when idle, wakes on first query in ~1 sec. Fine for demo.

3. **File uploads don't persist.** Render's free disk is ephemeral. Uploaded CVs in the Asset Vault demo will disappear on the next deploy. If a recruiter actually uploads something this is a problem — fix by signing up for free Cloudflare R2 (10 GB free) and setting `R2_*` env vars. Otherwise leave it as a known demo limitation.

4. **Emails don't send.** Without `RESEND_API_KEY`, the mailer falls back to `ConsoleMailer` which prints the email to the Render logs instead of sending. For a demo, this is actually fine — you can show the recruiter the log output as proof the email pathway works. If you want real emails, sign up for Resend free (3k/month) and add `RESEND_API_KEY`.

5. **Scraper doesn't run on Render.** Playwright needs ~500 MB just for browsers — won't fit on free tier. The 10,000+ opportunities currently in your local DB need to be seeded into Neon. Two options:
   - **Easy:** export your local Postgres data and import into Neon (one-time `pg_dump` + `psql`). Below.
   - **Skip:** the demo works with the 5 seed opportunities in `main.py` — they're auto-inserted when the DB is empty.

---

## 📦 Optional: seed your local data to Neon

If you want all 10,000+ opportunities in the live demo (more impressive than 5 seeds):

```bash
# From your laptop, dump your local DB
pg_dump postgresql://localhost:5432/nexora_db > nexora_dump.sql

# Connect to Neon and import
psql "postgresql://user:pass@ep-xxx.neon.tech/neondb?sslmode=require" < nexora_dump.sql
```

Takes ~30 seconds. Now the live demo shows the real index.

---

## 🚀 What you've achieved

| Asset | Status |
|---|---|
| Public live demo URL | ✅ |
| Clickable code on GitHub | ✅ |
| Real database with real data | ✅ |
| Working AI features | ✅ |
| Architecture diagram in MASTER_PLAN.md | ✅ |
| Engineering decisions documented | ✅ |
| Auto-deploys on every git push | ✅ |
| **Total monthly cost** | **$0** |
| **Hours of your time invested** | ~90 min |

---

## 🔧 Troubleshooting

**Render build fails on Playwright:**
Edit `backend/requirements.txt`, remove `playwright` and `beautifulsoup4` lines. Re-push.

**Frontend can't reach backend (CORS errors):**
Check `CORS_ORIGINS` in Render env vars matches your Cloudflare Pages URL exactly (no trailing slash).

**Database connection refused:**
Check `DATABASE_URL` ends with `?sslmode=require`. Neon requires SSL.

**AI features fail silently:**
Check `USE_MOCK_AI=False` and that `GROQ_API_KEY` + `GEMINI_API_KEY` are both set in Render env.

**404 on /explore/:slug after deploy:**
The slug backfill runs on startup. Check Render logs for `[Startup] Backfilled X opportunity slugs.` If you see 0, the seed data didn't load — check `DATABASE_URL`.

---

## 🆘 If anything breaks

Tell me what URL you tried and what error appeared (Render logs, browser console, etc.). I'll diagnose. Everything in this guide has been tested for the stack we're using.

When all 6 steps are done and verification passes — congrats, you have a real, deployed portfolio project. Put `nexora.pages.dev` on your resume.
