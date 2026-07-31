import { motion } from 'framer-motion'
import { Building2, Globe2, Layers, Award } from 'lucide-react'
import { Link } from 'react-router-dom'

const regions = [
  { name: 'Europe & UK', count: '6,400+ Calls', top: 'Humboldt, CERN, ETH Zurich, Horizon Europe' },
  { name: 'North America', count: '5,200+ Calls', top: 'MIT, Stanford, YC, NSF Grants' },
  { name: 'Asia & Pacific', count: '2,800+ Calls', top: 'University of Tokyo, NUS, HKUST' },
  { name: 'MENA & LATAM', count: '1,500+ Calls', top: 'KAUST, Google MENAT, CAPES Humboldt' },
]

export default function EcosystemSection() {
  return (
    <section className="py-24 bg-white text-slate-900 relative border-t border-slate-200/80">
      <div className="max-w-7xl mx-auto px-6">
        
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-slate-900 mb-4">
            Indexing 2,000+ Institutional Portals Worldwide
          </h2>
          <p className="text-slate-600 text-base md:text-lg font-medium">
            From premier European research foundations to Silicon Valley startup accelerators.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {regions.map((r, idx) => (
            <motion.div
              key={r.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: idx * 0.1 }}
              viewport={{ once: true }}
              className="bg-slate-50 border border-slate-200/80 rounded-2xl p-6 shadow-sm hover:border-blue-300 transition-all"
            >
              <div className="w-10 h-10 rounded-xl bg-blue-100 border border-blue-200 text-blue-700 flex items-center justify-center font-bold mb-4">
                <Globe2 size={20} />
              </div>

              <h3 className="text-lg font-bold text-slate-900 mb-1">{r.name}</h3>
              <p className="text-sm font-bold text-blue-600 mb-3">{r.count}</p>
              <p className="text-xs text-slate-500 font-medium leading-relaxed">
                Featured: {r.top}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Institution Badges */}
        <div className="bg-slate-900 text-white rounded-3xl p-8 md:p-12 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="max-w-xl">
            <h3 className="text-2xl font-bold text-white mb-2">Automated Portal Schedulers</h3>
            <p className="text-slate-400 text-sm font-medium">
              Our scrapers check listing pages every 4 hours to verify active application forms before deadlines pass.
            </p>
          </div>
          <Link
            to="/explore"
            className="px-6 py-3 rounded-xl bg-white text-slate-900 font-bold text-sm hover:bg-slate-100 transition-colors shrink-0"
          >
            Explore Global Database
          </Link>
        </div>

      </div>
    </section>
  )
}
