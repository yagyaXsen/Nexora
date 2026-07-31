import { Link } from 'react-router-dom'
import { NexoraLogoIcon } from '../common/NexoraLogo.jsx'

export default function PrismFooter() {
  return (
    <footer className="py-12 bg-slate-900 text-slate-400 border-t border-slate-800 text-xs">
      <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
        
        <div className="flex items-center gap-3">
          <NexoraLogoIcon className="w-6 h-6 shadow-md" fillSquare="#FFFFFF" fillN="#000000" />
          <span className="text-white font-extrabold text-sm tracking-tight">Nexora</span>
          <span className="text-slate-500">© {new Date().getFullYear()} Nexora Inc. All rights reserved.</span>
        </div>

        <div className="flex items-center gap-6 text-slate-300 font-bold">
          <Link to="/explore" className="hover:text-white transition-colors">Opportunities</Link>
          <Link to="/tracker" className="hover:text-white transition-colors">Tracker</Link>
          <Link to="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
        </div>


      </div>
    </footer>
  )
}
