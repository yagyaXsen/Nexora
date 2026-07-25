# Nexora — Landing Page Master Plan

> A single source of truth for the world-class, dual-mode landing page.
> Everything — design system, component architecture, section-by-section spec,
> animation grammar, responsive rules, and the build order — lives in this file.
>
> **North star:** when someone lands here they should think *"Apple, Stripe,
> Linear, and Vercel collaborated on this."* Every pixel intentional. Less, but
> better. Whitespace as a material. Motion that feels invisible.
>
> **Chosen direction:** **Dual-mode system.** A real light+dark theme built on
> `[data-theme]` tokens. Default = the warm editorial brand (canvas + coral).
> Dark = cinematic near-black + coral glow. Respects OS preference, toggles in
> nav, and every section is designed to read beautifully in both.

---

## 0. Ground truth (what already exists)

We are **elevating**, not starting from zero. Reuse and refactor these:

| Asset | Location | Verdict |
|---|---|---|
| Design tokens | `frontend/src/styles/tokens.css` | Keep + extend into dual-mode |
| Base/reset/buttons/inputs | `frontend/src/styles/base.css` | Keep, harden focus states |
| Landing page (8 sections) | `frontend/src/pages/Landing.jsx` | Refactor into section components |
| `Nav`, `Footer` | `frontend/src/components/` | Rebuild as premium primitives |
| `OpportunityCard` | `frontend/src/components/` | Keep, add hover/tilt polish |
| `CountUp`, `useReveal` | components / hooks | Keep; add more motion hooks |
| Data: `api.stats()`, `api.trending(n)`, `api.search(q)` | `frontend/src/lib/api.js` | Real, live — wire sections to these |

**Real data available** (never fabricate — use these):
- `stats`: `total_opportunities`, `active_count`, `expiring_soon_count`, `categories_breakdown{}` (10 categories).
- `trending(limit)`: most-clicked live opportunities (real `click_count` ranking).
- `search(query)`: AI intent parse → `{ intent, degraded, items }`.
- Categories (10): scholarship, fellowship, grant, accelerator, competition, conference, exchange, travel, gov_scheme, giveaway.

> Rule: numbers on the page come from `/stats`. If the API is cold, show tasteful
> skeletons — never hardcoded fake totals.

---

## 1. Design principles (the rubric every section is judged against)

1. **Breathe.** Section rhythm on the 8px grid; min `--s-12` (96px) vertical padding, `--s-15` on hero/CTA. Whitespace is the primary luxury signal.
2. **One accent, used rarely.** Coral (`--accent`) appears at most 1–2 times per viewport. Scarcity = expense.
3. **Hierarchy through weight + size, not color.** Three type sizes max per section.
4. **Depth, not decoration.** Layer with shadow + subtle border + background offset — never with glow spam or rainbow gradients.
5. **Motion is invisible.** Reveal on scroll, magnetic CTAs, tilt — all under 400ms, all easing on `--ease-out`, all killed by `prefers-reduced-motion`.
6. **Content never boxed.** Editorial/asymmetric layouts; full-bleed dark bands; content bleeds past the grid where it earns it.
7. **Dual-mode parity.** Every element defined once with tokens; both themes are first-class, not an afterthought filter.

---

## 2. Design system — dual-mode token layer

Extend `tokens.css`. Move all color to **semantic tokens** driven by `[data-theme]`, so components never reference raw hex.

### 2.1 Theming mechanism
```css
:root { color-scheme: light dark; }              /* default resolves via media */
:root, [data-theme="light"] { /* light semantic tokens */ }
[data-theme="dark"]         { /* dark semantic tokens  */ }
@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) { /* dark tokens (OS default) */ }
}
```
- Theme stored in `localStorage('nexora_theme')`, applied to `<html data-theme>` in `main.jsx` **before paint** (inline script) to avoid FOUC.
- `<meta name="theme-color">` updated on toggle.

