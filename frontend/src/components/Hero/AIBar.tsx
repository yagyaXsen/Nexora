import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, ArrowRight } from 'lucide-react'

const opportunities = [
  "Searching worldwide...",
  "✓ MIT Fellowship",
  "✓ YC Startup School",
  "✓ Google Summer of Code",
  "✓ Horizon Europe Grant",
  "✓ ETH Research Program"
]

export default function AIBar() {
  const [index, setIndex] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % opportunities.length)
    }, 2500)
    return () => clearInterval(interval)
  }, [])

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 1.2, duration: 0.8, ease: "easeOut" }}
      className="flex flex-col sm:flex-row items-center justify-between gap-4 p-2 sm:pl-6 sm:pr-2 bg-nx-glass backdrop-blur-xl border border-nx-border rounded-2xl w-full max-w-2xl mx-auto shadow-2xl"
    >
      
      {/* Left side: AI Icon & Live Text */}
      <div className="flex items-center gap-4 w-full sm:w-auto px-4 sm:px-0 pt-2 sm:pt-0 overflow-hidden">
        <motion.div
          animate={{ rotate: [0, 15, -15, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          className="text-nx-accent shrink-0"
        >
          <Sparkles size={20} />
        </motion.div>
        
        <div className="relative h-6 flex-1 sm:w-[220px] overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.p
              key={index}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -20, opacity: 0 }}
              transition={{ duration: 0.4, ease: "circOut" }}
              className={`absolute inset-0 text-sm font-medium tracking-wide whitespace-nowrap truncate ${
                index === 0 ? 'text-nx-muted animate-pulse' : 'text-white'
              }`}
            >
              {opportunities[index]}
            </motion.p>
          </AnimatePresence>
        </div>
      </div>

      {/* Right side: Action Button */}
      <button className="w-full sm:w-auto group relative flex items-center justify-center gap-2 bg-white text-nx-dark font-semibold px-6 py-3 rounded-xl overflow-hidden hover:bg-gray-100 transition-colors">
        <span className="relative z-10 text-sm">Explore Opportunities</span>
        <ArrowRight size={16} className="relative z-10 group-hover:translate-x-1 transition-transform" />
      </button>

    </motion.div>
  )
}
