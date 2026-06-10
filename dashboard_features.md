# Nexora — Student Dashboard Feature Specification
### *The Personal Performance Hub*

> **Purpose:** Help students understand where they stand, track their progress,
> improve their profile, and manage their applications.
> This page is about **YOU** — personal, private, performance-focused.

---

## Page Layout

```
┌──────────────────────────────────────────────────────────────────┐
│  NAVBAR  [☆ Nexora]  [Home] [Dashboard] [Saved] [🔔] [Avatar]  │
├────────────────┬─────────────────────────────────────────────────┤
│                │                                                  │
│  LEFT SIDEBAR  │  MAIN CONTENT AREA                              │
│                │                                                  │
│  📊 Overview   │  👋 Good morning, Alok!                        │
│  👤 Profile    │  ──────────────────────────────────────────     │
│  📋 Pipeline   │  [D2 Profile Health]  [D3 Stats Bar]           │
│  📅 Deadlines  │  ──────────────────────────────────────────     │
│  🤖 Copilot    │  [D9 Next Best Action]                         │
│  🏆 Badges     │  ──────────────────────────────────────────     │
│  📈 Analytics  │  [D5 Application Pipeline / Kanban]            │
│  ⚙️  Settings  │  ──────────────────────────────────────────     │
│                │  [D6 Deadlines]   [D16 Activity Feed]          │
│                │  ──────────────────────────────────────────     │
│                │  [D11 XP & Level]  [D12 Badges]                │
│                │  ──────────────────────────────────────────     │
│                │  [D10 Weekly Report]  [D14 Peer Comparison]    │
│                │                                                  │
└────────────────┴─────────────────────────────────────────────────┘
```

---
---

## Dashboard Features

---

### D1. Personalized Greeting & Daily Digest
**The first thing the user sees when they open the Dashboard.**

```
👋 Good morning, Alok!

You have:
  ⏰ 2 deadlines this week
  🤖 3 new AI matches today
  📋 1 application In Progress

[See Deadlines]  [View Matches]  [Continue Application]
```

- Greeting changes: Good morning / afternoon / evening
- Dynamic summary of what needs attention today
- Dismissable — can be collapsed after reading
- Updates in real time

---

### D2. Profile Health Score Card *(Hero Feature)*
**The most important card on the dashboard — always visible.**

```
┌──────────────────────────────────────────────────┐
│  👤 Profile Health                               │
│                                                  │
│        ████████████░░░░  72% Complete            │
│                                                  │
│  🎯 Match Accuracy:  HIGH  (72%)                 │
│  📈 Reach 90% → unlock 3x more matches          │
│                                                  │
│  Missing:                                        │
│  🔴 Research Interests      [Add → +18% match]  │
│  🟡 GPA / Academic Score    [Add → +12% match]  │
│  🟡 Skills & Technologies   [Add → +10% match]  │
│                                                  │
│  [Complete My Profile →]                         │
└──────────────────────────────────────────────────┘
```

- **Color coded by completion:**
  - 0–40% → 🔴 Red (Critical)
  - 41–70% → 🟡 Amber (Needs Work)
  - 71–90% → 🟢 Green (Good)
  - 91–100% → 💎 Gold (Elite)
- Shows **exact missing fields** ranked by match score impact
- Each field shows what % it adds: *"+18% match accuracy"*
- Clicking any field opens the profile editor at that exact section
- Progress bar animates when profile is updated

---

### D3. Quick Stats Bar
**A one-line snapshot of all key numbers — always visible below the greeting.**

```
📋 Saved: 12   ✉️ Applied: 4   🗓 Interviews: 1   ✅ Accepted: 1   ⏰ Due This Week: 2
```

- Each number is clickable → jumps to that filtered view
- Numbers animate (count up) on first load
- Updates in real time as user takes actions
- "Due This Week" turns red if any are within 48 hours

---

### D4. Profile Strength by Opportunity Category
**Shows how strong the profile is for each specific opportunity type.**

```
Your Strength by Category:

🎓 Scholarships     ████████░░  80%   Strong
🔬 Research         █████░░░░░  52%   Needs Work   [Improve →]
🚀 Accelerators     ███░░░░░░░  34%   Weak         [Improve →]
💰 Grants           ██████░░░░  63%   Good
🏆 Competitions     ███████░░░  72%   Strong
💼 Internships      ████████░░  78%   Strong
```

- Separate score per opportunity type — not one generic score
- Clicking **"Improve →"** shows exactly which profile fields to fill for that category
- Bar colors match the strength: Red / Amber / Green
- Updates instantly when profile fields are edited

---

### D5. Application Pipeline (Kanban Board)
**The full visual tracker for all opportunities the user is pursuing.**

