import React, { useId } from 'react'

/**
 * Input — labelled text field with optional hint / error.
 * Pass `multiline` to render a <textarea>.
 */
export default function Input({
  label,
  hint,
  error,
  multiline = false,
  className = '',
  id,
  ...rest
}) {
  const autoId = useId()
  const fieldId = id || autoId
  const Comp = multiline ? 'textarea' : 'input'
  const base = multiline ? 'ui-textarea' : 'ui-input'
  const cls = [base, error && `${base}--invalid`, className].filter(Boolean).join(' ')

  return (
    <div className="ui-field">
      {label && (
        <label className="ui-field__label" htmlFor={fieldId}>
          {label}
        </label>
      )}
      <Comp id={fieldId} className={cls} aria-invalid={Boolean(error)} {...rest} />
      {error ? (
        <span className="ui-field__error">{error}</span>
      ) : hint ? (
        <span className="ui-field__hint">{hint}</span>
      ) : null}
    </div>
  )
}
