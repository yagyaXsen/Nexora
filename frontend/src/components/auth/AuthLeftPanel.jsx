import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'

const DEMO_CARDS = [
  {
    id: 1,
    title: 'ETH AI Center Postdoc Fellowship 2026',
    organizer: 'ETH Zurich',
    category: 'FELLOWSHIP',
    match: '98% MATCH',
    funding: 'CHF 120,000/yr',
    location: 'Zurich, Switzerland',
    badgeText: 'DEADLINE IN 4 DAYS',
    badgeColor: 'text-amber-700 bg-amber-50 border-amber-200',
  },
  {
    id: 2,
    title: 'OpenAI Technical Research Residency',
    organizer: 'OpenAI San Francisco',
    category: 'RESIDENCY',
    match: '96% MATCH',
    funding: '$120,000/yr',
    location: 'San Francisco, USA',
    badgeText: 'INTERVIEW INVITATION',
    badgeColor: 'text-indigo-700 bg-indigo-50 border-indigo-200',
  },
  {
    id: 3,
    title: 'ERC Starting Grant 2026 (StG)',
    organizer: 'European Research Council',
    category: 'GRANT',
    match: '99% MATCH',
    funding: 'Up to €1,500,000',
    location: 'European Union',
    badgeText: 'HIGH-PRIORITY MATCH',
    badgeColor: 'text-emerald-700 bg-emerald-50 border-emerald-200',
  },
]

const ORGS = [
  { name: 'CERN', tag: 'Particle Physics' },
  { name: 'ETH Zurich', tag: 'AI & Robotics' },
  { name: 'OpenAI', tag: 'Frontier AI' },
  { name: 'UNESCO', tag: 'Global Science' },
  { name: 'ERC', tag: 'EU Frontier' },
  { name: 'Oxford', tag: 'Rhodes Trust' },
]

export default function AuthLeftPanel({ subtitleHint }) {
  const [activeCardIndex, setActiveCardIndex] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveCardIndex((prev) => (prev + 1) % DEMO_CARDS.length)
    }, 4500)
    return () => clearInterval(timer)
  }, [])

  return (
    <div className="auth-left-panel relative overflow-hidden bg-gradient-to-br from-indigo-50/80 via-slate-50 to-purple-50/60 flex flex-col justify-between p-8 sm:p-12 text-slate-900 h-full border-r border-slate-200/80">
      {/* Background ambient lighting */}
      <div className="absolute top-0 right-0 w-[550px] h-[550px] bg-indigo-200/40 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[450px] h-[450px] bg-purple-200/40 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:24px_24px] opacity-60 pointer-events-none" />

      {/* Top Header */}
      <div className="relative z-10 space-y-6">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-9 h-9 bg-[#0A0A0A] text-white rounded-xl flex items-center justify-center font-mono font-black text-sm shadow-md group-hover:scale-105 transition-transform">
              N
            </div>
            <div>
              <span className="font-extrabold tracking-tight text-slate-950 text-base block leading-none">NEXORA</span>
              <span className="font-mono text-[9px] text-indigo-600 font-bold tracking-widest uppercase block mt-1">AI OPERATING SYSTEM</span>
            </div>
          </Link>
        </div>

        {/* Editorial Headline */}
        <div className="space-y-3 pt-4 max-w-xl">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-[1.1] text-slate-950">
            The opportunity<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700">
              intelligence engine.
            </span>
          </h2>
          <p className="text-slate-600 text-sm sm:text-base leading-relaxed font-serif max-w-md font-medium">
            {subtitleHint || "Autonomous AI indexing unstructured fellowships, grants, and research positions worldwide."}
          </p>
        </div>
      </div>

      {/* Middle Interactive Opportunity Cards Stack */}
      <div className="relative z-10 my-6 space-y-4">
        <div className="flex items-center justify-between text-xs font-mono text-slate-500 font-bold uppercase tracking-widest border-b border-slate-200 pb-2">
          <span>[ LIVE OPPORTUNITY PREVIEW ]</span>
          <span className="text-indigo-600 font-bold">CYCLE {activeCardIndex + 1}/3</span>
        </div>

        <div className="relative min-h-[175px]">
          {DEMO_CARDS.map((card, idx) => {
            const isActive = idx === activeCardIndex
            return (
              <div
                key={card.id}
                className={`absolute inset-0 p-5 rounded-2xl border transition-all duration-700 backdrop-blur-xl ${
                  isActive
                    ? 'opacity-100 translate-y-0 scale-100 bg-white/90 border-slate-200 shadow-xl shadow-indigo-100/60 z-20'
                    : 'opacity-0 translate-y-4 scale-95 pointer-events-none bg-white/50 border-slate-200/50 z-10'
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2 font-mono text-[10px]">
                    <span className="bg-slate-900 text-white font-extrabold px-2.5 py-0.5 rounded-full uppercase">
                      {card.category}
                    </span>
                    <span className="bg-indigo-50 text-indigo-700 border border-indigo-200 px-2.5 py-0.5 rounded-full font-bold">
                      {card.match}
                    </span>
                  </div>
                  <span className={`font-mono text-[10px] font-bold px-2 py-0.5 rounded-full border ${card.badgeColor}`}>
                    {card.badgeText}
                  </span>
                </div>

                <h3 className="font-extrabold text-slate-950 text-base sm:text-lg leading-snug line-clamp-1">
                  {card.title}
                </h3>
                
                <p className="font-mono text-xs text-slate-600 mt-1 font-medium">
                  {card.organizer} · <span className="text-emerald-700 font-bold">{card.funding}</span>
                </p>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600 font-mono font-medium">
                  <span className="flex items-center gap-1.5">
                    <i className="ti ti-map-pin text-indigo-600" /> {card.location}
                  </span>
                  <span className="text-indigo-700 font-bold flex items-center gap-1">
                    Verified Signal <i className="ti ti-check text-emerald-600" />
                  </span>
                </div>
              </div>
            )
          })}
        </div>

        {/* Card indicator dots */}
        <div className="flex justify-center gap-2 pt-2">
          {DEMO_CARDS.map((_, i) => (
            <button
              key={i}
              onClick={() => setActiveCardIndex(i)}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === activeCardIndex ? 'w-6 bg-indigo-600' : 'w-1.5 bg-slate-300 hover:bg-slate-400'
              }`}
              aria-label={`View preview ${i + 1}`}
            />
          ))}
        </div>
      </div>

      {/* Bottom Institutional Grid & Trust Signals */}
      <div className="relative z-10 space-y-4 pt-4 border-t border-slate-200">
        <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 font-bold">
          <span>PARTNER ORGANIZATIONS</span>
          <span className="text-emerald-700 font-bold">1,420 INSTITUTIONS INDEXED</span>
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
          {ORGS.map((o) => (
            <div
              key={o.name}
              className="p-2 bg-white border border-slate-200/90 rounded-xl text-center hover:border-indigo-300 hover:shadow-2xs transition-all cursor-default"
            >
              <div className="font-bold text-xs text-slate-900 truncate">{o.name}</div>
              <div className="font-mono text-[9px] text-slate-500 truncate font-medium">{o.tag}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
