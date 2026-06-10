# Nexora Home Page — Feature Specification

This document covers features for both the **Pre-Login (Guest)** and **Post-Login (Authenticated)** home page experience. The core of the home page is a **smart search bar + filters + global opportunity feed**.

---

## 🏠 Core Home Page Architecture

```
┌─────────────────────────────────────────────────────┐
│  NAVBAR (Logo | Search | Filters | Profile/Login)   │
├─────────────────────────────────────────────────────┤
│  SMART SEARCH BAR  (full-width, prominent)          │
├─────────────────────────────────────────────────────┤
│  FILTER STRIP  (Category | Country | Deadline | ... │
├─────────────────────────────────────────────────────┤
│                                                     │
│   OPPORTUNITY FEED / GRID                           │
│   (Cards with match score, tags, deadline, etc.)    │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

## 🔓 PRE-LOGIN HOME PAGE (Guest / Public View)

### 1. Smart Search Bar (Hero)
- Large, centered, full-width search bar — the #1 element on the page
- Placeholder cycles through: *"Search scholarships..."* → *"Find AI research grants..."* → *"Explore accelerators in Europe..."*
- **Trending suggestions dropdown** shows below on focus: "AI Research · Gates Cambridge · Y Combinator · NASA Intern"
- **Category quick-filters** appear inline as pills below the search: 🎓 Scholarships · 🔬 Research · 🚀 Accelerators · 💰 Grants · 🏆 Competitions
- Search results appear without login (limited preview — full details require signup)

---

### 2. Filter Strip (Public)
A horizontal scrollable row of filter dropdowns:
| Filter | Options |
|--------|---------|
| **Category** | Scholarship, Grant, Fellowship, Research, Accelerator, Competition, Internship |
| **Country** | India, USA, UK, Germany, Singapore, Canada, Global/Remote |
| **Deadline** | This week, This month, Next 3 months, Open rolling |
| **Funding** | Fully Funded, Partially Funded, Stipend, Prize Money |
| **Eligibility** | Undergraduate, Postgraduate, PhD, Early Career, Open to All |
| **Field** | Computer Science, Life Sciences, Business, Engineering, Arts |

---

### 3. Public Opportunity Feed (Grid / List)
- Default view: **Grid of cards** (3 columns desktop, 2 tablet, 1 mobile)
- Each card shows:
  - Category badge (color-coded)
  - Opportunity title (bold)
  - Organization name + country flag
  - Deadline (with "Closes in X days" urgency if < 14 days)
  - Funding type tag
  - "View Details" button (triggers login/signup prompt for full info)
- Toggle between **Grid view** and **List view**
- **Sort by:** Newest · Deadline · Most Popular · Most Relevant (requires login for relevance)

---

### 4. Trending / Featured Section
- Above the main feed: a highlighted row of **"Featured This Week"** opportunities
- Curated by the Nexora team or by popularity/deadline urgency
- Displayed as horizontal scrolling cards (like the ticker on the landing page)
- "Trending in India", "Hot in AI/ML", "Closing Soon" sub-sections

---

### 5. AI Teaser (Upsell to Login)
- A blurred/frosted panel at the bottom of the feed: *"🔒 Your AI match score is hidden. Sign up to see how well you match with each opportunity."*
- Shows partial match scores (greyed out %) on cards to tease the feature
- CTA: "Unlock Your Matches — Free"

---

### 6. Category Explorer
- A visual grid of category tiles (like app icons):
  - 🎓 Scholarships · 🔬 Research · 🚀 Accelerators · 💰 Grants · 🏆 Competitions · 💼 Internships · 🌍 Global Programs · 🏥 Healthcare
- Clicking a tile filters the feed instantly

---

### 7. Country / Region Explorer
- A horizontal strip of country flags + names:
  - 🇮🇳 India · 🇺🇸 USA · 🇬🇧 UK · 🇩🇪 Germany · 🇨🇦 Canada · 🇸🇬 Singapore · 🌐 Global
- Clicking a country filters opportunities by location/eligibility

---

### 8. Guest Prompt (Soft Login Gate)
- After viewing 5–6 cards, a non-blocking prompt appears inline in the feed:
  *"You've explored 6 opportunities. Sign up to save, track, and get AI-matched results."*
- Two CTAs: "Create Free Account" · "Continue as Guest"
- Does NOT block the page — just nudges

---

---

## 🔐 POST-LOGIN HOME PAGE (Authenticated Dashboard)

### 9. Personalized AI Opportunity Feed
- The main feed is now **sorted by AI match score** based on user's profile
- Each card shows a prominent **match % badge** (e.g. "94% Match" in green)
- Feed sections:
  - 🎯 **Top Picks for You** — highest match scores
  - 🔥 **Trending in Your Field** — popular in user's domain
  - ⏰ **Closing Soon** — urgent deadlines from saved categories
  - 🌍 **New This Week** — freshly indexed opportunities
  - 🔄 **Because You Saved X** — recommendations based on saved items

---

### 10. Smart Search Bar (Personalized)
- Search is now context-aware — understands the user's profile
- Searching "AI research" shows results filtered by user's background (e.g. undergraduate CS, India)
- **Voice search button** (microphone icon) for hands-free querying
- **Search history** dropdown shows recent searches
- **Semantic search** — understands intent, not just keywords: "funded PhD in Europe" returns relevant results even without exact keyword match

---

### 11. Advanced Filter Panel (Sidebar or Dropdown)
Expanded filter options for logged-in users:
| Filter | Options |
|--------|---------|
| **Match Score** | 90%+, 80%+, 70%+, Show All |
| **Application Status** | Not Applied, Saved, Applied, Interview, Accepted |
| **Saved by Me** | Toggle to show only bookmarked |
| **Recommended by AI** | Toggle to show only AI picks |
| **Program Duration** | 1–3 months, 3–6 months, 6–12 months, Ongoing |
| **Language** | English, German, French, Spanish |
| **Application Complexity** | Easy (1-step), Medium, Competitive |

---

### 12. Quick Stats Bar (Personal Dashboard Strip)
A slim horizontal bar below the search showing the user's snapshot:
```
📋 Saved: 12   ✉️ Applied: 4   🗓 Interviews: 1   🏆 Accepted: 1   ⏰ Due This Week: 2
```
Clicking any stat jumps to the relevant filtered view.

---

### 13. Deadline Alert Strip
- A dismissable yellow/amber banner when deadlines are near:
  *"⚠️ 2 opportunities you saved close in the next 48 hours!"*
- Lists them inline with quick "Apply Now" buttons
- Can be set as a daily email/push notification preference

---

### 14. AI Copilot Sidebar (Collapsible)
- A slide-out panel from the right: **"Ask your AI Copilot"**
- Chat interface: user types *"Find me funded research in biotech under 6 months"*
- AI responds with filtered results inline + can save/apply directly from the chat
- Remembers conversation context within the session

---

### 15. Saved Opportunities Panel (Quick Access)
- A collapsible left sidebar or top tab: **"My Library"**
- Tabs: Saved · Applied · In Progress · Accepted · Rejected
- Drag-and-drop to move between stages (like a mini Kanban)
- Each item shows: title, deadline countdown, next action reminder

---

### 16. Application Progress Tracker (Inline)
- On cards the user has already interacted with, show a status badge:
  - 📌 Saved
  - ✉️ Applied (shows date applied)
  - 🗓 Interview Scheduled (with date)
  - ✅ Accepted
  - ❌ Rejected (with option to "Try Similar")
- "Continue Application" button if the user started and paused

---

### 17. Global Opportunity Map (Toggle View)
- A **map view** toggle (alongside grid/list): shows opportunities plotted on an interactive world map
- Clicking a pin shows a card popup for that opportunity
- Heatmap overlay shows density by region
- Filter by category changes which pins appear

---

### 18. Daily Digest Card
- At the top of the feed (dismissable): *"Good morning, Alok 👋 — Here are today's top 5 picks for you"*
- Compact horizontal scroll of 5 cards
- Updates daily at a set time
- Option to set preferred digest time in settings

---

### 19. Recent Activity Feed
- A small sidebar or bottom section showing recent actions:
  - *"You saved Google Research Fellowship — 2h ago"*
  - *"New match: NASA Internship — 92% match"*
  - *"Deadline reminder: MIT Grant closes in 3 days"*
- Keeps user informed without them needing to check manually

---

### 20. Quick Apply (One-Click)
- For opportunities with simple applications (link-based): a **"Quick Apply"** button
- Opens a side panel with the opportunity details + direct apply link without leaving the page
- Logs the application automatically to the tracker

---

### 21. Profile Completion Nudge
- If profile is < 80% complete, show an inline card: *"Complete your profile to improve your match accuracy by 40%"*
- Progress bar showing completion %
- Links directly to the fields that need filling

---

### 22. Notification Bell (Top Nav)
- Bell icon in navbar with badge count
- Dropdown shows:
  - New matches found
  - Deadline reminders
  - Application status updates (if integrated)
  - Weekly digest summary

---

## 🎨 Shared UI Components (Both Views)

### Opportunity Card (Standard)
```
┌──────────────────────────────────────┐
│ [Category Badge]        [Match %]    │
│                                      │
│  Opportunity Title (bold, 2 lines)   │
│  Organization · Country Flag · City  │
│                                      │
│  💰 Funding Type   📅 Deadline       │
│                                      │
│  [Save ♡]  [Share]  [View Details →] │
└──────────────────────────────────────┘
```

### Opportunity Card (Compact / List View)
```
[Badge] Title — Org · Country · Deadline · Match% — [Save] [Apply →]
```

---

## 📱 Mobile Considerations
- Search bar full-width, pinned to top on scroll
- Filters collapse into a "Filters" button → bottom sheet drawer
- Cards single column, swipeable left to save / right to dismiss (Tinder-style)
- Bottom tab bar: Home · Search · Saved · Copilot · Profile

---

## 🔮 Future / Advanced Features
- **Browser Extension** — highlights Nexora-indexed opportunities on university and grant websites
- **Email Digest** — weekly personalized PDF/email of top matches
- **Collaborative Lists** — share a curated list of opportunities with a friend/mentor
- **Mentor Connect** — match with alumni who got accepted to similar programs
- **Application Essay AI** — paste your draft, get AI feedback based on the opportunity's requirements
- **Deadline Calendar Sync** — one-click export saved deadlines to Google/Apple Calendar

---

*Document created: June 2026 | Nexora — Home Page Feature Specification*

---

---

## 👤 PROFILE-DRIVEN ENGAGEMENT & GAMIFICATION FEATURES

> These features revolve around the user's profile completeness and quality. The more complete and accurate the profile, the better the AI match scores. These nudges and rewards motivate users to keep their profile updated and stay engaged with the platform.

---

### P1. Profile Health Score (Prominent Card on Dashboard)
**The core feature — always visible after login.**

```
┌─────────────────────────────────────────────────┐
│  👤 Your Profile Health                         │
│                                                 │
│  ████████████░░░░  72% Complete                 │
│                                                 │
│  🎯 Match Accuracy:  HIGH (72%)                 │
│  📈 Complete to 90% → unlock 3x more matches   │
│                                                 │
│  Missing:  🔴 Research Interests                │
│            🟡 Academic Transcripts              │
│            🟡 Skills & Technologies             │
│                                                 │
│  [Complete Profile →]                           │
└─────────────────────────────────────────────────┘
```

- Circular or linear progress bar with % displayed prominently
- Color coded: 0–40% Red · 41–70% Amber · 71–90% Green · 91–100% Teal/Gold
- Shows **exact fields missing** with priority tags (Required / Recommended / Optional)
- Impact label: *"Adding your Research Interests will improve match accuracy by +18%"*
- Clicking any missing field opens that section of the profile editor directly

---

### P2. Onboarding Checklist (First 7 Days)
**For new users — a step-by-step checklist shown on the home dashboard.**

```
🚀 Get Started with Nexora  ░░░░░░░░ 3/7 completed

