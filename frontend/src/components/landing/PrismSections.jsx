import { useState } from 'react'
import { Link } from 'react-router-dom'
import { CountUp } from '../CountUp.jsx'

function formatMetric(value) {
  if (value == null) return '—'
  return Number(value).toLocaleString('en-US')
}

function PrismSectionIntro({ eyebrow, title, children, align = 'left' }) {
  return (
    <div className={`prism-section-intro prism-section-intro--${align}`}>
      <span className="prism-eyebrow">{eyebrow}</span>
      <h2 className="prism-display">{title}</h2>
      {children}
    </div>
  )
}

export function ProofSection({ stats }) {
  const categoryCount = stats?.categories_breakdown ? Object.keys(stats.categories_breakdown).length : null
  const totalOpps = stats?.total_opportunities || 56
  const activeCount = stats?.active_count || 55
  const catCount = categoryCount || 10

  return (
    <section className="prism-proof" aria-label="Global reach and case study">
      <div className="prism-proof__rail">
        <PrismSectionIntro eyebrow="Global reach" title="The internet is wide. Your attention is not." />
        <div className="prism-proof__metrics">
          <div className="prism-metric">
            <strong><CountUp end={totalOpps} /></strong>
            <span className="prism-mono">Indexed opportunities</span>
          </div>
          <div className="prism-metric">
            <strong><CountUp end={activeCount} /></strong>
            <span className="prism-mono">Live signals</span>
          </div>
          <div className="prism-metric prism-metric--accent">
            <strong><CountUp end={catCount} /></strong>
            <span className="prism-mono">Signal categories</span>
          </div>
        </div>
      </div>
      <div className="prism-proof__story">
        {/* CERN Research Facility Visual Showcase Banner */}
        <div className="rounded-2xl overflow-hidden border border-slate-200 shadow-md mb-6 relative group">
          <img
            src="/assets/cern_case.png"
            alt="CERN Research Facility Geneva"
            className="w-full h-44 object-cover group-hover:scale-105 transition-transform duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent flex items-end p-4 text-white">
            <div className="flex items-center gap-2">
              <span className="prism-mono text-[11px] font-bold tracking-wider uppercase text-white/90">
                CERN QUANTUM FACILITY · GENEVA, SWITZERLAND
              </span>
            </div>
          </div>
        </div>

        <p className="prism-quote">
          “Thousands of high-impact fellowships, undisclosed startup grants, and specialized academic residencies sit buried in fragmented university portals and PDF newsletters. Nexora continuously structures these signals into a singular precision feed.”
        </p>
        <div className="prism-testimonial">
          <div className="prism-avatar">AK</div>
          <div>
            <h3>Ari K.</h3>
            <p className="prism-mono">Research Fellow @ CERN / Geneva</p>
            <p className="prism-testimonial__copy">“Ari K. secured a funded fellowship at CERN after one saved search on Nexora—3 weeks before it appeared on standard job boards.”</p>
            <span className="prism-verified"><i className="ti ti-check" aria-hidden="true" /> Verified outcome / case 084</span>
          </div>
        </div>
      </div>
    </section>
  )
}

