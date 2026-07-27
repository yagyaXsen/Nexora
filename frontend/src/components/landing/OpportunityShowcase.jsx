import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  Sparkles, Bookmark, ArrowRight, MapPin, DollarSign, 
  Clock, Building2, CheckCircle2, ShieldCheck, TrendingUp
} from 'lucide-react'

// Data for Editorial Bento Layout (Zero Emojis, Clean Vector Badges)
const featuredOpportunity = {
  id: 'featured-1',
  title: 'Alexander von Humboldt Postdoctoral Research Fellowship',
  organization: 'Humboldt Foundation',
  logoText: 'AVH',
  location: 'Germany / EU',
  funding: '€3,200 / month',
  deadlineDays: 17,
  category: 'Fellowship',
  matchScore: 98,
  matchLabel: 'Excellent Fit',
  image: '/images/cover_humboldt.png',
  tags: ['Fully Funded', 'Research', 'PhD', 'Visa Support', 'Europe'],
  aiInsights: [
    '98.4% profile similarity with past successful awardees',
    'Full relocation stipend & healthcare coverage included',
    'Direct routing to Humboldt official submission portal'
  ],
  url: 'https://www.humboldt-foundation.de/en/apply/sponsorship-programmes/humboldt-research-fellowship'
}

const secondaryOpportunities = [
  {
    id: 'opp-2',
    title: 'Google for Startups Accelerator: MENAT Cohort',
    organization: 'Google for Startups',
    logoText: 'G',
    location: 'Middle East & Turkey',
    funding: 'Equity-Free Mentorship',
    deadlineDays: 24,
    category: 'Accelerator',
    matchScore: 95,
    matchLabel: 'Strong Match',
    image: '/images/cover_google.png',
    tags: ['Accelerator', 'AI & Cloud', 'Mentorship'],
    aiInsights: [
      'Top 5% match for early-stage AI startups',
      'Direct access to Google Cloud credits ($350K)'
    ],
    url: 'https://startup.google.com/programs/accelerator/middle-east-north-africa-turkey/'
  },
  {
    id: 'opp-3',
    title: 'ETH Zurich AI Center Postdoctoral Fellowship',
    organization: 'ETH Zurich',
    logoText: 'ETH',
    location: 'Zurich, Switzerland',
    funding: '85,000 CHF / year',
    deadlineDays: 12,
    category: 'Research Grant',
    matchScore: 99,
    matchLabel: 'Top Match',
    image: '/images/cover_eth.png',
    tags: ['Quantum', 'AI Lab', 'Switzerland'],
    aiInsights: [
      'Highest relevance to your published AI research',
      'Includes lab budget for GPU compute cluster'
    ],
    url: 'https://ai.ethz.ch/'
  },
  {
    id: 'opp-4',
    title: 'Y Combinator Founder Batch 2026',
    organization: 'Y Combinator',
    logoText: 'YC',
    location: 'San Francisco, US',
    funding: '$500,000 Investment',
    deadlineDays: 9,
    category: 'Accelerator',
    matchScore: 94,
    matchLabel: 'High Fit',
    image: '/images/cover_yc.png',
    tags: ['Venture Capital', 'Founders', 'Global'],
    aiInsights: [
      'Ideal for technical founders with working prototype',
      'Fast-track interview queue active'
    ],
    url: 'https://www.ycombinator.com/apply'
  }
]

const filterTabs = ['All Calls', 'Scholarships', 'Fellowships', 'Accelerators', 'Research Grants', 'Highest Match']

