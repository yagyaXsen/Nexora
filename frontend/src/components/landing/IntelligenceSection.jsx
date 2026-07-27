import { motion } from 'framer-motion'
import { Cpu, CheckCircle2, FileText, Sparkles } from 'lucide-react'

export default function IntelligenceSection() {
  return (
    <section className="py-16 md:py-24 bg-white text-slate-900 relative border-t border-slate-200/80 overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
        
        <div>
          <span className="text-xs uppercase tracking-widest font-semibold text-blue-600 mb-3 block">
            AI Assistant & Copilot
          </span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-slate-900 mb-6">
            Intelligent Matching That Knows Your Strengths
          </h2>
          <p className="text-slate-600 text-base md:text-lg mb-8 leading-relaxed font-medium">
            Stop filling out applications blindly. Nexora analyzes your resume, research history, or pitch deck to match eligibility metrics before you invest time applying.
          </p>

          <div className="space-y-4">
            {[
              'Automated eligibility score breakdown',
              'Personalized essay & proposal suggestions',
              'Real-time deadline reminders & calendar syncing',
              'Deep direct link extraction to final submit forms',
            ].map((feat) => (
              <div key={feat} className="flex items-center gap-3 text-sm font-semibold text-slate-800">
                <CheckCircle2 size={18} className="text-blue-600 shrink-0" />
                <span>{feat}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Live Copilot Preview Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="bg-slate-50 border border-slate-200/80 rounded-3xl p-8 shadow-xl relative"
        >
          <div className="flex items-center justify-between border-b border-slate-200 pb-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-100 border border-blue-200 flex items-center justify-center text-blue-600">
                <Cpu size={18} />
              </div>
              <span className="text-sm font-bold text-slate-900">Nexora AI Copilot</span>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700 border border-emerald-200 flex items-center gap-1">
              <Sparkles size={12} /> Live Analysis
            </span>
          </div>

          <div className="space-y-4 text-xs md:text-sm">
            <div className="p-4 rounded-xl bg-white border border-slate-200 text-slate-800 shadow-sm">
              <p className="text-xs text-blue-600 font-bold mb-1">PROMPT</p>
              <p className="font-mono text-slate-700">"Find fully funded postdoctoral CS research grants in Europe for 2026."</p>
            </div>

            <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 text-slate-900 shadow-sm">
              <p className="text-xs text-blue-700 font-bold mb-1">AI RESULT MATCH</p>
              <p className="font-bold text-slate-900">Alexander von Humboldt Fellowship (98% Match)</p>
              <p className="text-xs text-slate-600 font-medium mt-1">Stipend: €3,200/mo • Deadline: Rolling • 2-Pass Verified</p>
            </div>

            <div className="flex items-center gap-2 p-3 rounded-xl bg-white border border-slate-200 text-slate-700 shadow-sm">
              <FileText size={16} className="text-blue-600" />
              <span className="text-xs font-medium">Generated statement of purpose outline ready.</span>
            </div>
          </div>
        </motion.div>

      </div>
    </section>
  )
}