export function ProgramsSection() {
  return (
    <section id="discover" className="prism-programs" aria-label="Indexed programs">
      <div className="prism-container">
        <div className="prism-programs__header">
          <PrismSectionIntro eyebrow="Global programs" title="A field guide to what is possible." />
          <div className="prism-index-status">
            <span className="prism-live-dot" /> <span className="prism-mono">Live indexing</span>
            <span className="prism-divider" />
            <span className="prism-mono">Last update: 12m ago</span>
          </div>
        </div>

        <div className="prism-programs__grid">
          
          {/* Card 1: ETH AI Center (Vivid Visual Lab Cover Background) */}
          <Link className="prism-program prism-program--light relative overflow-hidden group" to="/organizations/eth-zurich-ai-center">
            <div className="absolute inset-0 z-0">
              <img src="/assets/eth_card_bg.png" alt="ETH Zurich Lab" className="w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-500" />
              <div className="absolute inset-0 bg-gradient-to-t from-white via-white/80 to-white/20" />
            </div>

            <div className="relative z-10 space-y-6 flex flex-col justify-between h-full">
              <div className="prism-program__top">
                <span className="prism-program__tag bg-indigo-600 text-white font-bold">FELLOWSHIP</span>
                <span className="prism-mono font-extrabold text-slate-900 bg-white/90 px-2 py-0.5 rounded shadow-2xs">CHF 6,000 / mo</span>
              </div>
              <div className="prism-program__content">
                <h3 className="text-slate-900 font-extrabold">ETH AI Center</h3>
                <p className="prism-mono font-bold text-slate-700">ZURICH, SWITZERLAND · CHE</p>
                <p className="prism-program__description font-medium text-slate-900">
                  Full-time research residency focused on trustworthy AI, foundation models, and embodied intelligence with ETH faculty.
                </p>
              </div>
              <div className="prism-program__bottom">
                <span className="prism-mono text-red-600 font-bold bg-white/90 px-2 py-0.5 rounded">CLOSES MAY 14</span>
                <span className="prism-round-arrow bg-slate-900 text-white"><i className="ti ti-arrow-up-right" aria-hidden="true" /></span>
              </div>
            </div>
          </Link>

          {/* Card 2: OpenAI Residency (Dark Theme with Vivid SF Lab Cover Background) */}
          <Link className="prism-program prism-program--dark relative overflow-hidden group" to="/organizations/openai-sf">
            <div className="absolute inset-0 z-0">
              <img src="/assets/openai_card_bg.png" alt="OpenAI SF Lab" className="w-full h-full object-cover opacity-65 group-hover:scale-105 transition-transform duration-500" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] via-[#0A0A0A]/85 to-transparent" />
            </div>

            <div className="relative z-10 space-y-6 flex flex-col justify-between h-full">
              <div className="prism-program__top">
                <span className="prism-program__tag bg-white/20 text-white font-bold border border-white/30">RESIDENCY</span>
                <span className="prism-mono text-white font-extrabold bg-black/40 px-2 py-0.5 rounded border border-white/10">$20K STIPEND / mo</span>
              </div>
              <div className="prism-program__content">
                <h3 className="text-white font-extrabold">OpenAI Residency</h3>
                <p className="prism-mono text-white/80 font-bold">SAN FRANCISCO, USA · USA</p>
                <p className="prism-program__description text-white font-medium">
                  6-month intensive pathway for researchers transitioning into frontier AI safety, alignment, and scaling systems.
                </p>
              </div>
              <div className="prism-program__bottom border-white/20">
                <span className="prism-mono text-indigo-300 font-bold bg-black/50 px-2 py-0.5 rounded">CLOSES AUG 01</span>
                <span className="prism-round-arrow bg-white text-black"><i className="ti ti-arrow-right" aria-hidden="true" /></span>
              </div>
            </div>
          </Link>

          {/* Card 3: UNESCO Youth Forum (Vivid Paris Forum Background Cover) */}
          <Link className="prism-program prism-program--light relative overflow-hidden group" to="/organizations/unesco-paris">
            <div className="absolute inset-0 z-0">
              <img src="/assets/unesco_card_bg.png" alt="UNESCO Paris Forum" className="w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-500" />
              <div className="absolute inset-0 bg-gradient-to-t from-white via-white/80 to-white/20" />
            </div>

            <div className="relative z-10 space-y-6 flex flex-col justify-between h-full">
              <div className="prism-program__top">
                <span className="prism-program__tag bg-slate-900 text-white font-bold">CONFERENCE</span>
                <span className="prism-mono font-extrabold text-slate-900 bg-white/90 px-2 py-0.5 rounded shadow-2xs">FULL TRAVEL</span>
              </div>
              <div className="prism-program__content">
                <h3 className="text-slate-900 font-extrabold">UNESCO Youth Forum</h3>
                <p className="prism-mono font-bold text-slate-700">PARIS, FRANCE · FRA</p>
                <p className="prism-program__description font-medium text-slate-900">
                  Global policy summit bringing 120 young policy creators to deliberate on digital ethics and climate.
                </p>
              </div>
              <div className="prism-program__bottom">
                <span className="prism-mono text-slate-700 font-bold bg-white/90 px-2 py-0.5 rounded">CLOSES JUN 18</span>
                <span className="prism-round-arrow bg-slate-900 text-white"><i className="ti ti-arrow-up-right" aria-hidden="true" /></span>
              </div>
            </div>
          </Link>

          {/* Card 4: Nordic Research Council (Wide 8-Col Card with Vivid Arctic Lab Cover) */}
          <div className="prism-program prism-program--wide relative overflow-hidden group">
            <div className="absolute inset-0 z-0">
              <img src="/assets/nordic_card_bg.png" alt="Nordic Arctic Lab" className="w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-500" />
              <div className="absolute inset-0 bg-gradient-to-r from-white via-white/85 to-white/30" />
            </div>

            <div className="relative z-10 flex-1 space-y-4">
              <div className="prism-program__top">
                <div className="flex items-center gap-2">
                  <span className="prism-program__tag bg-green-700 text-white font-bold">GRANT</span>
                  <span className="prism-mono text-slate-900 font-extrabold bg-white/90 px-2 py-0.5 rounded">€8,000 SEED FUNDING</span>
                </div>
              </div>
              <h3 className="text-2xl font-extrabold text-slate-900">Nordic Research Council</h3>
              <p className="text-sm text-slate-900 font-medium leading-relaxed max-w-lg">
                Micro-grants for early-stage open science initiatives, climate data collection, and Arctic oceanography projects.
              </p>
            </div>

            <div className="relative z-10 prism-program__side-meta bg-white/80 backdrop-blur-md p-4 rounded-xl border border-slate-200">
              <div>
                <span className="prism-mono text-[10px] uppercase text-slate-500 block font-bold">LOCATION</span>
                <strong className="text-sm font-bold text-slate-900">Helsinki, Finland</strong>
              </div>
              <div>
                <span className="prism-mono text-[10px] uppercase text-slate-500 block font-bold">DEADLINE</span>
                <strong className="text-sm font-bold text-indigo-600">Sep 10, 2026</strong>
              </div>
              <Link className="prism-button prism-button--dark prism-button--compact" to="/organizations/nordic-helsinki">
                View Details
              </Link>
            </div>
          </div>

          {/* Card 5: Custom Indexing (Purple 4-Col Card) */}
          <div className="prism-program prism-program--accent">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center text-white mb-2">
              <i className="ti ti-database-import text-xl" aria-hidden="true" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white mb-1">Custom Indexing</h3>
              <p className="text-xs text-white/80 leading-relaxed">
                Don't see a specialized program? Our autonomous agents can scrape and index university portals or private directories on demand for enterprise teams.
              </p>
            </div>
            <Link className="prism-button prism-button--light font-bold text-slate-900 hover:text-black" to="/signup">
              Submit Index Request
            </Link>
          </div>

        </div>
      </div>
    </section>
  )
}

