import React from 'react'

/**
 * Badge — small status / category pill.
 * variant: neutral | maroon | yellow | success | warning | danger | info | outline
 * dot:     show a leading status dot
 */
export default function Badge({ variant = 'neutral', dot = false, className = '', children, ...rest }) {
  const cls = ['ui-badge', `ui-badge--${variant}`, dot && 'ui-badge--dot', className]
    .filter(Boolean)
    .join(' ')
  return (
    <span className={cls} {...rest}>
      {children}
    </span>
  )
}
