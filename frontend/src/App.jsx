import { Routes, Route, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import Nav from './components/Nav.jsx'
import Footer from './components/Footer.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'

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

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])
  return null
}

export default function App() {
  const location = useLocation()
  
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
      <ScrollToTop />
      {!isAuthOrLandingPage && <Nav />}
      <main style={{ flex: 1 }}>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/explore" element={<Explore />} />
          <Route path="/opportunities/:idOrSlug" element={<OpportunityDetail />} />
          <Route path="/organizations/:slug" element={<OrganizationDetail />} />
          
          {/* Auth Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />

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
          {/* Catch-all route */}
          <Route path="*" element={<Landing />} />
        </Routes>
      </main>
      {!isAuthOrLandingPage && <Footer />}
    </div>
  )
}