export function WorkflowSection() {
  return (
    <section id="workflow" className="prism-workflow prism-grid-tight" aria-label="Application workflow">
      <div className="prism-container">
        <PrismSectionIntro eyebrow="Application workflow" title="Never drop the ball on what matters." align="center">
          <blockquote>“Momentum is easier to keep when the next step is visible.”</blockquote>
          <p>Track every application cycle from initial match to final offer. Nexora organizes deadlines and checklists automatically.</p>
        </PrismSectionIntro>

        {/* Modern Zurich Workspace Visual Banner */}
        <div className="max-w-4xl mx-auto rounded-2xl overflow-hidden border border-slate-200 shadow-lg mb-8 relative group">
          <img
            src="/assets/workflow_zurich.png"
            alt="Zurich Intelligence Workspace"
            className="w-full h-56 object-cover group-hover:scale-103 transition-transform duration-700"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent flex items-end p-5 text-white justify-between">
            <div>
              <span className="prism-mono text-xs font-bold tracking-wider uppercase text-white/90 block">
                ZÜRICH ARCHITECTURE HQ · SWITZERLAND
              </span>
              <p className="text-xs text-white/70">Real-time candidate match pipeline &amp; application tracking workspace.</p>
            </div>
            <span className="prism-mono text-[10px] bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-white font-bold">
              ACTIVE WORKSPACE
            </span>
          </div>
        </div>

        <div className="prism-kanban" aria-label="Illustration of the opportunity pipeline">
          <div className="prism-kanban__head">
            <div className="prism-kanban__title"><i className="ti ti-layout-kanban" aria-hidden="true" /><strong>Opportunity Pipeline</strong></div>
            <div className="prism-kanban__actions"><span className="prism-mono">3 active pipelines</span><Link className="prism-button prism-button--dark prism-button--compact" to="/tracker">Open tracker <i className="ti ti-arrow-up-right" aria-hidden="true" /></Link></div>
          </div>
          <div className="prism-kanban__columns">
            <div className="prism-kanban__column"><div className="prism-kanban__column-head"><span className="prism-mono"><i className="ti ti-bookmark" aria-hidden="true" /> Saved (02)</span><span className="prism-mono">47.3°N</span></div><div className="prism-kanban__card"><strong>Horizon Europe</strong><span className="prism-mono prism-kanban__date">JUL 20</span><p>Consortium research proposal draft pending. Checklist items incomplete.</p><span className="prism-kanban__tag prism-mono">0/4 assets ready</span></div><div className="prism-kanban__card prism-kanban__card--muted"><strong>UNESCO Youth</strong><span className="prism-mono">JUN 18</span><p>Policy essay submission required.</p></div></div>
            <div className="prism-kanban__column"><div className="prism-kanban__column-head"><span className="prism-mono">Applied (01)</span><span className="prism-live-dot" /></div><div className="prism-kanban__card prism-kanban__card--active"><strong>ETH AI Center</strong><span className="prism-mono prism-kanban__status">Submitted</span><p>Application ID #CHE-8821. Under review by selection committee.</p><span className="prism-kanban__tag prism-mono">Ref 1 verified</span></div></div>
            <div className="prism-kanban__column"><div className="prism-kanban__column-head"><span className="prism-mono">In motion (01)</span><span className="prism-live-dot prism-live-dot--violet" /></div><div className="prism-kanban__card prism-kanban__card--dark"><strong>OpenAI Residency</strong><span className="prism-mono prism-kanban__status">Interview</span><p>Technical screen scheduled for Tuesday at 14:00 PST.</p><span className="prism-kanban__tag prism-mono">Next: code review</span></div></div>
          </div>
        </div>
      </div>
    </section>
  )
}