### 2.2 Semantic tokens (define once, both themes)
| Token | Light | Dark | Use |
|---|---|---|---|
| `--bg` | `#f6f5f2` | `#0b0b10` | page canvas |
| `--bg-elevated` | `#ffffff` | `#14141c` | cards, nav |
| `--bg-sunken` | `#efede8` | `#08080c` | wells, insets |
| `--text` | `#0f0f1e` | `#f4f2f7` | primary text |
| `--text-dim` | `ink-70` | `rgba(244,242,247,.66)` | body |
| `--text-mute` | `ink-50` | `rgba(244,242,247,.45)` | captions |
| `--border` | `ink-12` | `rgba(255,255,255,.09)` | hairlines |
| `--accent` | `#e05263` | `#ff6376` | the one accent |
| `--accent-contrast` | `#fff` | `#0b0b10` | text on accent |
| `--glass` | `rgba(255,255,255,.7)` | `rgba(20,20,28,.6)` | blur panels |
| `--shadow-*` | keep existing | deepen + coral-tinted ambient | elevation |

### 2.3 New tokens to add
- **Type:** add `--text-4xl: clamp(4rem,9vw,7rem)` for hero; `--tracking-tight: -0.03em`; keep the existing scale.
- **Gradients:** `--mesh-1`, `--mesh-2` (2–3 stop radial meshes, coral + neutral, low opacity); `--gradient-accent` (coral→accent-strong for the rare CTA).
- **Effects:** `--noise` (base64 SVG fractal noise, ~3% opacity overlay); `--blur-nav: saturate(180%) blur(20px)`.
- **Motion:** add `--dur-slower: 1100ms`, `--ease-spring: cubic-bezier(.34,1.56,.64,1)` (magnetic/tilt), reuse `--ease-out`.
- **Z-index scale:** `--z-nav`, `--z-drawer`, `--z-cursor`, `--z-toast`.

### 2.4 Ambient background layers (reusable, GPU-cheap)
- `<MeshGradient>` — fixed, blurred radial blobs, `will-change: transform`, drifts slowly (respect reduced-motion → static).
- `<NoiseOverlay>` — one fixed `::before` at body level, `mix-blend-mode: overlay`, ~3%.
- Both mount once at app root, re-tint via tokens per theme.

---

## 3. Component architecture

```
frontend/src/
  styles/
    tokens.css              ← extended: semantic + dual-mode + effects
    base.css                ← reset, buttons, inputs, focus rings
  lib/
    theme.jsx               ← ThemeProvider + useTheme() + no-FOUC init
  hooks/
    useReveal.js            ← (exists) scroll reveal
    useMagnetic.js          ← magnetic hover for CTAs
    useTilt.js              ← 3D card tilt (pointer-driven)
    useParallax.js          ← scroll-linked translate
    useCountUp.js           ← wrap existing CountUp logic
    useScrollProgress.js    ← for scroll-linked showcase
  components/
    ui/                     ← design-system primitives (dumb, reusable)
      Button.jsx            ← variants: accent | dark | ghost | light; magnetic
      Card.jsx              ← elevation, border, hover-lift, optional tilt
      Badge.jsx  Chip.jsx  Eyebrow.jsx  SectionHead.jsx
      Reveal.jsx            ← wraps useReveal (fade/scale/blur/mask variants)
      Marquee.jsx           ← infinite logo/category ribbon
      GlassPanel.jsx  Divider.jsx  Skeleton.jsx
      ThemeToggle.jsx       ← sun/moon morph, in nav
      MeshGradient.jsx  NoiseOverlay.jsx  Cursor.jsx (desktop-only dot)
    layout/
      Nav.jsx               ← sticky, blur, active states, theme toggle, CTA
      Footer.jsx            ← editorial multi-column + big wordmark
    landing/                ← one file per section (see §4)
      Hero.jsx  LogoCloud.jsx  Problem.jsx  Pipeline.jsx
      Showcase.jsx  Features.jsx  LiveIndex.jsx  Tracker.jsx
      Testimonials.jsx  Pricing.jsx  FAQ.jsx  FinalCta.jsx
  pages/
    Landing.jsx             ← thin: composes <landing/*> sections in order
```

**Rules:** `ui/` primitives are theme-agnostic (tokens only), no data fetching.
`landing/*` sections own their copy + data hooks. `Landing.jsx` is just composition + the top-level data fetch passed down (or React Query if adopted).

---

## 4. Section-by-section specification

Order is deliberate: hook → credibility → tension → mechanism → proof → value → conversion. Each section has its own visual identity but shares the rhythm.

