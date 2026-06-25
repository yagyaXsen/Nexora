# Nexora — Frontend

The web client for **Nexora**, a global opportunity-intelligence platform that
auto-discovers scholarships, fellowships, accelerators, grants, and
competitions, then helps you track deadlines and apply.

React 18 + Vite 5 · React Router v6 · TanStack Query v5. Warm cream / maroon /
Playfair design identity.

---

## Quick start

```bash
cd frontend
npm install
npm run dev          # http://localhost:5173
```

The backend (FastAPI) should be running separately:

```bash
cd ../backend
uvicorn app.main:app --reload   # http://localhost:8000  (docs at /docs)
```

---

## Environment

One variable, read at build time by Vite:

| Variable | Default | Purpose |
|---|---|---|
| `VITE_API_URL` | `http://localhost:8000` | Backend base URL. All requests hit `${VITE_API_URL}/api`. |

For local dev with the default backend port, no `.env` is needed. To point
elsewhere, create `frontend/.env`:

```
VITE_API_URL=https://your-backend.example.com
```

---

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start the Vite dev server (HMR). |
| `npm run build` | Production build → `dist/`. |
| `npm run preview` | Serve the production build locally. |
| `npm run lint` | Lint (if configured). |

---

## Project layout

```
src/
  main.jsx            entry — providers + <BrowserRouter>
  App.jsx             route tree (4 zones)
  styles/             tokens.css · globals.css
  lib/                api.js · queryClient.js · auth.jsx · useSSE.js
  components/
    ui/               design-system primitives (Button, Card, Modal, ...)
    layout/           PublicLayout · AppLayout · ProtectedRoute
  pages/
    marketing/Home.jsx
    ComingSoon.jsx    (placeholder for routes not yet built)
```

Full detail in [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md). The route ↔
endpoint map is in [`../docs/PAGES.md`](../docs/PAGES.md). Per-phase build
notes live in [`docs/PHASE-0.md`](docs/PHASE-0.md) (and `PHASE-N.md` as they ship).

---

## Build status

The app is being built in phases (foundation → auth → core loop → stickiness →
community → growth). **Phase 0 (foundation) is complete**: routing, data layer,
auth scaffold, UI kit, and layouts are in place; the landing renders at `/` and
every other route is a navigable placeholder. See the docs above for what's live.