export function IntelligenceSection() {
  return (
    <section id="intelligence" className="prism-intelligence" aria-label="System intelligence">
      <div className="prism-container">
        <div className="prism-intel-layout grid grid-cols-12 gap-8 items-center">

          {/* Left Column (6 Cols): UI Mockup & Swiss Optical Lens Asset */}
          <div className="col-span-12 lg:col-span-6 bg-white border border-slate-200 p-6 rounded-3xl shadow-xl space-y-4">
            
            {/* Swiss Refractive Optics Lens Banner */}
            <div className="rounded-2xl overflow-hidden border border-slate-200/90 shadow-sm relative group">
              <img
                src="/assets/intelligence_lens.png"
                alt="Swiss Optical Lens Precision Signal Refraction"
                className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-md border border-slate-200 px-3 py-1 rounded-full text-[10px] font-mono font-bold text-indigo-600">
                SWISS OPTICS AG / 400NM
              </div>
            </div>

            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center font-bold">
                  <i className="ti ti-target text-sm" />
                </div>
                <span className="font-bold text-xs uppercase tracking-wider text-slate-900">YOUR SIGNAL FEED</span>
              </div>
              <span className="prism-mono text-[10px] text-slate-400">QUERY: AI + DEEPTECH</span>
            </div>

            <div className="space-y-3">
              {/* Item 01 */}
              <div className="relative p-3.5 bg-[#FAFAFA] border border-slate-200 rounded-2xl">
                <span className="absolute -top-2.5 -right-2.5 w-6 h-6 bg-indigo-600 text-white font-mono font-bold text-[11px] flex items-center justify-center rounded-full shadow-sm">
                  01
                </span>
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-sm text-slate-900">Max Planck Institute Research Grant</h4>
                  <span className="prism-mono text-xs font-bold text-indigo-600">97% MATCH</span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">Munich, Germany · €4,500/mo stipend</p>
              </div>

              {/* Item 02 */}
              <div className="relative p-3.5 bg-[#FAFAFA] border border-slate-200 rounded-2xl">
                <span className="absolute -top-2.5 -right-2.5 w-6 h-6 bg-[#0A0A0A] text-white font-mono font-bold text-[11px] flex items-center justify-center rounded-full shadow-sm">
                  02
                </span>
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-sm text-slate-900">Y Combinator Summer Batch '26</h4>
                  <span className="prism-mono text-xs font-bold text-slate-700">9 DAYS LEFT</span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">$500k standard deal</p>
              </div>
            </div>
          </div>

          {/* Right Column (6 Cols): Feature Explanation List */}
          <div className="col-span-12 lg:col-span-6 space-y-8">
            <div>
              <span className="prism-eyebrow text-indigo-600">CORE INTELLIGENCE</span>
              <h2 className="text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight mt-1">
                How Nexora turns noise into clarity.
              </h2>
            </div>

            <div className="space-y-6">
              {/* Feature 01 */}
              <div className="border-l-2 border-indigo-600 pl-5 space-y-1">
                <span className="prism-mono text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                  MATCHING ENGINE
                </span>
                <h3 className="font-bold text-lg text-slate-900 pt-1">01. Match Reasoning</h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Nexora breaks down why every opportunity is surfaced, matching your past publications and career trajectory against actual criteria.
                </p>
              </div>

              {/* Feature 02 */}
              <div className="border-l-2 border-slate-300 pl-5 space-y-1">
                <span className="prism-mono text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                  TIMELINE LOGIC
                </span>
                <h3 className="font-bold text-lg text-slate-900 pt-1">02. Deadline Intelligence</h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Get notified with exact preparation lead times based on essay length, recommendation letter requirements, and visa timelines.
                </p>
              </div>

              {/* Feature 03 */}
              <div className="border-l-2 border-slate-300 pl-5 space-y-1">
                <span className="prism-mono text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                  DATA PERSISTENCE
                </span>
                <h3 className="font-bold text-lg text-slate-900 pt-1">03. Saved Collections</h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Organize grants and fellowships by discipline or location. Export formatted lists directly to your advisors or co-founders.
                </p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  )
}

