# Nexora — Portfolio Build Plan (5 Days × 1–1.5 hr)

> Time budget: 60–90 minutes per day.
> Total: 5 days, ~6 hours, $0 cost.
> Outcome: live demo URL + polished GitHub repo on your resume.
>
> Each day below has: **what you do · what I do · how to verify · what's true at end of day.**
>
> If a day runs over, push the overflow to the start of the next day. Don't compress.

---

## The 5 days at a glance

| Day | Focus | Outcome | Time |
|---|---|---|---|
| 1 | Deploy to live URLs | `nexora.pages.dev` works publicly | 90 min |
| 2 | Polish copy + neutralize startup framing | Reads as engineering project, not pitch | 60 min |
| 3 | Screenshots + README rewrite | Professional GitHub landing page | 90 min |
| 4 | UX polish + seed real demo data | Live demo looks impressive | 75 min |
| 5 | Final review + resume bullets | Ready to share with recruiters | 60 min |

**Total: ~6 hours over 5 days.**

---

## 📅 DAY 1 — Deploy to live URLs (90 min)

**Goal:** by end of day, `https://nexora.pages.dev` loads in any browser and you can sign up.

### Your steps (60 min of clicks)

Follow `docs/DEPLOYMENT.md` step-by-step. The short version:

| Time | What to do |
|---|---|
| 0–5 min | Push repo to GitHub: `gh repo create nexora --private --source=. --remote=origin --push` |
| 5–15 min | Sign up for Neon · create project `nexora-prod` · copy `DATABASE_URL` |
| 15–20 min | Sign up Groq · create API key · copy `GROQ_API_KEY` |
| 20–25 min | Sign up Gemini at aistudio.google.com · copy `GEMINI_API_KEY` |
| 25–50 min | Sign up Render · connect GitHub · deploy backend with env vars · wait for build |
| 50–70 min | Sign up Cloudflare Pages · connect GitHub · deploy frontend with `VITE_API_URL` |
| 70–80 min | Go back to Render · set `CORS_ORIGINS=https://nexora.pages.dev` · auto-redeploys |
| 80–90 min | Verify: open `nexora.pages.dev` in incognito · sign up · browse opportunities · click Apply via Nexora |

### What I do tonight

While you sleep:
- Add `.env.example` to backend with all required variables documented
- Add a `Procfile` if Render needs one for the start command
- Verify `requirements.txt` excludes Playwright (would break Render free-tier build)
- Add a fallback `/healthz` endpoint Render can ping during cold starts

### Verification checklist

By end of Day 1 you can show me:
- [ ] `https://nexora.pages.dev` loads the landing page
- [ ] You signed up as a real user
- [ ] Onboarding wizard completed without errors
- [ ] Dashboard shows opportunities
- [ ] Clicking any opportunity opens the detail page
- [ ] The "Generate Draft" AI button returns a cover letter

### If you finish early

Don't start Day 2 work. Go for a walk. Day 1 is a hard deadline; if everything works at minute 70, you're done.

### If something breaks

Send me:
1. What URL you opened
2. The error message (Render logs, browser console, etc.)

Most-likely failure modes are in `DEPLOYMENT.md` § Troubleshooting. I'll diagnose anything weird.

---

## 📅 DAY 2 — Polish copy + neutralize startup framing (60 min)

**Goal:** by end of day, anyone visiting the live site sees "a thoughtful engineering project" not "a wannabe startup."

### Why this matters

Right now the landing page, pricing page, and some legal copy were written for a real startup launch. For a portfolio project, that framing is wrong — it sets up the recruiter to evaluate it as a business, not as engineering work.

We're not deleting features. We're rewording what's on the surface.

### Your steps (45 min of work)

| Time | What to do |
|---|---|
| 0–10 min | Open `nexora.pages.dev` and list every piece of copy that sounds like a sales pitch. Specific things to look for: "Join the platform", "Charter Member", "Apply via Nexora is the easiest way to...", any pricing language. |
| 10–15 min | Decide a tone: "personal project demonstrating X" or "open-source-style product showcase" — message me which |
| 15–45 min | Make the edits to landing components and any marketing pages where the copy is too sales-y. Match what you'd say in an interview describing the project. |

### What I do in parallel

While you edit:
- Add a "Portfolio Project" banner to the landing page (small, top of hero) that links to GitHub
- Remove the pricing page entirely from the public router (we'll keep the file in repo so the Stripe scaffold doesn't break, just unlink it from nav)
- Update Terms + Privacy to a one-paragraph notice: "This is a personal portfolio project. No real user data is collected for commercial purposes. The platform is non-commercial."
- Replace any "Sign up for Charter" CTA on the landing with "Try the demo"

