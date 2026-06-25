import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'

import PublicLayout from './components/layout/PublicLayout'
import AppLayout from './components/layout/AppLayout'
import ProtectedRoute from './components/layout/ProtectedRoute'

import Home from './pages/marketing/Home'
import ComingSoon from './pages/ComingSoon'

import Login from './pages/auth/Login'
import Signup from './pages/auth/Signup'
import ForgotPassword from './pages/auth/ForgotPassword'

/* ─────────────────────────────────────────────
   App — the full route tree.

   Zone 1 · Public/marketing   → PublicLayout (Home is bespoke, no layout)
   Zone 2 · Auth & onboarding  → standalone
   Zone 3 · The app            → AppLayout, gated by ProtectedRoute
   Zone 4 · Community          → nested under /app

   Every non-Home route is stubbed with <ComingSoon /> in Phase 0 so the
   tree is fully navigable; real pages land phase by phase.
───────────────────────────────────────────── */
export default function App() {
  return (
    <Routes>
      {/* ── Zone 1 · Home (own chrome, rendered directly) ── */}
      <Route path="/" element={<Home />} />

      {/* ── Zone 1 · Secondary marketing (shared PublicLayout) ── */}
      <Route element={<PublicLayout />}>
        <Route path="/product" element={<ComingSoon title="Product" phase="Phase 5" />} />
        <Route path="/pricing" element={<ComingSoon title="Pricing" phase="Phase 5" />} />
        <Route path="/explore" element={<ComingSoon title="Explore opportunities" phase="Phase 5" />} />
        <Route path="/about" element={<ComingSoon title="About Nexora" phase="Phase 5" />} />
        <Route path="/contact" element={<ComingSoon title="Contact us" phase="Phase 5" />} />
        <Route path="/terms" element={<ComingSoon title="Terms of Service" phase="Phase 5" />} />
        <Route path="/privacy" element={<ComingSoon title="Privacy Policy" phase="Phase 5" />} />
      </Route>

      {/* ── Zone 2 · Auth & onboarding ── */}
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route
        path="/onboarding"
        element={
          <ProtectedRoute>
            <ComingSoon title="Build your profile" phase="Phase 1" />
          </ProtectedRoute>
        }
      />

      {/* ── Zone 3 + 4 · The app (gated) ── */}
      <Route
        path="/app"
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        {/* Core loop */}
        <Route index element={<ComingSoon title="Dashboard" phase="Phase 2" />} />
        <Route path="opportunities" element={<ComingSoon title="Opportunities Explorer" phase="Phase 2" />} />
        <Route path="opportunities/:id" element={<ComingSoon title="Opportunity detail" phase="Phase 2" />} />
        <Route path="tracker" element={<ComingSoon title="Application Tracker" phase="Phase 2" />} />

        {/* Stickiness */}
        <Route path="reminders" element={<ComingSoon title="Deadlines & Reminders" phase="Phase 3" />} />
        <Route path="profile" element={<ComingSoon title="Profile & Settings" phase="Phase 3" />} />
        <Route path="intelligence" element={<ComingSoon title="Intelligence Console" phase="Phase 3" />} />

        {/* Zone 4 · Community */}
        <Route path="community" element={<ComingSoon title="Community Hub" phase="Phase 4" />} />
        <Route path="community/stories" element={<ComingSoon title="Success Stories" phase="Phase 4" />} />
        <Route path="community/stories/:id" element={<ComingSoon title="Story" phase="Phase 4" />} />
        <Route path="community/questions" element={<ComingSoon title="Q&A" phase="Phase 4" />} />
        <Route path="community/questions/:id" element={<ComingSoon title="Question" phase="Phase 4" />} />
        <Route path="community/mentors" element={<ComingSoon title="Mentors" phase="Phase 4" />} />
        <Route path="community/mentors/:id" element={<ComingSoon title="Mentor" phase="Phase 4" />} />
        <Route path="community/tips" element={<ComingSoon title="Application Tips" phase="Phase 4" />} />
      </Route>

      {/* ── Fallback ── */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
