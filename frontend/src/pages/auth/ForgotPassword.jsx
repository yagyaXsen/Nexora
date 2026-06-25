import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { Button, Input } from '../../components/ui'
import AuthBrand from './AuthBrand'
import './auth.css'

/**
 * ForgotPassword — request a reset link.
 *
 * NOTE: there is no backend reset endpoint yet (deferred past Phase 1).
 * To avoid leaking which emails exist, the form always confirms success
 * once a valid-looking email is submitted; wiring the real
 * POST /auth/forgot-password is a follow-up.
 */
export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)

  const onSubmit = (e) => {
    e.preventDefault()
    if (email.trim()) setSent(true)
  }

  return (
    <div className="auth">
      <AuthBrand
        eyebrow="Account recovery"
        headline={<>Locked out? <em>We've got you.</em></>}
        sub="Tell us the email on your account and we'll send a secure link to set a new password."
      />

      <div className="auth__panel">
        <div className="auth__card">
          {sent ? (
            <>
              <div className="auth__head">
                <h1 className="auth__title">Check your inbox</h1>
                <p className="auth__subtitle">
                  If an account exists for <strong>{email.trim()}</strong>, a password
                  reset link is on its way. It may take a minute to arrive.
                </p>
              </div>
              <Button as={Link} to="/login" variant="primary" size="lg" block>
                Back to log in
              </Button>
            </>
          ) : (
            <>
              <div className="auth__head">
                <h1 className="auth__title">Reset your password</h1>
                <p className="auth__subtitle">
                  Enter your account email and we'll send you a reset link.
                </p>
              </div>

              <form className="auth__form" onSubmit={onSubmit} noValidate>
                <Input
                  label="Email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@university.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <Button type="submit" variant="primary" size="lg" block>
                  Send reset link
                </Button>
              </form>

              <p className="auth__foot">
                Remembered it?{' '}
                <Link to="/login" className="auth__link">
                  Back to log in
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
