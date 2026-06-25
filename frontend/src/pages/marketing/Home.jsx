import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'

/* ─────────────────────────────────────────────
   Nexora — Landing / Home
   The original consolidated landing page. Keeps its bespoke,
   self-contained chrome (fixed nav + rich footer) and styles
   (single injected <style> block). Auth CTAs are wired to real
   router destinations; in-page anchors still scroll the page.
───────────────────────────────────────────── */

/* ─────────────────────────────────────────────
   DATA
───────────────────────────────────────────── */
const OPPORTUNITIES = [
  {
    category: 'Research', match: 99,
    title: 'Schwarzman Scholars at Tsinghua',
    desc: "A fully-funded one-year Master's degree and leadership program in Beijing.",
    location: 'Beijing, China', deadline: '4 Days Left',
    cta: 'Quick Apply', ctaStyle: 'dark',
  },
  {
    category: 'Startups', match: 96,
    title: 'Techstars New York City',
    desc: 'Three-month accelerator for high-growth startups with $120k funding.',
    location: 'New York, USA', deadline: '12 Days Left',
    cta: 'View Details', ctaStyle: 'outline',
  },
  {
    category: 'Arts', match: 91,
    title: 'Fulbright Arts Grant',
    desc: 'Funding for artists to pursue independent study and research abroad.',
    location: 'Global', deadline: '3 Weeks Left',
    cta: 'Apply via Nexora', ctaStyle: 'dark',
  },
]

const TESTIMONIALS = [
  {
    quote: '"The match scores are scarily accurate. Nexora understands my ambitions better than I do sometimes. It saved me weeks of manual searching across fragmented university portals."',
    name: 'Marcus Thorne', title: 'YC S23 Founder · JSA', initials: 'MT',
  },
  {
    quote: '"I never thought a student from Lagos could access these specialised research grants so easily. The platform handles the complexity for you."',
    name: 'Adebayo Okafor', title: "Master's Candidate · Nigeria", initials: 'AO',
  },
  {
    quote: '"The deadline tracker is an absolute lifesaver. It\'s like having a personal agent that whispers in your ear when a life-changing door is closing."',
    name: 'Elena Rodriguez', title: 'Artist-Grantee · Spain', initials: 'ER',
  },
]

const STATS = [
  { value: '100K+', label: 'Active Users',    sub: 'Verified Talent',    bg: 'light'  },
  { value: '500K+', label: 'Opportunities',   sub: 'Daily Discoveries',  bg: 'maroon' },
  { value: '190+',  label: 'Countries',       sub: 'Global Coverage',    bg: 'dark'   },
  { value: '$10B+', label: 'Capital Tracked', sub: 'Annual Funding',     bg: 'yellow' },
]

const CHART_CATS = [
  { label: 'Scholarships',    pct: 45, color: '#3d1020' },
  { label: 'Accelerators',    pct: 30, color: '#888'    },
  { label: 'Research Grants', pct: 25, color: '#ccc'    },
]

const HOW_STEPS = [
  {
    num: '01', side: 'left',
    title: 'Personalized Profile',
    desc: "Define your identity, academic background, and future goals in simple terms. Nexora's AI builds a multidimensional profile of your potential.",
    visual: 'photo',
  },
  {
    num: '02', side: 'right',
    title: 'AI Discovery',
    desc: 'Our engine crawls 50,000+ sources including "hidden" opportunities that never reach major search engines, filtered specifically for your profile.',
    visual: 'scan',
  },
  {
    num: '03', side: 'left',
    title: 'Automated Success',
    desc: 'Track deadlines, manage documents, and use our AI Copilot to refine your application essays for maximum matching probability.',
    visual: 'tracker',
  },
]

const NAV_COLS = {
  Platform:  ['Opportunities', 'AI Match Engine', 'CRM Tracker', 'Copilot Assistant'],
  Resources: ['Success Stories', 'Writing Guides', 'Help Center', 'API Docs'],
  Company:   ['About Us', 'Careers', 'Contact', 'Privacy'],
}

