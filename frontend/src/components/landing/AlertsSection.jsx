import { motion } from 'framer-motion'
import { Bell, ShieldCheck, Zap } from 'lucide-react'

export default function AlertsSection() {
  return (
    <section className="py-16 md:py-24 bg-slate-50 text-slate-900 relative border-t border-slate-200/80">
      <div className="max-w-7xl mx-auto px-6 text-center">
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="max-w-3xl mx-auto"
        >
          <span className="text-xs uppercase tracking-widest font-extrabold text-indigo-950 mb-3 block">
            Never Miss a Deadline
          </span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-slate-900 mb-6">
            Instant Alerts Before Applications Close
          </h2>
          <p className="text-slate-600 text-base md:text-lg mb-12 font-medium">
            Receive real-time notifications via email or dashboard when relevant opportunities launch or approach final submission dates.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
            <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm">
              <Bell className="text-blue-600 mb-4" size={24} />
              <h3 className="text-lg font-bold text-slate-900 mb-2">Custom Thresholds</h3>
              <p className="text-xs text-slate-600 font-medium">Set notifications for 30, 14, or 3 days prior to application deadlines.</p>
            </div>

            <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm">
              <ShieldCheck className="text-blue-600 mb-4" size={24} />
              <h3 className="text-lg font-bold text-slate-900 mb-2">Verified Links</h3>
              <p className="text-xs text-slate-600 font-medium">Every opportunity link undergoes 2-step verification directly to official portals.</p>
            </div>

            <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm">
              <Zap className="text-blue-600 mb-4" size={24} />
              <h3 className="text-lg font-bold text-slate-900 mb-2">Smart Queue</h3>
              <p className="text-xs text-slate-600 font-medium">Save and organize opportunities directly into your personal Kanban tracker.</p>
            </div>
          </div>
        </motion.div>

      </div>
    </section>
  )
}
