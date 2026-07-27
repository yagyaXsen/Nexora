import { motion } from 'framer-motion'
import { ArrowRight, Sparkles } from 'lucide-react'

export default function ConversionSection() {
  return (
    <section className="py-28 bg-white text-slate-900 relative border-t border-slate-200/80 overflow-hidden">
      {/* Ambient Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-blue-100/50 rounded-full blur-[140px] pointer-events-none" />

      <div className="max-w-5xl mx-auto px-6 text-center relative z-10">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="bg-slate-50 border border-slate-200/80 rounded-3xl p-12 md:p-16 shadow-xl"
        >
          <h2 className="text-3xl sm:text-5xl md:text-6xl font-bold tracking-tight text-slate-900 mb-6 leading-tight">
            Discover Your Next Global Opportunity Before Deadlines Pass
          </h2>

          <p className="text-slate-600 text-base md:text-lg max-w-2xl mx-auto mb-10 font-medium">
            Join thousands of researchers, students, and founders finding funding, research grants, and accelerator programs worldwide.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href="/signup"
              className="w-full sm:w-auto px-8 py-4 rounded-xl bg-slate-900 text-white font-bold text-sm hover:bg-slate-800 transition-colors flex items-center justify-center gap-2 shadow-lg"
            >
              <span>Create Free Account</span>
              <ArrowRight size={16} />
            </a>
            <a
              href="/explore"
              className="w-full sm:w-auto px-8 py-4 rounded-xl bg-white text-slate-900 font-bold text-sm hover:bg-slate-100 border border-slate-200 transition-colors shadow-sm"
            >
              Browse All Programs
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
