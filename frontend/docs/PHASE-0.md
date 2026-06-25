# Phase 0 — Foundation

**Goal:** turn the single-file landing into a router-driven app shell with a
data layer, auth scaffold, design-system kit, and two layouts — **without any
visible change to the landing page**. The app builds and runs at every step.

**Status:** ✅ Complete.

---

## What was built

### 1 · Dependencies
Added to `package.json` and installed:
- `react-router-dom@^6.26.0`
- `@tanstack/react-query@^5.51.0`

### 2 · Design tokens + globals
- `src/styles/tokens.css` — `:root` custom properties (palette, type, radii,
  elevation, motion, layout), extracted from the landing's inlined `:root`.
- `src/styles/globals.css` — `@import` tokens + reset + base body + utilities
  (`.container`, `.section-label`, focus-visible ring, reduced-motion).
- Imported once in `main.jsx` (replacing the old `index.css` import).

### 3 · Lib layer (`src/lib/`)
- `api.js` — `fetch` wrapper, `ApiError`, `tokenStore`, `api.{get,post,put,patch,del,raw}`.
  Base = `VITE_API_URL ?? http://localhost:8000`; all calls under `/api`;
  auto-attaches `Authorization` when a token is present.
- `queryClient.js` — configured React Query client (60s stale, no 4xx retry).
- `auth.jsx` — `AuthProvider` + `useAuth()`; JWT in `localStorage`
  (`nexora_token`); login/signup/logout/refresh; degrades gracefully before
  the Phase-1 auth endpoints exist.
- `useSSE.js` — `EventSource` hook for the scraper console.

### 4 · UI kit (`src/components/ui/`)
`Button · Card · Badge · Input · Select · Avatar · Spinner · Tabs · Modal ·
EmptyState`, all tokenized, exported from `index.js` (barrel also loads
`ui.css`).

### 5 · Layouts (`src/components/layout/`)
- `PublicLayout.jsx` — exports `PublicNav` (scroll-aware) + `PublicFooter`;
  shared chrome for **secondary** marketing pages.
- `AppLayout.jsx` — dark sticky sidebar (primary nav + community nav + profile)
  and sticky topbar (hamburger, avatar, log out); `<Outlet/>` for `/app/*`.
- `ProtectedRoute.jsx` — spinner while loading, redirect to `/login` when
  unauthenticated, remembers intended destination.

### 6 · Router
- Landing moved verbatim → `src/pages/marketing/Home.jsx` (self-contained
  chrome). Auth CTAs rewired to real `<Link>`s; in-page anchors unchanged.
- `src/pages/ComingSoon.jsx` — placeholder (built on `EmptyState`).
- `src/App.jsx` rewritten as the full route tree (Zones 1–4); every non-Home
  route stubbed with `ComingSoon`. Unknown paths redirect to `/`.

### 7 · Providers
- `src/main.jsx` wraps `App` in `QueryClientProvider` → `AuthProvider` →
  `BrowserRouter`, and imports `globals.css`.

---

## Files added

```
docs/PAGES.md                       (repo root)
frontend/docs/ARCHITECTURE.md
frontend/docs/PHASE-0.md
frontend/README.md
frontend/src/styles/tokens.css
frontend/src/styles/globals.css
frontend/src/lib/api.js
frontend/src/lib/queryClient.js
frontend/src/lib/auth.jsx
frontend/src/lib/useSSE.js
frontend/src/components/ui/*           (10 primitives + ui.css + index.js)
frontend/src/components/layout/*       (PublicLayout, AppLayout, ProtectedRoute, layout.css)
frontend/src/pages/ComingSoon.jsx
frontend/src/pages/marketing/Home.jsx
```

Modified: `frontend/package.json`, `frontend/src/App.jsx`, `frontend/src/main.jsx`.
The old `src/components/Landing.jsx` is no longer imported (superseded by
`pages/marketing/Home.jsx`).

## Endpoints wired

None yet — Phase 0 is pure foundation. The `api`/auth/SSE layers are in place;
real data wiring starts in Phase 1 (auth) and Phase 2 (core loop).

---

## How to verify

```bash
cd frontend
npm install
npm run build      # ✅ clean (102 modules transformed, no errors)
npm run dev        # open http://localhost:5173
```

Expected:
- `/` renders the landing **exactly** as before (nav, hero, all sections, footer).
- Visiting `/product`, `/pricing`, `/app`, `/app/community`, etc. shows the
  `ComingSoon` placeholder — the route tree is fully navigable.
- Navigating to `/app/*` while unauthenticated redirects to `/login` (which is
  itself a stub in Phase 0).
- No console errors; no network calls fire yet on the landing.

---

## Next — Phase 1 (Auth + Onboarding)

Backend `User` model + JWT (`auth/security.py`, `auth/deps.py`), `routes/auth.py`
(`/auth/register|login|me`), `migrate_auth.py`. Frontend: real Login, Signup,
and Onboarding pages wired to `AuthContext`; `/app/*` becomes genuinely gated.
