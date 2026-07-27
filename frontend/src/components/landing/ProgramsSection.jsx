import { motion } from 'framer-motion'
import { ArrowUpRight, Calendar, Sparkles } from 'lucide-react'

export default function ProgramsSection({ programs, loading }) {
  return (
    <section className="py-16 md:py-24 bg-white text-slate-900 relative border-t border-slate-200/80">
      <div className="max-w-7xl mx-auto px-6">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
          <div>
            <span className="text-xs uppercase tracking-widest font-semibold text-blue-600 mb-3 block">
              Curated Opportunities
            </span>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-slate-900">
              Trending Global Calls
            </h2>
          </div>
          <p className="text-slate-600 max-w-md text-sm md:text-base font-medium">
            Live AI-verified programs, fellowships, and funding rounds discovered across international portals.
          </p>
        </div>

        {/* Programs Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {programs && programs.length > 0 ? (
            programs.map((item, idx) => (
              <motion.div
                key={item.id || idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: idx * 0.08 }}
                viewport={{ once: true }}
                className="group relative bg-slate-50/80 border border-slate-200/80 rounded-2xl p-6 flex flex-col justify-between hover:border-blue-400 hover:bg-white hover:shadow-xl transition-all duration-300"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-4">
                    <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200">
                      {item.category || 'Opportunity'}
                    </span>
                    {item.match_score && (
                      <span className="flex items-center gap-1 text-xs font-semibold text-emerald-600">
                        <Sparkles size={12} />
                        {item.match_score}% Match
                      </span>
                    )}
                  </div>

                  <h3 className="text-xl font-bold text-slate-900 mb-2 group-hover:text-blue-600 transition-colors line-clamp-2">
                    {item.title}
                  </h3>
                  
                  <p className="text-xs text-slate-500 mb-4 font-semibold">
                    By {item.organizer || 'Global Foundation'}
                  </p>

                  <p className="text-sm text-slate-600 line-clamp-3 mb-6 font-normal leading-relaxed">
                    {item.description || 'Fully funded program offering mentorship, stipends, and institutional research access.'}
                  </p>
                </div>

                <div className="pt-4 border-t border-slate-200/80 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                    <Calendar size={14} />
                    <span>{item.deadline || 'Open Call'}</span>
                  </div>

                  <a
                    href={item.apply_url || '#'}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 text-xs font-bold text-slate-900 group-hover:text-blue-600 transition-colors"
                  >
                    <span>Apply</span>
                    <ArrowUpRight size={14} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                  </a>
                </div>
              </motion.div>
            ))
          ) : (
            Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-slate-50 border border-slate-200 rounded-2xl p-6 animate-pulse h-64 flex flex-col justify-between">
                <div className="h-4 bg-slate-200 rounded w-1/3 mb-4" />
                <div className="h-6 bg-slate-200 rounded w-3/4 mb-2" />
                <div className="h-4 bg-slate-200 rounded w-1/2" />
                <div className="h-10 bg-slate-200 rounded w-full mt-auto" />
              </div>
            ))
          )}
        </div>

      </div>
    </section>
  )
}
