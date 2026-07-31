import { useEffect, useState, useRef } from 'react'
import { Link } from 'react-router-dom'

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
    }, { threshold: 0.5 })

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
    <section className="relative bg-white text-slate-900 border-t border-slate-100">
      {/* Light Ambient Soft Glow */}
      <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-500/5 rounded-full blur-[140px] pointer-events-none" />
      
      <div className="relative z-10 px-5 md:px-10 lg:px-16 py-24 md:py-36 max-w-7xl mx-auto">
        <div className="lg:grid lg:grid-cols-[400px_1fr] xl:grid-cols-[460px_1fr] lg:gap-24 xl:gap-36 items-start">
          
          {/* Left Column - Pinned Sticky Panel */}
          <div className="hidden lg:flex lg:sticky lg:top-28 lg:self-start lg:flex-col lg:justify-between space-y-12">
            <div>
              <h2 className="text-slate-950 text-2xl sm:text-3xl lg:text-[44px] leading-[1.2] font-extrabold tracking-tight mb-10">
                Software that flows with your ambition, not over it
              </h2>
              
              <div className="flex flex-col gap-3">
                {features.map((f) => {
                  const isActive = activeFeature === f.id
                  return (
                    <button
                      key={f.id}
                      onClick={() => scrollToFeature(f.id)}
                      className={`text-left px-5 py-4 rounded-2xl transition-all duration-300 font-bold text-sm border flex items-center justify-between ${
                        isActive 
                          ? 'bg-[#0A0A0A] border-[#0A0A0A] text-white shadow-md' 
                          : 'bg-slate-50 border-slate-200/80 text-slate-600 hover:text-slate-950 hover:bg-slate-100'
                      }`}
                    >
                      <span>{f.title}</span>
                      <span className={`w-2 h-2 rounded-full transition-all ${isActive ? 'bg-white scale-125' : 'bg-transparent'}`} />
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="pt-6 border-t border-slate-200/80">
              <p className="text-slate-500 text-xs font-medium mb-4">
                No noise. No complicated systems. Just your path, gently sorted.
              </p>
              <Link
                to="/explore"
                className="inline-block bg-[#0A0A0A] hover:bg-slate-800 text-white text-xs font-extrabold px-5 py-3 rounded-xl transition-all shadow-md active:scale-98"
              >
                Start for free
              </Link>
            </div>
          </div>

          {/* Right Column - Sequential Scrolling Opportunity Cards */}
          <div className="flex flex-col gap-24 lg:gap-36">
            <h2 className="text-slate-950 text-2xl sm:text-3xl leading-[1.2] font-extrabold lg:hidden mb-8">
              Software that flows with your ambition, not over it
            </h2>

            {features.map((f, index) => (
              <div 
                key={f.id}
                id={f.id}
                ref={el => cardRefs.current[index] = el}
                className={`bg-white border border-slate-200/90 rounded-3xl p-6 md:p-10 flex flex-col gap-6 transition-all duration-700 ease-out shadow-[0_20px_50px_rgba(0,0,0,0.05)] ${
                  revealed[f.id] ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-16'
                }`}
              >
                <div className="flex items-center gap-4">
                  <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 256 256" fill="none">
                    <path d="M 256 256 L 178 256 C 150.386 256 128 233.614 128 206 L 128 256 L 0 256 L 0 192 C 0 156.654 28.654 128 64 128 C 99.346 128 128 156.654 128 192 L 128 128 L 256 128 Z M 78 0 C 105.614 0 128 22.386 128 50 L 128 0 L 256 0 L 256 64 C 256 99.346 227.346 128 192 128 C 156.654 128 128 99.346 128 64 L 128 128 L 0 128 L 0 0 Z" fill="rgba(15,23,42,0.9)" />
                  </svg>
                  <h3 className="text-slate-950 text-xl md:text-2xl font-extrabold">{f.title}</h3>
                </div>

                {/* High-Tech AI Feature Image */}
                <div className="w-full aspect-video rounded-2xl overflow-hidden bg-slate-50 shadow-md border border-slate-200/80">
                  <img 
                    src={f.image} 
                    alt={f.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                
                <p className="text-slate-600 font-medium text-sm md:text-base leading-relaxed">
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
