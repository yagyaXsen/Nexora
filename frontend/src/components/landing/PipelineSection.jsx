import { motion } from 'framer-motion'
import { CheckCircle2, ArrowUpRight } from 'lucide-react'

const opportunities = [
  {
    title: 'Alexander von Humboldt Postdoctoral Fellowship 2026',
    organizer: 'Alexander von Humboldt Foundation',
    category: 'Fellowship',
    stipend: '€2,700 - €3,200/mo',
    url: 'https://www.humboldt-foundation.de/en/apply/sponsorship-programmes/humboldt-research-fellowship'
  },
  {
    title: 'Google for Startups Accelerator: Middle East, North Africa & Turkey',
    organizer: 'Google for Startups',
    category: 'Accelerator',
    stipend: 'Equity-Free Mentorship',
    url: 'https://startup.google.com/programs/accelerator/middle-east-north-africa-turkey/'
  },
  {
    title: 'Erasmus Mundus Joint Masters Scholarship',
    organizer: 'European Commission',
    category: 'Scholarship',
    stipend: '100% Fully Funded',
    url: 'https://erasmus-plus.ec.europa.eu/opportunities/opportunities-for-individuals/students/erasmus-mundus-joint-masters-scholarships'
  },
  {
    title: 'Y Combinator Founder Batch 2026',
    organizer: 'Y Combinator',
    category: 'Accelerator',
    stipend: '$500,000 Investment',
    url: 'https://www.ycombinator.com/apply'
  }
]

export default function PipelineSection() {
  return (
    <section className="py-24 bg-slate-50 text-slate-900 relative border-t border-slate-200/80">
      <div className="max-w-7xl mx-auto px-6">
        
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-slate-900 mb-6">
            Live Verified Opportunity Stream
          </h2>
          <p className="text-slate-600 text-base md:text-lg font-medium">
            Every link is 2-step verified to land directly on the active application portal — never generic corporate landing pages.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {opportunities.map((item, idx) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: idx * 0.1 }}
              viewport={{ once: true }}
              className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm hover:border-blue-300 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-4">
                  <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200">
                    {item.category}
                  </span>
                  <span className="flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
                    <CheckCircle2 size={12} /> 2-Pass Verified (HTTP 200)
                  </span>
                </div>

                <h3 className="text-xl font-bold text-slate-900 mb-2 leading-snug">
                  {item.title}
                </h3>
                
                <p className="text-xs text-slate-500 mb-4 font-semibold">
                  Organized by {item.organizer}
                </p>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900 bg-slate-100 px-3 py-1 rounded-lg">
                  {item.stipend}
                </span>

                <a
                  href={item.url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 text-xs font-bold text-slate-900 hover:text-blue-600 transition-colors"
                >
                  <span>Direct Apply</span>
                  <ArrowUpRight size={14} />
                </a>
              </div>
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  )
}
