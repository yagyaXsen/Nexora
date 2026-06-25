import React from 'react'

/**
 * Tabs — controlled tab strip.
 * items:  [{ value, label }]
 * value:  active value
 * onChange(value)
 */
export default function Tabs({ items = [], value, onChange, className = '' }) {
  return (
    <div className={['ui-tabs', className].filter(Boolean).join(' ')} role="tablist">
      {items.map((it) => {
        const active = it.value === value
        return (
          <button
            key={it.value}
            role="tab"
            aria-selected={active}
            className={['ui-tab', active && 'ui-tab--active'].filter(Boolean).join(' ')}
            onClick={() => onChange?.(it.value)}
          >
            {it.label}
          </button>
        )
      })}
    </div>
  )
}
