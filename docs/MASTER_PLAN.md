# Nexora — The Master Plan

> **Global Opportunity Intelligence Platform**
> Author: Alok Kumar (Founder)
> Status: Living document · v1.0 · 2026-06-25

---

## 0. The One-Liner

**Nexora is the search engine and operating system for the world's opportunities.** We automatically discover, structure, and surface every scholarship, fellowship, grant, accelerator, competition, conference, exchange program, and giveaway on earth — then help people actually *win* them.

> Google indexes the web. LinkedIn indexes jobs. **Nexora indexes opportunity.**

---

## 1. The Problem (Why This Exists)

### 1.1 The core insight

Every year, **billions of dollars** in opportunities go unclaimed — not because they don't exist, but because the people who need them never find them.

- Millions of scholarships
- Thousands of fellowships
- Startup accelerators & VC programs
- Research grants
- Competitions & hackathons
- Government schemes
- Conferences & exhibitions
- Exchange & travel programs
- Giveaways (cloud credits, software, hardware)

> **Opportunities exist. Discovery is broken.**

### 1.2 Why discovery is broken today

1. **Fragmentation** — opportunities live on 100,000+ websites, university pages, ministry portals, Twitter threads, Telegram groups, and PDFs. There is no single index.
2. **Decay** — opportunities have deadlines. By the time word-of-mouth reaches you, it's expired.
3. **No personalization** — even aggregators dump generic lists. A 19-year-old engineering student in Patna and a postdoc in Berlin see the same noise.
4. **No workflow** — finding the opportunity is 10% of the battle. Tracking deadlines, drafting applications, and following through is the other 90% — and nothing supports it.
5. **Information asymmetry** — the people who win are those with networks ("my senior told me"). Talent is everywhere; *access* is not.

### 1.3 Who hurts

- Students (scholarships, exchange, competitions)
- Early founders (accelerators, grants, VC programs, credits)
- Researchers (fellowships, research grants, conferences)
- Creators & professionals (residencies, awards, travel grants)
- Underserved regions where the access gap is widest

### 1.4 The mission

> **Democratize access to global opportunity.** Make where you were born irrelevant to what you can reach.

---

## 2. The Solution

Nexora is three products fused into one loop:

1. **Discovery Engine** — AI continuously scrapes, normalizes, de-duplicates, and categorizes opportunities from across the web into one structured index.
2. **Intelligence Layer** — personalized matching, deadline reminders, eligibility checks, and an AI draft copilot that helps you *apply*, not just find.
3. **Community & Trust Layer** — success stories, Q&A, mentors, and application tips so winners teach the next wave.

```
   DISCOVER  →  MATCH  →  TRACK  →  APPLY  →  WIN  →  GIVE BACK
   (engine)    (AI)      (Kanban)  (copilot) (status) (community)
        ▲                                                  │
        └──────────────  data + trust flywheel  ◄──────────┘
```

The genius is the **loop**: winners come back to share how they did it, which creates content + trust + data, which attracts more users, which attracts more opportunity providers, which improves the index.

---

## 3. Why Now

- **AI inflection** — LLMs make it economically possible to read, classify, and summarize unstructured opportunity data at scale. This was infeasible 3 years ago.
- **Global mobility** — remote work, global education, and cross-border funding are exploding.
- **Trust collapse in search** — Google results are increasingly SEO spam and ads. Vertical, structured, trustworthy indices win.
- **Creator/solo-founder boom** — more individuals than ever are seeking grants, credits, and programs.

**The window:** Be the default index before someone else aggregates the long tail. Indices compound — the first mover with the cleanest data and strongest community becomes a winner-take-most.

---

## 4. Product Architecture

### 4.1 Current foundation (already built)

**Backend (FastAPI + SQLAlchemy + PostgreSQL + Gemini AI)** — all routes under `/api`:

| Domain | Capability |
|---|---|
| `/auth` | JWT register / login / me |
| `/opportunities` | CRUD, search, stats, recommendations, draft copilot |
| `/applications` | Kanban tracker (Saved → Planning → Applied → Interview → Accepted/Rejected) |
| `/profile` | rich user profile (interests, regions, reputation, badges) |
| `/reminders` | upcoming + overdue deadlines |
| `/scraper` | sources list + SSE live discovery run |
| `/community` | stories, questions, answers, mentors, mentorship, tips, votes |

**Frontend (React + Vite + React Router v6 + React Query + plain CSS):**
- Phase 0 ✅ — router, design tokens, UI kit, layouts, AuthProvider, landing page
- Phase 1 🚧 — auth pages built, wiring in progress
- Phases 2–5 ⛔ — core app, stickiness, community, marketing

