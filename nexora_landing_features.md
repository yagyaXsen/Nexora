# Nexora Landing Page — Feature Backlog

A curated list of premium sections and UI features to add to the Nexora landing page in future iterations. Each item includes a description, purpose, and implementation hints.

---

## 🏆 Social Proof & Trust

### 1. Testimonials Carousel
**Purpose:** Build credibility and emotional connection with visitors.
**What it shows:** Auto-rotating quotes from real students/founders who discovered life-changing opportunities via Nexora.
**Card contents:**
- Profile photo, name, university, country flag
- Quote: *"I found my Google Research Fellowship through Nexora's AI match. I wouldn't have known it existed."*
- Opportunity they landed (e.g. "Accepted to — ETH Zurich Research Programme")
- Match score badge
**UX:** Auto-scrolls every 4s, pause on hover, dot indicators, left/right arrow controls.

---

### 2. "As Featured In" Media Strip
**Purpose:** Instant credibility from press mentions.
**What it shows:** Logos of TechCrunch, Forbes, Product Hunt, YC, MIT Review, etc. in a muted grayscale horizontal strip.
**UX:** Logos auto-scroll left infinitely (like the opportunities ticker). Hovering a logo highlights it.

---

### 3. Live Activity Feed (Social Proof Toasts)
**Purpose:** Create urgency and FOMO. Makes the platform feel alive and real.
**What it shows:** Small toast notifications that slide in from bottom-left every few seconds:
- *"Priya S. from Mumbai just matched with Google Research Fellowship 🎉"*
- *"James K. from Nairobi was accepted to Schwarzman Scholars"*
- *"142 new opportunities indexed in the last hour"*
**UX:** Auto-generates from a list, fades in/out with smooth animation, non-intrusive.

---

### 4. Success Stories Wall
**Purpose:** Deep social proof with real outcomes.
**What it shows:** Masonry grid of cards each showing:
- Person's name, photo, background
- Opportunity they won
- Short story (2–3 lines)
- "Read Story →" link
**UX:** Hover reveals the full story in an expand panel. Filter by category (Scholarship / Fellowship / Grant).

---

### 5. Impact Numbers Ticker (Live Stats)
**Purpose:** Communicate scale and momentum.
**What it shows:** Animated rolling counters:
- Opportunities indexed **today**: 1,247
- AI matches made **this week**: 48,392
- Applications submitted **via Nexora**: 12,800
**UX:** Numbers animate upward on scroll into view. Refreshes subtly every 30s to simulate live data.

---

## 🧩 Product Demos & Interactivity

### 6. Interactive Category Filter
**Purpose:** Let visitors explore what Nexora offers before signing up.
**What it shows:** Tab pills at the top — Scholarships / Grants / Accelerators / Research / Competitions / Internships. Clicking a tab filters a live grid of opportunity cards below.
**UX:** Filter transition is animated (fade + slide). Cards show match score, deadline, location.

---

### 7. Profile Builder Preview (Step Animation)
**Purpose:** Show the onboarding experience without needing to sign up.
**What it shows:** A 3-step animated walkthrough:
1. "Tell us about yourself" — fill in field (CS Student, India, Undergrad)
2. "AI scans 500K+ opportunities" — animated loading state
3. "Your personalized matches appear" — cards fly in with match scores
**UX:** Auto-plays on scroll, or user can click "Next Step" manually.

---

### 8. Deadline Countdown Cards
**Purpose:** Create urgency for high-value opportunities.
**What it shows:** 3–4 "Closing Soon" opportunity cards each with:
- Live countdown timer (Days : Hours : Minutes)
- Red urgency badge "Closes in 3 days"
- Quick apply button
**UX:** Timers tick down in real time. Cards pulse with a subtle red border when < 24h remain.

---

### 9. AI Match Score Demo (Interactive)
**Purpose:** Let visitors experience the AI matching before signing up.
**What it shows:** A mini input form: "Describe yourself in one line" → user types → AI-style match animation plays → 3 opportunity cards appear with match scores.
**UX:** Simulated AI response (typed text animation), not real API. Ends with CTA: "See your full matches — sign up free".

---

## 🌍 Data & Credibility

### 10. Country Heatmap / Global Coverage Map
**Purpose:** Demonstrate Nexora's global reach visually.
**What it shows:** SVG world map where countries light up in navy/indigo based on indexed opportunities. Hovering shows count (e.g. "India — 12,400 opportunities").
**UX:** Countries pulse/glow on load. Top 10 countries highlighted by default.

---

### 11. Opportunity Category Breakdown (Donut Chart)
**Purpose:** Show the diversity of opportunity types.
**What it shows:** Animated donut/pie chart:
- Scholarships: 34%
- Research Grants: 22%
- Accelerators: 18%
- Competitions: 14%
- Internships: 12%
**UX:** Segments animate in on scroll. Hovering a segment highlights and shows count.