### § Hero — cinematic
- **Layout:** centered editorial, max ~880px text column, full-viewport-ish (`min-height: 92vh`). Asymmetry comes from a floating product panel offset below.
- **Content:** live badge (`{active_count} live opportunities tracked right now` — real), 3-line mask-reveal headline (*"The World's / Opportunity / Intelligence Network"*), supporting sub, **AI search bar** (the real hero interaction → routes to `/explore?q=`), trending category chips.
- **Product preview:** floating glass panel showing a faux "results" stack / dashboard mock, soft shadow, subtle parallax on scroll, 2–4° tilt on pointer. Reads in both themes.
- **Background:** `<MeshGradient>` + noise; in dark mode a faint coral aurora behind the headline.
- **Motion:** staggered blur-up on the badge→headline→sub→search→chips (existing `hero-stagger` pattern, upgraded to blur+translate). Search bar has focus glow. CTA magnetic.
- **Data:** `api.stats()` for the badge; graceful skeleton if pending.

### § LogoCloud / Social proof
- **Layout:** slim band under hero. Eyebrow "Sourced from" + infinite `<Marquee>` of source/category wordmarks (universities, gov portals, accelerators — presented as source *types*, honestly).
- **Motion:** seamless marquee, pauses on hover, mask-fade edges. Reduced-motion → static wrap.
- **Note:** no fake company logos. Frame as "indexes public sources like …" to stay truthful.

### § Featured / Trending feed
- **Layout:** section head (`Trending this week`) + 3-up `OpportunityCard` grid, "Explore all →" ghost link.
- **Data:** `api.trending(3)` — real click-ranked. Skeletons while null.
- **Motion:** staggered reveal; cards lift + hairline-border brighten on hover.

### § Problem — tension
- **Layout:** centered lede + 4-card asymmetric grid (scattered / found-too-late / dead-links / unsearchable).
- **Visual identity:** slightly sunken background (`--bg-sunken`), muted; the "gap" the product closes.
- **Motion:** staggered reveal, icon micro-transition on hover.

### § Pipeline — "how it works" (cinematic dark band, always dark)
- **Layout:** full-bleed dark section (dark tokens even in light mode — the one intentional inversion). Left sticky copy + right 4-step stack (Discover → Verify → Match → Track), each numbered.
- **Motion:** **scroll-linked** — as the user scrolls, the active step highlights (coral accent rail), a connecting line draws. Sticky left column.
- **Depth:** glass step cards over mesh; coral glow on active step only.

### § Interactive Showcase — the centerpiece
- **Layout:** sticky-scroll product story. A pinned device/panel frame on one side; as the user scrolls, the panel content swaps through 3–4 states (search → results → detail → tracker), copy on the other side updates in lockstep.
- **Impl:** `useScrollProgress()` maps scroll range → active frame index; crossfade + subtle scale between states. Mobile → horizontal swipe carousel fallback.
- **This is the Awwwards moment.** Budget the most craft here.

### § Features — capability grid
- **Layout:** editorial 2×3 (or bento) grid. Mix card sizes (bento) for asymmetry: one large "AI natural-language search" tile spanning 2 cols, smaller tiles for verification, deadline reminders, tracker, categories, global coverage.
- **Motion:** reveal stagger; large tile has a live micro-demo (typed query → parsed intent chips animating in).

### § Live Index — data as proof
- **Layout:** left copy ("For universities, accelerators & organizations") + right **live category bar chart** built from `stats.categories_breakdown` (real). Refactor existing `Partners` bars into a polished, animated chart.
- **Motion:** bars grow from 0 on reveal (`useCountUp` for the counts). Hover → tooltip with exact count.
- **Also here:** the 4-stat band (`CountUp`) — indexed / live today / categories / 24-7 monitoring, all real from `/stats`.

### § Tracker / Benefits — workflow
- **Layout:** show the Saved→Applied→Accepted kanban lifecycle as a small animated board; copy on how nothing slips past a deadline.
- **Motion:** a card animates across columns on reveal (once, tasteful).

### § Testimonials
- **Layout:** single large rotating quote (keep current auto-rotate + dots) OR a 3-card row — pick rotating for focus. Big editorial quote, avatar initial, role.
- **Motion:** crossfade between quotes; dots as progress. Keep it honest — label as representative user stories.

### § Pricing
- **Layout:** 3 tiers (Free / Pro / Teams) as layered cards, middle "Most popular" elevated with coral hairline + subtle glow. Monthly/annual toggle (animated pill). Feature checklist per tier.
- **Motion:** toggle morphs prices with a count roll; popular card sits slightly forward with stronger shadow.
- **Note:** scaffold copy; wire to real billing later (none exists yet — mark as "coming soon" honestly if unpriced).

