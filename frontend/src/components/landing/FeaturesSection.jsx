import { useEffect, useState, useRef } from 'react'
import { CheckCircle2, ArrowUpRight, Sparkles } from 'lucide-react'

const features = [
  {
    id: 'feature-1',
    title: 'Autonomous Opportunity Discovery',
    description: 'Nexora’s 2-pass crawler continuously indexes 15,000+ global fellowships, research grants, and accelerator calls directly from official university and foundation portals.',
    badge: '15,000+ Live Calls',
    image: '/images/nexora_discovery.png',
    opportunities: [
      {
        title: 'Alexander von Humboldt Postdoctoral Fellowship 2026',
        organizer: 'Alexander von Humboldt Foundation',
        stipend: '€3,200/mo Stipend',
        match: 98,
        status: '2-Pass Verified (HTTP 200)',
        url: 'https://www.humboldt-foundation.de/en/apply/sponsorship-programmes/humboldt-research-fellowship'
      },
      {
        title: 'Google for Startups Accelerator: MENAT Cohort',
        organizer: 'Google for Startups',
        stipend: 'Equity-Free Mentorship',
        match: 95,
        status: 'Active Cohort Call',
        url: 'https://startup.google.com/programs/accelerator/middle-east-north-africa-turkey/'
      }
    ]
  },
  {
    id: 'feature-2',
    title: 'AI Match & Eligibility Scoring',
    description: 'Groq-powered semantic normalization analyzes your academic background, research field, and experience to calculate a precise eligibility match percentage.',
    badge: '98.4% Match Accuracy',
    image: '/images/nexora_matching.png',
    opportunities: [
      {
        title: 'ETH Zurich AI Center Postdoctoral Fellowship',
        organizer: 'ETH Zurich',
        stipend: '85,000 CHF/yr',
        match: 99,
        status: 'Top Match Recommendation',
        url: 'https://ai.ethz.ch/'
      },
      {
        title: 'CERN Technical & Doctoral Studentship',
        organizer: 'CERN',
        stipend: '3,700 CHF/mo',
        match: 96,
        status: 'Verified Portal Call',
        url: 'https://careers.cern/'
      }
    ]
  },
  {
    id: 'feature-3',
    title: 'One-Click Direct Portal Routing',
    description: 'Bypass generic corporate homepages. Nexora routes you straight to the deep action submission page with prepared application outlines and deadline alerts.',
    badge: 'Direct Portal Link',
    image: '/images/nexora_routing.png',
    opportunities: [
      {
        title: 'Y Combinator Founder Batch 2026',
        organizer: 'Y Combinator',
        stipend: '$500,000 Investment',
        match: 94,
        status: 'Applications Open',
        url: 'https://www.ycombinator.com/apply'
      },
      {
        title: 'Erasmus Mundus Joint Master Degree Scholarship',
        organizer: 'European Commission',
        stipend: '100% Fully Funded',
        match: 97,
        status: 'Verified Submission Form',
        url: 'https://erasmus-plus.ec.europa.eu/opportunities/opportunities-for-individuals/students/erasmus-mundus-joint-masters-scholarships'
      }
    ]
  }
]

export default function FeaturesSection() {
  const [activeFeature, setActiveFeature] = useState(features[0].id)
  const cardRefs = useRef([])
  const [revealed, setRevealed] = useState({})

  useEffect(() => {
    const activeObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setActiveFeature(entry.target.id)
        }
      })
    }, { threshold: 0.6 })

    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setRevealed(prev => ({ ...prev, [entry.target.id]: true }))
        }
      })
    }, { threshold: 0.15 })

    cardRefs.current.forEach((card) => {
      if (card) {
        activeObserver.observe(card)
        revealObserver.observe(card)
      }
    })

    return () => {
      activeObserver.disconnect()
      revealObserver.disconnect()
    }
  }, [])

  const scrollToFeature = (id) => {
    const el = document.getElementById(id)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }

  return (
    <section className="relative bg-[#0A0E1A] text-white overflow-hidden">
      {/* Ambient Deep Navy / Indigo Glow */}
      <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-[700px] h-[700px] bg-indigo-900/20 rounded-full blur-[160px] pointer-events-none" />
      
      <div className="relative z-10 px-5 md:px-10 lg:px-16 py-20 md:py-40 lg:py-48 max-w-7xl mx-auto">
        <div className="lg:grid lg:grid-cols-[400px_1fr] xl:grid-cols-[460px_1fr] lg:gap-24 xl:gap-48 items-start">
          
          {/* Left Column - Sticky on Desktop */}
          <div className="hidden lg:flex lg:sticky lg:top-0 lg:h-screen lg:flex-col lg:justify-between lg:py-32">
            <div>
              <h2 className="text-white text-2xl sm:text-3xl lg:text-[46px] leading-[1.2] font-normal mb-12">
                Software that flows with your ambition, not over it
              </h2>
              
              <div className="flex flex-col gap-3">
                {features.map((f) => (
                  <button
                    key={f.id}
                    onClick={() => scrollToFeature(f.id)}
                    className={`text-left px-5 py-4 rounded-2xl transition-all duration-300 font-medium ${
                      activeFeature === f.id ? 'bg-black/20 text-white' : 'bg-black/20 text-white/40 hover:text-white/80'
                    }`}
                  >
                    {f.title}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-white/80 text-sm font-medium mb-4">
                No noise. No complicated systems. Just your path, gently sorted.
              </p>
              <a
                href="/explore"
                className="inline-block bg-white text-black text-sm font-medium px-5 py-2.5 rounded-xl hover:bg-white/90 transition-colors shadow-md"
              >
                Start for free
              </a>
            </div>
          </div>

          {/* Right Column - Scrolling Cards with Reveal Motion */}
          <div className="flex flex-col gap-12 md:gap-24">
            <h2 className="text-white text-2xl sm:text-3xl leading-[1.2] font-normal lg:hidden mb-8">
              Software that flows with your ambition, not over it
            </h2>

            {features.map((f, index) => (
              <div 
                key={f.id}
                id={f.id}
                ref={el => cardRefs.current[index] = el}
                className={`bg-black/20 backdrop-blur-sm rounded-3xl p-6 md:p-10 flex flex-col gap-6 transition-all duration-700 ease-out border border-white/10 ${
                  revealed[f.id] ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-16'
                }`}
              >
                <div className="flex items-center gap-4">
                  <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 256 256" fill="none">
                    <path d="M 256 256 L 178 256 C 150.386 256 128 233.614 128 206 L 128 256 L 0 256 L 0 192 C 0 156.654 28.654 128 64 128 C 99.346 128 128 156.654 128 192 L 128 128 L 256 128 Z M 78 0 C 105.614 0 128 22.386 128 50 L 128 0 L 256 0 L 256 64 C 256 99.346 227.346 128 192 128 C 156.654 128 128 99.346 128 64 L 128 128 L 0 128 L 0 0 Z" fill="rgba(255,255,255,0.8)" />
                  </svg>
                  <h3 className="text-white text-xl md:text-2xl font-medium">{f.title}</h3>
                </div>

                {/* High-Tech AI Feature Image */}
                <div className="w-full aspect-video rounded-2xl overflow-hidden bg-black/30 shadow-xl border border-white/10">
                  <img 
                    src={f.image} 
                    alt={f.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                
                <p className="text-white/60 font-medium text-sm md:text-base leading-relaxed">
                  {f.description}
                </p>

              </div>
            ))}
          </div>

        </div>
      </div>
    </section>
  )
}