export default function OpportunityShowcase() {
  const [activeTab, setActiveTab] = useState('All Calls')
  const [savedIds, setSavedIds] = useState(new Set())
  const [hoveredCardId, setHoveredCardId] = useState(null)
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect()
    setMousePos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    })
  }

  const toggleSave = (e, id) => {
    e.stopPropagation()
    setSavedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return (
    <section className="pt-32 md:pt-44 pb-28 md:pb-36 bg-[#F8FAFC] text-slate-900 relative overflow-hidden">
      
      {/* Ambient Lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[900px] h-[400px] bg-blue-200/30 rounded-full blur-[140px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        
        {/* Section Header */}
        <div className="text-center max-w-4xl mx-auto mb-16">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            viewport={{ once: true }}
            className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-slate-900 mb-6 leading-tight"
          >
            Discover opportunities <br className="hidden sm:inline" />
            <span className="text-indigo-950 font-extrabold">
              worth your ambition.
            </span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true }}
            className="text-slate-600 text-base md:text-xl font-medium max-w-2xl mx-auto mb-10 leading-relaxed"
          >
            <strong className="text-slate-900 font-bold">500,000+</strong> global opportunities continuously discovered, ranked, and personalized by AI.
          </motion.p>

          {/* Statistics Counters */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            viewport={{ once: true }}
            className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto"
          >
            {[
              { label: 'Active Calls', val: '15,420+' },
              { label: 'Match Precision', val: '98.4%' },
              { label: 'Portals Indexed', val: '2,000+' },
              { label: 'Funding Pool', val: '$2.4B' },
            ].map((stat) => (
              <div key={stat.label} className="bg-white/80 backdrop-blur-md border border-slate-200/80 rounded-2xl p-4 shadow-xs text-center">
                <p className="text-xl md:text-2xl font-extrabold text-slate-900 font-mono">{stat.val}</p>
                <p className="text-xs font-semibold text-slate-500">{stat.label}</p>
              </div>
            ))}
          </motion.div>
        </div>

        {/* Filter Bar Chips */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-14 overflow-x-auto pb-2">
          {filterTabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-2.5 rounded-full text-xs font-bold transition-all duration-300 ${
                activeTab === tab
                  ? 'bg-slate-900 text-white shadow-md scale-105'
                  : 'bg-white/80 border border-slate-200/80 text-slate-600 hover:border-slate-300 hover:bg-white'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Bento Editorial Composition Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LARGE FEATURED HERO CARD (7 cols) */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7 }}
            viewport={{ once: true }}
            onMouseMove={(e) => handleMouseMove(e, featuredOpportunity.id)}
            onMouseEnter={() => setHoveredCardId(featuredOpportunity.id)}
            onMouseLeave={() => setHoveredCardId(null)}
            className="lg:col-span-7 bg-white/80 backdrop-blur-2xl border border-white/80 rounded-[32px] p-6 md:p-8 shadow-[0_20px_50px_rgba(0,0,0,0.06)] hover:shadow-xl transition-all duration-500 relative overflow-hidden group"
          >
            {/* Top Badges Row */}
            <div className="flex items-center justify-between gap-3 mb-6 relative z-10">
              <div className="flex items-center gap-2.5">
                <span className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center text-xs font-mono font-bold shadow-xs">
                  {featuredOpportunity.logoText}
                </span>
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-950 bg-indigo-50 border border-indigo-200 px-3 py-1 rounded-full font-mono">
                  {featuredOpportunity.category}
                </span>
              </div>

              <div className="flex items-center gap-2">
                {/* Clean Vector AI Match Pill */}
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-300 shadow-2xs">
                  <Sparkles size={13} className="text-emerald-600 animate-pulse" />
                  <span className="font-mono">98% Match</span>
                </div>

                {/* Bookmark Save Button */}
                <button
                  onClick={(e) => toggleSave(e, featuredOpportunity.id)}
                  className={`w-9 h-9 rounded-full border flex items-center justify-center transition-all ${
                    savedIds.has(featuredOpportunity.id)
                      ? 'bg-slate-950 border-slate-950 text-white shadow-md'
                      : 'bg-white border-slate-200 text-slate-400 hover:text-slate-900'
                  }`}
                >
                  <Bookmark size={15} fill={savedIds.has(featuredOpportunity.id) ? 'currentColor' : 'none'} />
                </button>
              </div>
            </div>

            {/* Cover Image */}
            <div className="w-full aspect-[16/9] rounded-2xl overflow-hidden mb-6 shadow-md border border-slate-200/60 relative group-hover:scale-[1.01] transition-transform duration-500">
              <img 
                src={featuredOpportunity.image} 
                alt={featuredOpportunity.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute top-4 left-4 bg-slate-900/90 backdrop-blur-md text-white text-xs font-bold px-3 py-1 rounded-lg tracking-wider">
                FEATURED CALL
              </div>
            </div>

            {/* Title & Vector Metadata */}
            <div className="relative z-10 mb-6">
              <h3 className="text-2xl md:text-3xl font-extrabold text-slate-900 mb-4 group-hover:text-indigo-950 transition-colors leading-snug">
                {featuredOpportunity.title}
              </h3>

              <div className="flex flex-wrap items-center gap-3 text-xs font-bold text-slate-700">
                <span className="flex items-center gap-1.5 bg-slate-100/80 px-3 py-1.5 rounded-lg border border-slate-200/60">
                  <Building2 size={14} className="text-slate-500" />
                  {featuredOpportunity.organization}
                </span>
                <span className="flex items-center gap-1.5 bg-slate-100/80 px-3 py-1.5 rounded-lg border border-slate-200/60">
                  <MapPin size={14} className="text-slate-500" />
                  {featuredOpportunity.location}
                </span>
                <span className="flex items-center gap-1.5 bg-emerald-50 text-emerald-800 border border-emerald-200 px-3 py-1.5 rounded-lg">
                  <DollarSign size={14} className="text-emerald-600" />
                  {featuredOpportunity.funding}
                </span>
              </div>
            </div>

            {/* Smart Tags Chips */}
            <div className="flex flex-wrap gap-2 mb-6 relative z-10">
              {featuredOpportunity.tags.map((tag) => (
                <span key={tag} className="px-3 py-1 bg-white border border-slate-200/80 text-xs font-semibold text-slate-700 rounded-lg shadow-2xs">
                  {tag}
                </span>
              ))}
            </div>

            {/* Deadline Progress Bar */}
            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 mb-6 relative z-10">
              <div className="flex items-center justify-between text-xs font-bold text-slate-700 mb-2">
                <span className="flex items-center gap-1.5 text-indigo-950 font-extrabold">
                  <Clock size={13} className="text-indigo-950" /> {featuredOpportunity.deadlineDays} Days Remaining
                </span>
                <span className="text-slate-500 font-mono">72% Completed</span>
              </div>
              <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-slate-950 via-indigo-950 to-slate-900 rounded-full w-[72%]" />
              </div>
            </div>

            {/* AI Insights Panel */}
            <div className="bg-slate-50/80 border border-slate-200 rounded-2xl p-4 mb-6 relative z-10 space-y-2.5">
              <p className="text-xs font-extrabold uppercase tracking-wider text-indigo-950 flex items-center gap-1.5 font-mono">
                <ShieldCheck size={14} className="text-indigo-950" /> AI Match Rationale
              </p>
              <div className="space-y-1.5">
                {featuredOpportunity.aiInsights.map((insight, idx) => (
                  <p key={idx} className="text-xs font-medium text-slate-800 flex items-center gap-2">
                    <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
                    <span>{insight}</span>
                  </p>
                ))}
              </div>
            </div>

            {/* Card CTA */}
            <div className="flex items-center justify-end relative z-10">
              <a
                href={featuredOpportunity.url}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 bg-[#0A0A0A] hover:bg-slate-800 text-white font-extrabold text-xs md:text-sm px-6 py-3.5 rounded-xl transition-all shadow-md active:scale-98"
              >
                <span>View Opportunity</span>
                <ArrowRight size={15} className="group-hover:translate-x-1 transition-transform" />
              </a>
            </div>

          </motion.div>

          {/* SECONDARY CARDS (5 cols) */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            {secondaryOpportunities.map((opp, idx) => (
              <motion.div
                key={opp.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: idx * 0.15 }}
                viewport={{ once: true }}
                onMouseMove={(e) => handleMouseMove(e, opp.id)}
                onMouseEnter={() => setHoveredCardId(opp.id)}
                onMouseLeave={() => setHoveredCardId(null)}
                className="bg-white/80 backdrop-blur-2xl border border-white/80 rounded-[28px] p-6 shadow-[0_15px_35px_rgba(0,0,0,0.04)] hover:shadow-xl transition-all duration-300 relative overflow-hidden group"
              >
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-md bg-slate-900 text-white flex items-center justify-center text-[10px] font-mono font-bold">
                      {opp.logoText}
                    </span>
                    <span className="text-xs font-bold uppercase tracking-wider text-indigo-950 bg-indigo-50 border border-indigo-200 px-2.5 py-0.5 rounded-full font-mono">
                      {opp.category}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-300 px-2.5 py-0.5 rounded-full font-mono">
                      {opp.matchScore}% Match
                    </span>
                    <button
                      onClick={(e) => toggleSave(e, opp.id)}
                      className={`w-7 h-7 rounded-full border flex items-center justify-center transition-all ${
                        savedIds.has(opp.id) ? 'bg-slate-950 border-slate-950 text-white' : 'bg-white border-slate-200 text-slate-400'
                      }`}
                    >
                      <Bookmark size={12} fill={savedIds.has(opp.id) ? 'currentColor' : 'none'} />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-[90px_1fr] gap-4 items-center mb-4">
                  <div className="w-full aspect-square rounded-xl overflow-hidden shadow-2xs border border-slate-200/60">
                    <img src={opp.image} alt={opp.title} className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <h4 className="text-base font-extrabold text-slate-900 group-hover:text-indigo-950 transition-colors leading-snug line-clamp-2">
                      {opp.title}
                    </h4>
                    <p className="text-xs text-slate-500 font-semibold mt-1">{opp.organization}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs pt-3 border-t border-slate-100">
                  <span className="font-bold text-slate-800 bg-slate-100 px-2.5 py-1 rounded-lg">
                    {opp.funding}
                  </span>

                  <a
                    href={opp.url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 font-extrabold text-slate-950 hover:text-indigo-950 transition-colors"
                  >
                    <span>View Call</span>
                    <ArrowRight size={13} />
                  </a>
                </div>
              </motion.div>
            ))}
          </div>

        </div>

      </div>
    </section>
  )
}
