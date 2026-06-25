# Nexora Frontend — Architecture

How the frontend is wired: folder structure, routing, the data layer, auth,
and the design system. This is a living document — each phase updates it.

---

## Stack

- **React 18** + **Vite 5** (JSX, ES modules)
- **react-router-dom v6** — routing
- **@tanstack/react-query v5** — server-state fetching/caching/mutations
- Plain CSS with **design tokens** (CSS custom properties). No CSS framework.
- Native `fetch` (thin wrapper) + native `EventSource` (SSE) — no axios.

One environment variable: `VITE_API_URL` (backend base; defaults to
`http://localhost:8000`). All API calls hit `${VITE_API_URL}/api`.

---

## Folder structure

```
src/
  main.jsx                # entry: providers + <BrowserRouter>
  App.jsx                 # the full route tree

  styles/
    tokens.css            # :root design tokens (single source of truth)
    globals.css           # @import tokens + reset + base + utilities

  lib/
    api.js                # fetch wrapper, ApiError, tokenStore, api.{get,post,...}
    queryClient.js        # configured React Query QueryClient
    auth.jsx              # AuthProvider + useAuth() (JWT in localStorage)
    useSSE.js             # EventSource hook (for the Intelligence Console)

  components/
    ui/                   # design-system primitives (see "Design system")
      Button Card Badge Input Select Avatar Spinner Tabs Modal EmptyState
      ui.css · index.js   # barrel: import { Button } from '../components/ui'
    layout/
      PublicLayout.jsx    # PublicNav + <Outlet/> + PublicFooter (secondary marketing)
      AppLayout.jsx       # dark sidebar + topbar shell for /app/*
      ProtectedRoute.jsx  # gates authed zones; redirects to /login
      layout.css

  pages/
    ComingSoon.jsx        # Phase-0 placeholder for not-yet-built routes
    marketing/Home.jsx    # the landing page (self-contained chrome)
    # auth/, app/, community/  — added in later phases
```

---

## Routing

Defined entirely in [`src/App.jsx`](../src/App.jsx) with `<Routes>`. Four zones:

1. **Home** (`/`) renders `<Home />` directly — **not** wrapped in any layout.
2. **Secondary marketing** (`/product`, `/pricing`, `/explore`, `/about`,
   `/contact`, `/terms`, `/privacy`) render inside `<PublicLayout />` via a
   layout route (`<Route element={<PublicLayout/>}>` + `<Outlet/>`).
3. **Auth** (`/login`, `/signup`, `/forgot-password`) are standalone.
   `/onboarding` is gated by `ProtectedRoute`.
4. **App + Community** are nested under `/app`, wrapped in
   `<ProtectedRoute><AppLayout/></ProtectedRoute>`. Child routes render through
   `AppLayout`'s `<Outlet/>`. `index` → Dashboard.

Unknown paths `<Navigate to="/" replace />`.

> **Why Home is self-contained.** The original landing page ships its own
> fixed nav, rich footer, and a single injected `<style>` block. To guarantee
> it renders **pixel-identical** through the Phase-0 refactor, it was moved
> verbatim into `pages/marketing/Home.jsx` and rendered directly at `/` —
> *not* through `PublicLayout`. `PublicLayout` (a lighter, tokenized nav +
> footer) is therefore used only for the *other* marketing pages. This avoids
> risky CSS surgery on the landing and keeps the two concerns independent.
> Home's only behavioral change: auth CTAs (Log in / Get Started / Go Pro /
> Start Free / Sign up) are now real router `<Link>`s; in-page `#anchor`
> links still smooth-scroll the page.

---

## Data layer

**`lib/api.js`** — one thin client over `fetch`:

- `API_BASE` = `(import.meta.env.VITE_API_URL ?? 'http://localhost:8000')` (trailing slash stripped).
- `request(path, { method, body, headers, auth=true, signal })` builds
  `` `${API_BASE}/api${path}` ``, JSON-encodes the body, attaches
  `Authorization: Bearer <token>` when `auth` and a token exist, handles `204`,
  and throws `ApiError(message, status, body)` on non-2xx.
- Convenience methods: `api.get/post/put/patch/del` and `api.raw`.
- `tokenStore.{get,set,clear}` persists the JWT under `localStorage['nexora_token']`.

**`lib/queryClient.js`** — shared `QueryClient`: `staleTime` 60s, `gcTime` 5m,
no refetch-on-focus, **no retry on 4xx** (inspects `ApiError.status`), one retry
on network/5xx, mutations never retry.