```
[  Saved  ]  →  [ Planning ]  →  [ Applied ]  →  [ Interview ]  →  [ Accepted ✅ / Rejected ❌ ]
    12               3               4                 1                   1 / 2
```

**Each card in the Kanban shows:**
- Opportunity title + organization
- Deadline countdown (red if < 7 days)
- Current status badge
- Quick actions: View · Notes · Mark Applied · Remove

**Features:**
- Drag-and-drop cards between columns
- "Add Opportunity" button to manually add any program
- Click card → opens full opportunity detail drawer
- Notes field per card (private to user)
- Color-coded urgency: 🔴 < 3 days · 🟡 < 14 days · 🟢 > 14 days
- Filter by: Category / Deadline / Match Score

---

### D6. Deadline Countdown Panel
**Shows upcoming deadlines from saved and applied opportunities.**

```
⏰ Upcoming Deadlines

🔴 MIT Bio-Innovation Grant          Closes in 2 days    [Apply Now]
🔴 ETH Zurich Research Program       Closes in 4 days    [Apply Now]
🟡 Gates Cambridge Scholarship       Closes in 9 days    [Review]
🟡 NSF Graduate Research Grant       Closes in 13 days   [Review]
🟢 Google Research Fellowship        Closes in 28 days   [View]
🟢 Chevening Scholarship             Closes in 45 days   [View]
```

- Sorted by urgency (nearest first)
- Color-coded: 🔴 < 3 days · 🟡 < 14 days · 🟢 > 14 days
- "Apply Now" opens quick-apply panel inline
- Toggle: **Saved only** / **All matched** / **Applied**
- "Set Reminder" button → sends email/push 3 days before deadline

---

### D7. AI Copilot Panel (Collapsible Sidebar / Floating Button)
**Natural language search and guidance assistant.**

```
🤖 AI Copilot

You: "Find me funded research in biotech, under 6 months, in Europe"

Copilot: Here are 8 matches for you:
  ┌─ EMBL Research Fellowship — 94% match ─ [Save] [View] ┐
  ├─ Max Planck Summer Programme — 89% match ─────────────┤
  └─ Wellcome Trust Early Career — 86% match ─────────────┘

Try: "Which of my saved opportunities am I most likely to get?"
```

- Triggered via floating button (bottom-right) or left sidebar
- Understands profile context — knows your field, level, country
- Can answer: *"What's my best opportunity right now?"*
- Can filter and save directly from the chat
- Conversation history saved within the session
- Shows suggested prompts for first-time users

---

### D8. Onboarding Checklist *(First 30 Days Only)*
**Step-by-step guide for new users — disappears once complete.**

```
🚀 Get Started with Nexora    ████░░░░  3 / 7 done

✅  Create your account
✅  Set your field of study
✅  Add your country
☐   Add your academic level           [Do it → 2 min]
☐   Add 3+ research interests         [Do it → +18% match]
☐   Save your first opportunity       [Explore Home →]
☐   Try the AI Copilot               [Chat →]
```

- Each completed step: green checkmark + subtle animation
- Uncompleted steps: direct CTA button + estimated time
- Completing all 7 → unlocks **"Nexora Pioneer 🚀"** badge + 50 XP
- Disappears after all steps done OR after 30 days
- Collapsed by default after Day 3 (expandable)

---

### D9. Next Best Action Card
**Always shows the single most impactful action the user can take right now.**

```
⚡ Your Next Best Action

Add your Research Interests to:
  ✓ Improve match accuracy by +18%
  ✓ Unlock 47 new personalized opportunities
  ✓ Earn 15 XP toward Level 4

Takes less than 1 minute.

[Do It Now →]   [Remind Me Tomorrow]
```

- Shows **ONE** action only — never overwhelming
- Calculated by AI: highest impact for this specific user right now
- Rotates to the next best action after completion
- "Remind Me Tomorrow" snoozes it for 24 hours
- Cards rotate through profile fields, application nudges, deadline alerts

---

### D10. Weekly Performance Report Card
**A personal review card shown every Monday.**

```
📊 Your Week in Review — June 9, 2026

Opportunities Explored:    24   ▲ +8 vs last week
Saved:                      5
Applied:                    2   ⭐ New personal best!
AI Matches Found:          18
Profile Health:            72%  → Add 2 fields to reach 80%

🏅 Top Match This Week:
   Google Research Fellowship — 95% match · Dec 15
   [View →]

💡 Tip of the Week:
   Adding your GPA unlocks 12% more matches this week.
```

