import React, { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../lib/auth'
import { ApiError } from '../../lib/api'
import { Button, Input } from '../../components/ui'
import AuthBrand from './AuthBrand'
import './auth.css'

/* Cheap, dependency-free password strength heuristic → 0..3. */
function scorePassword(pw) {
  if (!pw) return 0
  let score = 0
  if (pw.length >= 8) score++
  if (pw.length >= 12) score++
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++
  if (/\d/.test(pw)) score++
  if (/[^A-Za-z0-9]/.test(pw)) score++
  return Math.min(3, Math.max(score - 1, pw ? 1 : 0))
}

const STRENGTH = [
  { label: '', cls: '' },
  { label: 'Weak', cls: 'is-on--weak' },
  { label: 'Okay', cls: 'is-on--ok' },
  { label: 'Strong', cls: 'is-on--strong' },
]

/**
 * Signup — registers via POST /auth/register through useAuth().signup,
 * then sends the new user into /onboarding to build their profile.
 */
export default function Signup() {
  const { signup } = useAuth()
  const navigate = useNavigate()

  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const strength = useMemo(() => scorePassword(form.password), [form.password])

  const onChange = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }))
    if (error) setError('')
  }

  const onSubmit = async (e) => {
    e.preventDefault()
    if (submitting) return

    if (form.password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }

    setSubmitting(true)
    setError('')
    try {
      await signup({
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
      })
      navigate('/onboarding', { replace: true })
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
        eyebrow="Get started free"
        headline={<>Stop scouring the web. <em>Start applying.</em></>}
        sub="Create your account and let Nexora surface scholarships, fellowships, and grants matched to who you are."
      />

      <div className="auth__panel">
        <div className="auth__card">
          <div className="auth__head">
            <h1 className="auth__title">Create your account</h1>
            <p className="auth__subtitle">Free to start. No credit card required.</p>
          </div>

          <form className="auth__form" onSubmit={onSubmit} noValidate>
            {error && (
              <div className="auth__error" role="alert">
                <span aria-hidden>⚠</span>
                {error}
              </div>
            )}

            <Input
              label="Full name"
              name="name"
              type="text"
              autoComplete="name"
              placeholder="Ada Lovelace"
              value={form.name}
              onChange={onChange}
              required
            />
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
              autoComplete="new-password"
              placeholder="At least 8 characters"
              value={form.password}
              onChange={onChange}
              required
            />

            {form.password && (
              <div className="auth__strength">
                <div className="auth__strength-bars">
                  {[1, 2, 3].map((i) => (
                    <span
                      key={i}
                      className={`auth__strength-bar ${i <= strength ? STRENGTH[strength].cls : ''}`}
                    />
                  ))}
                </div>
                <span className="auth__strength-label">
                  {strength > 0 ? `${STRENGTH[strength].label} password` : ' '}
                </span>
              </div>
            )}

            <Button type="submit" variant="primary" size="lg" block loading={submitting}>
              {submitting ? 'Creating account…' : 'Create account'}
            </Button>

            <p className="auth__legal">
              By creating an account you agree to our{' '}
              <Link to="/terms">Terms</Link> and <Link to="/privacy">Privacy Policy</Link>.
            </p>
          </form>

          <p className="auth__foot">
            Already have an account?{' '}
            <Link to="/login" className="auth__link">
              Log in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