✅ Create your account
✅ Set your field of study
✅ Add your country
☐  Add your academic level        [Do it →]
☐  Add 3+ research interests      [Do it →]
☐  Save your first opportunity    [Explore →]
☐  Try the AI Copilot             [Chat →]
```

- Each completed step shows a green checkmark with a subtle animation
- Uncompleted steps show a CTA button
- Completing all 7 steps unlocks a badge: **"Nexora Pioneer 🚀"**
- Disappears after 100% completion (or after 30 days, whichever first)
- Progress is saved and persists across sessions

---

### P3. Match Score Impact Indicator (Per Missing Field)
**Shows the user the direct impact of completing each profile field.**

- On the profile edit page, each empty field shows:
  - *"+12% match accuracy"* badge next to the field label
  - Fields sorted by impact (highest impact shown first)
- Example breakdown:
  | Field | Impact on Match Accuracy |
  |-------|--------------------------|
  | Research Interests | +18% |
  | GPA / Academic Score | +12% |
  | Skills & Technologies | +10% |
  | Publications / Projects | +8% |
  | Country of Citizenship | +6% |
  | Preferred Program Duration | +4% |
  | Language Proficiency | +3% |

---

### P4. Profile Strength by Category
**Shows how strong the profile is specifically for each opportunity type.**

```
Your Profile Strength by Category:

