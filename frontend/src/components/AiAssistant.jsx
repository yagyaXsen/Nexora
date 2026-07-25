import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../lib/auth.jsx'
import { api } from '../lib/api'
import './AiAssistant.css'

export default function AiAssistant() {
  const { user } = useAuth()
  const [open, setOpen] = useState(false)

  const [messages, setMessages] = useState([
    {
      sender: 'assistant',
      text: `Hi ${user?.name ? user.name.split(' ')[0] : 'there'}. Tell me what kind of opportunity you're after and I'll search the index.`,
    },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)

  const sendMessage = async (textToSend) => {
    const userMsg = textToSend || input.trim()
    if (!userMsg) return

    const nextMsgs = [...messages, { sender: 'user', text: userMsg }]
    setMessages(nextMsgs)
    if (!textToSend) setInput('')
    setLoading(true)

    // Same endpoint the Explore page uses — {query, intent, degraded, total, items}
    try {
      const res = await api.search(userMsg)
      const items = res?.items ?? []

      let reply
      if (items.length === 0) {
        reply = `Nothing in the index matched "${userMsg}". Try a broader term — a category like "fellowship", or a country.`
      } else {
        const lead = res.degraded
          ? `No exact matches — ${items.length} related:`
          : `${items.length} match${items.length === 1 ? '' : 'es'}:`
        const lines = items
          .slice(0, 3)
          .map((o) => `• ${o.title} — ${o.organizer}${o.country ? ` (${o.country})` : ''}`)
          .join('\n')
        reply = `${lead}\n${lines}`
      }

      setMessages([...nextMsgs, { sender: 'assistant', text: reply, query: userMsg }])
    } catch {
      setMessages([
        ...nextMsgs,
        { sender: 'assistant', text: 'Could not reach the search service. Please try again shortly.' },
      ])
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {/* Floating Co-Pilot Trigger Button */}
      <button
        onClick={() => setOpen(!open)}
        className="ai-copilot-trigger group"
        aria-label="Toggle AI Co-Pilot Assistant"
        title={open ? 'Close AI Assistant' : 'Open AI Assistant'}
      >
        {open ? (
          <span className="text-xs font-bold font-mono">✕</span>
        ) : (
          <i className="ti ti-sparkles text-sm text-indigo-400 group-hover:text-white transition-colors" />
        )}
      </button>

      {/* Slide-Over Co-Pilot Window */}
      {open && (
        <div className="ai-copilot-drawer">
          {/* Drawer Header */}
          <div className="ai-copilot-header">
            <div>
              <span className="font-mono text-[10px] text-[#960018] font-bold uppercase tracking-widest block">
                [ UNIVERSAL INTELLIGENCE ]
              </span>
              <h4 className="font-sans font-bold text-sm">Nexora AI Co-Pilot</h4>
            </div>
            <button onClick={() => setOpen(false)} className="text-white hover:text-[#960018] font-mono text-base">✕</button>
          </div>

          {/* Quick Prompt Triggers — all route through opportunity search */}
          <div className="p-3 bg-[#F0F0EA] border-b border-[#1A1110]/20 flex flex-wrap gap-1.5 font-mono text-[10px]">
            <button
              onClick={() => sendMessage('Fully funded scholarships')}
              className="bg-[#FAFAF8] border border-[#1A1110]/30 px-2 py-1 text-[#1A1110] hover:bg-[#960018] hover:text-white transition-colors"
            >
              ⚡ Funded scholarships
            </button>
            <button
              onClick={() => sendMessage('Research fellowships')}
              className="bg-[#FAFAF8] border border-[#1A1110]/30 px-2 py-1 text-[#1A1110] hover:bg-[#960018] hover:text-white transition-colors"
            >
              ⚡ Fellowships
            </button>
            <button
              onClick={() => sendMessage('Grants closing soon')}
              className="bg-[#FAFAF8] border border-[#1A1110]/30 px-2 py-1 text-[#1A1110] hover:bg-[#960018] hover:text-white transition-colors"
            >
              ⚡ Grants
            </button>
          </div>

          {/* Messages Feed */}
          <div className="ai-copilot-messages">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`ai-msg-bubble ${msg.sender === 'assistant' ? 'ai-msg-assistant' : 'ai-msg-user'}`}
              >
                <span style={{ whiteSpace: 'pre-line' }}>{msg.text}</span>
                {msg.query && (
                  <Link
                    to={`/explore?q=${encodeURIComponent(msg.query)}`}
                    onClick={() => setOpen(false)}
                    className="block mt-2 font-mono text-[10px] font-bold underline"
                  >
                    Open in Explore →
                  </Link>
                )}
              </div>
            ))}
            {loading && (
              <div className="ai-msg-bubble ai-msg-assistant font-mono text-[11px] text-[#960018] animate-pulse">
                Searching…
              </div>
            )}
          </div>

          {/* Input Bar */}
          <form
            onSubmit={(e) => {
              e.preventDefault()
              sendMessage()
            }}
            className="ai-copilot-input-box"
          >
            <input
              className="ai-copilot-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Search scholarships, fellowships, grants…"
            />
            <button type="submit" className="bg-[#960018] text-[#FAFAF8] px-3 py-1.5 font-mono text-xs font-bold">
              Send
            </button>
          </form>
        </div>
      )}
    </>
  )
}
