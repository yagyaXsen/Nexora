import React from 'react'

/**
 * Card — surface container.
 * variant: default | flat | raised | dark
 * pad:     sm | md (default) | lg
 */
export default function Card({
  variant = 'default',
  pad = 'md',
  hover = false,
  className = '',
  as: Comp = 'div',
  children,
  ...rest
}) {
  const cls = [
    'ui-card',
    variant !== 'default' && `ui-card--${variant}`,
    pad === 'sm' && 'ui-card--pad-sm',
    pad === 'lg' && 'ui-card--pad-lg',
    hover && 'ui-card--hover',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <Comp className={cls} {...rest}>
      {children}
    </Comp>
  )
}
