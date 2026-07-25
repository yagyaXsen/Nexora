import { useEffect, useState } from 'react'
import { api } from '../lib/api'
import PrismNav from '../components/landing/PrismNav.jsx'
import PrismHero from '../components/landing/PrismHero.jsx'
import { AlertsSection, ConversionSection, FaqSection, IntelligenceSection, ProgramsSection, ProofSection, WorkflowSection } from '../components/landing/PrismSections.jsx'
import PrismFooter from '../components/landing/PrismFooter.jsx'
import './Landing.css'

async function loadPrograms() {
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
    <div className="prism-page">
      <PrismNav />
      <main>
        <PrismHero stats={stats} />
        <ProofSection stats={stats} />
        <ProgramsSection programs={programs} loading={loading} />
        <WorkflowSection />
        <IntelligenceSection />
        <AlertsSection />
        <FaqSection />
        <ConversionSection />
      </main>
      <PrismFooter />
    </div>
  )
}
