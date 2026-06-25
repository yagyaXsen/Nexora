import React from 'react'

/** Derive up-to-2-letter initials from a name. */
function initialsFrom(name = '') {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (!parts.length) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

/**
 * Avatar — image with initials fallback.
 * size: xs | sm | md (default) | lg | xl
 */
export default function Avatar({ name, src, alt, size = 'md', className = '', ...rest }) {
  const cls = ['ui-avatar', `ui-avatar--${size}`, className].filter(Boolean).join(' ')
  return (
    <span className={cls} title={name} {...rest}>
      {src ? <img src={src} alt={alt || name || 'avatar'} /> : initialsFrom(name)}
    </span>
  )
}
