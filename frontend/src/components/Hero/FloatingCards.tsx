import { motion, useScroll, useTransform, useSpring } from 'framer-motion'
import { useEffect, useState } from 'react'

interface CardItem {
  id: number
  title: string
  details: string
  initialPosition: { x: string; y: string }
  delay: number
}

const cards: CardItem[] = [
  {
    id: 1,
    title: 'MIT Fellowship',
    details: 'Deadline: 12 Days • Funding: £50K',
    initialPosition: { x: '10vw', y: '20vh' },
    delay: 0,
  },
  {
    id: 2,
    title: 'Y Combinator',
    details: 'Application Open',
    initialPosition: { x: '75vw', y: '30vh' },
    delay: 0.2,
  },
  {
    id: 3,
    title: 'Oxford Scholarship',
    details: '98% Match',
    initialPosition: { x: '15vw', y: '65vh' },
    delay: 0.4,
  },
  {
    id: 4,
    title: 'Google Research',
    details: 'Recommended',
    initialPosition: { x: '80vw', y: '70vh' },
    delay: 0.6,
  }
]

function FloatingCard({ card, index, mousePosition, scrollYSpring }: { card: CardItem; index: number; mousePosition: { x: number; y: number }; scrollYSpring: any }) {
  const depthFactor = (index + 1) * 15
  const scrollLift = useTransform(scrollYSpring, [0, 500], [0, -100 * (index + 1)])

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ 
        opacity: 1, 
        scale: 1, 
        x: mousePosition.x * depthFactor,
        y: mousePosition.y * depthFactor
      }}
      style={{
        position: 'absolute',
        left: card.initialPosition.x,
        top: card.initialPosition.y,
        y: scrollLift,
      }}
      transition={{
        opacity: { duration: 1, delay: card.delay },
        scale: { duration: 1, delay: card.delay, type: 'spring' },
        x: { type: 'spring', stiffness: 50, damping: 20 },
        y: { type: 'spring', stiffness: 50, damping: 20 }
      }}
    >
      <motion.div
        animate={{ 
          y: [0, -10, 0],
          rotate: [0, index % 2 === 0 ? 2 : -2, 0]
        }}
        transition={{
          duration: 6 + index,
          repeat: Infinity,
          ease: 'easeInOut'
        }}
        className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-4 shadow-2xl flex flex-col gap-1 min-w-[180px]"
      >
        <span className="text-white font-medium text-sm tracking-tight">{card.title}</span>
        <span className="text-nx-muted text-xs">{card.details}</span>
      </motion.div>
    </motion.div>
  )
}

export default function FloatingCards() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const { scrollY } = useScroll()
  const scrollYSpring = useSpring(scrollY, { stiffness: 100, damping: 30 })

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({
        x: (e.clientX / window.innerWidth) * 2 - 1,
        y: (e.clientY / window.innerHeight) * 2 - 1,
      })
    }
    
    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  return (
    <div className="absolute inset-0 pointer-events-none z-10 overflow-hidden">
      {cards.map((card, index) => (
        <FloatingCard
          key={card.id}
          card={card}
          index={index}
          mousePosition={mousePosition}
          scrollYSpring={scrollYSpring}
        />
      ))}
    </div>
  )
}
