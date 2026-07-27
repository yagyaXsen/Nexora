import { motion } from 'framer-motion'
import { Award, Globe, Zap, ShieldCheck } from 'lucide-react'

const statsData = [
  { label: 'Global Opportunities Tracked', value: '15,000+', icon: Globe },
  { label: 'Total Funding Pool', value: '$250M+', icon: Award },
  { label: 'Average Match Accuracy', value: '98.4%', icon: Zap },
  { label: 'Verified Partners & Labs', value: '500+', icon: ShieldCheck },
]

const partners = [
  'MIT Media Lab', 'Y Combinator', 'CERN Research', 'DAAD Germany',
  'Google for Startups', 'ETH Zurich', 'Horizon Europe', 'Erasmus Mundus'
]

export default function ProofSection({ stats }) {
  return (
    <section className="py-12 md:py-16 bg-slate-50 text-slate-900 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-6">
        
        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-20">
          {statsData.map((s, idx) => {
            const Icon = s.icon
            return (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                viewport={{ once: true }}
                className="bg-white border border-slate-200/80 shadow-sm rounded-2xl p-6 hover:border-blue-300 hover:shadow-md transition-all"
              >
                <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 mb-4">
                  <Icon size={20} />
                </div>
                <div className="text-3xl md:text-4xl font-bold tracking-tight mb-1 text-slate-900">
                  {s.value}
                </div>
                <div className="text-xs md:text-sm text-slate-500 font-medium">
                  {s.label}
                </div>
              </motion.div>
            )
          })}
        </div>

        {/* Marquee Header */}
        <div className="text-center mb-8">
          <p className="text-xs uppercase tracking-widest font-semibold text-slate-500">
            Index & Program Partners
          </p>
        </div>

        {/* Partner Pills Marquee */}
        <div className="flex flex-wrap items-center justify-center gap-3 max-w-4xl mx-auto">
          {partners.map((partner) => (
            <span
              key={partner}
              className="px-4 py-2 rounded-full bg-white border border-slate-200/80 text-sm font-semibold text-slate-700 hover:text-slate-900 hover:border-blue-300 shadow-sm transition-all cursor-default"
            >
              {partner}
            </span>
          ))}
        </div>

      </div>
    </section>
  )
}