export function AlertsSection() {
  return (
    <section className="prism-alerts py-24 bg-[#FAFAFA] border-b border-slate-200" aria-label="Real-time signal alerts">
      <div className="prism-container max-w-4xl mx-auto text-center space-y-12">
        <div>
          <span className="prism-mono text-[11px] font-bold text-indigo-600 uppercase tracking-widest block mb-1">
            REAL-TIME SIGNAL
          </span>
          <h2 className="text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight">
            The right nudge, at the right distance.
          </h2>
          <p className="text-base text-slate-600 mt-2 max-w-xl mx-auto">
            No spam. Only calm, prioritized updates when a relevant program opens or a deadline approaches.
          </p>
        </div>

        {/* Stockholm Modern Architectural Visual Showcase Banner */}
        <div className="rounded-2xl overflow-hidden border border-slate-200 shadow-lg relative group">
          <img
            src="/assets/alerts_atrium.png"
            alt="Stockholm Architectural Atrium"
            className="w-full h-52 object-cover group-hover:scale-103 transition-transform duration-700"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent flex items-end p-5 text-white justify-between">
            <span className="prism-mono text-xs font-bold tracking-wider uppercase text-white/90">
              STOCKHOLM SIGNAL LABS · SWEDEN
            </span>
            <span className="prism-mono text-[10px] bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-white font-bold">
              ● REAL-TIME DISPATCH
            </span>
          </div>
        </div>

        {/* 3 Alternating Zigzag Cards */}
        <div className="space-y-6 pt-2">

          {/* Card 1: Top Left */}
          <div className="max-w-xl mr-auto bg-white border border-slate-200 p-4 rounded-2xl shadow-lg flex items-center justify-between gap-4 text-left">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center shrink-0">
                <i className="ti ti-bell-ringing-filled text-lg" aria-hidden="true" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-slate-900">17 new opportunities curated</h4>
                <p className="text-xs text-slate-500">Includes 4 fully funded doctoral fellowships in Zurich &amp; Cambridge.</p>
              </div>
            </div>
            <span className="prism-mono text-[11px] text-slate-400 font-bold shrink-0">10M AGO</span>
          </div>

          {/* Card 2: Middle Right */}
          <div className="max-w-xl ml-auto bg-white border border-slate-200 p-4 rounded-2xl shadow-lg flex items-center justify-between gap-4 text-left">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center shrink-0">
                <i className="ti ti-clock-filled text-lg" aria-hidden="true" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-slate-900">Deadline in 4 days · ETH AI</h4>
                <p className="text-xs text-slate-500">Your application checklist is 80% complete. 1 recommendation letter missing.</p>
              </div>
            </div>
            <span className="prism-mono text-[11px] text-slate-400 font-bold shrink-0">2H AGO</span>
          </div>

          {/* Card 3: Bottom Center */}
          <div className="max-w-xl mx-auto bg-white border border-slate-200 p-4 rounded-2xl shadow-lg flex items-center justify-between gap-4 text-left">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-slate-100 text-slate-700 rounded-xl flex items-center justify-center shrink-0">
                <i className="ti ti-sparkles text-lg" aria-hidden="true" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-slate-900">Research Match: DeepMind</h4>
                <p className="text-xs text-slate-500">New Academic Fellowship just announced $50k research awards.</p>
              </div>
            </div>
            <span className="prism-mono text-[11px] text-slate-400 font-bold shrink-0">1D AGO</span>
          </div>

        </div>
      </div>
    </section>
  )
}