### 4.2 The data model that matters

The defensible asset is a **clean, structured, de-duplicated, freshness-scored index** of opportunities. Each opportunity carries: title, org, description, canonical URL, funding amount, deadline, country, category, tags, eligibility. This structure is the moat — raw scraping is a commodity, *clean structured data* is not.

### 4.3 The four product pillars

1. **The Index** — comprehensive, fresh, structured, trustworthy.
2. **The Match** — "10 opportunities you can actually win this week," personalized to profile + history.
3. **The Tracker** — the workflow that keeps users coming back daily (deadlines create habit).
4. **The Copilot** — AI that drafts essays, checks eligibility, and increases *win rate* (the outcome that creates evangelists).

---

## 5. The Moat (Why We Win and Stay Won)

A billion-dollar company needs durable defensibility. Nexora compounds **five** moats:

1. **Data moat** — the cleanest, freshest, most complete opportunity index. Hard to replicate; improves with scale.
2. **Network effects** — winners → stories/tips → trust → more users → more providers → better index. Two-sided.
3. **Workflow lock-in** — once your applications, deadlines, drafts, and history live in Nexora, switching is painful.
4. **Brand / trust** — "I found it on Nexora" becomes the default. Trust is the scarcest asset in a spam-filled discovery world.
5. **AI proprietary signal** — win/loss outcome data trains matching + copilot quality that no competitor without the index can match.

> The flywheel: **more data → better matches → more wins → more community → more data.**

---

## 6. Go-To-Market

### 6.1 Wedge — start narrow, own a niche

Do **not** boil the ocean. Pick **one high-pain, high-density, viral segment** and dominate it, then expand category by category.

**Recommended wedge: Students seeking scholarships + fellowships in India / emerging markets.**
- Huge volume, acute pain, deadline-driven (built-in retention), naturally viral (students share in groups), underserved by clean tooling.

Then expand outward:
`Scholarships → Fellowships → Competitions/Hackathons → Startup accelerators & credits → Grants & research → Conferences & travel.`

### 6.2 Growth engine (sequenced)

| Stage | Channel | Mechanic |
|---|---|---|
| 0→1 | Founder-led + communities | Seed in Telegram/WhatsApp/Discord/college groups |
| 1→10 | SEO + programmatic pages | Every opportunity = an indexed landing page; long-tail search wins |
| 10→100 | Viral loops | "I won X via Nexora" share cards; referral for early access |
| 100→1000 | Content + creators | Student ambassadors, university partnerships, newsletter |
| Scale | Provider-side | Orgs list opportunities directly → supply network effect |

### 6.3 The SEO unlock

Each opportunity becomes a clean, fast, structured public page (`/explore/...`). With tens of thousands of fresh, deadline-relevant pages, Nexora becomes the organic search destination for "[X] scholarship 2026 deadline." This is near-zero marginal cost distribution and the primary 1→100 engine.

---

## 7. Business Model

Free index drives top-of-funnel and SEO. Monetize the **workflow, intelligence, and supply side** — never paywall basic discovery (that kills the flywheel and the mission).

### 7.1 Revenue streams (layered over time)

1. **Nexora Pro (B2C subscription)** — unlimited matches, AI copilot, advanced filters, priority reminders, profile analytics. *~$5–15/mo.* Primary early revenue.
2. **Provider listings (B2B)** — universities, foundations, accelerators, governments pay to feature/verify/target opportunities to qualified candidates. *High margin, scales with index.*
3. **Recruiting / talent marketplace** — connect providers with high-intent, qualified applicants (opt-in). Large TAM later.
4. **API / data licensing** — structured opportunity feed to ed-tech, universities, career platforms.
5. **Affiliate / credits** — software/cloud credit giveaways and partner programs.

### 7.2 Why this is venture-scale

- TAM = everyone seeking funding/opportunity globally (students + founders + researchers + professionals = hundreds of millions).
- Multiple revenue layers (consumer subscription + B2B SaaS + marketplace + data).
- Strong network effects + low marginal cost = software economics.

---

## 8. The Roadmap (Start → Billion)

### Phase 1 — Foundation (Now: 0→1)
- Finish auth (wire Login/Signup/ForgotPassword, build onboarding).
- Ship core app: Dashboard, Opportunities Explorer, Opportunity Detail, Application Tracker.
- Get the discovery scraper producing clean, de-duplicated, categorized data for **one wedge category**.
- **Goal:** a single user can discover → track → apply end-to-end. Founder uses it daily.

