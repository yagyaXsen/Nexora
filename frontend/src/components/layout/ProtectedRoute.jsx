import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../lib/auth'
import { Spinner } from '../ui'

/**
 * ProtectedRoute — gates authenticated zones (/app/*, /onboarding).
 * • While the session is hydrating, shows a spinner.
 * • If unauthenticated, redirects to /login and remembers where the
 *   user was headed (location.state.from) so login can bounce back.
 */
export default function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div style={{ display: 'grid', placeItems: 'center', minHeight: '100vh' }}>
        <Spinner size="lg" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  return children
}
