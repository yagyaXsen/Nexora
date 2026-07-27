import { useState } from 'react'
import { motion } from 'framer-motion'
import { Calculator, Sparkles, CheckCircle2 } from 'lucide-react'

export default function MatchCalculator() {
  const [role, setRole] = useState('Postdoc / Researcher')
  const [field, setField] = useState('AI & Computer Science')
  const [region, setRegion] = useState('Europe / UK')

  const estimatedFunding = role === 'Startup Founder' ? '$500,000+' : role === 'Postdoc / Researcher' ? '€85,000/yr' : '$45,000/yr'
  const matchRate = field === 'AI & Computer Science' ? '98.4%' : '94.2%'
  const openCallsCount = region === 'Europe / UK' ? '1,420 Active Calls' : '2,150 Active Calls'

  return (
    <section className="py-24 bg-slate-50 text-slate-900 relative border-t border-slate-200/80">
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
        
        <div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-slate-900 mb-6">
            Calculate Your Available Funding & Match Rate
          </h2>
          <p className="text-slate-600 text-base md:text-lg mb-8 leading-relaxed font-medium">
            Select your profile parameters to see estimated research stipends, institutional grant pools, and eligible application calls tracked on Nexora.
          </p>

          <div className="space-y-3">
            {[
              'Real-time aggregation across 500+ top universities & labs',
              'AI semantic matching powered by Groq normalization pipeline',
              'Direct submission routing to official portal forms',
            ].map(item => (
              <div key={item} className="flex items-center gap-3 text-sm font-bold text-slate-800">
                <CheckCircle2 size={18} className="text-blue-600 shrink-0" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Calculator Widget Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="bg-white border border-slate-200/80 rounded-3xl p-8 shadow-xl"
        >
          <div className="flex items-center justify-between border-b border-slate-200 pb-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center font-bold">
                <Calculator size={20} />
              </div>
              <span className="text-lg font-bold text-slate-900">AI Grant Match Engine</span>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
              <Sparkles size={12} /> Live Calculator
            </span>
          </div>

          <div className="space-y-5 mb-8">
            {/* Input 1: Role */}
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 block">
                Applicant Role
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:border-blue-500"
              >
                <option>Postdoc / Researcher</option>
                <option>PhD / Master Student</option>
                <option>Startup Founder</option>
              </select>
            </div>

            {/* Input 2: Field */}
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 block">
                Field of Study / Domain
              </label>
              <select
                value={field}
                onChange={(e) => setField(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:border-blue-500"
              >
                <option>AI & Computer Science</option>
                <option>Quantum & Physics</option>
                <option>Biotech & Medicine</option>
                <option>Clean Energy & Climate</option>
              </select>
            </div>

            {/* Input 3: Region */}
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 block">
                Target Region
              </label>
              <select
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:border-blue-500"
              >
                <option>Europe / UK</option>
                <option>North America (US & Canada)</option>
                <option>Asia & MENA</option>
                <option>Global / Any</option>
              </select>
            </div>
          </div>

          {/* Results Box */}
          <div className="bg-slate-900 text-white rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-lg">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Estimated Available Funding</p>
              <p className="text-3xl font-extrabold text-white">{estimatedFunding}</p>
            </div>
            <div className="text-right">
              <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-emerald-500 text-white mb-1">
                {matchRate} Match Rate
              </span>
              <p className="text-xs text-slate-400 font-semibold">{openCallsCount}</p>
            </div>
          </div>

        </motion.div>

      </div>
    </section>
  )
}