🎓 Scholarships     ████████░░  80%  Strong
🔬 Research         █████░░░░░  52%  Needs Work  [Improve →]
🚀 Accelerators     ███░░░░░░░  34%  Weak        [Improve →]
💰 Grants           ██████░░░░  63%  Good
🏆 Competitions     ███████░░░  72%  Strong
```

- Helps users understand which areas they qualify for and which need improvement
- Clicking "Improve →" shows exactly which fields to fill for that category
- Updates in real-time as the user edits their profile

---

### P5. XP Points & Level System (Gamification)
**Makes profile completion and platform usage rewarding.**

**XP is earned by:**
- Completing profile fields (5–20 XP each based on impact)
- Saving an opportunity (2 XP)
- Applying to an opportunity (10 XP)
- Logging an interview (15 XP)
- Getting accepted (50 XP)
- Daily login streak (5 XP/day)
- Sharing an opportunity (3 XP)

**Levels:**
| Level | XP Required | Title |
|-------|-------------|-------|
| 1 | 0 | Explorer |
| 2 | 50 | Seeker |
| 3 | 150 | Discoverer |
| 4 | 350 | Trailblazer |
| 5 | 700 | Achiever |
| 6 | 1200 | Pioneer |
| 7 | 2000 | Nexora Elite |

**UI:** Small XP bar in the top nav or profile card. Level badge next to username.

---

### P6. Achievement Badges
**Visual rewards displayed on the user's profile.**

| Badge | Trigger |
|-------|---------|
| 🚀 First Steps | Complete onboarding checklist |
| 💯 Perfect Profile | Reach 100% profile completion |
| 🔍 Power Searcher | Perform 50+ searches |
| 📌 Super Saver | Save 25+ opportunities |
| ✉️ Go-Getter | Apply to 10+ opportunities |
| 🏆 Acceptance | Log first accepted offer |
| 🔥 On Fire | 7-day login streak |
| 🌍 Global Thinker | Save opportunities from 5+ countries |
| 🤖 Copilot Fan | Use AI Copilot 10+ times |
| 🧩 Category Explorer | Save from 5+ different categories |

- Badges displayed on profile page in a grid
- Locked badges shown greyed out with progress: *"Apply to 3 more to unlock"*
- Special animated badge reveal when earned (confetti or glow effect)

---

### P7. Daily Login Streak Tracker
**Encourages daily engagement.**

```
🔥 7-Day Streak!

