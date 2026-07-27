import { useState } from 'react'
import { motion } from 'framer-motion'
import { FileSearch, Sparkles, Cpu, ArrowRight } from 'lucide-react'

export default function ScannerSection() {
  const [scanning, setScanning] = useState(false)
  const [scanned, setScanned] = useState(false)

  const handleScan = () => {
    setScanning(true)
    setScanned(false)
    setTimeout(() => {
      setScanning(false)
      setScanned(true)
    }, 2000)
  }

  return (
    <section className="py-24 bg-slate-50 text-slate-900 relative border-t border-slate-200">
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
        
        <div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-slate-950 mb-6">
            Instant ATS &amp; Eligibility Verification
          </h2>
          <p className="text-slate-600 text-base md:text-lg mb-8 leading-relaxed font-medium">
            Upload your resume, research statement, or startup deck to extract key skills and automatically score your eligibility for top international grants and fellowships.
          </p>

          <button
            onClick={handleScan}
            disabled={scanning}
            className="flex items-center gap-3 bg-[#0A0A0A] text-white font-bold px-8 py-4 rounded-2xl hover:bg-indigo-600 transition-all shadow-lg active:scale-98 disabled:opacity-50"
          >
            <Cpu size={18} className={scanning ? 'animate-spin text-indigo-400' : ''} />
            <span>{scanning ? 'Scanning Profile…' : 'Simulate Live Profile Scan'}</span>
            <ArrowRight size={16} />
          </button>
        </div>

        {/* Live Scanner Visual Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="bg-white border border-slate-200 rounded-3xl p-8 shadow-xl relative overflow-hidden"
        >
          {/* Laser scanning beam effect */}
          {scanning && (
            <motion.div
              initial={{ top: '0%' }}
              animate={{ top: ['0%', '100%', '0%'] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
              className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-indigo-600 to-transparent shadow-[0_0_15px_#4f46e5] z-20"
            />
          )}

          <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-6">
            <div className="flex items-center gap-3">
              <FileSearch size={22} className="text-indigo-600" />
              <span className="text-base font-extrabold text-slate-900">Profile Analysis Engine</span>
            </div>
            {scanned && (
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                <Sparkles size={12} /> 98.4% Match Verified
              </span>
            )}
          </div>

          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
              <p className="text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider font-mono">Extracted Core Skills</p>
              <div className="flex flex-wrap gap-2">
                {['Machine Learning', 'Quantum Computing', 'Distributed Systems', 'Research Writing'].map((skill) => (
                  <span key={skill} className="px-3 py-1 bg-white border border-slate-200 text-xs font-bold rounded-xl text-slate-700 shadow-2xs">
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-[#0A0A0A] text-white space-y-1">
              <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider font-mono">Top Match Recommendation</p>
              <p className="text-base font-extrabold text-white">ETH Zurich Postdoctoral Research Fellowship</p>
              <p className="text-xs text-slate-400 font-medium">Fully funded • Salary: 85,000 CHF/yr • Verified Portal</p>
            </div>
          </div>
        </motion.div>

      </div>
    </section>
  )
}