- Appears as a dismissable card at the top of the dashboard every Monday
- Also emailed as a weekly digest (if user opts in)
- Highlights personal bests with ⭐
- Always includes one actionable tip

---

### D11. XP Points & Level Progress
**Gamification to reward engagement and profile completion.**

```
Level 3 — Discoverer 🔍
████████░░░░░░  320 / 350 XP  →  Level 4: Trailblazer

This week's XP:  +45 XP
  +20 XP  Applied to 2 opportunities
  +15 XP  Completed profile field (GPA)
  +10 XP  7-day streak bonus
```

**How XP is earned:**
| Action | XP |
|--------|----|
| Complete a profile field | 5–20 XP (based on impact) |
| Save an opportunity | 2 XP |
| Apply to an opportunity | 10 XP |
| Log an interview | 15 XP |
| Log an acceptance | 50 XP |
| Daily login | 5 XP |
| 7-day streak bonus | 25 XP |
| Share an opportunity | 3 XP |
| Use AI Copilot | 2 XP/session |

**Level Titles:**
| Level | XP | Title |
|-------|----|-------|
| 1 | 0 | Explorer |
| 2 | 50 | Seeker |
| 3 | 150 | Discoverer |
| 4 | 350 | Trailblazer |
| 5 | 700 | Achiever |
| 6 | 1,200 | Pioneer |
| 7 | 2,000 | Nexora Elite |

- XP bar shown in top nav and on the dashboard card
- Level-up triggers a celebratory animation + toast

---

### D12. Achievement Badges Wall
**Visual reward system displayed on the user's profile and dashboard.**

**Available Badges:**
| Badge | Name | Unlock Condition |
|-------|------|-----------------|
| 🚀 | First Steps | Complete all 7 onboarding steps |
| 💯 | Perfect Profile | Reach 100% profile completion |
| 🔍 | Power Searcher | Perform 50+ searches |
| 📌 | Super Saver | Save 25+ opportunities |
| ✉️ | Go-Getter | Apply to 10+ opportunities |
| 🏆 | Acceptance | Log your first accepted offer |
| 🔥 | On Fire | Achieve a 7-day login streak |
| 🌍 | Global Thinker | Save opps from 5+ different countries |
| 🤖 | Copilot Fan | Use AI Copilot 10+ times |
| 🧩 | Category Explorer | Save from 5+ different categories |
| 💎 | Elite | Reach Nexora Elite (Level 7) |

**UI:**
- Earned badges: full color with subtle glow
- Locked badges: greyed out with progress shown: *"Apply to 7 more to unlock ✉️"*
- New badge earned → animated reveal (confetti effect + toast notification)
- Badges visible on public profile too

---

### D13. Daily Login Streak Tracker
**Encourages daily engagement and rewards consistency.**

```
🔥 7-Day Streak!

Mon ✅  Tue ✅  Wed ✅  Thu ✅  Fri ✅  Sat ✅  Sun ✅

Keep it going! Log in tomorrow to earn +25 XP Streak Bonus.
```

- Streak shown as a mini weekly calendar (Mon–Sun)
- Breaks if user misses a day (unless Streak Shield is active)
- **Streak Shield** power-up: earned at Level 4 · protects against 1 missed day
- **Milestones:**
  - 7 days → 🔥 "On Fire" badge + 25 XP
  - 30 days → 🔥🔥 "Blazing" badge + 100 XP
  - 100 days → 💎 "Unstoppable" badge + 500 XP + special profile frame

---

### D14. Peer Comparison Card *(Anonymous)*
**Shows how the user compares to similar students — motivates improvement.**

```
👥 How you compare to CS Undergrads in India:

                        You      Average    Status
Profile Completeness    72%        68%      ✅ Above average
Opportunities Saved      12         8       ✅ Above average
Applications Sent         2         5       ⚠️ Below average
Match Score (avg)        81%       74%      ✅ Above average

💡 Students who apply to 5+ opportunities have 3x higher acceptance rates.
```

- **100% anonymous** — only aggregate averages, no individual data
- Compared to users with the same: field + academic level + country
- Updated every week
- Collapsible card — user can hide if they prefer

---

### D15. Profile Visibility Score
**Shows how discoverable the user is to organizations posting on Nexora.**

```
👁️ Your Profile Visibility

Discoverable by organizations:   ✅ Yes (Public)
Profile views this month:         14
Shortlisted by:                    2 organizations

Visibility Score: 65 / 100

Improve by:
  → Add a profile photo        (+10 points)
  → Write a bio (2–3 lines)    (+15 points)
  → Add LinkedIn URL           (+8 points)
  → Add GitHub / Portfolio     (+7 points)

[Edit Profile →]
```

