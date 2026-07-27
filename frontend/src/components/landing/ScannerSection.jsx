import { useState } from 'react'
import { motion } from 'framer-motion'
import { FileSearch, Sparkles, CheckCircle, Cpu, ArrowRight } from 'lucide-react'

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
    <section className="py-24 bg-[#FFF9F2] text-[#321C04] relative border-t border-[#D9C4AA]">
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
        
        <div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-[#321C04] mb-6">
            Instant ATS & Eligibility Verification
          </h2>
          <p className="text-[#321C04]/80 text-base md:text-lg mb-8 leading-relaxed font-medium">
            Upload your resume, research statement, or startup deck to extract key skills and automatically score your eligibility for top international grants and fellowships.
          </p>

          <button
            onClick={handleScan}
            disabled={scanning}
            className="flex items-center gap-3 bg-[#321C04] text-[#FFF9F2] font-bold px-8 py-4 rounded-xl hover:bg-[#1F1003] transition-all shadow-lg"
          >
            <Cpu size={18} className={scanning ? 'animate-spin' : ''} />
            <span>{scanning ? 'Scanning Profile...' : 'Simulate Live Profile Scan'}</span>
            <ArrowRight size={16} />
          </button>
        </div>

        {/* Live Scanner Visual Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="bg-white border-2 border-[#D9C4AA] rounded-3xl p-8 shadow-xl relative overflow-hidden"
        >
          {/* Laser scanning beam effect */}
          {scanning && (
            <motion.div
              initial={{ top: '0%' }}
              animate={{ top: ['0%', '100%', '0%'] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
              className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#321C04] to-transparent shadow-[0_0_15px_#321C04] z-20"
            />
          )}

          <div className="flex items-center justify-between border-b border-[#D9C4AA] pb-4 mb-6">
            <div className="flex items-center gap-3">
              <FileSearch size={22} className="text-[#321C04]" />
              <span className="text-base font-bold text-[#321C04]">Profile Analysis Engine</span>
            </div>
            {scanned && (
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                <Sparkles size={12} /> 98.4% Match Verified
              </span>
            )}
          </div>

          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-[#F6E4CF]/50 border border-[#D9C4AA]">
              <p className="text-xs font-bold text-[#321C04]/80 mb-2 uppercase tracking-wider">Extracted Core Skills</p>
              <div className="flex flex-wrap gap-2">
                {['Machine Learning', 'Quantum Computing', 'Distributed Systems', 'Research Writing'].map((skill) => (
                  <span key={skill} className="px-3 py-1 bg-white border border-[#D9C4AA] text-xs font-semibold rounded-lg text-[#321C04]">
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-[#321C04] text-[#FFF9F2]">
              <p className="text-xs font-bold text-[#D9C4AA] mb-1 uppercase tracking-wider">Top Match Recommendation</p>
              <p className="text-base font-bold">ETH Zurich Postdoctoral Research Fellowship</p>
              <p className="text-xs text-[#D9C4AA] mt-1 font-medium">Fully funded • Salary: 85,000 CHF/yr • Verified Portal</p>
            </div>
          </div>
        </motion.div>

      </div>
    </section>
  )
}