---

### 12. Partner / University Logos Grid
**Purpose:** Show which organizations post on Nexora.
**What it shows:** Logo grid of Google, NASA, Oxford, MIT, CERN, Gates Foundation, Y Combinator, Techstars, etc.
**UX:** Logos displayed in a soft rounded card grid. Grayscale by default, colored on hover.

---

## 💰 Conversion Boosters

### 13. Pricing Section
**Purpose:** Convert visitors who are ready to pay.
**Plans:**
- **Free** — 10 matches/month, basic filters
- **Pro ($9/mo)** — Unlimited matches, AI Copilot, deadline alerts
- **Teams ($29/mo)** — For universities/orgs to post and manage opportunities
**UX:** Toggle between Monthly/Annual (annual shows savings). Most popular plan highlighted with navy border.

---

### 14. FAQ Accordion
**Purpose:** Remove objections and answer common questions before signup.
**Sample questions:**
- "Is Nexora free to use?"
- "How does the AI matching work?"
- "How often are opportunities updated?"
- "Can organizations post on Nexora?"
- "Is my data private?"
**UX:** Smooth expand/collapse animation. Only one open at a time. Chevron rotates on open.

---

### 15. Sticky Email Waitlist Banner
**Purpose:** Capture leads from visitors who aren't ready to sign up.
**What it shows:** A slim sticky bar at the bottom of the page: *"🚀 Join 2,400 people on the early access waitlist"* + email input + "Join Waitlist" button.
**UX:** Slides up from bottom on first scroll. Can be dismissed. Persists across scroll.

---

### 16. Exit Intent Popup
**Purpose:** Recover visitors about to leave.
**What it shows:** Modal triggered on mouse-leave: "Wait — before you go. See your AI-matched opportunities in 30 seconds." + "Try for Free" CTA.
**UX:** Only shows once per session. Smooth fade in. Easy dismiss.

---

## ✨ Premium UX Touches

### 17. Floating Notification Bubbles in Hero
**Purpose:** Make the hero feel live and dynamic.
**What it shows:** Small pill-shaped bubbles that float up and fade away in the hero background:
- *"✓ Anjali matched with Gates Cambridge"*
- *"🆕 14 new fellowships added"*
- *"⏰ MIT deadline in 2 days"*
**UX:** Random positions, different delays, subtle floating animation. Don't block content.

---

### 18. Scroll Progress Indicator
**Purpose:** Premium UX touch, helps users track where they are on a long page.
**What it shows:** A thin 2px navy line at the very top of the viewport that grows from 0% to 100% as the user scrolls down.
**UX:** Pure CSS, no JS needed. Color: `#0D0D10`.

---

### 19. Category Pills Scroll Row
**Purpose:** Quick visual navigation of opportunity types above the ticker.
**What it shows:** A horizontally scrollable row of pill buttons:
- 🎓 Scholarships · 🔬 Research · 💼 Internships · 🚀 Accelerators · 🏆 Competitions · 💰 Grants · 🌍 Global · 🇮🇳 India
**UX:** Clicking a pill filters the ticker below. Active pill has navy bg + white text.

---

### 20. Dark Mode Toggle
**Purpose:** Modern UX expectation. Also showcases the dark navy theme more dramatically.
**What it shows:** Sun/moon icon in the navbar. Toggles the entire page between light (current) and dark (navy `#0D0D10` everywhere) mode.
**UX:** Smooth CSS transition on all colors. Preference saved in localStorage.

---

### 21. "Back to Top" Floating Button
**Purpose:** Convenience on a long landing page.
**What it shows:** A small rounded button (↑) fixed bottom-right that appears after scrolling 400px.
**UX:** Smooth scroll to top on click. Fades in/out. Uses the dark navy color.

---

### 22. Keyboard Shortcut Hint
**Purpose:** Delights power users and feels premium.
**What it shows:** A small badge in the search bar showing `⌘K` — pressing it focuses the search and shows recent searches.
**UX:** Keyboard listener activates search focus on Cmd+K / Ctrl+K.

---

## 📊 Analytics & Personalization

### 23. Geo-Personalized Hero Text
**Purpose:** Make each visitor feel the product is made for them.
**What it shows:** Detects visitor country via IP, dynamically shows: *"Discover 12,400 opportunities available in India"*
**UX:** Fallback to generic text if geo fails. Subtle, not intrusive.

---

### 24. "Recently Viewed" Cookie Strip
**Purpose:** Re-engage returning visitors.
**What it shows:** A small strip at the top (below nav) for returning users: *"Welcome back! 3 new matches since your last visit."* with a CTA.
**UX:** Only shown if a cookie/localStorage flag exists from a previous visit.

---

*Document created: June 2026 | Nexora Landing Page Feature Backlog*
