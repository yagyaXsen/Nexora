import { Link } from 'react-router-dom'

const sections = [
  {
    title: '1. Information We Collect',
    body: [
      'Account information — name, email address, and authentication details you provide when you create an account or sign in with Google.',
      'Profile data — academic background, skills, interests, and preferences you choose to share to improve opportunity matching.',
      'Usage data — pages visited, opportunities viewed or saved, applications tracked, and interactions with the AI assistant.',
    ],
  },
  {
    title: '2. How We Use Your Information',
    body: [
      'To power the opportunity matching engine and personalize the opportunities surfaced to you.',
      'To track your applications, send deadline reminders, and deliver notifications you request.',
      'To improve the product, detect abuse, and keep the platform secure.',
    ],
  },
  {
    title: '3. Data Sharing',
    body: [
      'We do not sell your personal data. Your information is never shared with third parties for advertising purposes.',
      'We may share limited data with service providers (hosting, email delivery) strictly to operate the platform.',
      'When you apply to an opportunity, you are redirected to the program\'s official portal — anything you enter there is governed by that organization\'s own policies.',
    ],
  },
  {
    title: '4. Data Retention & Deletion',
    body: [
      'We retain your data while your account is active. You may delete your account and all associated data at any time from Settings.',
      'Deletion removes your profile, applications, notifications, and tracking data from our systems.',
    ],
  },
  {
    title: '5. Security',
    body: [
      'Passwords are stored using bcrypt hashing. Data in transit is protected with TLS encryption.',
      'No system is fully immune to attack, but we follow industry-standard practices to safeguard your information.',
    ],
  },
  {
    title: '6. Contact',
    body: [
      'Questions about this policy can be directed to the Nexora support team via the contact form or by emailing support@nexora.app.',
    ],
  },
]

export default function Privacy() {
  return (
    <div className="min-h-screen bg-white font-sans">
      <div className="max-w-[860px] mx-auto px-6 pt-28 pb-24">
        <div className="space-y-3 mb-12">
          <span className="prism-mono text-[11px] font-bold text-indigo-600 uppercase tracking-widest">
            Legal
          </span>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 tracking-tight">
            Privacy Policy
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
                    <span className="text-indigo-600 font-bold mt-px shrink-0">—</span>
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
          <Link to="/explore" className="text-sm font-bold text-indigo-600 hover:text-indigo-800 transition-colors flex items-center gap-1.5">
            Explore opportunities <i className="ti ti-arrow-right" />
          </Link>
        </div>
      </div>
    </div>
  )
}
