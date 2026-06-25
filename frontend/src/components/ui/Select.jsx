import React, { useId } from 'react'

/**
 * Select — labelled dropdown.
 * Provide `options` as [{ value, label }] or pass <option> children.
 */
export default function Select({
  label,
  hint,
  error,
  options,
  placeholder,
  className = '',
  id,
  children,
  ...rest
}) {
  const autoId = useId()
  const fieldId = id || autoId
  const cls = ['ui-select', error && 'ui-select--invalid', className].filter(Boolean).join(' ')

  return (
    <div className="ui-field">
      {label && (
        <label className="ui-field__label" htmlFor={fieldId}>
          {label}
        </label>
      )}
      <select id={fieldId} className={cls} aria-invalid={Boolean(error)} {...rest}>
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options
          ? options.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))
          : children}
      </select>
      {error ? (
        <span className="ui-field__error">{error}</span>
      ) : hint ? (
        <span className="ui-field__hint">{hint}</span>
      ) : null}
    </div>
  )
}
