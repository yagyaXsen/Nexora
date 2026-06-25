import React, { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../lib/auth'
import { ApiError } from '../../lib/api'
import { Button, Input } from '../../components/ui'
import AuthBrand from './AuthBrand'
import './auth.css'

/**
 * Login — Zone 2 entry. Authenticates against POST /auth/login via
 * useAuth().login, then bounces the user back to wherever ProtectedRoute
 * sent them from (location.state.from) or /app by default.
 */
export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = location.state?.from?.pathname || '/app'

  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const onChange = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }))
    if (error) setError('')
  }

  const onSubmit = async (e) => {
    e.preventDefault()
    if (submitting) return
    setSubmitting(true)
    setError('')
    try {
      await login(form.email.trim(), form.password)
      navigate(from, { replace: true })
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : 'Something went wrong. Please try again.',
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="auth">
      <AuthBrand
        eyebrow="Welcome back"
        headline={<>Your next opportunity is <em>already waiting.</em></>}
        sub="Pick up where you left off — saved opportunities, live deadlines, and fresh matches tuned to your profile."
      />

      <div className="auth__panel">
        <div className="auth__card">
          <div className="auth__head">
            <h1 className="auth__title">Log in to Nexora</h1>
            <p className="auth__subtitle">Enter your details to access your workspace.</p>
          </div>

          <form className="auth__form" onSubmit={onSubmit} noValidate>
            {error && (
              <div className="auth__error" role="alert">
                <span aria-hidden>⚠</span>
                {error}
              </div>
            )}

            <Input
              label="Email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="you@university.edu"
              value={form.email}
              onChange={onChange}
              required
            />
            <Input
              label="Password"
              name="password"
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              value={form.password}
              onChange={onChange}
              required
            />

            <div className="auth__meta">
              <span />
              <Link to="/forgot-password" className="auth__link">
                Forgot password?
              </Link>
            </div>

            <Button type="submit" variant="primary" size="lg" block loading={submitting}>
              {submitting ? 'Signing in…' : 'Log in'}
            </Button>
          </form>

          <p className="auth__foot">
            New to Nexora?{' '}
            <Link to="/signup" className="auth__link">
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