### Verification

By end of Day 2:
- [ ] No "Charter Member" copy visible anywhere
- [ ] No pricing in the public navigation
- [ ] Hero says something like "Discover & apply to opportunities — a full-stack portfolio project"
- [ ] Footer or somewhere near top has a "Code on GitHub →" link
- [ ] Privacy + Terms read as portfolio-appropriate

### Output

A polished public surface that says: *engineering project, working software, not a business attempt.*

---

## 📅 DAY 3 — Screenshots + README rewrite (90 min)

**Goal:** by end of day, the GitHub repo's README is a professional landing page that makes recruiters stop scrolling.

### Why this matters

Most recruiters and hiring managers click the GitHub link, scan the README for 15 seconds, and decide whether to investigate further. **The README is the project's resume page.** The current one is from May 27, before most of the work landed.

### Your steps (60 min)

#### Capture screenshots (20 min)

Take 6 screenshots from the live demo. Use macOS Screenshot (Cmd+Shift+5) at full screen. Save as PNG:

1. **`01_landing.png`** — the landing page hero
2. **`02_dashboard.png`** — logged-in dashboard with recommendations
3. **`03_opportunity_detail.png`** — an opportunity detail page with the Apply CTA visible
4. **`04_apply_drawer.png`** — the ApplyDrawer open with cover letter + attachments + consent
5. **`05_tracker.png`** — the Kanban tracker with cards in different statuses
6. **`06_asset_vault.png`** — the Asset Vault with at least one uploaded file

Drop them in `docs/screenshots/` in the repo.

#### Provide me 2 inputs (10 min)

- Your GitHub username (so I can put correct URLs in the README)
- Whether you want your real name + email visible (recruiter-friendly) or a handle (privacy-conscious)

#### Stay available for review (30 min)

While I write the README, you skim each section as I push it. Veto anything that's not true or doesn't sound like you.

### What I do in parallel (60 min of writing)

A complete README rewrite. Structure:

```
# Nexora

[Live Demo] [GitHub] [License] (badges)

> One-line description

[hero screenshot]

## Features
- Bullet list with what works, with feature screenshots inlined

## Architecture
- ASCII diagram
- Tech stack table

## Engineering decisions
- 3-4 highlighted decisions linking to specific code

## Getting started
- 5-line local setup
- Env vars table

## Project structure
- Tree

## Acknowledgments
- AI tooling, libraries, etc.

## License
```

### Verification

By end of Day 3:
- [ ] 6 screenshots in `docs/screenshots/` referenced in README
- [ ] README has badges, hero image, feature list, architecture diagram
- [ ] README mentions live demo URL prominently
- [ ] Anyone landing on the repo immediately knows: what this is, what tech, where to click

---

## 📅 DAY 4 — UX polish + seed demo data (75 min)

**Goal:** by end of day, the live demo at `nexora.pages.dev` LOOKS impressive.

### Your steps (50 min)

#### Mobile responsiveness check (15 min)

Open `nexora.pages.dev` on your phone. Walk through:
1. Landing page → readable, no horizontal scroll
2. Sign up → form usable
3. Dashboard → cards stack vertically, not crushed
4. Opportunity detail → text doesn't overflow
5. Tracker → swipeable or stacked

Send me a screenshot of anything broken. I fix tonight.

#### Seed real opportunity data to Neon (15 min)

Run from your laptop:

```bash
# Dump your local DB
pg_dump postgresql://localhost:5432/nexora_db --data-only -t opportunities > opps.sql

# Push to Neon (use your DATABASE_URL)
psql "postgresql://...neon.tech/neondb?sslmode=require" < opps.sql
```

Now the live demo has all 10,000+ opportunities, not just 5 seeds. Way more impressive.

#### End-to-end test on the live URL (20 min)

Open `nexora.pages.dev` in incognito. Do the full flow:
1. Sign up with a fresh email
2. Onboarding — fill in real-sounding answers
3. Browse opportunities → use filters
4. Save 3 opportunities
5. Open one → click "Apply via Nexora" → walk the drawer
6. Click "Generate Draft" → wait for AI response
7. Check tracker — saved items appear
8. Upload a real CV to Asset Vault

Log anything broken or slow.

### What I do in parallel

- Fix any mobile breakages you report
- Polish empty states ("No opportunities saved yet" → "Start by browsing the catalog →")
- Add a "Demo Tour" banner that points new users at the 3 most interesting features
- Make sure the cold-start delay (Render waking up) shows a friendly "Warming up..." message instead of a generic error

### Verification

