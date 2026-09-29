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

export default function Landing() {
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
