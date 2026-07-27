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
          <a href="/explore" className="hover:text-white transition-colors">Opportunities</a>
          <a href="/tracker" className="hover:text-white transition-colors">Tracker</a>
          <a href="/ai-assistant" className="hover:text-white transition-colors">AI Copilot</a>
          <a href="/privacy" className="hover:text-white transition-colors">Privacy Policy</a>
        </div>

        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-slate-300 font-mono font-semibold">System Operational</span>
        </div>

      </div>
    </footer>
  )
}
