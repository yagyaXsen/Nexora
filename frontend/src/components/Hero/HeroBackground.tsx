import { motion } from 'framer-motion'

export default function HeroBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden bg-nx-dark pointer-events-none">
      {/* Background Video from Hero */}
      <video
        autoPlay
        muted
        loop
        playsInline
        className="absolute inset-0 w-full h-full object-cover opacity-85"
        src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260711_090308_1dd0cea7-f9ba-4db4-8147-c7d746061c9e.mp4"
      />

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
        <svg className="absolute inset-0 w-full h-full opacity-30" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="line-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#4F7CFF" stopOpacity="0.2" />
              <stop offset="50%" stopColor="#8B7FFF" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#4F7CFF" stopOpacity="0.1" />
            </linearGradient>
          </defs>
          
          <g transform="translate(50vw, 50vh)">
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