Mon ✅  Tue ✅  Wed ✅  Thu ✅  Fri ✅  Sat ✅  Sun ✅

Keep it up! Login tomorrow to earn Streak Shield 🛡️
```

- Streak counter shown prominently on dashboard
- Streak breaks if user misses a day (unless they have a "Streak Shield" power-up)
- Streak milestones: 7 days → badge, 30 days → special badge + bonus XP, 100 days → Elite status

---

### P8. Weekly Profile Report Card
**Sent every Monday morning — also visible on dashboard.**

```
📊 Your Week in Review — June 9, 2026

Opportunities Explored:    24  (+8 from last week)
Saved:                      5
Applied:                    2  ⭐ New personal best!
AI Matches Found:          18
Profile Completeness:      72%  → Complete 2 fields to reach 80%

Top Match This Week:
🏅 Google Research Fellowship — 95% match
   Deadline: Dec 15 · [View →]

This week's tip: Add your GPA to unlock 12% more matches.
```

- Dismissable card at top of dashboard on Mondays
- Also sent as an email digest (if user opts in)
- Includes personalized improvement tip

---

### P9. AI-Powered Profile Improvement Tips
**Contextual, smart suggestions shown throughout the app.**

- After a search with few results: *"We found only 3 matches. Add your Research Interests to unlock 47 more."*
- On a high-match card: *"You're 94% matched! Add your GPA to push this to 98%."*
- After saving: *"Nice save! Complete your Skills section to find 12 similar opportunities."*
- Weekly tip card: *"Users with complete profiles get 3x more matches. You're 72% there."*

---

### P10. Peer Comparison (Anonymous Benchmarking)
**Shows how the user compares to similar peers — motivates improvement.**

```
👥 How you compare to CS undergrads in India:

