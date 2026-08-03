import { motion } from 'framer-motion'
import { useState } from 'react'

export default function HeroBackground() {
  const [videoLoaded, setVideoLoaded] = useState(false)

  return (
    <div className="absolute inset-0 overflow-hidden bg-nx-dark pointer-events-none">
      {/* Instant Ambient Gradient Fallback (renders in 0ms while video streams) */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#090d16] via-[#05070c] to-nx-dark z-0" />
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] bg-indigo-600/15 rounded-full blur-[160px] pointer-events-none z-0" />

      {/* Optimized Background Video with Instant Poster Fallback */}
      <video
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        poster="/assets/hero_poster.jpg"
        onCanPlay={() => setVideoLoaded(true)}
        className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${
          videoLoaded ? 'opacity-85' : 'opacity-70'
        }`}
      >
        <source src="/assets/hero_video.webm" type="video/webm" />
        <source src="/assets/hero_video.mp4" type="video/mp4" />
      </video>

      {/* Subtle overlay for contrast */}
      <div className="absolute inset-0 bg-black/30 bg-[radial-gradient(circle_at_center,_transparent_0%,_rgba(0,0,0,0.5)_100%)]" />
      
      {/* Animated network nodes */}
      <motion.div
        animate={{
          rotate: 360,
          scale: [1, 1.05, 1],
        }}
        transition={{
          duration: 150,
          repeat: Infinity,
          ease: "linear"
        }}
        className="absolute inset-[-50%] w-[200%] h-[200%] flex items-center justify-center"
      >
        {/* Layer 1: Blurred background glowing orbs */}
        <div className="absolute top-[30%] left-[30%] w-[400px] h-[400px] bg-nx-accent/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-[20%] right-[30%] w-[500px] h-[500px] bg-nx-violet/10 rounded-full blur-[150px]" />
        
        {/* Layer 2: Connecting lines and nodes */}
        <svg className="absolute inset-0 w-full h-full opacity-30" xmlns="http://www.w3.org/2000/svg" viewBox="-500 -500 1000 1000" preserveAspectRatio="xMidYMid slice">
          <defs>
            <linearGradient id="line-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#4F7CFF" stopOpacity="0.2" />
              <stop offset="50%" stopColor="#8B7FFF" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#4F7CFF" stopOpacity="0.1" />
            </linearGradient>
          </defs>
          
          <g>
            {/* Abstract network paths */}
            <motion.path 
              d="M -300 -200 Q -100 -400 100 -200 T 400 -100" 
              fill="none" 
              stroke="url(#line-gradient)" 
              strokeWidth="1"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ duration: 4, ease: "easeInOut", repeat: Infinity, repeatType: "reverse" }}
            />
            <motion.path 
              d="M -400 100 Q -200 300 0 100 T 300 200" 
              fill="none" 
              stroke="url(#line-gradient)" 
              strokeWidth="1.5"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ duration: 5, ease: "easeInOut", repeat: Infinity, repeatType: "reverse", delay: 1 }}
            />
            <motion.path 
              d="M -200 300 Q 100 400 200 100 T 500 -50" 
              fill="none" 
              stroke="url(#line-gradient)" 
              strokeWidth="0.5"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ duration: 6, ease: "easeInOut", repeat: Infinity, repeatType: "reverse", delay: 2 }}
            />
          </g>
        </svg>

        {/* Floating particles/nodes */}
        {Array.from({ length: 20 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute bg-nx-accent rounded-full"
            style={{
              width: Math.random() * 4 + 2 + 'px',
              height: Math.random() * 4 + 2 + 'px',
              top: Math.random() * 100 + '%',
              left: Math.random() * 100 + '%',
              opacity: Math.random() * 0.5 + 0.2,
            }}
            animate={{
              y: [0, Math.random() * -100 - 50],
              opacity: [0, 0.8, 0],
            }}
            transition={{
              duration: Math.random() * 10 + 10,
              repeat: Infinity,
              ease: "linear",
              delay: Math.random() * 10,
            }}
          />
        ))}
      </motion.div>
    </div>
  )
}