### Phase 2 — Product-Market Fit (1→10)
- Personalized matching + reminders that create daily habit.
- AI copilot for drafting (the win-rate multiplier).
- Public SEO opportunity pages.
- Seed first 1,000 real users in the wedge community.
- **Goal:** retention curve flattens; users say "I'd be sad if this disappeared." Measure WAU, win stories.

### Phase 3 — Growth (10→100)
- Programmatic SEO at scale; viral share/referral loops.
- Community layer live (stories, Q&A, mentors, tips) → trust flywheel.
- Launch Nexora Pro. First revenue.
- Expand to 2–3 adjacent categories.
- **Goal:** organic growth dominates paid; CAC < LTV proven.

### Phase 4 — Monetization & Moat (100→1000)
- Provider/B2B listings — onboard universities, foundations, accelerators.
- Win/loss outcome data improves matching → measurable win-rate lift.
- Mobile app for habit + notifications.
- **Goal:** two-sided marketplace turning; multiple revenue streams live.

### Phase 5 — Category Dominance (Billion)
- Every opportunity category covered globally.
- API/data licensing; talent marketplace.
- "Nexora" = the verb for finding opportunity.
- **Goal:** the default global opportunity index. Winner-take-most.

---

## 9. Metrics That Matter

**North Star:** **Opportunities Won via Nexora** (real outcomes, not vanity).

| Layer | Metric |
|---|---|
| Discovery health | # fresh opportunities, freshness lag, de-dup accuracy, category coverage |
| Engagement | WAU/MAU, applications tracked, reminder open rate |
| Outcome | applications submitted, **wins reported**, win rate lift vs. baseline |
| Growth | organic traffic, viral coefficient (K), referral rate |
| Business | Pro conversion %, MRR, CAC, LTV, provider count |
| Retention | D1/D7/D30, cohort retention curve (must flatten) |

---

## 10. Team & Hiring (in order of need)

1. **Founder (you)** — product + full-stack + vision. Stay in the build until PMF.
2. **First eng hire** — data/scraping/AI pipeline (the moat is data quality).
3. **Growth/community lead** — owns the wedge community + SEO.
4. **Second full-stack** — ship velocity on the app.
5. **Then:** design, B2B/provider sales, content.

> Stay small and founder-led through PMF. Hire only to remove the bottleneck that's actually blocking growth.

---

## 11. Risks & Mitigations

| Risk | Mitigation |
|---|---|
| Scraping fragility / legal | Prefer official feeds/APIs, provider partnerships, robots-respecting crawl; diversify sources |
| Data quality / spam | AI + human-in-loop verification; community flagging; freshness scoring |
| Cold-start (no users/data) | Found in one dense community; seed index manually for the wedge |
| Incumbents (Google, aggregators) | Win on structure + workflow + community + trust — things horizontal search won't do |
| Monetization too early | Keep discovery free; monetize workflow + supply, never gate the mission |
| Founder burnout / scope | Phase discipline; one wedge at a time; ruthless focus |

---

## 12. Founder Principles

1. **Discovery stays free.** The mission is access. Monetize value-add, never the index.
2. **One wedge at a time.** Dominate a niche before expanding. Focus is the strategy.
3. **Outcomes over vanity.** Optimize for opportunities *won*, not signups.
4. **Data quality is the product.** Clean > comprehensive > raw. The index is the moat.
5. **Trust is the brand.** In a spam world, being trustworthy is the unfair advantage.
6. **Ship daily, use daily.** The founder is user #1. Dogfood relentlessly.
7. **Talent is everywhere; access is not.** Every decision should widen access.

---

## 13. The 90-Day Plan (Concrete Next Steps)

**Days 1–30 — Make it real (single-player loop)**
- Wire auth routes (`Login`, `Signup`, `ForgotPassword`) into `App.jsx`; build onboarding.
- Ship Dashboard + Opportunities Explorer + Detail + Application Tracker.
- Scraper outputs clean, categorized data for the wedge (e.g. scholarships).

**Days 31–60 — Make it sticky (matching + habit)**
- Personalized matches on Dashboard; reminders that drive return visits.
- AI draft copilot v1.
- Public SEO opportunity pages live.

**Days 61–90 — Make it spread (first 1,000 users)**
- Seed the wedge community; collect first **win stories**.
- Launch share cards + referral.
- Measure D7/D30 retention; iterate toward "can't live without it."

> **Definition of done for "started":** a real user, in the wedge, can discover → track → apply → report a win, entirely inside Nexora. Everything else is scale.

---

*"The best way to predict the future is to build it — and the best way to build it is to ship one wedge, win one user, and let the flywheel turn."*
