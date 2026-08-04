import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api } from '../lib/api'
import OpportunityCard from '../components/OpportunityCard.jsx'
import './OrganizationDetail.css'

function getOrgData(slug) {
  const lower = (slug || '').toLowerCase()

  if (lower.includes('cern')) {
    return {
      name: 'CERN Quantum Research Facility',
      slug: 'cern-quantum',
      category: 'International Research Center',
      headquarters: 'Geneva, Switzerland',
      website: 'https://home.cern',
      verified: true,
      description:
        'CERN operates the world’s largest particle physics laboratory. The Quantum Initiative focuses on quantum computing, sensors, and fundamental physics research for scholars worldwide.',
      ai_summary:
        'CERN frequently offers fully funded quantum physics, computing, and engineering fellowships for postdocs and graduate researchers.',
      cover_image: '/assets/cern_case.png',
      query: 'CERN',
    }
  }

  if (lower.includes('oxford') || lower.includes('rhodes')) {
    return {
      name: 'Oxford University Rhodes Pavilion',
      slug: 'oxford-rhodes',
      category: 'University & Global Trust',
      headquarters: 'Oxford, United Kingdom',
      website: 'https://www.rhodeshouse.ox.ac.uk',
      verified: true,
      description:
        'The Rhodes Trust provides fully funded postgraduate scholarships for exceptional global leaders to study at the University of Oxford across all academic disciplines.',
      ai_summary:
        'Oxford Rhodes Scholarships provide complete tuition, stipend, and travel coverage for graduate studies at Oxford.',
      cover_image: '/assets/cern_case.png',
      query: 'Oxford',
    }
  }

  if (lower.includes('openai') || lower.includes('sf')) {
    return {
      name: 'OpenAI San Francisco Lab',
      slug: 'openai-sf',
      category: 'AI Research Laboratory',
      headquarters: 'San Francisco, USA',
      website: 'https://openai.com',
      verified: true,
      description:
        'OpenAI is an AI research and deployment company whose mission is to ensure that artificial general intelligence benefits all of humanity.',
      ai_summary:
        'OpenAI Residency programs provide $210,000 USD stipends for top ML research scientists and engineers.',
      cover_image: '/assets/openai_card_bg.png',
      query: 'OpenAI',
    }
  }

  if (lower.includes('unesco') || lower.includes('paris')) {
    return {
      name: 'UNESCO Paris Youth Forum',
      slug: 'unesco-paris',
      category: 'United Nations Agency',
      headquarters: 'Paris, France',
      website: 'https://www.unesco.org',
      verified: true,
      description:
        'UNESCO fosters global peace, sustainable development, and intercultural dialogue through education, the sciences, culture, communication, and information.',
      ai_summary:
        'UNESCO offers fully funded global youth forums, fellowship exchanges, and policy initiatives across 194 member states.',
      cover_image: '/assets/unesco_card_bg.png',
      query: 'UNESCO',
    }
  }

  if (lower.includes('nordic') || lower.includes('helsinki')) {
    return {
      name: 'Nordic Research Council Institute',
      slug: 'nordic-helsinki',
      category: 'Governmental Research Council',
      headquarters: 'Helsinki, Finland',
      website: 'https://www.nordforsk.org',
      verified: true,
      description:
        'NordForsk is an organization under the Nordic Council of Ministers that provides funding for and facilitates Nordic cooperation in research and research infrastructure.',
      ai_summary:
        'Nordic Research Council grants fund Arctic climate research, renewable energy, and deeptech innovation across Northern Europe.',
      cover_image: '/assets/nordic_card_bg.png',
      query: 'Nordic',
    }
  }

  if (lower.includes('eth') || lower.includes('zurich')) {
    return {
      name: 'ETH Zurich AI Center',
      slug: 'eth-zurich-ai-center',
      category: 'Research Institute & University',
      headquarters: 'Zurich, Switzerland',
      website: 'https://ai.ethz.ch',
      verified: true,
      description:
        'ETH Zurich AI Center is the central artificial intelligence research facility across Switzerland, bringing together over 80 professors and 1,500 researchers in machine learning, embodied AI, robotics, and foundation models.',
      ai_summary:
        'ETH Zurich AI Center frequently publishes fully funded postdoctoral research fellowships and Master’s grants with 98% compatibility for candidates specializing in PyTorch, ROS2, and Computer Vision.',
      cover_image: '/assets/eth_card_bg.png',
      query: 'ETH',
    }
  }

  // Generic fallback for any other organizer slug
  const cleanName = slug
    ? slug
        .split('-')
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ')
    : 'Opportunity Desk Global'

  const firstWord = cleanName.split(' ')[0]

  return {
    name: cleanName,
    slug: slug || 'opportunity-desk-global',
    category: 'Global Educational & Research Organization',
    headquarters: 'Global Network',
    website: 'https://opportunitydesk.org',
    verified: true,
    description: `${cleanName} is an international opportunities network indexing verified scholarships, research fellowships, startup grants, and competitions for candidates worldwide.`,
    ai_summary: `${cleanName} frequently indexes fully funded opportunities, travel stipends, and academic programs for international applicants.`,
    cover_image: '/assets/workflow_zurich.png',
    query: firstWord.length > 2 ? firstWord : cleanName,
  }
}