/* ─────────────────────────────────────────────
   STYLES  (single <style> block)
───────────────────────────────────────────── */
const CSS = `
/* ── Reset & Tokens ── */
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
html { scroll-behavior: smooth; }
body {
  font-family: 'Inter', system-ui, sans-serif;
  background: #f5f0e8;
  color: #1a1a1a;
  line-height: 1.6;
  -webkit-font-smoothing: antialiased;
}
img { display: block; max-width: 100%; }
a { text-decoration: none; color: inherit; }
button { cursor: pointer; font-family: inherit; border: none; outline: none; }

:root {
  --cream:        #f5f0e8;
  --cream-light:  #faf7f2;
  --yellow-pale:  #f5f2bc;
  --maroon:       #3d1020;
  --maroon-mid:   #5a1a30;
  --rust:         #8b3a3a;
  --dark:         #111111;
  --white:        #ffffff;
  --grey-light:   #f0ece4;
  --grey-text:    #888888;
  --grey-border:  #ddd8d0;
  --text-muted:   #666666;
  --ff-serif:     'Playfair Display', Georgia, serif;
  --radius-sm:    8px;
  --radius-md:    16px;
  --radius-lg:    24px;
  --radius-xl:    32px;
}

.lp-container {
  width: 100%; max-width: 1200px;
  margin: 0 auto; padding: 0 32px;
}

.lp-label {
  font-size: 11px; font-weight: 600;
  letter-spacing: .12em; text-transform: uppercase;
  color: var(--grey-text);
}
.lp-label--rust  { color: var(--rust); }
.lp-label--light { color: rgba(255,255,255,.45); }

/* ─── Scrollbar ─── */
::-webkit-scrollbar { width: 6px; }
::-webkit-scrollbar-track { background: var(--cream); }
::-webkit-scrollbar-thumb { background: var(--grey-border); border-radius: 3px; }

/* ══════════════════════════════════════════
   NAVBAR
══════════════════════════════════════════ */
.nav {
  position: fixed; top: 0; left: 0; right: 0; z-index: 1000;
  padding: 18px 0;
  transition: background .3s, box-shadow .3s;
}
.nav--scrolled {
  background: rgba(245,240,232,.96);
  backdrop-filter: blur(12px);
  box-shadow: 0 1px 0 var(--grey-border);
}
.nav__inner {
  display: flex; align-items: center;
  justify-content: space-between; gap: 24px;
}
.nav__logo {
  display: flex; align-items: center; gap: 8px;
}
.nav__logo-icon {
  width: 32px; height: 32px;
  background: var(--dark); color: var(--white);
  border-radius: 8px;
  display: inline-flex; align-items: center; justify-content: center;
  font-size: 16px;
}
.nav__logo-text {
  font-size: 18px; font-weight: 700;
  color: #1a1a1a; letter-spacing: -.02em;
}
.nav__links { display: flex; align-items: center; gap: 36px; }
.nav__links a {
  font-size: 14px; font-weight: 500;
  color: #1a1a1a; transition: opacity .2s;
}
.nav__links a:hover { opacity: .6; }
.nav__actions { display: flex; align-items: center; gap: 16px; }
.nav__login {
  font-size: 14px; font-weight: 500;
  color: #1a1a1a; transition: opacity .2s;
}
.nav__login:hover { opacity: .6; }
.nav__cta {
  display: inline-flex; align-items: center;
  padding: 10px 20px;
  background: var(--maroon); color: var(--white);
  border-radius: 100px;
  font-size: 14px; font-weight: 600;
  transition: background .2s, transform .15s;
}
.nav__cta:hover { background: var(--maroon-mid); transform: translateY(-1px); }

/* ══════════════════════════════════════════
   HERO
══════════════════════════════════════════ */
.hero {
  padding: 140px 0 80px;
  background: var(--cream);
  overflow: hidden;
}
.hero__inner {
  display: grid; grid-template-columns: 1fr 1fr;
  gap: 64px; align-items: center;
}
.hero__badge {
  display: inline-flex; align-items: center; gap: 8px;
  padding: 8px 16px;
  background: var(--white); border: 1px solid var(--grey-border);
  border-radius: 100px;
  font-size: 11px; font-weight: 600;
  letter-spacing: .08em; text-transform: uppercase;
  color: #1a1a1a; margin-bottom: 32px;
}
.hero__badge-dot { color: var(--rust); font-size: 10px; }
.hero__headline {
  font-family: var(--ff-serif);
  font-size: clamp(52px,5.5vw,72px);
  font-weight: 700; line-height: 1.05;
  color: #1a1a1a; letter-spacing: -.02em;
  margin-bottom: 24px;
}
.hero__italic { font-style: italic; color: var(--rust); font-weight: 500; }
.hero__subtext {
  font-size: 16px; line-height: 1.7;
  color: var(--text-muted); max-width: 420px;
  margin-bottom: 36px;
}
.hero__cta {
  display: inline-flex; align-items: center; gap: 8px;
  padding: 14px 28px;
  background: var(--dark); color: var(--white);
  border-radius: 100px;
  font-size: 15px; font-weight: 600;
  transition: background .2s, transform .15s;
  margin-bottom: 32px;
}
.hero__cta:hover { background: #333; transform: translateY(-2px); }
.hero__social-proof {
  display: flex; align-items: center; gap: 12px;
  margin-bottom: 20px;
}
.hero__avatars { display: flex; }
.hero__avatar {
  display: inline-block;
  width: 30px; height: 30px; border-radius: 50%;
  border: 2px solid var(--cream);
  margin-left: -8px;
}
.hero__avatars .hero__avatar:first-child { margin-left: 0; }
.hero__proof-text { font-size: 13px; font-weight: 500; color: var(--text-muted); }
.hero__notif {
  display: inline-flex; align-items: center; gap: 12px;
  padding: 12px 16px;
  background: var(--white); border: 1px solid var(--grey-border);
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0,0,0,.06);
  max-width: 300px;
}
.hero__notif-avatar {
  width: 36px; height: 36px; border-radius: 50%;
  background: linear-gradient(135deg,#c5a8d4,#a8c5e8);
  flex-shrink: 0;
}
.hero__notif-lbl {
  font-size: 10px; font-weight: 600;
  text-transform: uppercase; letter-spacing: .08em;
  color: var(--rust); margin-bottom: 2px;
}
.hero__notif-txt { font-size: 12px; font-weight: 500; color: #1a1a1a; }

/* Right column */
.hero__right { display: flex; flex-direction: column; gap: 16px; }
.hero__live-card {
  background: var(--dark); border-radius: var(--radius-xl);
  padding: 32px; color: var(--white);
}
.hero__live-header {
  display: flex; align-items: center; gap: 8px;
  margin-bottom: 20px;
}
.hero__live-dot {
  width: 8px; height: 8px; border-radius: 50%;
  background: var(--rust);
  animation: lp-pulse 2s ease-in-out infinite;
}
@keyframes lp-pulse { 0%,100%{opacity:1} 50%{opacity:.4} }
.hero__live-lbl {
  font-size: 11px; font-weight: 600;
  text-transform: uppercase; letter-spacing: .1em;
  color: rgba(255,255,255,.5);
}
.hero__globe { margin-left: auto; font-size: 36px; opacity: .2; }
.hero__live-title {
  font-family: var(--ff-serif);
  font-size: 28px; font-weight: 600;
  line-height: 1.2; margin-bottom: 20px;
}
.hero__search {
  display: flex; align-items: center; gap: 10px;
  background: rgba(255,255,255,.08);
  border: 1px solid rgba(255,255,255,.12);
  border-radius: 12px; padding: 12px 16px;
}
.hero__search-ico { font-size: 14px; opacity: .5; }
.hero__search-input {
  flex: 1; background: transparent; border: none;
  color: rgba(255,255,255,.6);
  font-size: 14px; font-family: inherit; outline: none;
}
.hero__search-input::placeholder { color: rgba(255,255,255,.4); }
.hero__search-key {
  font-size: 11px; color: rgba(255,255,255,.3);
  background: rgba(255,255,255,.08);
  padding: 3px 8px; border-radius: 6px;
}
.hero__match-cards {
  display: grid; grid-template-columns: 1fr 1fr; gap: 16px;
}
.hero__match-card { border-radius: var(--radius-lg); padding: 20px; }
.hero__match-card--yellow { background: var(--yellow-pale); }
.hero__match-card--white  { background: var(--white); }
.hero__match-top {
  display: flex; align-items: center;
  justify-content: space-between; margin-bottom: 12px;
}
.hero__match-ico { font-size: 20px; }
.hero__match-pct { font-size: 13px; font-weight: 700; color: #1a1a1a; }
.hero__match-pct--g { color: var(--grey-text); }
.hero__match-name {
  font-family: var(--ff-serif);
  font-size: 17px; font-weight: 600;
  color: #1a1a1a; margin-bottom: 4px;
}
.hero__match-meta {
  font-size: 10px; font-weight: 600;
  letter-spacing: .06em; text-transform: uppercase;
  color: var(--grey-text); margin-bottom: 14px;
}
.hero__match-bar {
  height: 3px; background: rgba(0,0,0,.08);
  border-radius: 2px; overflow: hidden;
}
.hero__match-fill { height: 100%; background: var(--dark); border-radius: 2px; }

/* ══════════════════════════════════════════
   PARTNERS
══════════════════════════════════════════ */
.partners {
  padding: 48px 0;
  background: var(--white);
  border-top: 1px solid var(--grey-border);
  border-bottom: 1px solid var(--grey-border);
}
.partners__inner {
  display: flex; align-items: center;
  justify-content: center; gap: 80px;
}
.partners__item {
  display: flex; align-items: center; gap: 10px;
  opacity: .35; transition: opacity .2s;
}
.partners__item:hover { opacity: .65; }
.partners__ico { font-size: 20px; font-weight: 700; color: #1a1a1a; }
.partners__name {
  font-size: 13px; font-weight: 700;
  letter-spacing: .12em; text-transform: uppercase;
  color: #1a1a1a;
}

/* ══════════════════════════════════════════
   STATS
══════════════════════════════════════════ */
.stats { padding: 100px 0; background: var(--cream); }
.stats__header {
  display: flex; flex-direction: column;
  align-items: center; gap: 12px;
  margin-bottom: 64px; text-align: center;
}
.stats__title {
  font-family: var(--ff-serif);
  font-size: clamp(36px,4vw,52px); font-weight: 700;
  color: #1a1a1a; letter-spacing: -.02em;
}
.stats__grid {
  display: grid; grid-template-columns: repeat(4,1fr);
  gap: 16px; align-items: end;
}
.stats__card {
  border-radius: var(--radius-xl);
  padding: 36px 28px;
  display: flex; flex-direction: column; gap: 8px;
}
.stats__card:nth-child(1) { min-height: 200px; }
.stats__card:nth-child(2) { min-height: 280px; padding-top: 60px; }
.stats__card:nth-child(3) { min-height: 250px; padding-top: 48px; }
.stats__card:nth-child(4) { min-height: 210px; }
.stats__card--light  { background: var(--grey-light); color: #1a1a1a; }
.stats__card--maroon { background: var(--maroon);     color: var(--white); }
.stats__card--dark   { background: var(--dark);       color: var(--white); }
.stats__card--yellow { background: var(--yellow-pale);color: #1a1a1a; }
.stats__value {
  font-family: var(--ff-serif);
  font-size: clamp(40px,4vw,56px); font-weight: 700;
  line-height: 1; letter-spacing: -.02em;
}
.stats__lbl  { font-size: 14px; font-weight: 600; margin-top: 4px; }
.stats__sub  { font-size: 11px; font-weight: 500; text-transform: uppercase; letter-spacing: .1em; opacity: .55; }

/* ══════════════════════════════════════════
   LIVE FEED
══════════════════════════════════════════ */
.feed { padding: 100px 0; background: var(--dark); }
.feed__header {
  display: flex; align-items: flex-end;
  justify-content: space-between; margin-bottom: 48px;
}
.feed__title {
  font-family: var(--ff-serif);
  font-size: clamp(36px,4vw,56px); font-weight: 700;
  color: var(--white); letter-spacing: -.02em; margin-top: 8px;
}
.feed__nav { display: flex; gap: 8px; }
.feed__nav-btn {
  width: 44px; height: 44px; border-radius: 50%;
  background: rgba(255,255,255,.08);
  border: 1px solid rgba(255,255,255,.12);
  color: var(--white); font-size: 20px;
  display: flex; align-items: center; justify-content: center;
  transition: background .2s;
}
.feed__nav-btn:hover { background: rgba(255,255,255,.16); }
.feed__cards {
  display: grid; grid-template-columns: repeat(3,1fr); gap: 20px;
}
.feed__card {
  background: #1e1e1e; border-radius: var(--radius-xl);
  padding: 28px; display: flex; flex-direction: column; gap: 12px;
  border: 1px solid rgba(255,255,255,.06);
  transition: border-color .2s;
}
.feed__card:hover { border-color: rgba(255,255,255,.12); }
.feed__card-top {
  display: flex; align-items: center; justify-content: space-between;
}
.feed__cat {
  font-size: 11px; font-weight: 600;
  letter-spacing: .1em; text-transform: uppercase;
  color: rgba(255,255,255,.5);
  background: rgba(255,255,255,.08);
  padding: 4px 10px; border-radius: 100px;
}
.feed__pct {
  font-family: var(--ff-serif);
  font-size: 24px; font-weight: 700; font-style: italic;
  color: rgba(255,255,255,.6);
}
.feed__card-title {
  font-family: var(--ff-serif);
  font-size: 22px; font-weight: 600;
  color: var(--white); line-height: 1.2;
}
.feed__card-desc {
  font-size: 13px; line-height: 1.6;
  color: rgba(255,255,255,.5); flex: 1;
}
.feed__meta { display: flex; gap: 16px; font-size: 12px; color: rgba(255,255,255,.45); }
.feed__cta {
  width: 100%; padding: 13px; border-radius: 12px;
  font-size: 14px; font-weight: 600; text-align: center;
  transition: opacity .2s, transform .15s; margin-top: 4px;
}
.feed__cta:hover { opacity: .85; transform: translateY(-1px); }
.feed__cta--dark    { background: var(--white); color: var(--dark); }
.feed__cta--outline { background: transparent; color: var(--white); border: 1px solid rgba(255,255,255,.25); }

/* ══════════════════════════════════════════
   FEATURES
══════════════════════════════════════════ */
.feat { padding: 100px 0; background: var(--cream); }
.feat__grid {
  display: grid; grid-template-columns: 1fr 1fr; gap: 20px; align-items: start;
}
.feat__main {
  background: var(--maroon); border-radius: var(--radius-xl);
  padding: 48px 40px;
  display: flex; flex-direction: column; gap: 20px;
  min-height: 480px; position: relative; overflow: hidden;
}
.feat__main::after {
  content: ''; position: absolute;
  bottom: -60px; right: -60px;
  width: 200px; height: 200px; border-radius: 50%;
  background: rgba(255,255,255,.04); pointer-events: none;
}
.feat__main-ico {
  font-size: 32px; color: rgba(255,255,255,.5);
  width: 56px; height: 56px;
  display: flex; align-items: center; justify-content: center;
  background: rgba(255,255,255,.08); border-radius: 14px;
}
.feat__main-title {
  font-family: var(--ff-serif);
  font-size: clamp(32px,3vw,44px); font-weight: 700;
  color: var(--white); line-height: 1.1;
  letter-spacing: -.02em; flex: 1;
}
.feat__main-desc { font-size: 15px; line-height: 1.7; color: rgba(255,255,255,.65); max-width: 380px; }
.feat__status {
  display: flex; align-items: center; gap: 10px;
  background: rgba(255,255,255,.06);
  border-radius: 12px; padding: 12px 16px;
  font-size: 13px; color: rgba(255,255,255,.6);
}
.feat__status-dot {
  width: 8px; height: 8px; border-radius: 50%;
  background: #4caf50; flex-shrink: 0;
  animation: lp-pulse 2s ease-in-out infinite;
}
.feat__status-badge {
  margin-left: auto; font-size: 11px; font-weight: 600;
  text-transform: uppercase; letter-spacing: .08em;
  color: rgba(255,255,255,.4);
}
.feat__mini-grid {
  display: grid; grid-template-columns: 1fr 1fr; gap: 16px;
}
.feat__mini {
  border-radius: var(--radius-xl); padding: 28px;
  display: flex; flex-direction: column; gap: 10px;
}
.feat__mini--white  { background: var(--white); }
.feat__mini--yellow { background: var(--yellow-pale); }
.feat__mini--wide   { grid-column: span 2; }
.feat__mini-ico     { font-size: 24px; margin-bottom: 4px; }
.feat__mini-ico-sm  { font-size: 18px; }
.feat__mini-title   { font-size: 17px; font-weight: 700; color: #1a1a1a; }
.feat__mini-desc    { font-size: 13px; line-height: 1.6; color: var(--text-muted); }
.feat__tracker-top  { display: flex; align-items: center; gap: 10px; margin-bottom: 4px; }
.feat__tracker-badges { display: flex; gap: 8px; margin-top: 8px; flex-wrap: wrap; }
.feat__tracker-badge { font-size: 11px; font-weight: 600; padding: 4px 12px; border-radius: 100px; }
.feat__tracker-badge--g { background: #e8f5e9; color: #2e7d32; }
.feat__tracker-badge--o { background: #fff3e0; color: #e65100; }
.feat__tracker-badge--x { background: #f0ece4; color: #666; }

/* ══════════════════════════════════════════
   GLOBAL IMPACT
══════════════════════════════════════════ */
.impact { padding: 100px 0; background: var(--cream-light); }
.impact__inner {
  display: grid; grid-template-columns: 1fr 1fr;
  gap: 80px; align-items: center;
}
.impact__left  { display: flex; flex-direction: column; gap: 24px; }
.impact__title {
  font-family: var(--ff-serif);
  font-size: clamp(36px,4vw,56px); font-weight: 700;
  color: #1a1a1a; line-height: 1.1; letter-spacing: -.02em;
}
.impact__stat-box {
  background: var(--white); border-radius: var(--radius-lg);
  padding: 28px; position: relative; overflow: hidden;
  max-width: 260px; border: 1px solid var(--grey-border);
}
.impact__stat-lbl {
  font-size: 11px; font-weight: 600;
  text-transform: uppercase; letter-spacing: .1em;
  color: var(--grey-text); margin-bottom: 8px;
}
.impact__stat-val {
  font-family: var(--ff-serif);
  font-size: 44px; font-weight: 700;
  color: #1a1a1a; line-height: 1; margin-bottom: 6px;
}
.impact__stat-sub { font-size: 13px; color: var(--text-muted); }
.impact__right  { display: flex; flex-direction: column; gap: 32px; }
.impact__chart-wrap { display: flex; align-items: center; gap: 40px; }
.impact__donut { position: relative; width: 180px; height: 180px; flex-shrink: 0; }
.impact__donut-svg { width: 100%; height: 100%; }
.impact__donut-center {
  position: absolute; inset: 0;
  display: flex; flex-direction: column;
  align-items: center; justify-content: center;
}
.impact__donut-val {
  font-family: var(--ff-serif);
  font-size: 22px; font-weight: 700; color: #1a1a1a;
}
.impact__donut-sub {
  font-size: 10px; font-weight: 600;
  text-transform: uppercase; letter-spacing: .1em; color: var(--grey-text);
}
.impact__legend { display: flex; flex-direction: column; gap: 12px; }
.impact__legend-item { display: flex; align-items: center; gap: 10px; font-size: 13px; color: #1a1a1a; }
.impact__legend-dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }
.impact__quote {
  font-family: var(--ff-serif);
  font-size: 16px; font-style: italic;
  color: var(--text-muted); line-height: 1.7;
  border-left: 3px solid var(--grey-border); padding-left: 20px;
}

/* ══════════════════════════════════════════
   HOW IT WORKS
══════════════════════════════════════════ */
.hiw { padding: 100px 0; background: var(--cream); }
.hiw__title {
  font-family: var(--ff-serif);
  font-size: clamp(40px,4.5vw,60px); font-weight: 700;
  text-align: center; color: #1a1a1a;
  letter-spacing: -.02em; line-height: 1.1; margin-bottom: 80px;
}
.hiw__timeline {
  position: relative; max-width: 900px; margin: 0 auto;
  display: flex; flex-direction: column; gap: 80px;
}
.hiw__line {
  position: absolute; left: 50%; top: 0; bottom: 0;
  width: 1px; background: var(--grey-border);
  transform: translateX(-50%);
}
.hiw__step {
  display: grid; grid-template-columns: 1fr 48px 1fr;
  align-items: center; position: relative;
}
.hiw__step--left  .hiw__content { order:1; text-align:right; padding-right:40px; }
.hiw__step--left  .hiw__node   { order:2; }
.hiw__step--left  .hiw__visual { order:3; padding-left:40px; }
.hiw__step--right .hiw__content{ order:3; text-align:left;  padding-left:40px; }
.hiw__step--right .hiw__node   { order:2; }
.hiw__step--right .hiw__visual { order:1; padding-right:40px; }
.hiw__content { display: flex; flex-direction: column; gap: 10px; }
.hiw__num {
  font-family: var(--ff-serif);
  font-size: 64px; font-weight: 700;
  color: rgba(0,0,0,.06); line-height: 1;
}
.hiw__step--left .hiw__num { text-align: right; }
.hiw__step-title { font-size: 20px; font-weight: 700; color: #1a1a1a; }
.hiw__step-desc  { font-size: 14px; line-height: 1.7; color: var(--text-muted); max-width: 300px; }
.hiw__step--left .hiw__step-desc { margin-left: auto; }
.hiw__node {
  display: flex; align-items: center; justify-content: center;
  width: 48px; height: 48px; border-radius: 50%;
  background: var(--dark); color: var(--white);
  font-size: 18px; z-index: 2; position: relative;
}

/* Visuals */
.hiw__photo-wrap {
  background: var(--white); border-radius: var(--radius-xl);
  overflow: hidden; height: 260px;
  display: flex; align-items: flex-end; justify-content: center;
}
.hiw__photo-bg {
  width: 100%; height: 100%;
  background: linear-gradient(160deg,#e8e0d8,#d0c8c0);
  display: flex; align-items: flex-end; justify-content: center;
}
.hiw__photo-person {
  width: 120px; height: 200px;
  background: linear-gradient(180deg,#c5a07a,#a07850);
  border-radius: 60px 60px 0 0;
}
.hiw__scan-card {
  background: var(--yellow-pale); border-radius: var(--radius-xl);
  padding: 28px; display: flex; flex-direction: column; gap: 12px;
}
.hiw__scan-ico { font-size: 32px; opacity: .4; }
.hiw__scan-bar { height: 8px; background: rgba(0,0,0,.12); border-radius: 4px; }
.hiw__scan-bar--s { width: 60%; }
.hiw__scan-lbl {
  display: flex; justify-content: space-between;
  font-size: 13px; font-weight: 500; color: var(--text-muted);
}
.hiw__scan-cnt { color: #1a1a1a; font-weight: 700; }
.hiw__tracker-card {
  background: var(--white); border-radius: var(--radius-xl);
  padding: 24px; display: flex; flex-direction: column; gap: 12px;
  border: 1px solid var(--grey-border);
}
.hiw__tracker-row {
  display: flex; align-items: center;
  justify-content: space-between; gap: 12px;
}
.hiw__tracker-name { font-size: 14px; font-weight: 500; color: #1a1a1a; }
.hiw__tracker-badge { font-size: 11px; font-weight: 600; padding: 4px 12px; border-radius: 100px; }
.hiw__tracker-badge--g { background:#e8f5e9; color:#2e7d32; }
.hiw__tracker-badge--o { background:#fff3e0; color:#e65100; }

/* ══════════════════════════════════════════
   TESTIMONIALS
══════════════════════════════════════════ */
.testi { padding: 100px 0; background: var(--dark); }
.testi__featured {
  display: flex; flex-direction: column; align-items: center;
  text-align: center; gap: 24px; max-width: 800px;
  margin: 0 auto 72px;
}
.testi__big-quote {
  font-family: var(--ff-serif);
  font-size: clamp(28px,3.5vw,44px); font-weight: 600;
  font-style: italic; color: var(--white);
  line-height: 1.25; letter-spacing: -.01em;
}
.testi__feat-author { display: flex; align-items: center; gap: 14px; }
.testi__avatar {
  width: 40px; height: 40px; border-radius: 50%;
  background: linear-gradient(135deg,#9c6b4c,#7a4a3a);
  display: flex; align-items: center; justify-content: center;
  font-size: 13px; font-weight: 700; color: var(--white); flex-shrink: 0;
}
.testi__avatar--lg {
  width: 52px; height: 52px; font-size: 15px;
  border: 2px solid rgba(255,255,255,.2);
}
.testi__feat-name  { font-size: 16px; font-weight: 700; color: var(--white); }
.testi__feat-role  { font-size: 12px; color: rgba(255,255,255,.45); }
.testi__dots { display: flex; gap: 8px; }
.testi__dot {
  width: 8px; height: 8px; border-radius: 50%;
  background: rgba(255,255,255,.2); border: none;
  transition: background .2s, transform .2s;
}
.testi__dot--active { background: var(--white); transform: scale(1.2); }
.testi__cards {
  display: grid; grid-template-columns: repeat(3,1fr); gap: 20px;
}
.testi__card {
  background: rgba(255,255,255,.04);
  border: 1px solid rgba(255,255,255,.08);
  border-radius: var(--radius-xl); padding: 28px;
  display: flex; flex-direction: column; gap: 20px;
  transition: background .2s, border-color .2s;
}
.testi__card--active,
.testi__card:hover { background: rgba(255,255,255,.07); border-color: rgba(255,255,255,.14); }
.testi__card-quote { font-size: 14px; line-height: 1.7; color: rgba(255,255,255,.65); flex: 1; }
.testi__card-author { display: flex; align-items: center; gap: 12px; }
.testi__card-name   { font-size: 14px; font-weight: 700; color: var(--white); }
.testi__card-role   { font-size: 11px; color: rgba(255,255,255,.4); margin-top: 2px; }

/* ══════════════════════════════════════════
   PRICING
══════════════════════════════════════════ */
.pricing { padding: 100px 0; background: var(--cream); }
.pricing__header {
  display: flex; flex-direction: column;
  align-items: center; gap: 12px;
  margin-bottom: 60px; text-align: center;
}
.pricing__title {
  font-family: var(--ff-serif);
  font-size: clamp(36px,4vw,52px); font-weight: 700;
  color: #1a1a1a; letter-spacing: -.02em;
}
.pricing__cards { display: grid; grid-template-columns: 2fr 1fr; gap: 20px; align-items: start; }

/* Pro */
.pricing__pro {
  background: var(--maroon); border-radius: var(--radius-xl);
  padding: 40px; position: relative; overflow: hidden;
}
.pricing__pro-inner { display: flex; justify-content: space-between; gap: 40px; position: relative; z-index: 1; }
.pricing__recommended {
  display: inline-block;
  font-size: 10px; font-weight: 700;
  letter-spacing: .12em; text-transform: uppercase;
  background: rgba(255,255,255,.12); color: rgba(255,255,255,.7);
  padding: 4px 10px; border-radius: 100px; margin-bottom: 16px;
}
.pricing__plan-name { font-family: var(--ff-serif); font-size: 36px; font-weight: 700; color: var(--white); margin-bottom: 8px; }
.pricing__plan-desc { font-size: 14px; color: rgba(255,255,255,.6); line-height: 1.6; max-width: 320px; margin-bottom: 24px; }
.pricing__feats { list-style: none; display: grid; grid-template-columns: 1fr 1fr; gap: 10px 20px; }
.pricing__feat { font-size: 14px; color: rgba(255,255,255,.8); display: flex; align-items: center; gap: 8px; }
.pricing__check { color: rgba(255,255,255,.5); font-weight: 700; }
.pricing__price-col { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 16px; min-width: 200px; }
.pricing__price { display: flex; align-items: flex-start; gap: 2px; color: var(--white); }
.pricing__currency { font-size: 24px; font-weight: 700; margin-top: 8px; }
.pricing__amount  { font-family: var(--ff-serif); font-size: 64px; font-weight: 700; line-height: 1; }
.pricing__period  { font-size: 18px; color: rgba(255,255,255,.5); align-self: flex-end; margin-bottom: 8px; }
.pricing__billing { font-size: 11px; font-weight: 600; letter-spacing: .08em; text-transform: uppercase; color: rgba(255,255,255,.35); text-align: center; }
.pricing__deco { position: absolute; border-radius: 50%; background: rgba(255,255,255,.04); pointer-events: none; }
.pricing__deco--1 { width:200px; height:200px; top:-60px; right:200px; }
.pricing__deco--2 { width:160px; height:160px; bottom:-40px; right:60px; }

/* Free */
.pricing__free {
  background: var(--white); border-radius: var(--radius-xl);
  padding: 36px; display: flex; flex-direction: column; gap: 20px;
  border: 1px solid var(--grey-border);
}
.pricing__free-name { font-family: var(--ff-serif); font-size: 36px; font-weight: 700; color: #1a1a1a; margin-bottom: 8px; }
.pricing__free-desc { font-size: 14px; color: var(--text-muted); line-height: 1.6; margin-bottom: 8px; }
.pricing__free-feats { list-style: none; display: flex; flex-direction: column; gap: 10px; }
.pricing__free-feat { font-size: 14px; color: #1a1a1a; display: flex; align-items: center; gap: 8px; }
.pricing__free-feat--off { color: var(--grey-text); text-decoration: line-through; }
.pricing__check-dark { color: #1a1a1a; font-weight: 700; }
.pricing__check-off  { color: var(--grey-text); }

/* Shared CTA */
.pricing__cta {
  display: inline-flex; align-items: center; justify-content: center;
  width: 100%; padding: 14px 28px; border-radius: 100px;
  font-size: 15px; font-weight: 700;
  transition: opacity .2s, transform .15s;
}
.pricing__cta:hover { opacity: .85; transform: translateY(-1px); }
.pricing__cta--pro  { background: var(--white); color: var(--maroon); }
.pricing__cta--free {
  background: transparent; color: #1a1a1a;
  border: 1.5px solid #1a1a1a;
  transition: background .2s, color .2s;
}
.pricing__cta--free:hover { background: var(--dark); color: var(--white); }

/* ══════════════════════════════════════════
   CTA SECTION
══════════════════════════════════════════ */
.cta { padding: 80px 40px; background: var(--dark); border-radius: var(--radius-xl); max-width: 1136px; margin: 0 auto 40px; }
.cta__inner { display: grid; grid-template-columns: 1fr 1fr; gap: 64px; align-items: center; }
.cta__title {
  font-family: var(--ff-serif);
  font-size: clamp(40px,5vw,64px); font-weight: 700;
  color: var(--white); line-height: 1.05;
  letter-spacing: -.02em; margin-bottom: 20px;
}
.cta__italic { font-style: italic; color: var(--yellow-pale); }
.cta__sub    { font-size: 15px; color: rgba(255,255,255,.55); line-height: 1.7; }
.cta__right  { display: flex; flex-direction: column; gap: 12px; max-width: 360px; justify-self: end; width: 100%; }
.cta__btn {
  display: block; text-align: center;
  padding: 16px 32px; border-radius: 12px;
  font-size: 16px; font-weight: 700;
  transition: opacity .2s, transform .15s;
}
.cta__btn:hover { opacity: .85; transform: translateY(-2px); }
.cta__btn--primary { background: var(--maroon); color: var(--white); }
.cta__btn--outline { background: transparent; color: var(--white); border: 1px solid rgba(255,255,255,.25); }
.cta__secure {
  display: flex; align-items: center; justify-content: center; gap: 8px;
  font-size: 12px; font-weight: 500;
  letter-spacing: .06em; text-transform: uppercase;
  color: rgba(255,255,255,.3);
}

/* ══════════════════════════════════════════
   FOOTER
══════════════════════════════════════════ */
.footer { background: var(--cream); padding-top: 80px; border-top: 1px solid var(--grey-border); }
.footer__inner {
  display: grid; grid-template-columns: 2fr 1fr 1fr 1fr 1.5fr;
  gap: 40px; padding-bottom: 60px;
}
.footer__logo { display: flex; align-items: center; gap: 8px; margin-bottom: 16px; }
.footer__logo-ico {
  width: 28px; height: 28px; background: var(--dark); color: var(--white);
  border-radius: 7px;
  display: flex; align-items: center; justify-content: center; font-size: 14px;
}
.footer__logo-txt { font-size: 16px; font-weight: 700; color: #1a1a1a; }
.footer__tagline  { font-size: 13px; line-height: 1.65; color: var(--text-muted); margin-bottom: 20px; max-width: 220px; }
.footer__socials  { display: flex; gap: 10px; }
.footer__social {
  width: 36px; height: 36px; border-radius: 8px;
  border: 1px solid var(--grey-border);
  display: flex; align-items: center; justify-content: center;
  font-size: 13px; font-weight: 700; color: #1a1a1a;
  transition: background .2s;
}
.footer__social:hover { background: var(--grey-light); }
.footer__col-title {
  font-size: 11px; font-weight: 700;
  text-transform: uppercase; letter-spacing: .1em;
  color: #1a1a1a; margin-bottom: 16px;
}
.footer__col-links { list-style: none; display: flex; flex-direction: column; gap: 10px; }
.footer__col-links a { font-size: 13px; color: var(--text-muted); transition: color .2s; }
.footer__col-links a:hover { color: #1a1a1a; }
.footer__status {
  background: var(--white); border: 1px solid var(--grey-border);
  border-radius: var(--radius-md); padding: 16px;
  display: flex; align-items: flex-start; gap: 10px; align-self: flex-start;
}
.footer__status-dot {
  width: 8px; height: 8px; border-radius: 50%;
  background: #4caf50; flex-shrink: 0; margin-top: 3px;
}
.footer__status-title { font-size: 12px; font-weight: 700; color: #1a1a1a; margin-bottom: 4px; }
.footer__status-txt   { font-size: 11px; color: var(--text-muted); line-height: 1.5; }
.footer__bottom { border-top: 1px solid var(--grey-border); padding: 20px 0; }
.footer__bottom-inner {
  display: flex; align-items: center; justify-content: space-between;
  font-size: 12px; color: var(--grey-text);
}
.footer__bottom-links { display: flex; gap: 24px; }
.footer__bottom-links a {
  color: var(--grey-text); transition: color .2s;
  text-transform: uppercase; font-size: 11px;
  letter-spacing: .06em; font-weight: 500;
}
.footer__bottom-links a:hover { color: #1a1a1a; }
`

