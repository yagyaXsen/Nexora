import { Routes, Route, useLocation } from 'react-router-dom'
import { useEffect, lazy, Suspense } from 'react'
import Nav from './components/Nav.jsx'
import Footer from './components/Footer.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import { ToastProvider } from './components/Toast.jsx'
import { api } from './lib/api.js'

// Pages
import Landing from './pages/Landing.jsx'
import Explore from './pages/Explore.jsx'
import OpportunityDetail from './pages/OpportunityDetail.jsx'
import OrganizationDetail from './pages/OrganizationDetail.jsx'
import Login from './pages/Login.jsx'
import Signup from './pages/Signup.jsx'
import ForgotPassword from './pages/ForgotPassword.jsx'
import ResetPassword from './pages/ResetPassword.jsx'
import Onboarding from './pages/Onboarding.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Tracker from './pages/Tracker.jsx'
import Profile from './pages/Profile.jsx'
import Settings from './pages/Settings.jsx'
import Notifications from './pages/Notifications.jsx'
import Privacy from './pages/Privacy.jsx'
import { ADMIN_NO_LOGIN } from './lib/env.js'

// The admin console is a localhost-only tool. It is lazy-loaded and registered
// ONLY in dev builds (import.meta.env.DEV → replaced with `false` at build
// time), so the production bundle never contains the route or the Admin chunk.
const AdminPage = import.meta.env.DEV ? lazy(() => import('./pages/Admin.jsx')) : null

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])
  return null
}

export default function App() {
  const location = useLocation()
  
  // Pre-warm backend and Neon DB instance immediately on initial app load
  useEffect(() => {
    api.healthCheck()
  }, [])

  // Hide standard header and footer on landing & all auth/onboarding pages.
  const isAuthOrLandingPage = [
    '/',
    '/login',
    '/signup',
    '/forgot-password',
    '/reset-password',
    '/onboarding'
  ].includes(location.pathname)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <ToastProvider>
        <ScrollToTop />
        {!isAuthOrLandingPage && <Nav />}
        <main style={{ flex: 1 }}>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route
              path="/explore"
              element={
                <ProtectedRoute>
                  <Explore />
                </ProtectedRoute>
              }
            />
            <Route
              path="/opportunities/:idOrSlug"
              element={
                <ProtectedRoute>
                  <OpportunityDetail />
                </ProtectedRoute>
              }
            />
            <Route path="/organizations/:slug" element={<OrganizationDetail />} />
            <Route path="/privacy" element={<Privacy />} />

            {/* Auth Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />

            {/* Onboarding onboarding setup wizard for new users */}
            <Route
              path="/onboarding"
              element={
                <ProtectedRoute>
                  <Onboarding />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/tracker"
              element={
                <ProtectedRoute>
                  <Tracker />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings"
              element={
                <ProtectedRoute>
                  <Settings />
                </ProtectedRoute>
              }
            />
            <Route
              path="/notifications"
              element={
                <ProtectedRoute>
                  <Notifications />
                </ProtectedRoute>
              }
            />
            {AdminPage && (
              <Route
                path="/admin"
                element={
                  ADMIN_NO_LOGIN ? (
                    // No-login mode (dev-only): open the console without a session.
                    <Suspense fallback={null}>
                      <AdminPage />
                    </Suspense>
                  ) : (
                    <ProtectedRoute>
                      <Suspense fallback={null}>
                        <AdminPage />
                      </Suspense>
                    </ProtectedRoute>
                  )
                }
              />
            )}
            {/* Catch-all route */}
            <Route path="*" element={<Landing />} />
          </Routes>
        </main>
        {!isAuthOrLandingPage && <Footer />}
      </ToastProvider>
    </div>
  )
}