export default function OrganizationDetail() {
  const { slug } = useParams()
  const org = getOrgData(slug)

  const [following, setFollowing] = useState(false)
  const [followerCount, setFollowerCount] = useState(1420)
  const [opportunities, setOpportunities] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    // Fetch opportunities matching organizer search query dynamically
    api
      .opportunities({ q: org.query, page_size: 6 })
      .then((r) => setOpportunities(r.items))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [slug])

  const toggleFollow = () => {
    if (following) {
      setFollowing(false)
      setFollowerCount((prev) => prev - 1)
    } else {
      setFollowing(true)
      setFollowerCount((prev) => prev + 1)
    }
  }

  return (
    <div className="prism-org-detail bg-white min-h-screen pt-24 pb-20 font-sans relative overflow-hidden">
      
      {/* Background Ambient Radial Gradient Glow */}
      <div className="absolute top-0 right-1/4 w-[800px] h-[500px] bg-gradient-to-tr from-slate-200/30 via-slate-100/20 to-transparent rounded-full blur-3xl pointer-events-none" />
      
      {/* 1. Top Cover Image Banner */}
      <div className="h-64 w-full relative overflow-hidden border-b border-slate-200">
        <img
          src={org.cover_image}
          alt={org.name}
          className="w-full h-full object-cover opacity-60"
          onError={(e) => {
            e.target.style.display = 'none'
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-white via-white/80 to-transparent" />
      </div>

      <div className="max-w-[1240px] mx-auto px-6 relative z-10 -mt-16 space-y-8">
        
        {/* 2. Hero Specs Card */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-slate-100 text-slate-900 rounded-2xl flex items-center justify-center text-2xl font-extrabold shadow-sm shrink-0 border border-slate-200">
                {org.name.charAt(0)}
              </div>
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2 font-mono text-xs">
                  <span className="bg-slate-900 text-white px-2.5 py-0.5 rounded-full font-bold uppercase">{org.category}</span>
                  {org.verified && (
                    <span className="bg-emerald-50 border border-emerald-100 text-emerald-700 px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1">
                      <i className="ti ti-check text-xs text-emerald-600" /> VERIFIED INSTITUTION
                    </span>
                  )}
                </div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-950 tracking-tight leading-snug">{org.name}</h1>
                <p className="text-sm text-slate-500 flex items-center gap-2">
                  <span><i className="ti ti-map-pin text-slate-700" /> {org.headquarters}</span>
                  <span>·</span>
                  <span>{followerCount.toLocaleString()} Candidates Following</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={toggleFollow}
                className={`px-5 py-3 rounded-2xl font-bold text-xs transition-colors flex items-center gap-1.5 ${following ? 'bg-slate-100 border border-slate-200 text-slate-700 hover:bg-slate-200' : 'bg-[#0A0A0A] text-white hover:bg-slate-800'}`}
              >
                <i className={`ti ${following ? 'ti-check' : 'ti-plus'}`}></i>
                <span>{following ? 'Following' : 'Follow'}</span>
              </button>

              <a
                href={org.website}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-white border border-slate-200 text-slate-700 px-4 py-3 rounded-2xl font-bold text-xs hover:bg-slate-50 hover:border-slate-400 transition-colors flex items-center gap-1 shadow-xs"
              >
                <span>Website</span>
                <i className="ti ti-arrow-up-right"></i>
              </a>
            </div>
          </div>
        </div>

        {/* 3. 7:5 Asymmetric Grid Layout */}
        <div className="grid grid-cols-12 gap-8 items-start">

          {/* Left Canvas (7 Cols) */}
          <div className="col-span-12 lg:col-span-8 space-y-6">

            {/* Overview Box */}
            <div className="bg-slate-50 border border-slate-200 p-6 rounded-2xl space-y-3">
              <div className="font-mono text-xs text-slate-700 font-bold uppercase tracking-wider">
                Institutional Overview
              </div>
              <p className="text-sm text-slate-700 leading-relaxed">
                “{org.ai_summary}”
              </p>
            </div>

            {/* About Institution */}
            <div className="bg-white border border-slate-200 p-6 rounded-2xl space-y-3">
              <div className="font-mono text-xs text-slate-500 font-bold uppercase tracking-wider pb-2 border-b border-slate-100">
                About Institution &amp; Mandate
              </div>
              <p className="text-sm text-slate-600 leading-relaxed">
                {org.description}
              </p>
            </div>

            {/* Active Opportunities Grid */}
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200 font-mono text-xs">
                <span className="font-bold text-slate-800">Active Opportunities ({opportunities.length})</span>
                <span className="text-slate-400 font-bold">UPDATED TODAY</span>
              </div>

              {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[0, 1].map((i) => (
                    <div key={i} className="h-64 bg-slate-100 animate-pulse border border-slate-200 rounded-2xl" />
                  ))}
                </div>
              ) : opportunities.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {opportunities.map((opp) => (
                    <OpportunityCard key={opp.id} opp={opp} />
                  ))}
                </div>
              ) : (
                <div className="p-8 bg-slate-50 border border-slate-200 rounded-2xl text-center text-slate-500 text-sm">
                  No active calls at this moment. Subscribe to alerts below.
                </div>
              )}
            </div>

          </div>

          {/* Right Panel (5 Cols) */}
          <div className="col-span-12 lg:col-span-4 space-y-6">

            {/* Candidate Match Index */}
            <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm space-y-3 hover:border-slate-400 hover:shadow-md transition-all">
              <div className="font-mono text-xs text-slate-700 font-bold uppercase tracking-wider pb-2 border-b border-slate-100">
                Candidate Compatibility
              </div>
              <div className="text-3xl font-extrabold text-slate-900 font-sans">98% MATCH</div>
              <p className="text-xs text-slate-500 leading-relaxed">
                Your research profile in PyTorch &amp; Robotics has high compatibility with {org.name}'s historical grant focus.
              </p>
            </div>

            {/* Similar Institutions */}
            <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm space-y-3">
              <div className="font-mono text-xs text-slate-500 font-bold uppercase tracking-wider pb-2 border-b border-slate-100">
                Similar Institutions
              </div>
              <div className="space-y-2 font-sans font-bold text-xs text-slate-700">
                <Link to="/organizations/eth-zurich-ai-center" className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between hover:border-slate-800 hover:bg-slate-100 transition-colors block">
                  <span>ETH Zurich AI Center</span>
                  <i className="ti ti-arrow-up-right text-xs"></i>
                </Link>
                <Link to="/organizations/cern-quantum" className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between hover:border-slate-800 hover:bg-slate-100 transition-colors block">
                  <span>CERN Quantum Facility</span>
                  <i className="ti ti-arrow-up-right text-xs"></i>
                </Link>
                <Link to="/organizations/oxford-rhodes" className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between hover:border-slate-800 hover:bg-slate-100 transition-colors block">
                  <span>Oxford University Rhodes</span>
                  <i className="ti ti-arrow-up-right text-xs"></i>
                </Link>
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  )
}