Profile Completeness:    You: 72%  |  Avg: 68%  ✅ Above average
Opportunities Saved:     You: 12   |  Avg: 8    ✅ Above average
Applications Sent:       You: 2    |  Avg: 5    ⚠️ Below average

💡 Tip: Students who apply to 5+ opportunities have 3x higher acceptance rates.
```

- All data is anonymous (no individual user data shared)
- Compared to users with similar: field, academic level, and country
- Shown as a collapsible card on the dashboard, updated weekly

---

### P11. Profile Visibility Score (For Recruiters / Org Discovery)
**If organizations can discover talent on Nexora, profile visibility matters.**

```
👁️ Your Profile Visibility

Discoverable by organizations:    ✅ Yes
Profile views this month:         14
Shortlisted by:                   2 organizations

Visibility Score: 65/100
Improve by:
  → Add a profile photo        (+10 visibility)
  → Write a bio (2–3 lines)    (+15 visibility)
  → Add a LinkedIn URL         (+8 visibility)

[Edit Profile →]
```

---

### P12. "Next Best Action" Card
**Always shows the single most impactful thing the user can do right now.**

```
⚡ Your Next Best Action

Adding your Research Interests will:
  ✓ Improve match accuracy by +18%
  ✓ Unlock 47 new opportunities
  ✓ Earn you 15 XP

[Add Research Interests →]  [Remind me later]
```

- Only ONE action shown at a time (not overwhelming)
- Calculated by AI based on what has highest impact for that specific user
- Rotates to the next best action once completed
- Shows estimated time: *"Takes less than 1 minute"*

---

### P13. Profile Completion Milestones & Rewards
**Unlocks real benefits at specific completion thresholds.**

| Milestone | Benefit Unlocked |
|-----------|-----------------|
| 25% complete | Access to basic filters |
| 50% complete | AI match scores visible on cards |
| 70% complete | AI Copilot access |
| 80% complete | Priority listing in org searches |
| 90% complete | Early access to new opportunities (24h before public) |
| 100% complete | "Verified Profile" badge + 100 bonus XP |

- Each milestone triggers a celebratory toast notification
- Shown as a visual unlock roadmap on the profile page

---

### P14. Smart Profile Reminder (Contextual Prompts)
**Non-annoying reminders tied to what the user is doing.**

- User saves a scholarship → *"This scholarship requires GPA. Add yours to see how well you qualify."*
- User runs a search with no results → *"No results? Adding your Skills section could change that."*
- User views a fellowship → *"You're missing Research Interests — a key factor for fellowships."*
- User hasn't logged in for 5 days → email: *"3 new opportunities match your profile. Log in to see them."*

---

### P15. Profile Photo & Bio Nudge
**Small but high-impact profile elements often skipped.**

```
📸 Your profile is missing a photo and bio.

Profiles with a photo are:
  → 3x more likely to be discovered by organizations
  → Seen as more trustworthy by the community

[Add Photo]  [Write Bio]  [Skip for now]
```

- Shown as a non-blocking banner on first login after signup
- Reappears gently after 7 days if still empty
- Photo upload supports crop/resize in-browser

---

*Last updated: June 2026 | Nexora — Profile Engagement Feature Specification*
