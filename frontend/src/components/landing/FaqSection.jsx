import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown } from 'lucide-react'

const faqs = [
  {
    q: 'How does Nexora verify program application links?',
    a: 'Nexora runs a multi-pass crawler. First, it identifies listing pages, then navigates directly to specific program detail pages, and verifies that the application action link leads directly to an active submission portal (returning HTTP 200 OK).'
  },
  {
    q: 'What types of opportunities are indexed on Nexora?',
    a: 'We index academic research fellowships, postdocs, master’s scholarships, global startup accelerators, government research grants, and international innovation competitions.'
  },
  {
    q: 'Is Nexora free for students and researchers?',
    a: 'Yes! Basic opportunity browsing, AI matching scores, and direct application routing are 100% free for individual applicants.'
  },
  {
    q: 'How often is the opportunity database updated?',
    a: 'Our background pipeline crawls partner feeds and portal index pages multiple times daily using automated schedulers.'
  }
]

export default function FaqSection() {
  const [openIdx, setOpenIdx] = useState(null)

  return (
    <section className="py-24 bg-slate-50 text-slate-900 relative border-t border-slate-200/80">
      <div className="max-w-4xl mx-auto px-6">
        
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-slate-900">
            Frequently Asked Questions
          </h2>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, idx) => {
            const isOpen = openIdx === idx
            return (
              <div
                key={faq.q}
                className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-sm transition-all"
              >
                <button
                  onClick={() => setOpenIdx(isOpen ? null : idx)}
                  className="w-full p-6 text-left flex items-center justify-between gap-4 font-bold text-base md:text-lg text-slate-900"
                >
                  <span>{faq.q}</span>
                  <ChevronDown
                    size={20}
                    className={`text-blue-600 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
                  />
                </button>

                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="px-6 pb-6 text-sm text-slate-600 font-medium leading-relaxed border-t border-slate-100 pt-4"
                    >
                      {faq.a}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )
          })}
        </div>

      </div>
    </section>
  )
}
