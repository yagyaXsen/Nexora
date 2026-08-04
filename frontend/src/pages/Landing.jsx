import { useEffect, useState } from 'react'
import { api } from '../lib/api'
import { toCardShape } from '../lib/published'
import AboutSection from '../components/landing/AboutSection.jsx'
import OpportunityShowcase from '../components/landing/OpportunityShowcase.jsx'
import FeaturesSection from '../components/landing/FeaturesSection.jsx'
import MatchCalculator from '../components/landing/MatchCalculator.jsx'
import PipelineSection from '../components/landing/PipelineSection.jsx'
import ScannerSection from '../components/landing/ScannerSection.jsx'
import EcosystemSection from '../components/landing/EcosystemSection.jsx'
import TestimonialsSection from '../components/landing/TestimonialsSection.jsx'
import FaqSection from '../components/landing/FaqSection.jsx'
import ConversionSection from '../components/landing/ConversionSection.jsx'
import PrismFooter from '../components/landing/PrismFooter.jsx'
import Hero from '../components/Hero/index.tsx'
import './Landing.css'

async function loadPrograms() {
  // Surface the verified published catalog, not the 13 thin legacy rows.
  const published = await api
    .published({ page_size: 6 })
    .then((r) => (r.items || []).map(toCardShape))
    .catch(() => null)
  if (Array.isArray(published)) return published
  const trending = await api.trending(6).catch(() => null)
  if (Array.isArray(trending)) return trending
  const fallback = await api.opportunities({ page_size: 6 }).catch(() => ({ items: [] }))
  return fallback.items || []
}

export default function Landing() {
  const [stats, setStats] = useState(null)
  const [programs, setPrograms] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setLoading(true)

    Promise.all([api.stats().catch(() => null), loadPrograms()])
      .then(([statsResult, programsResult]) => {
        if (cancelled) return
        setStats(statsResult)
        setPrograms(programsResult)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div className="nx-page bg-nx-dark">
      {/* 1. HERO SECTION (100% UNTOUCHED DARK HERO) */}
      <Hero />

      {/* 2. EXPANDED LOWER SECTIONS (PREMIUM LIGHT CREME & SLATE DESIGN SYSTEM) */}
      <main className="relative z-10">
        <AboutSection />
        <OpportunityShowcase />
        <FeaturesSection />
        <MatchCalculator />
        <PipelineSection />
        <ScannerSection />
        <EcosystemSection />
        <TestimonialsSection />
        <FaqSection />
        <ConversionSection />
      </main>

      <PrismFooter />
    </div>
  )
}
