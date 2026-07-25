import { Link } from 'react-router-dom'

export default function PrismHero() {

  return (
    <section className="prism-hero prism-grid prism-noise" aria-labelledby="prism-hero-title">
      <div className="prism-container prism-hero__grid">

        {/* Left Column: Headline & CTAs */}
        <div className="prism-hero__copy">
          <h1 id="prism-hero-title" className="prism-display prism-hero__title">
            The future belongs to people who <span>never miss</span> opportunities.
          </h1>

          <p className="prism-lede">
            Nexora turns the open web into a quiet, personal signal—the programs, people, and deadlines that deserve your attention next.
          </p>

          <div className="prism-hero__actions">
            <Link className="prism-button prism-button--dark prism-button--large text-white font-bold" to="/explore">
              <span className="text-white font-bold">Start exploring</span>
              <i className="ti ti-arrow-right text-white" aria-hidden="true" />
            </Link>
            <a className="prism-text-action" href="#discover">
              A clearer way to search <i className="ti ti-arrow-up-right" aria-hidden="true" />
            </a>
          </div>

          <div className="prism-hero__trust">
            <span className="prism-mono">TRUSTED BY SIGNAL INTELLIGENCE LABS:</span>
            <div className="prism-hero__trust-list" aria-label="Indexed signal partners">
              <span>CERN LABS</span>
              <span>MIT MEDIA</span>
              <span>ETH ZURICH</span>
              <span>OPENAI RES.</span>
            </div>
          </div>
        </div>

        {/* Right Column: Single High-Resolution Swiss Prism Showcase Image Asset */}
        <div className="prism-hero__visual relative" aria-label="Nexora optical prism signal visual">
          
          {/* Main Visual Image Showcase */}
          <div className="relative rounded-3xl overflow-hidden border border-slate-200/90 shadow-2xl group bg-white">
            <img
              src="/assets/hero_main.png"
              alt="Nexora Prism Signal Optical Dispersion"
              className="w-full h-auto object-cover group-hover:scale-102 transition-transform duration-700"
            />


          </div>

        </div>

      </div>
    </section>
  )
}
