import React from 'react'

/**
 * Spinner — indeterminate loading indicator.
 * size: sm | md (default) | lg ; `light` for dark backgrounds.
 */
export default function Spinner({ size = 'md', light = false, className = '', label = 'Loading', ...rest }) {
  const cls = ['ui-spinner', `ui-spinner--${size}`, light && 'ui-spinner--light', className]
    .filter(Boolean)
    .join(' ')
  return <span className={cls} role="status" aria-label={label} {...rest} />
}