### § FAQ
- **Layout:** centered, max ~760px, accordion list. Questions: how sourcing works, is it free, how deadlines are verified, data/privacy, coverage.
- **Motion:** smooth height accordion (`grid-template-rows` 0fr→1fr trick), chevron rotate, one-open-at-a-time.

### § Final CTA — conversion
- **Layout:** full-bleed, generous, big headline + coral accent line, two buttons (Create free account / Browse without signing up). Mesh + noise; the boldest coral moment on the page.
- **Motion:** headline mask-reveal; primary button magnetic + shine sweep.

### § Footer
- **Layout:** editorial multi-column (Product / Company / Resources / Legal) + oversized `NEXORA` wordmark that clips a subtle gradient, theme toggle mirror, "built by" line, socials.
- **Detail:** top hairline divider; wordmark parallax-drifts a few px on scroll.

---

## 5. Animation & interaction grammar

Centralized so nothing feels ad-hoc. Every effect ships with a reduced-motion fallback.

| Interaction | Where | Impl | Duration/ease |
|---|---|---|---|
| Blur/scale reveal | all sections | `<Reveal>` + IntersectionObserver | `--dur-slow`, `--ease-out`, staggered `--i*80ms` |
| Mask/line reveal | headlines | clip-path / translate on `<span>` lines | `--dur-slow` |
| Magnetic button | primary CTAs | `useMagnetic` (translate toward cursor, spring back) | `--ease-spring` |
| Card tilt | hero panel, feature cards | `useTilt` (rotateX/Y from pointer, max 6°) | `--dur-fast` |
| Parallax | hero panel, footer wordmark, mesh | `useParallax` (transform on scroll) | rAF-throttled |
| Scroll-linked | Pipeline, Showcase | `useScrollProgress` → active index / draw line | frame-synced |
| Marquee | logo cloud | CSS keyframe translate, pause on hover | linear, ~30s loop |
| CountUp | stat band, chart, pricing | existing + `useCountUp` | on reveal |
| Custom cursor | desktop only | `<Cursor>` dot that scales on interactive hover | spring |
| Theme morph | nav toggle | sun↔moon path morph + 200ms cross-tint | `--dur-med` |
| Skeleton shimmer | any pending data | existing `.skeleton` | 1.4s loop |

**Guardrails:** no effect >400ms except reveals/marquee. No layout thrash — animate `transform`/`opacity`/`filter` only. `will-change` applied surgically and removed after. Everything behind `@media (prefers-reduced-motion: reduce)` collapses to instant/static.

---

## 6. Responsive strategy

Desktop-first design, but every breakpoint deliberate. Never "compressed."

| Breakpoint | Behavior |
|---|---|
| ≥1160px | full editorial layout; container `--container` (1160px) |
| 900–1159 | grids relax (3→2 col), hero panel scales, spacing holds |
| 600–899 (tablet) | 2-col → 1-col for dense grids; sticky-scroll showcase → stacked; nav condenses |
| <600 (mobile) | single column; hero type `--text-4xl`→clamp floor; showcase → swipe carousel; nav → sheet menu; marquee slows; disable tilt/custom-cursor/parallax |
| Touch devices | no hover-only affordances; tap states replace hover; magnetic/cursor off |

Mobile nav: full-screen sheet with staggered link reveal, theme toggle inside. CTA persists.

---

## 7. Accessibility & quality bar (non-negotiable)

- **Contrast:** all text ≥ WCAG AA in *both* themes (verify coral-on-bg and dim text especially).
- **Focus:** visible focus ring (`box-shadow` ring token) on every interactive element; never `outline:none` without replacement.
- **Keyboard:** nav, theme toggle, FAQ accordion, pricing toggle, search — all keyboard operable; accordion uses proper `button`+`aria-expanded`.
- **Semantics:** one `<h1>` (hero), logical heading order, `<nav>`/`<main>`/`<footer>` landmarks, `aria-label` on icon buttons.
- **Motion:** `prefers-reduced-motion` fully honored (already in base.css — extend to new hooks).
- **Images:** `alt` on everything; lazy-load below the fold; explicit dimensions to avoid CLS.
- **SEO:** per-page `<title>`/meta/OG (reuse/add `useSEO`), `theme-color`, semantic sitemap already exists backend-side.