/* ─────────────────────────────────────────────
   HOME / LANDING COMPONENT
───────────────────────────────────────────── */
export default function Home() {
  const [scrolled, setScrolled]           = useState(false)
  const [feedIdx, setFeedIdx]             = useState(0)
  const [activeTestimonial, setActiveTesti] = useState(0)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const feedPrev = () => setFeedIdx(i => (i - 1 + OPPORTUNITIES.length) % OPPORTUNITIES.length)
  const feedNext = () => setFeedIdx(i => (i + 1) % OPPORTUNITIES.length)
  const visibleCards = [0, 1, 2].map(o => OPPORTUNITIES[(feedIdx + o) % OPPORTUNITIES.length])

  return (
    <>
      {/* Inject all styles */}
      <style>{CSS}</style>

      {/* ── NAVBAR ── */}
      <header className={`nav${scrolled ? ' nav--scrolled' : ''}`}>
        <div className="lp-container nav__inner">
          <Link to="/" className="nav__logo">
            <span className="nav__logo-icon">✳</span>
            <span className="nav__logo-text">Nexora</span>
          </Link>
          <nav className="nav__links">
            <a href="#opportunities">Opportunities</a>
            <a href="#intelligence">Intelligence</a>
            <a href="#pricing">Pricing</a>
            <a href="#case-studies">Case Studies</a>
          </nav>
          <div className="nav__actions">
            <Link to="/login" className="nav__login">Log in</Link>
            <Link to="/signup" className="nav__cta">Get Started Free</Link>
          </div>
        </div>
      </header>

      <main>
        {/* ── HERO ── */}
        <section className="hero">
          <div className="lp-container hero__inner">
            {/* Left */}
            <div>
              <div className="hero__badge">
                <span className="hero__badge-dot">✦</span>
                Trusted by 100K+ Users
              </div>
              <h1 className="hero__headline">
                The world is<br />
                <em className="hero__italic">your</em> stage.
              </h1>
              <p className="hero__subtext">
                Unlock billions in global scholarships, fellowships, and grants
                through Nexora's AI-powered intelligence platform.
              </p>
              <a href="#opportunities" className="hero__cta">Explore Opportunities ↗</a>
              <div className="hero__social-proof">
                <div className="hero__avatars">
                  {['#e8c5a0','#c5a8d4','#a8c5d4'].map((bg, i) => (
                    <span key={i} className="hero__avatar" style={{ background: bg }} />
                  ))}
                </div>
                <span className="hero__proof-text">Join 12k new users this month</span>
              </div>
              <div className="hero__notif">
                <div className="hero__notif-avatar" />
                <div>
                  <div className="hero__notif-lbl">Recent Match</div>
                  <div className="hero__notif-txt">Amara from Lagos just secured a $50k Grant</div>
                </div>
              </div>
            </div>

            {/* Right */}
            <div className="hero__right">
              <div className="hero__live-card">
                <div className="hero__live-header">
                  <span className="hero__live-dot" />
                  <span className="hero__live-lbl">Live Intelligence</span>
                  <span className="hero__globe">🌐</span>
                </div>
                <h2 className="hero__live-title">Match with your potential.</h2>
                <div className="hero__search">
                  <span className="hero__search-ico">🔍</span>
                  <input className="hero__search-input" placeholder="Describe your dream fellowship..." readOnly />
                  <span className="hero__search-key">⌘K</span>
                </div>
              </div>

              <div className="hero__match-cards">
                {[
                  { ico: '📚', pct: '98% Match', name: 'Gates Cambridge', meta: 'UK · FULLY FUNDED', fill: 98, cls: 'yellow' },
                  { ico: '🚀', pct: '94% Match', name: 'YC S24 Accelerator', meta: 'USA · $500K INVESTMENT', fill: 94, cls: 'white', grey: true },
                ].map(c => (
                  <div key={c.name} className={`hero__match-card hero__match-card--${c.cls}`}>
                    <div className="hero__match-top">
                      <span className="hero__match-ico">{c.ico}</span>
                      <span className={`hero__match-pct${c.grey ? ' hero__match-pct--g' : ''}`}>{c.pct}</span>
                    </div>
                    <div className="hero__match-name">{c.name}</div>
                    <div className="hero__match-meta">{c.meta}</div>
                    <div className="hero__match-bar">
                      <div className="hero__match-fill" style={{ width: `${c.fill}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── PARTNERS ── */}
        <section className="partners">
          <div className="lp-container partners__inner">
            {[{ico:'△',name:'MIT'},{ico:'🎓',name:'Stanford'},{ico:'🏛',name:'World Bank'},{ico:'G',name:'Google'}].map(p => (
              <div key={p.name} className="partners__item">
                <span className="partners__ico">{p.ico}</span>
                <span className="partners__name">{p.name}</span>
              </div>
            ))}
          </div>
        </section>

        {/* ── STATS ── */}
        <section className="stats" id="intelligence">
          <div className="lp-container">
            <div className="stats__header">
              <span className="lp-label">Platform Scale</span>
              <h2 className="stats__title">Numbers that speak volumes.</h2>
            </div>
            <div className="stats__grid">
              {STATS.map(s => (
                <div key={s.label} className={`stats__card stats__card--${s.bg}`}>
                  <div className="stats__value">{s.value}</div>
                  <div className="stats__lbl">{s.label}</div>
                  <div className="stats__sub">{s.sub}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── LIVE FEED ── */}
        <section className="feed" id="opportunities">
          <div className="lp-container">
            <div className="feed__header">
              <div>
                <span className="lp-label lp-label--rust">Live Feed</span>
                <h2 className="feed__title">Closing soon, near you.</h2>
              </div>
              <div className="feed__nav">
                <button className="feed__nav-btn" onClick={feedPrev}>‹</button>
                <button className="feed__nav-btn" onClick={feedNext}>›</button>
              </div>
            </div>
            <div className="feed__cards">
              {visibleCards.map((opp, i) => (
                <div key={`${opp.title}-${i}`} className="feed__card">
                  <div className="feed__card-top">
                    <span className="feed__cat">{opp.category}</span>
                    <span className="feed__pct">{opp.match}%</span>
                  </div>
                  <h3 className="feed__card-title">{opp.title}</h3>
                  <p className="feed__card-desc">{opp.desc}</p>
                  <div className="feed__meta">
                    <span>📍 {opp.location}</span>
                    <span>⏱ {opp.deadline}</span>
                  </div>
                  <button className={`feed__cta feed__cta--${opp.ctaStyle}`}>
                    {opp.cta} {opp.ctaStyle === 'dark' ? '→' : '◎'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── FEATURES ── */}
        <section className="feat">
          <div className="lp-container feat__grid">
            {/* Main card */}
            <div className="feat__main">
              <div className="feat__main-ico">⊞</div>
              <h2 className="feat__main-title">Precision<br />Match Engine</h2>
              <p className="feat__main-desc">
                Our proprietary AI doesn't just search; it understands your unique
                profile to predict your success rate with 94% accuracy.
              </p>
              <div className="feat__status">
                <div className="feat__status-dot" />
                <span>Scanning your profile...</span>
                <span className="feat__status-badge">AI Active</span>
              </div>
            </div>

            {/* Mini grid */}
            <div className="feat__mini-grid">
              <div className="feat__mini feat__mini--white">
                <div className="feat__mini-ico">🌐</div>
                <h3 className="feat__mini-title">Global Discovery</h3>
                <p className="feat__mini-desc">Tracking 190+ countries and 50k+ local sources daily.</p>
              </div>
              <div className="feat__mini feat__mini--yellow">
                <div className="feat__mini-ico">🔔</div>
                <h3 className="feat__mini-title">Smart Alerts</h3>
                <p className="feat__mini-desc">Never miss a deadline again with AI-prioritized notifications.</p>
              </div>
              <div className="feat__mini feat__mini--white feat__mini--wide">
                <div className="feat__tracker-top">
                  <span className="feat__mini-ico-sm">⊟</span>
                  <h3 className="feat__mini-title">Application Tracker</h3>
                </div>
                <p className="feat__mini-desc">Manage your entire discovery to acceptance journey in one unified CRM.</p>
                <div className="feat__tracker-badges">
                  <span className="feat__tracker-badge feat__tracker-badge--g">✓ Accepted</span>
                  <span className="feat__tracker-badge feat__tracker-badge--o">◎ Interview</span>
                  <span className="feat__tracker-badge feat__tracker-badge--x">+ Planning</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── GLOBAL IMPACT ── */}
        <section className="impact">
          <div className="lp-container impact__inner">
            <div className="impact__left">
              <span className="lp-label">Global Impact</span>
              <h2 className="impact__title">Where potential<br />meets power.</h2>
              <div className="impact__stat-box">
                <div className="impact__stat-lbl">Current Active</div>
                <div className="impact__stat-val">14,281</div>
                <div className="impact__stat-sub">Opportunities in EU</div>
              </div>
            </div>
            <div className="impact__right">
              <div className="impact__chart-wrap">
                <div className="impact__donut">
                  <svg viewBox="0 0 120 120" className="impact__donut-svg">
                    <circle cx="60" cy="60" r="44" fill="none" stroke="#3d1020" strokeWidth="18"
                      strokeDasharray="124 158" strokeDashoffset="0" strokeLinecap="round"
                      transform="rotate(-90 60 60)" />
                    <circle cx="60" cy="60" r="44" fill="none" stroke="#888" strokeWidth="18"
                      strokeDasharray="83 200" strokeDashoffset="-124" strokeLinecap="round"
                      transform="rotate(-90 60 60)" />
                    <circle cx="60" cy="60" r="44" fill="none" stroke="#ddd" strokeWidth="18"
                      strokeDasharray="69 213" strokeDashoffset="-207" strokeLinecap="round"
                      transform="rotate(-90 60 60)" />
                  </svg>
                  <div className="impact__donut-center">
                    <div className="impact__donut-val">500K+</div>
                    <div className="impact__donut-sub">TOTAL</div>
                  </div>
                </div>
                <div className="impact__legend">
                  {CHART_CATS.map(c => (
                    <div key={c.label} className="impact__legend-item">
                      <span className="impact__legend-dot" style={{ background: c.color }} />
                      <span>{c.label} ({c.pct}%)</span>
                    </div>
                  ))}
                </div>
              </div>
              <blockquote className="impact__quote">
                "Nexora isn't just a database; it's the intelligent tissue connecting
                ambition to resources globally."
              </blockquote>
            </div>
          </div>
        </section>

        {/* ── HOW IT WORKS ── */}
        <section className="hiw">
          <div className="lp-container">
            <h2 className="hiw__title">Your trajectory,<br />simplified.</h2>
            <div className="hiw__timeline">
              <div className="hiw__line" />
              {HOW_STEPS.map((step, i) => (
                <div key={step.num} className={`hiw__step hiw__step--${step.side}`}>
                  <div className="hiw__content">
                    <span className="hiw__num">{step.num}</span>
                    <h3 className="hiw__step-title">{step.title}</h3>
                    <p className="hiw__step-desc">{step.desc}</p>
                  </div>
                  <div className="hiw__node">
                    {i === 0 ? '◉' : i === 1 ? '⊞' : '✓'}
                  </div>
                  <div className="hiw__visual">
                    {step.visual === 'photo' && (
                      <div className="hiw__photo-wrap">
                        <div className="hiw__photo-bg">
                          <div className="hiw__photo-person" />
                        </div>
                      </div>
                    )}
                    {step.visual === 'scan' && (
                      <div className="hiw__scan-card">
                        <div className="hiw__scan-ico">🗄</div>
                        <div className="hiw__scan-bar" />
                        <div className="hiw__scan-bar hiw__scan-bar--s" />
                        <div className="hiw__scan-lbl">
                          <span>Scanning...</span>
                          <span className="hiw__scan-cnt">14 New Matches</span>
                        </div>
                      </div>
                    )}
                    {step.visual === 'tracker' && (
                      <div className="hiw__tracker-card">
                        {[
                          { name: 'Rhodes Scholarship',    status: 'Applied',      cls: 'g' },
                          { name: 'Stanford GSB Fellowship', status: 'Interviewing', cls: 'o' },
                        ].map(r => (
                          <div key={r.name} className="hiw__tracker-row">
                            <span className="hiw__tracker-name">{r.name}</span>
                            <span className={`hiw__tracker-badge hiw__tracker-badge--${r.cls}`}>{r.status}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── TESTIMONIALS ── */}
        <section className="testi">
          <div className="lp-container">
            <div className="testi__featured">
              <span className="lp-label lp-label--light">Testimonials</span>
              <blockquote className="testi__big-quote">
                "Nexora didn't just find me a scholarship; it found a future I
                didn't know I was eligible for."
              </blockquote>
              <div className="testi__feat-author">
                <div className="testi__avatar testi__avatar--lg">SC</div>
                <div>
                  <div className="testi__feat-name">Sarah Chen</div>
                  <div className="testi__feat-role">Gates Cambridge Scholar · AI Researcher</div>
                </div>
              </div>
              <div className="testi__dots">
                {TESTIMONIALS.map((_, i) => (
                  <button key={i}
                    className={`testi__dot${i === activeTestimonial ? ' testi__dot--active' : ''}`}
                    onClick={() => setActiveTesti(i)} />
                ))}
              </div>
            </div>

            <div className="testi__cards">
              {TESTIMONIALS.map((t, i) => (
                <div key={t.name} className={`testi__card${i === activeTestimonial ? ' testi__card--active' : ''}`}>
                  <p className="testi__card-quote">{t.quote}</p>
                  <div className="testi__card-author">
                    <div className="testi__avatar">{t.initials}</div>
                    <div>
                      <div className="testi__card-name">{t.name}</div>
                      <div className="testi__card-role">{t.title}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── PRICING ── */}
        <section className="pricing" id="pricing">
          <div className="lp-container">
            <div className="pricing__header">
              <span className="lp-label">Pricing</span>
              <h2 className="pricing__title">Invest in your potential.</h2>
            </div>
            <div className="pricing__cards">
              {/* Pro */}
              <div className="pricing__pro">
                <div className="pricing__pro-inner">
                  <div>
                    <span className="pricing__recommended">RECOMMENDED</span>
                    <h3 className="pricing__plan-name">Pro Match</h3>
                    <p className="pricing__plan-desc">
                      Unlimited matching, AI Copilot, and real-time deadline priority alerts.
                    </p>
                    <ul className="pricing__feats">
                      {['Unlimited Matches','AI Essay Review','Direct Expert Chat','Global CRM Access'].map(f => (
                        <li key={f} className="pricing__feat">
                          <span className="pricing__check">✓</span> {f}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="pricing__price-col">
                    <div className="pricing__price">
                      <span className="pricing__currency">$</span>
                      <span className="pricing__amount">19</span>
                      <span className="pricing__period">/mo</span>
                    </div>
                    <Link to="/signup" className="pricing__cta pricing__cta--pro">Go Pro Now</Link>
                    <p className="pricing__billing">BILLED ANNUALLY · SAVE 20%</p>
                  </div>
                </div>
                <div className="pricing__deco pricing__deco--1" />
                <div className="pricing__deco pricing__deco--2" />
              </div>
              {/* Free */}
              <div className="pricing__free">
                <div>
                  <div className="pricing__free-name">Explorer</div>
                  <p className="pricing__free-desc">Start discovering opportunities for free. Basic filters included.</p>
                </div>
                <ul className="pricing__free-feats">
                  {[{f:'5 Matches / Day',off:false},{f:'Basic Search',off:false},{f:'AI Copilot',off:true}].map(({f,off}) => (
                    <li key={f} className={`pricing__free-feat${off?' pricing__free-feat--off':''}`}>
                      <span className={off ? 'pricing__check-off' : 'pricing__check-dark'}>{off ? '✕' : '✓'}</span> {f}
                    </li>
                  ))}
                </ul>
                <Link to="/signup" className="pricing__cta pricing__cta--free">Start Free</Link>
              </div>
            </div>
          </div>
        </section>

        {/* ── CTA SECTION ── */}
        <section style={{ padding: '0 32px 80px' }}>
          <div className="cta">
            <div className="lp-container cta__inner">
              <div>
                <h2 className="cta__title">
                  Claim your <em className="cta__italic">future</em>.<br />Start today.
                </h2>
                <p className="cta__sub">One platform. Thousands of doors.</p>
                <p className="cta__sub">Join 100,000+ pioneers redefining their global trajectory.</p>
              </div>
              <div className="cta__right">
                <Link to="/signup" className="cta__btn cta__btn--primary">Sign up for free</Link>
                <Link to="/contact" className="cta__btn cta__btn--outline">Talk to an advisor</Link>
                <div className="cta__secure">
                  <span>🔒</span><span>No credit card required</span>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* ── FOOTER ── */}
      <footer className="footer">
        <div className="lp-container footer__inner">
          <div>
            <Link to="/" className="footer__logo">
              <span className="footer__logo-ico">✳</span>
              <span className="footer__logo-txt">Nexora</span>
            </Link>
            <p className="footer__tagline">
              The global intelligence network for scholarships, fellowships, and startup opportunities.
            </p>
            <div className="footer__socials">
              {[{h:'#twitter',l:'✕'},{h:'#linkedin',l:'in'},{h:'#github',l:'⌥'}].map(s => (
                <a key={s.h} href={s.h} className="footer__social">{s.l}</a>
              ))}
            </div>
          </div>

          {Object.entries(NAV_COLS).map(([col, links]) => (
            <div key={col}>
              <h4 className="footer__col-title">{col}</h4>
              <ul className="footer__col-links">
                {links.map(l => (
                  <li key={l}><a href={`#${l.toLowerCase().replace(/\s+/g,'-')}`}>{l}</a></li>
                ))}
              </ul>
            </div>
          ))}

          <div className="footer__status">
            <div className="footer__status-dot" />
            <div>
              <div className="footer__status-title">System Status</div>
              <div className="footer__status-txt">All systems operational.</div>
              <div className="footer__status-txt">1,281 new matches in last hour.</div>
            </div>
          </div>
        </div>

        <div className="footer__bottom">
          <div className="lp-container footer__bottom-inner">
            <span>© 2026 Nexora Intelligence Corp. All rights reserved.</span>
            <div className="footer__bottom-links">
              <a href="#terms">Terms of Service</a>
              <a href="#cookies">Cookie Policy</a>
            </div>
          </div>
        </div>
      </footer>
    </>
  )
}
