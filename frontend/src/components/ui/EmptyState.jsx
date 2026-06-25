import React from 'react'

/**
 * EmptyState — friendly placeholder for empty lists / zero results /
 * not-yet-built screens (used by the Phase 0 ComingSoon stub).
 */
export default function EmptyState({ icon = '✦', title, desc, action, className = '' }) {
  return (
    <div className={['ui-empty', className].filter(Boolean).join(' ')}>
      <div className="ui-empty__icon" aria-hidden>
        {icon}
      </div>
      {title && <div className="ui-empty__title">{title}</div>}
      {desc && <p className="ui-empty__desc">{desc}</p>}
      {action}
    </div>
  )
}