- Toggle to make profile public/private for org discovery
- "Shortlisted" count shown only if user has opted into org discovery

---

### D16. Recent Activity Feed
**A log of everything the user has done on the platform.**

```
Today
  🔖  Saved "NASA Space Technology Internship"          2h ago
  🤖  New AI match: CERN Summer Programme — 94%        4h ago

Yesterday
  ✉️  Applied to "Microsoft Imagine Cup"               1d ago
  ⚠️  Deadline reminder: ETH Zurich closes in 8 days  1d ago

Last Week
  🏆  Earned badge: "On Fire 🔥" (7-day streak)       5d ago
  💯  Profile reached 70% — AI Copilot unlocked!       6d ago
```

- Chronological log of: saves, applications, matches, deadlines, badges, level-ups
- Filterable tabs: All · Saves · Applications · Matches · Achievements
- Clicking any item opens the relevant opportunity or profile section

---

### D17. Saved Opportunities Library
**Full management view of all saved opportunities.**

```
Tabs: [All Saved (12)] [Applied (4)] [In Progress (2)] [Accepted (1)] [Rejected (2)]
```

- Each tab shows a list/grid of opportunities
- **Sort by:** Date Saved · Deadline (nearest first) · Match Score
- **Bulk actions:** Mark as Applied · Remove · Export
- Each item shows: title, org, deadline countdown, match %, notes icon
- Notes field: private personal notes per opportunity (e.g. *"need 2 references"*)
- "Try Similar" button on rejected items → finds similar opportunities

---

### D18. Match Score Impact per Profile Field *(Profile Page)*
**Shown on the profile edit page to motivate completion.**

```
Your Profile Fields — Sorted by Match Impact:

Field                      Impact     Status
──────────────────────────────────────────────
Research Interests          +18%      ❌ Missing    [Add →]
GPA / Academic Score        +12%      ❌ Missing    [Add →]
Skills & Technologies       +10%      ⚠️ Partial    [Complete →]
Language Proficiency         +6%      ✅ Done
Country of Citizenship       +6%      ✅ Done
Publications / Projects      +8%      ❌ Missing    [Add →]
Preferred Duration           +4%      ✅ Done
Profile Photo                +3%      ❌ Missing    [Add →]
```

- Always sorted by highest impact first
- Status icons: ❌ Missing · ⚠️ Incomplete · ✅ Complete
- Estimated time shown: *"Takes ~1 minute"*

---

### D19. Profile Completion Milestones Roadmap *(Profile Page)*
**A visual unlock roadmap showing benefits at each % threshold.**

```
Profile Completion Roadmap:

25%  ✅  Basic filters and search unlocked
50%  ✅  AI match scores visible on all cards
70%  ✅  AI Copilot access unlocked  ← YOU ARE HERE
80%  ░░  Priority listing in organization searches
90%  ░░  Early access to new opportunities (24h before public)
100% ░░  "Verified Profile" badge + 100 bonus XP
```

- Visual progress path with locked/unlocked states
- Each milestone triggers a toast celebration on reaching it
- Clicking a locked milestone shows what to do to reach it

---

### D20. Profile Photo & Bio Nudge
**Gentle reminder for the most commonly skipped profile elements.**

```
📸 Your profile is missing a photo and bio.

Profiles with a photo and bio are:
  → 3x more discoverable by organizations
  → More likely to be shortlisted
  → Seen as more credible by the community

[Add Photo]   [Write Bio]   [Skip for now]
```

- Shown as a soft banner after first login
- Reappears after 7 days if still missing (not spammy)
- Photo upload: in-browser crop and resize
- Bio: max 160 characters, character counter shown

---
---

## 🔔 Notification System (Bell Icon — Top Nav)

```
🔔 (3)  Notifications

Today
  🤖  3 new AI matches found for your profile
  ⏰  MIT Grant closes in 2 days — you haven't applied yet
  🏆  You earned a new badge: "Power Searcher 🔍"

Earlier
  📊  Your weekly report is ready — June 2, 2026
  ✨  12 new opportunities added in Computer Science
```

- Bell icon shows unread count badge
- Dropdown with chronological notifications
- Categories: Matches · Deadlines · Badges · Reports · System
- Filter/mute by category in notification settings
- "Mark all as read" button

---

## 📱 Mobile Dashboard UX
- Left sidebar collapses → hamburger menu
- Quick stats bar becomes a horizontal scroll row
- Kanban board: single column, swipeable between stages
- Badges: horizontal scroll strip
- Bottom tab bar: 🏠 Home · 📊 Dashboard · 📌 Saved · 🤖 Copilot · 👤 Profile

---

*Document created: June 2026 | Nexora — Student Dashboard Features*
