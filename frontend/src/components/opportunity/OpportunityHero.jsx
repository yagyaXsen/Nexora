import OpportunityBadge from './OpportunityBadge'
import OpportunityCTAGroup from './OpportunityCTAGroup'
import { typeLabel } from '../../lib/opportunityNormalize'

/**
 * Hero/header block for the opportunity page. Renders the title, provider,
 * badge bar (status / verification / funding / deadline / mode / AI match),
 * short summary, CTA group, and optional featured image. Degrades to a clean
 * gradient + icon block when no image exists.
 */
export default function OpportunityHero({ opp, saved, saving, onToggleSave, onShare, onApply }) {
  if (!opp) return null

  const hasImage = opp.featuredImage

  return (
    <header className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      {/* Ambient accent */}
      <div className="absolute top-0 right-0 w-[400px] h-[280px] bg-gradient-to-tr from-indigo-500/10 via-purple-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />

      <div className="relative grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-6 p-6 sm:p-8">
        <div className="space-y-5">
          {/* Badge bar */}
          <div className="flex flex-wrap items-center gap-2">
            <OpportunityBadge
              label={typeLabel(opp.type)}
              tone="slate"
              icon="ti-tag"
            />
            {opp.badges.map((b) => (
              <OpportunityBadge key={b.key} label={b.label} tone={b.tone} />
            ))}
          </div>

          <div className="space-y-3">
            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-950 tracking-tight leading-snug">
              {opp.title}
            </h1>

            {opp.provider && (
              <p className="text-sm text-slate-500">
                <span className="font-mono text-[10px] uppercase tracking-widest text-slate-400">By </span>
                <strong className="text-indigo-600 font-bold">{opp.provider}</strong>
              </p>
            )}

            {opp.summary && (
              <p className="font-serif text-[15px] text-slate-600 leading-relaxed max-w-2xl">
                {opp.summary}
              </p>
            )}
          </div>

          {/* Hero CTAs */}
          <div className="max-w-md">
            <OpportunityCTAGroup opp={opp} onApply={onApply} />
          </div>

          {/* Save / Share row */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <button
              type="button"
              onClick={onToggleSave}
              disabled={saving}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all border ${
                saved
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-red-50 hover:text-red-600 hover:border-red-200'
                  : 'bg-white text-slate-700 border-slate-200 hover:border-indigo-400 hover:bg-indigo-50 hover:text-indigo-700'
              }`}
            >
              {saving ? 'Processing…' : saved ? '✓ Saved to Tracker' : '+ Save Opportunity'}
            </button>
            <button
              type="button"
              onClick={onShare}
              className="px-4 py-2.5 rounded-xl text-xs font-bold transition-all border border-slate-200 bg-white text-slate-700 hover:border-slate-400 hover:bg-slate-50"
            >
              <i className="ti ti-share mr-1" /> Share
            </button>
          </div>
        </div>

        {/* Featured image or graceful placeholder */}
        <div className="relative rounded-2xl overflow-hidden border border-slate-100 min-h-[160px] bg-gradient-to-br from-indigo-50 via-white to-slate-50 flex items-center justify-center">
          {hasImage ? (
            <img
              src={opp.featuredImage}
              alt=""
              loading="lazy"
              className="w-full h-full object-cover absolute inset-0"
            />
          ) : (
            <div className="text-center space-y-2 p-6">
              <i className="ti ti-briefcase text-4xl text-indigo-300" />
              <p className="font-mono text-[10px] uppercase tracking-widest text-slate-300">
                {typeLabel(opp.type)}
              </p>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
