import { motion } from 'framer-motion'
import { Star, Award } from 'lucide-react'

const testimonials = [
  {
    name: 'Dr. Elena Rostova',
    role: 'Postdoctoral Fellow in Machine Learning',
    award: 'Alexander von Humboldt Fellowship',
    funding: '€38,400/yr Stipend',
    text: 'Nexora routed me directly to the Humboldt research portal call before it closed. The AI match score predicted 98% eligibility, which proved 100% accurate!'
  },
  {
    name: 'Julian Vance',
    role: 'Co-Founder @ QuantumFlow',
    award: 'Y Combinator W26 Batch',
    funding: '$500,000 Investment',
    text: 'We discovered two non-dilutive government innovation grants alongside YC. Nexora Saved us weeks of manual application hunting.'
  },
  {
    name: 'Aisha Al-Mansoor',
    role: 'Master’s Scholar in Quantum Computing',
    award: 'Erasmus Mundus Joint Degree',
    funding: '100% Full Tuition + Travel',
    text: 'The direct link verification meant zero dead ends. I submitted my proposal 3 weeks ahead of the deadline.'
  }
]

export default function TestimonialsSection() {
  return (
    <section className="py-24 bg-white text-slate-900 relative border-t border-slate-200/80">
      <div className="max-w-7xl mx-auto px-6">
        
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-slate-900 mb-4">
            Trusted by Researchers & Founders Worldwide
          </h2>
          <p className="text-slate-600 text-base md:text-lg font-medium">
            Read how Nexora applicants secured prestigious global fellowships and seed funding.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((t, idx) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: idx * 0.1 }}
              viewport={{ once: true }}
              className="bg-slate-50 border border-slate-200/80 rounded-2xl p-8 shadow-sm flex flex-col justify-between hover:border-blue-300 transition-all"
            >
              <div>
                <div className="flex items-center gap-1 text-amber-500 mb-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} size={16} fill="currentColor" />
                  ))}
                </div>

                <p className="text-slate-700 text-sm md:text-base leading-relaxed mb-6 font-medium">
                  "{t.text}"
                </p>
              </div>

              <div>
                <div className="pt-4 border-t border-slate-200 mb-4">
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-slate-900 text-white mb-2">
                    <Award size={12} /> {t.award}
                  </span>
                  <p className="text-xs font-bold text-emerald-700">{t.funding}</p>
                </div>

                <div>
                  <h4 className="text-base font-bold text-slate-900">{t.name}</h4>
                  <p className="text-xs text-slate-500 font-semibold">{t.role}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  )
}
