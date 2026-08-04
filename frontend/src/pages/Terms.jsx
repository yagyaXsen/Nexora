import { Link } from 'react-router-dom'

const sections = [
  {
    title: '1. Acceptance of Terms',
    body: [
      'By accessing or using Nexora, you agree to be bound by these Terms of Service and our Privacy Policy.',
      'If you do not agree with any part of these terms, you may not access or use the platform.',
    ],
  },
  {
    title: '2. Description of Service',
    body: [
      'Nexora is an AI-powered opportunity intelligence platform that indexes, summarizes, and surfaces non-job opportunities including scholarships, fellowships, research grants, accelerators, competitions, and global exchange programs.',
      'Nexora is an informational indexing and matching service. We are not an employer, scholarship committee, or academic admissions department.',
    ],
  },
  {
    title: '3. Application Routing & Third-Party Portals',
    body: [
      'When you click "Apply" or "Official Source", you are routed directly to the third-party organization\'s verified submission portal.',
      'Nexora does not collect application fees, make admissions decisions, or guarantee awards. All submissions are governed by the hosting organization\'s rules and deadlines.',
    ],
  },
  {
    title: '4. User Accounts & Responsibilities',
    body: [
      'You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account.',
      'You agree to provide accurate information when configuring your profile preferences and application tracking dashboard.',
    ],
  },
  {
    title: '5. Intellectual Property & Platform Content',
    body: [
      'All original Nexora branding, AI summary pipelines, interface designs, and algorithms are the property of Nexora Inc.',
      'Opportunity names, trademarks, and program logos belong to their respective university, foundation, or corporate providers.',
    ],
  },
  {
    title: '6. Limitation of Liability',
    body: [
      'While we strive to keep opportunity deadlines and details accurate, program organizers may modify requirements or close calls early without notice. Always verify details on the official program portal.',
      'Nexora shall not be liable for missed deadlines, rejected applications, or discrepancies on third-party portals.',
    ],
  },
  {
    title: '7. Contact & Inquiries',
    body: [
      'For inquiries regarding these Terms of Service, please reach out via our contact page or email legal@nexora.app.',
    ],
  },
]

export default function Terms() {
  return (
    <div className="min-h-screen bg-white font-sans">
      <div className="max-w-[860px] mx-auto px-6 pt-28 pb-24">
        <div className="space-y-3 mb-12">
          <span className="prism-mono text-[11px] font-bold text-slate-800 uppercase tracking-widest">
            Legal
          </span>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 tracking-tight">
            Terms of Service
          </h1>
          <p className="text-sm text-slate-500 font-medium">
            Last updated: July 2026 · Nexora Inc.
          </p>
        </div>

        <div className="space-y-10">
          {sections.map((s) => (
            <section key={s.title}>
              <h2 className="text-xl font-extrabold text-slate-900 mb-3">{s.title}</h2>
              <ul className="space-y-2">
                {s.body.map((line) => (
                  <li key={line} className="text-[15px] leading-relaxed text-slate-600 flex gap-2.5">
                    <span className="text-slate-900 font-bold mt-px shrink-0">—</span>
                    <span>{line}</span>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>

        <div className="mt-14 pt-8 border-t border-slate-200 flex items-center justify-between">
          <Link to="/" className="text-sm font-bold text-slate-500 hover:text-slate-900 transition-colors flex items-center gap-1.5">
            <i className="ti ti-arrow-left" /> Back to Nexora
          </Link>
          <Link to="/explore" className="text-sm font-bold text-slate-900 hover:text-black hover:underline transition-colors flex items-center gap-1.5">
            Explore opportunities <i className="ti ti-arrow-right" />
          </Link>
        </div>
      </div>
    </div>
  )
}
