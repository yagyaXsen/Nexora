import React, { useEffect } from 'react'

/**
 * Modal — centered dialog with overlay.
 * Closes on Escape and overlay click. Locks body scroll while open.
 * size: sm | md (default) | lg
 */
export default function Modal({ open, onClose, title, size = 'md', children, footer }) {
  useEffect(() => {
    if (!open) return undefined
    const onKey = (e) => {
      if (e.key === 'Escape') onClose?.()
    }
    document.addEventListener('keydown', onKey)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="ui-modal__overlay" onMouseDown={onClose}>
      <div
        className={`ui-modal ui-modal--${size}`}
        role="dialog"
        aria-modal="true"
        aria-label={typeof title === 'string' ? title : undefined}
        onMouseDown={(e) => e.stopPropagation()}
      >
        {(title || onClose) && (
          <div className="ui-modal__head">
            {title && <h2 className="ui-modal__title">{title}</h2>}
            {onClose && (
              <button className="ui-modal__close" aria-label="Close dialog" onClick={onClose}>
                ×
              </button>
            )}
          </div>
        )}
        <div className="ui-modal__body">{children}</div>
        {footer}
      </div>
    </div>
  )
}