export function FaqSection() {
  const [openIndex, setOpenIndex] = useState(0)

  const faqs = [
    {
      q: 'How does Nexora structure private data?',
      a: 'Our autonomous agents ingest public and semi-public university portals, structuring unstructured text into defined schemas including eligibility, funding, and deadlines.',
    },
    {
      q: 'Can I track institutional teams?',
      a: 'Yes, enterprise subscriptions allow multi-seat tracking across lab members, department faculty, and shared grant pipelines.',
    },
    {
      q: 'Is my search data private?',
      a: 'All query histories and candidate match vectors are encrypted at rest with zero third-party data selling or tracking.',
    },
  ]

  return (
    <section className="prism-faq py-24 bg-white border-b border-slate-200" aria-label="Frequently asked questions">
      <div className="prism-container max-w-[1180px] mx-auto px-6 grid grid-cols-12 gap-12 items-start">

        {/* Left Column (5 Cols) with Swiss Editorial Desk Image */}
        <div className="col-span-12 lg:col-span-5 space-y-6">
          
          {/* Swiss Editorial Desk Visual Showcase */}
          <div className="rounded-2xl overflow-hidden border border-slate-200 shadow-md relative group">
            <img
              src="/assets/editorial_desk.png"
              alt="Swiss Editorial Desk"
              className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent flex items-end p-4 text-white">
              <span className="prism-mono text-[10px] font-bold tracking-wider uppercase text-white/90">
                EDITORIAL DESK · ZURICH
              </span>
            </div>
          </div>

          <div className="space-y-4">
            <span className="prism-mono text-[11px] font-bold text-indigo-600 uppercase tracking-widest block">
              COMMON INQUIRIES
            </span>
            <h2 className="text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
              Everything you need to know.
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              Can't find what you're looking for? Contact our editorial desk directly.
            </p>
            <div>
              <Link to="/explore" className="text-sm font-bold text-slate-900 hover:text-black hover:underline transition-colors flex items-center gap-1.5">
                <span>Contact Editorial Desk</span>
                <i className="ti ti-arrow-right" />
              </Link>
            </div>
          </div>
        </div>

        {/* Right Column (7 Cols): Accordion */}
        <div className="col-span-12 lg:col-span-7 divide-y divide-slate-200 pt-4">
          {faqs.map((faq, i) => (
            <div key={i} className="py-6 first:pt-0 last:pb-0">
              <button
                type="button"
                className="w-full flex items-center justify-between text-left font-bold text-base text-slate-900 group"
                onClick={() => setOpenIndex(openIndex === i ? null : i)}
              >
                <span className="group-hover:text-black transition-colors">{faq.q}</span>
                <span className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 group-hover:bg-slate-200 group-hover:text-slate-900 transition-colors shrink-0 ml-4">
                  <i className={openIndex === i ? 'ti ti-chevron-up' : 'ti ti-chevron-down'} />
                </span>
              </button>
              {openIndex === i && (
                <p className="text-sm text-slate-600 leading-relaxed mt-3 pr-8 font-serif">
                  {faq.a}
                </p>
              )}
            </div>
          ))}
        </div>

      </div>
    </section>
  )
}

