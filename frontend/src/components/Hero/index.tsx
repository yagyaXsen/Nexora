import { motion, useScroll, useTransform } from 'framer-motion'
import { useRef } from 'react'
import HeroBackground from './HeroBackground'
import FloatingCards from './FloatingCards'
import Navbar from './Navbar'
import HeroContent from './HeroContent'

export default function Hero() {
  const containerRef = useRef<HTMLDivElement>(null)
  
  // Track scroll position relative to the hero section
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end start']
  })

  // Scroll animations
  const scale = useTransform(scrollYProgress, [0, 1], [1, 0.94])
  const bgScale = useTransform(scrollYProgress, [0, 1], [1, 1.08])
  const y = useTransform(scrollYProgress, [0, 1], [0, 50])
  
  return (
    <section 
      ref={containerRef} 
      className="relative w-full h-screen overflow-hidden bg-nx-dark mb-[-40px]"
    >
      <motion.div 
        style={{ scale, y }} 
        className="relative w-full h-full origin-top"
      >
        <motion.div 
          style={{ scale: bgScale }} 
          className="absolute inset-0"
        >
          <HeroBackground />
        </motion.div>
        
        <FloatingCards />
        <HeroContent />
      </motion.div>
      
      {/* Navbar is fixed, rendered outside the scaling container */}
      <Navbar />
    </section>
  )
}