---

## 8. Performance budget

- LCP < 2.0s: hero text is real text (not image); mesh is CSS, not a heavy asset; hero product panel is DOM/SVG, not a large PNG.
- No animation library required for v1 (CSS + IntersectionObserver + rAF hooks). If needed later, add Framer Motion *only* for the Showcase.
- Route-level code-split heavy sections (Showcase) if bundle grows.
- Fonts: system font stack already in use (`--font-sans`) → zero font-load cost. If a display face is added (optional for hero wordmark), preload + `font-display: swap`, one weight.
- Images: `hero.png` → prefer SVG/DOM panel; compress + `loading="lazy"` for any raster.
- Target: Lighthouse ≥ 95 across the board.

---

## 9. Build order (phased, each phase shippable)

**Phase 0 — Foundation**
1. Extend `tokens.css` → semantic + dual-mode tokens, effects, motion.
2. `theme.jsx` (ThemeProvider, no-FOUC init in `main.jsx`, `<meta theme-color>`).
3. Harden `base.css` focus rings; add `MeshGradient`, `NoiseOverlay`, mount at root.

**Phase 1 — Primitives (`ui/`)**
4. `Button`, `Card`, `Badge`, `Chip`, `Eyebrow`, `SectionHead`, `Reveal`, `Divider`, `Skeleton`, `ThemeToggle`, `Marquee`, `GlassPanel`.
5. Motion hooks: `useMagnetic`, `useTilt`, `useParallax`, `useCountUp`, `useScrollProgress`, `Cursor`.

**Phase 2 — Chrome**
6. Rebuild `Nav` (sticky/blur/active/toggle/CTA + mobile sheet) and `Footer` (editorial + wordmark).

**Phase 3 — Sections (top-down, ship as they land)**
7. Hero → LogoCloud → Featured (wire `trending`) → Problem.
8. Pipeline (dark, scroll-linked) → Showcase (sticky-scroll centerpiece).
9. Features (bento) → LiveIndex (wire `stats`) → Tracker.
10. Testimonials → Pricing → FAQ → FinalCta.

**Phase 4 — Polish pass**
11. Dual-mode audit (every section in both themes), contrast fixes.
12. Reduced-motion + keyboard + screen-reader pass.
13. Responsive pass (tablet + mobile), Lighthouse, CLS/LCP tuning.
14. Micro-interaction detailing (shine, cursor, dividers, hover morphs).

---

## 10. Definition of done

- [ ] Loads flawlessly in light **and** dark; toggle persists, no FOUC.
- [ ] All stats/feed/chart numbers come from live API with skeleton fallbacks.
- [ ] Every section reveals on scroll; nothing janks; 60fps on mid hardware.
- [ ] `prefers-reduced-motion` yields a calm, static, fully-usable page.
- [ ] Keyboard + screen-reader complete; AA contrast in both themes.
- [ ] Mobile is spacious, not compressed; showcase degrades to swipe.
- [ ] Lighthouse ≥ 95 (Perf/A11y/Best-Practices/SEO).
- [ ] Zero fabricated data or fake partner logos — everything truthful.
- [ ] Reads as portfolio-worthy: *"Apple × Stripe × Linear × Vercel."*

---

## Appendix A — Section → data source map

| Section | Endpoint | Fallback |
|---|---|---|
| Hero badge | `api.stats().active_count` | skeleton chip |
| Featured | `api.trending(3)` | 3 skeleton cards |
| Stat band | `api.stats()` | zeros → CountUp on arrival |
| Live Index chart | `api.stats().categories_breakdown` | placeholder bars |
| Hero search | `api.search(q)` (routes to `/explore`) | plain navigate |
| Pricing / Testimonials / FAQ | static (honest copy) | — |

## Appendix B — Open decisions to confirm during build

1. Adopt React Query for the landing data fetches, or keep the current `useEffect`+`useState`? (Landing is read-only → either is fine; React Query if the rest of the app adopts it.)
2. Pricing: publish real numbers or mark tiers "coming soon" until billing exists?
3. Display typeface for the hero wordmark, or stay 100% system stack (zero-cost, recommended)?
4. Framer Motion for the Showcase only, or hand-rolled rAF (recommended: hand-rolled first, escalate if needed)?
