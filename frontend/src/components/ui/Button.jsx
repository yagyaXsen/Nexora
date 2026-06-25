import React from 'react'

/**
 * Button — the one button. Renders <button> or, when `as="a"` / `to`
 * is given, an anchor / router Link via the `as` prop.
 *
 * variant: primary | dark | outline | ghost | subtle | danger
 * size:    sm | md | lg
 */
export default function Button({
  variant = 'primary',
  size = 'md',
  block = false,
  loading = false,
  disabled = false,
  as: Comp = 'button',
  className = '',
  children,
  ...rest
}) {
  const cls = [
    'ui-btn',
    `ui-btn--${variant}`,
    `ui-btn--${size}`,
    block && 'ui-btn--block',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  const isNativeButton = Comp === 'button'
  const props = isNativeButton
    ? { disabled: disabled || loading, type: rest.type || 'button' }
    : { 'aria-disabled': disabled || loading }

  return (
    <Comp className={cls} {...props} {...rest}>
      {loading && <span className="ui-spinner ui-spinner--sm ui-spinner--light" aria-hidden />}
      {children}
    </Comp>
  )
}
