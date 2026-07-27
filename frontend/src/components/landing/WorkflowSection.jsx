import { motion } from 'framer-motion'
import { Search, Filter, BellRing, Rocket } from 'lucide-react'

const steps = [
  {
    step: '01',
    title: 'Autonomous Multi-Agent Crawling',
    desc: 'Nexora continuously monitors 2,000+ university, government, and venture portals 24/7 to index new calls as soon as they drop.',
    icon: Search,
  },
  {
    step: '02',
    title: 'Groq-Powered AI Normalization',
    desc: 'Unstructured HTML pages are automatically converted into structured schemas with deadlines, funding amounts, and eligibility requirements.',
    icon: Filter,
  },
  {
    step: '03',
    title: 'Personalized Profile Matching',
    desc: 'Our semantic algorithm matches your background, research interests, or startup stage to calculate a precise fit percentage.',
    icon: BellRing,
  },
  {
    step: '04',
    title: 'One-Click Direct Application',
    desc: 'Skip generic homepages. Nexora routes you straight into the active program application portal with prepared documents.',
    icon: Rocket,
  },
]

export default function WorkflowSection() {
  return (
    <section className="py-16 md:py-24 bg-slate-50 text-slate-900 relative border-t border-slate-200/80">
      <div className="max-w-7xl mx-auto px-6">
        
        <div className="text-center max-w-3xl mx-auto mb-20">
          <span className="text-xs uppercase tracking-widest font-semibold text-blue-600 mb-3 block">
            How It Works
          </span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-slate-900 mb-6">
            From Discovery to Submission in Four Steps
          </h2>
          <p className="text-slate-600 text-base md:text-lg font-medium">
            Built to eliminate endless manual searching and give applicants an unfair advantage.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((s, idx) => {
            const Icon = s.icon
            return (
              <motion.div
                key={s.step}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                viewport={{ once: true }}
                className="relative bg-white border border-slate-200/80 shadow-sm rounded-2xl p-6 flex flex-col justify-between hover:border-blue-300 hover:shadow-md transition-all"
              >
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <span className="text-2xl font-mono font-bold text-blue-600">
                      {s.step}
                    </span>
                    <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
                      <Icon size={20} />
                    </div>
                  </div>

                  <h3 className="text-xl font-bold text-slate-900 mb-3">
                    {s.title}
                  </h3>
                  <p className="text-sm text-slate-600 leading-relaxed font-normal">
                    {s.desc}
                  </p>
                </div>
              </motion.div>
            )
          })}
        </div>

      </div>
    </section>
  )
}
