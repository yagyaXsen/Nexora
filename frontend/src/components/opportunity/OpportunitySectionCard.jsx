/**
 * Reusable section primitives for the opportunity detail page:
 *  - SectionCard: titled card container with optional icon + action slot
 *  - InfoRow: label/value row used inside key-facts grids
 *  - EmptyHint: graceful fallback text when a section has no data
 */

export function SectionCard({ icon, title, eyebrow, action, children, className = '' }) {
  return (
    <section className={`bg-white border border-slate-200 rounded-3xl p-6 sm:p-7 shadow-sm ${className}`}>
      <header className="flex items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          {icon && <i className={`ti ${icon} text-indigo-600 text-lg`} />}
          <div>
            {eyebrow && (
              <div className="font-mono text-[9px] font-bold text-slate-400 uppercase tracking-widest">{eyebrow}</div>
            )}
            <h2 className="font-extrabold text-slate-900 text-base tracking-tight">{title}</h2>
          </div>
        </div>
        {action}
      </header>
      <div className="pt-5">{children}</div>
    </section>
  )
}

export function InfoRow({ label, value, icon }) {
  if (value === null || value === undefined || String(value).trim() === '') return null
  return (
    <div className="flex items-start justify-between gap-4 py-2.5 border-b border-slate-50 last:border-0">
      <span className="flex items-center gap-1.5 text-[11px] font-mono font-bold text-slate-400 uppercase tracking-wide shrink-0">
        {icon && <i className={`ti ${icon} text-[11px]`} />}
        {label}
      </span>
      <span className="text-sm font-semibold text-slate-800 text-right break-words">{value}</span>
    </div>
  )
}

export function ChipList({ items, empty = 'Not specified' }) {
  if (!items || items.length === 0) {
    return <span className="text-sm text-slate-400 italic">{empty}</span>
  }
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((item) => (
        <span
          key={item}
          className="bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-lg text-xs font-mono text-slate-600"
        >
          {item}
        </span>
      ))}
    </div>
  )
}

export function EmptyHint({ children }) {
  return <p className="font-serif text-sm text-slate-400 italic leading-relaxed">{children}</p>
}

export default SectionCard