export function ConversionSection() {
  return (
    <section id="request-access" className="prism-conversion py-24 bg-[#FAFAFA]" aria-label="Get started with Nexora">
      <div className="prism-container max-w-[1080px] mx-auto px-6">

        {/* Split Comparison Container */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xl grid grid-cols-12 relative overflow-hidden">

          {/* Left Column (6 Cols: Old Way) */}
          <div className="col-span-12 md:col-span-6 p-10 lg:p-12 bg-[#FAFAFA] border-b md:border-b-0 md:border-r border-slate-200 space-y-6">
            <span className="prism-mono text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
              THE STATUS QUO
            </span>
            <h3 className="text-2xl font-bold text-slate-800">
              Reactionary &amp; Fragmented
            </h3>

            <ul className="space-y-4 text-sm text-slate-400">
              <li className="flex items-start gap-3 line-through">
                <i className="ti ti-x text-red-500 font-bold mt-0.5 shrink-0" />
                <span>47 open browser tabs across bookmark bars</span>
              </li>
              <li className="flex items-start gap-3 line-through">
                <i className="ti ti-x text-red-500 font-bold mt-0.5 shrink-0" />
                <span>Scattered deadlines on sticky notes</span>
              </li>
              <li className="flex items-start gap-3 line-through">
                <i className="ti ti-x text-red-500 font-bold mt-0.5 shrink-0" />
                <span>Constant anxiety: "Did I miss a fellowship?"</span>
              </li>
            </ul>
          </div>

          {/* Right Column (6 Cols: Nexora Way) */}
          <div className="col-span-12 md:col-span-6 p-10 lg:p-12 bg-white space-y-6">
            <span className="prism-mono text-[10px] font-bold text-slate-900 uppercase tracking-widest block">
              THE NEXORA WAY
            </span>
            <h3 className="text-2xl font-bold text-slate-900">
              Proactive &amp; Accelerated
            </h3>

            <ul className="space-y-4 text-sm text-slate-800 font-medium">
              <li className="flex items-start gap-3">
                <i className="ti ti-check text-slate-900 font-bold mt-0.5 shrink-0" />
                <span>One quiet signal tailored specifically to your work</span>
              </li>
              <li className="flex items-start gap-3">
                <i className="ti ti-check text-slate-900 font-bold mt-0.5 shrink-0" />
                <span>A clearer next step with preparation lead times</span>
              </li>
              <li className="flex items-start gap-3">
                <i className="ti ti-check text-slate-900 font-bold mt-0.5 shrink-0" />
                <span>More time to act, create, and submit excellent work</span>
              </li>
            </ul>
          </div>

          {/* Centered Floating Black Overlay Button */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-30 hidden md:block">
            <Link
              to="/signup"
              style={{ color: '#FFFFFF', backgroundColor: '#0A0A0A' }}
              className="px-8 py-3.5 rounded-2xl shadow-2xl font-bold text-sm flex items-center gap-2 hover:!bg-slate-800 hover:scale-105 transition-all whitespace-nowrap border border-white/20"
            >
              <span style={{ color: '#FFFFFF' }} className="!text-white font-bold">Request Access Now</span>
              <i className="ti ti-arrow-right !text-white" style={{ color: '#FFFFFF' }} />
            </Link>
          </div>

        </div>

      </div>
    </section>
  )
}
