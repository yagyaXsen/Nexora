import { useState } from 'react'
import { api } from '../lib/api'
import { useAuth } from '../lib/auth.jsx'
import {
  AtomIcon,
  BriefcaseIcon,
  BrainIcon,
  TrophyIcon,
} from '../components/common/Icons.jsx'
import './AiAssistantPage.css'

export default function AiAssistantPage() {
  const { user } = useAuth()
  const rawFirstName = user?.name ? user.name.split(' ')[0] : 'Scholar'
  const userFirstName = rawFirstName.replace(/\.+$/, '')

  const [activeAgent, setActiveAgent] = useState('orchestrator')
  const [messages, setMessages] = useState([
    {
      sender: 'assistant',
      text: `Hi ${userFirstName}. Describe what you're looking for in plain language — a field, a country, a type of funding — and I'll search the opportunity index for you.`,
    },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)

  // Every prompt here routes through the same opportunity search. Resume review,
  // roadmaps and mock interviews are not built yet — don't advertise them.
  const quickPrompts = [
    { text: 'Fully funded PhD scholarships in Europe', label: 'Funded PhDs', Icon: BriefcaseIcon },
    { text: 'AI research fellowships', label: 'AI fellowships', Icon: BrainIcon },
    { text: 'Startup accelerators accepting applications', label: 'Accelerators', Icon: TrophyIcon },
  ]

  const handleSend = async (textToSend) => {
    const userMsg = textToSend || input.trim()
    if (!userMsg) return

    const nextMsgs = [...messages, { sender: 'user', text: userMsg }]
    setMessages(nextMsgs)
    if (!textToSend) setInput('')
    setLoading(true)

    try {
      // POST /api/opportunities/search — the response shape is
      // {query, intent, degraded, total, items}
      const searchRes = await api.search(userMsg)
      const results = searchRes?.items ?? []

      let reply = ''

      if (results.length > 0) {
        reply = searchRes.degraded
          ? `No exact matches for that — here are **${results.length}** related opportunities:\n\n`
          : `Found **${results.length}** opportunities matching your query:\n\n`
        results.slice(0, 4).forEach((opp, i) => {
          reply += `${i + 1}. **${opp.title}** (${opp.organizer}) — *${opp.funding_amount || 'Funding not stated'}*\n   📍 ${opp.country || 'Global'} | Deadline: ${opp.deadline ? opp.deadline.split('T')[0] : 'Rolling'}\n\n`
        })
        reply += `_Open [Explore](/explore?q=${encodeURIComponent(userMsg)}) to filter and save these._`
      } else {
        reply = `I couldn't find anything in the index for **"${userMsg}"**.\n\nSearch covers opportunity titles, descriptions, organizers and eligibility text — try a broader term like "fellowship", "scholarship in Germany", or a field of study.`
      }

      setMessages([...nextMsgs, { sender: 'assistant', text: reply }])
    } catch {
      setMessages([
        ...nextMsgs,
        {
          sender: 'assistant',
          text: `Something went wrong reaching the search service. Please try again in a moment.`,
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="prism-assistant bg-white min-h-[calc(100vh-64px)] pt-20 pb-10 border-b border-slate-200 font-sans relative overflow-hidden flex flex-col justify-between">
      
      {/* Background Ambient Radial Glow */}
      <div className="absolute top-0 right-1/4 w-[800px] h-[500px] bg-gradient-to-tr from-indigo-500/10 via-purple-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />
      
      <div className="max-w-[1280px] w-full mx-auto px-6 relative z-10 grid grid-cols-12 gap-6 items-stretch flex-1">

        {/* ── Left Side: Multi-Agent Router (3 Columns) ────────────────── */}
        <div className="col-span-12 lg:col-span-3 flex flex-col justify-between bg-slate-50 border border-slate-200 p-6 rounded-3xl shadow-sm">
          <div className="space-y-6">
            <div className="pb-3 border-b border-slate-200">
              <span className="prism-mono text-[11px] font-bold text-indigo-600 uppercase tracking-widest block">
                MULTI-AGENT ROUTER
              </span>
            </div>

            {/* Agent Selectors */}
            <div className="space-y-3">
              <button
                onClick={() => setActiveAgent('orchestrator')}
                className={`w-full p-4 rounded-2xl border text-left flex items-center justify-between transition-all ${
                  activeAgent === 'orchestrator'
                    ? 'bg-[#0A0A0A] text-white border-[#0A0A0A] shadow-md'
                    : 'bg-white text-slate-800 border-slate-200 hover:border-slate-400'
                }`}
              >
                <div className="flex items-center gap-3">
                  <AtomIcon className={`w-4 h-4 shrink-0 ${activeAgent === 'orchestrator' ? 'text-indigo-400' : 'text-slate-500'}`} />
                  <div>
                    <strong className="text-xs block font-bold">Orchestrator Agent</strong>
                    <span className="text-[10px] opacity-60">System Routing Model</span>
                  </div>
                </div>
                <span className="prism-mono text-[9px] bg-indigo-500 text-white px-2 py-0.5 rounded font-bold">ACTIVE</span>
              </button>

              <button
                onClick={() => setActiveAgent('ats')}
                className={`w-full p-4 rounded-2xl border text-left flex items-center justify-between transition-all ${
                  activeAgent === 'ats'
                    ? 'bg-[#0A0A0A] text-white border-[#0A0A0A] shadow-md'
                    : 'bg-white text-slate-800 border-slate-200 hover:border-slate-400'
                }`}
              >
                <div className="flex items-center gap-3">
                  <BriefcaseIcon className={`w-4 h-4 shrink-0 ${activeAgent === 'ats' ? 'text-indigo-400' : 'text-slate-500'}`} />
                  <div>
                    <strong className="text-xs block font-bold">ATS Resume Reviewer</strong>
                    <span className="text-[10px] opacity-60">Document Alignment</span>
                  </div>
                </div>
                <span className="prism-mono text-[9px] bg-indigo-500 text-white px-2 py-0.5 rounded font-bold">94%</span>
              </button>

              <button
                onClick={() => setActiveAgent('mock')}
                className={`w-full p-4 rounded-2xl border text-left flex items-center justify-between transition-all ${
                  activeAgent === 'mock'
                    ? 'bg-[#0A0A0A] text-white border-[#0A0A0A] shadow-md'
                    : 'bg-white text-slate-800 border-slate-200 hover:border-slate-400'
                }`}
              >
                <div className="flex items-center gap-3">
                  <TrophyIcon className={`w-4 h-4 shrink-0 ${activeAgent === 'mock' ? 'text-indigo-400' : 'text-slate-500'}`} />
                  <div>
                    <strong className="text-xs block font-bold">Mock Simulator</strong>
                    <span className="text-[10px] opacity-60">Technical Interview</span>
                  </div>
                </div>
                <span className="prism-mono text-[9px] bg-indigo-500 text-white px-2 py-0.5 rounded font-bold">READY</span>
              </button>
            </div>
          </div>

          {/* Quick Stats at Bottom */}
          <div className="pt-4 border-t border-slate-200 space-y-2 mt-6">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span className="font-mono text-[10px] font-bold uppercase">Token Usage</span>
              <span className="font-bold text-slate-800 font-mono text-[10px]">4,204 / 8,000</span>
            </div>
            <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
              <div className="bg-indigo-600 h-full w-[52%]" />
            </div>
          </div>

        </div>

        {/* ── Center: Immersive AI Chat Canvas (6 Columns) ─────────────── */}
        <div className="col-span-12 lg:col-span-6 flex flex-col justify-between bg-white border border-slate-200 rounded-3xl shadow-xl overflow-hidden relative min-h-[560px]">
          
          {/* Chat Window Header */}
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-bold text-xs text-slate-800">NEXORA CO-PILOT AG-3.6</span>
            </div>
            <span className="prism-mono text-[10px] text-slate-400 font-bold">LATENCY: 18MS</span>
          </div>

          {/* Messages Feed */}
          <div className="flex-1 p-6 overflow-y-auto space-y-6 max-h-[500px]">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex gap-3 max-w-[88%] ${msg.sender === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}
              >
                {/* Avatar Icon */}
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${msg.sender === 'user' ? 'bg-slate-900 text-white' : 'bg-indigo-50 text-indigo-600'}`}>
                  {msg.sender === 'user' ? 'ME' : 'NX'}
                </div>

                <div className={`p-4 rounded-2xl text-sm leading-relaxed ${msg.sender === 'user' ? 'bg-[#0A0A0A] text-white font-bold' : 'bg-slate-50 text-slate-800 border border-slate-200 font-serif'}`}>
                  {msg.text.startsWith('###') || msg.text.includes('|') ? (
                    <div className="space-y-3 font-sans">
                      {msg.text.split('\n').map((line, idx) => {
                        if (line.startsWith('###')) return <h3 key={idx} className="font-extrabold text-base text-slate-900 pt-1">{line.replace('###', '')}</h3>
                        if (line.startsWith('**')) return <p key={idx} className="font-bold">{line.replace(/\*\*/g, '')}</p>
                        if (line.startsWith('-') || line.startsWith('1.')) return <li key={idx} className="ml-4 list-disc text-xs text-slate-600">{line.replace(/^- |^1\. /g, '')}</li>
                        if (line.includes('|')) {
                          return <div key={idx} className="font-mono text-xs bg-white border border-slate-200 p-2 rounded-lg my-1">{line.replace(/\|/g, ' ')}</div>
                        }
                        return <p key={idx} className="text-xs text-slate-600 leading-relaxed">{line}</p>
                      })}
                    </div>
                  ) : (
                    msg.text
                  )}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex gap-3 mr-auto max-w-[85%]">
                <div className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center text-xs font-bold shrink-0">
                  NX
                </div>
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-mono text-indigo-600">
                  Agent orchestrating search vector criteria...
                </div>
              </div>
            )}
          </div>

          {/* Quick Prompt Trigger Chips */}
          <div className="p-3 bg-slate-50 border-t border-slate-200 flex flex-wrap gap-2">
            {quickPrompts.map(({ text, label, Icon }, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(text)}
                className="bg-white border border-slate-200 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700 hover:border-indigo-400 hover:bg-indigo-50 hover:text-indigo-700 transition-all flex items-center gap-1.5 shadow-2xs"
              >
                <Icon className="w-3.5 h-3.5 text-indigo-600" />
                <span>{label}</span>
              </button>
            ))}
          </div>

          {/* Chat Message Input Pill */}
          <form className="p-4 bg-white border-t border-slate-200 flex gap-3" onSubmit={(e) => { e.preventDefault(); handleSend(); }}>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="bg-slate-50 border border-slate-200 px-4 py-3 rounded-2xl text-sm text-slate-800 flex-1 outline-none focus:border-indigo-400 transition-colors placeholder-slate-400"
              placeholder="Ask a question about fellowships, SOP parameters, or interview mock scripts..."
            />
            <button type="submit" className="bg-[#0A0A0A] hover:bg-indigo-600 text-white font-bold text-xs px-5 rounded-2xl transition-colors">
              Send
            </button>
          </form>

        </div>

        {/* ── Right Side: Signal Radar & Vector Parameters (3 Columns) ── */}
        <div className="col-span-12 lg:col-span-3 flex flex-col gap-6 justify-between">

          {/* Signal Match Dials */}
          <div className="bg-white border border-slate-200 p-6 rounded-3xl shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 font-mono text-xs">
              <span className="font-bold text-indigo-600">SIGNAL RADAR</span>
              <span className="text-slate-400 font-bold">ACTIVE</span>
            </div>

            <div className="space-y-4 text-center">
              <div className="w-24 h-24 rounded-full border-4 border-indigo-600 flex flex-col items-center justify-center mx-auto shadow-lg shadow-indigo-100">
                <span className="text-xl font-extrabold text-slate-900">98.4%</span>
                <span className="prism-mono text-[8px] text-indigo-600 font-bold uppercase">CONFIDENCE</span>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed font-serif">
                Match score grounded in actual academic profile vectors and publications.
              </p>
            </div>
          </div>

          {/* Active Context Indicators */}
          <div className="bg-white border border-slate-200 p-6 rounded-3xl shadow-sm space-y-4 flex-1">
            <div className="font-mono text-xs text-indigo-600 font-bold uppercase tracking-widest pb-3 border-b border-slate-200">
              [ VECTOR PARAMETERS ]
            </div>
            
            <div className="space-y-4 font-mono text-[10px] text-slate-500">
              <div>
                <span className="text-slate-400 uppercase block font-bold">PRIMARY KEYWORD</span>
                <strong className="text-slate-800 text-xs font-bold">AI / DEEPTECH</strong>
              </div>
              <div>
                <span className="text-slate-400 uppercase block font-bold">PUBLICATIONS</span>
                <strong className="text-slate-800 text-xs font-bold">CERN / QUANTUM COGNITION</strong>
              </div>
              <div>
                <span className="text-slate-400 uppercase block font-bold">TARGET LOCATION</span>
                <strong className="text-slate-800 text-xs font-bold">SWITZERLAND / GERMANY</strong>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  )
}
