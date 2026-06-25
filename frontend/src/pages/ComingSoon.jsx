import React from 'react'
import { Link } from 'react-router-dom'
import { EmptyState, Button } from '../components/ui'

/**
 * ComingSoon — lightweight placeholder used to keep the route tree
 * navigable during Phase 0. Each real page replaces this in later phases.
 */
export default function ComingSoon({ title = 'Coming soon', desc, phase }) {
  return (
    <div style={{ display: 'grid', placeItems: 'center', minHeight: '60vh', padding: '64px 24px' }}>
      <EmptyState
        icon="✦"
        title={title}
        desc={desc || 'This page is being built. Check back as Nexora rolls out.'}
        action={
          <Button as={Link} to="/" variant="outline" size="sm">
            Back to home
          </Button>
        }
      />
      {phase ? (
        <p style={{ marginTop: 16, fontSize: 12, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--grey-text)' }}>
          Planned · {phase}
        </p>
      ) : null}
    </div>
  )
}
