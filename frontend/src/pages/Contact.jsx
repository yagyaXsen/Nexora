import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Mail, Send, CheckCircle2, Building2, HelpCircle } from 'lucide-react'

export default function Contact() {
  const [submitted, setSubmitted] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: 'General Inquiry',
    message: '',
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    setSubmitted(true)
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      <div className="max-w-[860px] mx-auto px-6 pt-28 pb-24">
        
        {/* Header */}
        <div className="text-center space-y-3 mb-12">
          <span className="prism-mono text-[11px] font-bold text-indigo-600 uppercase tracking-widest">
            Support & Inquiries
          </span>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 tracking-tight">
            Get in Touch
          </h1>
          <p className="text-base text-slate-600 max-w-lg mx-auto">
            Have questions about opportunity indexing, partnership requests, or technical support? We'd love to hear from you.
          </p>
        </div>

        {/* Contact Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs text-center">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-4">
              <Mail size={20} />
            </div>
            <h3 className="text-sm font-bold text-slate-900 mb-1">Email Support</h3>
            <p className="text-xs text-slate-500 mb-3">Direct response within 24h</p>
            <a href="mailto:support@nexora.app" className="text-xs font-bold text-indigo-600 hover:underline">
              support@nexora.app
            </a>
          </div>

          <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs text-center">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-4">
              <Building2 size={20} />
            </div>
            <h3 className="text-sm font-bold text-slate-900 mb-1">Partnerships</h3>
            <p className="text-xs text-slate-500 mb-3">For universities & labs</p>
            <a href="mailto:partners@nexora.app" className="text-xs font-bold text-emerald-600 hover:underline">
              partners@nexora.app
            </a>
          </div>

          <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs text-center">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-4">
              <HelpCircle size={20} />
            </div>
            <h3 className="text-sm font-bold text-slate-900 mb-1">Feedback</h3>
            <p className="text-xs text-slate-500 mb-3">Submit program suggestions</p>
            <a href="mailto:feedback@nexora.app" className="text-xs font-bold text-blue-600 hover:underline">
              feedback@nexora.app
            </a>
          </div>
        </div>

        {/* Contact Form */}
        <div className="bg-white border border-slate-200/80 rounded-3xl p-8 shadow-sm">
          {submitted ? (
            <div className="text-center py-12 space-y-4">
              <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 size={32} />
              </div>
              <h3 className="text-2xl font-bold text-slate-900">Message Sent!</h3>
              <p className="text-sm text-slate-600 max-w-md mx-auto">
                Thank you for contacting Nexora. Our team will review your message and get back to you shortly.
              </p>
              <button
                onClick={() => setSubmitted(false)}
                className="mt-4 px-6 py-2.5 bg-slate-900 text-white text-xs font-bold rounded-xl hover:bg-slate-800 transition-colors"
              >
                Send Another Message
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                    Your Name
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Jane Doe"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="jane@example.com"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                  Topic / Subject
                </label>
                <select
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:border-indigo-500"
                >
                  <option>General Inquiry</option>
                  <option>Submit or Verify an Opportunity</option>
                  <option>Partnership or University Inquiries</option>
                  <option>Report a Broken Link or Incorrect Deadline</option>
                  <option>Technical Support</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                  Message
                </label>
                <textarea
                  required
                  rows={5}
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  placeholder="How can we help you?"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <button
                type="submit"
                className="w-full sm:w-auto px-8 py-3.5 bg-slate-950 hover:bg-slate-800 text-white font-extrabold text-xs md:text-sm rounded-xl transition-all shadow-md flex items-center justify-center gap-2"
              >
                <span>Send Message</span>
                <Send size={15} />
              </button>
            </form>
          )}
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