By end of Day 4:
- [ ] Site usable on phone
- [ ] 10,000+ opportunities in live DB
- [ ] Full end-to-end flow works without errors
- [ ] AI features respond within 3 seconds
- [ ] Cold-start UX doesn't break the first impression

---

## 📅 DAY 5 — Final review + resume bullets + LinkedIn post (60 min)

**Goal:** by end of day, the project is shareable. You have the words you'd use when talking about it.

### Your steps (60 min)

#### Pretend to be the recruiter (15 min)

Open in fresh incognito browser:
1. Search "your GitHub username" → find the repo
2. Open the README → read it like a recruiter would
3. Click the live demo URL → use the app for 5 minutes
4. Open `MASTER_PLAN.md` → read it like an engineering manager would

Note anywhere you cringed or got confused. Send me the list — I fix tonight.

#### Pick your 4 resume bullets (15 min)

I'll give you 12 candidate bullets (4 each for: junior/mid backend, full-stack, AI-leaning). Pick the 4 that best fit your target role. Message me which ones; I refine them based on the actual code we shipped.

#### Write the LinkedIn announcement (20 min)

Draft a 150-word LinkedIn post:
- Opening hook
- What you built
- What you learned
- Live demo + GitHub links
- Soft CTA ("would love feedback")

I review and improve it. You post when you're ready.

#### Final verification pass (10 min)

The "everything works" checklist:
- [ ] `nexora.pages.dev` loads in <5 sec
- [ ] Signup works first try
- [ ] AI features return without errors
- [ ] GitHub README screenshots render correctly
- [ ] All internal links in README work
- [ ] Live demo URL is in the GitHub About section

### What I do

- Generate the 12 candidate resume bullets
- Review your LinkedIn draft
- Final pass on README polish based on your Day 5 walkthrough notes
- Suggest one bonus pin (a tweet, an Indie Hackers post, etc.) if you want extra distribution

### End-of-day-5 state

You have:
- A live, working portfolio project at `nexora.pages.dev`
- A polished GitHub repo recruiters will respect
- 4 resume bullets you can paste tomorrow
- A LinkedIn post ready to share
- Documented engineering decisions in `MASTER_PLAN.md`

**Total time invested: ~6 hours over 5 days. Total cost: $0. Resume impact: huge.**

---

## 🛟 If you fall behind

The plan is sequential. If Day 1 takes 2 hours instead of 90 min, push Day 2 to your next session — don't try to do both. The order matters more than the calendar.

If life happens and you miss a day, the project just sits. It doesn't expire. The locked-state at any day's end is your fallback.

---

## 📋 Daily message protocol

Each day when you start, message me: **"Day N starting"**
Each day when you finish, message me: **"Day N done — [anything broken]"**

That's it. I'll have your overnight work ready before your next session.

---

## 🎯 The 5-day end state

| Asset | Where it lives |
|---|---|
| Live demo URL | `https://nexora.pages.dev` |
| Code | `github.com/<your-username>/nexora` |
| README | The repo's `README.md` (Day 3 rewrite) |
| Architecture spec | `docs/MASTER_PLAN.md` (already done) |
| Apply Layer design | `docs/APPLY_LAYER_V1.md` (already exists) |
| User flow docs | `docs/USER_FLOW.md` (already exists) |
| Deployment guide | `docs/DEPLOYMENT.md` (already exists) |
| 6 screenshots | `docs/screenshots/01..06.png` (Day 3) |
| Resume bullets | Saved in your password manager (Day 5) |
| LinkedIn post | Live on your profile (Day 5) |

When all 10 exist, you're done. The project is portfolio-ready and on your resume.

---

## ⏭️ What we DON'T do (intentionally cut)

For honest scope control, these things are NOT in the 5-day plan:

| Cut | Why |
|---|---|
| Stripe live integration | Too much work, no value for portfolio |
| Real email sending via Resend | ConsoleMailer print is fine for demo |
| Multi-language i18n | Not expected at this stage |
| Mobile app | Web-responsive only |
| Browser extension | Out of scope for portfolio |
| Custom domain | `.pages.dev` is fine, saves $15/yr |
| Analytics / Sentry / monitoring | Portfolio doesn't need it |
| CI/CD pipeline | Render + Pages auto-deploy on push, that's enough |
| Test coverage | Worth adding later, not Day 1-5 priority |

If you want any of these added in a Day 6+, we can do it. But don't slow Days 1-5 for them.

---

## 🚀 Start Day 1 when ready

When you sit down for your first 90-min block:

1. Open `docs/DEPLOYMENT.md` in one tab
2. Message me: **"Day 1 starting"**
3. Work top to bottom on the deployment guide
4. Message me anything weird you hit

The fastest path to a resume-ready portfolio is starting Day 1.
