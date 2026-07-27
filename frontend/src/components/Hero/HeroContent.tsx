import { motion } from 'framer-motion'
import AIBar from './AIBar'

const headlineLines = [
  "Discover the world's",
  "next opportunity",
  "before everyone else."
]

export default function HeroContent() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.3,
      }
    }
  }

  const lineVariants = {
    hidden: { opacity: 0, y: 40, filter: 'blur(10px)' },
    visible: { 
      opacity: 1, 
      y: 0, 
      filter: 'blur(0px)',
      transition: { duration: 1, ease: [0.16, 1, 0.3, 1] }
    }
  }

  return (
    <div className="absolute inset-0 flex flex-col justify-end items-center pb-20 md:pb-28 pt-20 px-4 z-20 pointer-events-none">
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="w-full max-w-5xl mx-auto flex flex-col items-center pointer-events-auto"
      >
        {/* Headline */}
        <h1 className="text-center font-medium tracking-tight leading-[1.1] mb-6 w-full">
          {headlineLines.map((line, i) => (
            <motion.div key={i} variants={lineVariants} className="overflow-hidden">
              <span className={`block text-[36px] sm:text-[56px] md:text-[72px] lg:text-[84px] ${
                line === 'next opportunity' 
                  ? 'text-transparent bg-clip-text bg-gradient-to-r from-nx-accent via-[#6b91ff] to-white'
                  : 'text-white'
              }`}>
                {line}
              </span>
            </motion.div>
          ))}
        </h1>

        {/* Subtitle */}
        <motion.p 
          variants={lineVariants}
          className="text-white/80 text-sm md:text-base lg:text-lg font-normal text-center max-w-[580px] mb-8"
        >
          Nexora continuously discovers global opportunities, understands what fits your profile, and helps you act before deadlines disappear.
        </motion.p>

        {/* AI Live Intelligence Bar */}
        <AIBar />
      </motion.div>
    </div>
  )
}
