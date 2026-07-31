import { Search, Sparkles } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function AboutSection() {
  return (
    <section className="bg-slate-50 rounded-t-[25px] relative z-10 pt-28 pb-20 md:pt-36 md:pb-32 px-6 shadow-[0_-15px_40px_rgba(0,0,0,0.05)] border-t border-slate-200/80">
      <div className="max-w-6xl mx-auto flex flex-col items-center">
        
        {/* Top Area */}
        <div className="flex flex-col items-center max-w-3xl w-full">
          <p className="text-slate-700 text-base md:text-lg text-center leading-relaxed max-w-xl mb-8 font-medium">
            The global opportunity network built to discover scholarships, research grants, and accelerator calls before deadlines disappear.
          </p>
          
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              to="/explore"
              className="flex items-center gap-3 bg-slate-900 text-white rounded-full pl-2 pr-6 py-2 hover:bg-slate-800 transition-colors shadow-md text-xs md:text-sm font-bold"
            >
              <span className="bg-white text-slate-900 rounded-full p-1.5 flex items-center justify-center shadow-sm">
                <Search size={16} />
              </span>
              <span>EXPLORE OPPORTUNITIES</span>
            </Link>

            <Link
              to="/ai-assistant"
              className="flex items-center gap-3 bg-white text-slate-900 border border-slate-200/80 rounded-full pl-2 pr-6 py-2 hover:bg-slate-100 transition-colors shadow-sm text-xs md:text-sm font-bold"
            >
              <span className="bg-blue-50 text-blue-600 rounded-full p-1.5 flex items-center justify-center shadow-sm">
                <Sparkles size={16} />
              </span>
              <span>TRY AI MATCH ENGINE</span>
            </Link>
          </div>
        </div>

        {/* Decorative Circle Divider */}
        <div className="w-full max-w-6xl flex items-center gap-[2px] my-16 md:my-20">
          <div className="w-2 h-2 rounded-full bg-slate-300 shrink-0" />
          <div className="flex-1 h-[2px] bg-slate-200" />
          <div className="w-2 h-2 rounded-full bg-slate-300 shrink-0" />
        </div>

        {/* Bottom Area: Nexora Brand Statement */}
        <div className="w-full flex flex-col md:flex-row gap-12 md:gap-24 justify-between items-start">
          <div className="flex flex-col gap-4 shrink-0">
            <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center rotate-3 shadow-md">
              <div className="w-4 h-4 bg-white rounded-sm -rotate-3" />
            </div>
            <span className="text-xs uppercase tracking-widest font-extrabold whitespace-pre-line text-slate-900">
              Global /<br/>Intelligence
            </span>
          </div>
          
          <div className="flex-1 md:max-w-3xl">
            <p className="text-2xl sm:text-3xl md:text-4xl lg:text-[42px] leading-[1.3] font-bold text-slate-900">
              We index thousands of institutional portals worldwide. Nexora carries the heavy cognitive weight of scanning, score-verifying, and matching global opportunities so you can focus on building your research and venture proposals.
            </p>
          </div>
        </div>

      </div>
    </section>
  )
}