**`lib/useSSE.js`** — `useSSE(path, { enabled, max })` opens an `EventSource`
to `` `${API_BASE}/api${path}` ``, buffers events in a bounded ring, and exposes
`{ events, status, close, clear }`. Powers the Intelligence Console (Phase 3).

---

## Auth

**`lib/auth.jsx`** — `AuthProvider` + `useAuth()`:

- State: `user`, `token` (initialized from `tokenStore.get()`), `loading`.
- `login(email, password)` → `POST /auth/login` (unauthenticated), persists
  `access_token`, then `refresh()`.
- `signup(payload)` → `POST /auth/register`.
- `refresh()` → `GET /auth/me`; clears the token **only on 401** (keeps it on
  other errors so the app still works before the Phase-1 backend exists).
- `logout()` clears token + user.
- Derived `isAuthenticated = Boolean(token)`.

**`ProtectedRoute`** shows a spinner while `loading`, redirects to `/login`
(remembering `location` in `state.from`) when unauthenticated, else renders
its children. Wraps `/app/*` and `/onboarding`.

> Phase 0 degrades gracefully: the `/api/auth/*` endpoints don't exist yet, so
> `refresh()` keeps a present token rather than logging out. Phase 1 adds the
> real backend `User`/JWT and these endpoints go live unchanged.

---

## Design system

**Tokens** live in [`src/styles/tokens.css`](../src/styles/tokens.css) as
`:root` custom properties — the single source of truth, extracted from the
landing page:

- **Surfaces**: `--cream #f5f0e8`, `--cream-light`, `--yellow-pale #f5f2bc`,
  `--white`, `--grey-light`, `--grey-border`.
- **Brand**: `--maroon #3d1020`, `--maroon-mid`, `--maroon-btn`, `--rust #8b3a3a`.
- **Dark**: `--dark #111`, `--dark-card`, `--dark-mid`.
- **Text**: `--text-primary #1a1a1a`, `--text-muted`, `--grey-text`.
- **Status**: `--success/-bg`, `--warning/-bg`, `--danger/-bg`, `--info/-bg`.
- **Type**: `--ff-serif` (Playfair Display) for headings, `--ff-sans` (Inter) body.
- **Radii**: `--radius-sm/md/lg/xl` = 8/16/24/32, `--radius-pill` 100px.
- **Elevation**: `--shadow-sm/md/lg`. **Motion**: `--ease`.
- **Layout**: `--container-max 1200px`, `--sidebar-w 248px`, `--topbar-h 64px`.

**`globals.css`** imports tokens, applies a reset + base body styles, and ships
utilities (`.container`, `.section-label`, focus ring, reduced-motion).

**UI kit** (`src/components/ui/`, imported via the `index.js` barrel which also
loads `ui.css`) — every primitive is tokenized to the cream/maroon identity:

| Component | Notes |
|---|---|
| `Button` | variants primary/dark/outline/ghost/subtle/danger · sizes sm/md/lg · `block` · `loading` · polymorphic `as` (Link/a) |
| `Card` | variants flat/raised/dark · `pad` · `hover` · `as` |
| `Badge` | neutral/maroon/yellow/success/warning/danger/info/outline · `dot` |
| `Input` | label/hint/error · `multiline` → textarea |
| `Select` | label/hint/error · `options` or children · placeholder |
| `Avatar` | initials fallback · sizes xs–xl |
| `Spinner` | sizes · `light` |
| `Tabs` | controlled (`items`, `value`, `onChange`) |
| `Modal` | `open`/`onClose` · Escape + overlay close · scroll-lock |
| `EmptyState` | icon/title/desc/action (used by `ComingSoon`) |

---

## Providers (entry)

[`src/main.jsx`](../src/main.jsx) nests:

```
<QueryClientProvider client={queryClient}>
  <AuthProvider>
    <BrowserRouter>
      <App />
```

and imports `./styles/globals.css` once.

---

## Conventions

- API paths passed to `api.*` are **without** the `/api` prefix (the client adds it).
- Server state → React Query; ephemeral UI state → local `useState`.
- New pages go under `pages/<zone>/`; shared chrome under `components/layout/`;
  reusable primitives under `components/ui/` (export from the barrel).
- Keep the landing (`pages/marketing/Home.jsx`) self-contained — don't fold it
  into `PublicLayout`.
