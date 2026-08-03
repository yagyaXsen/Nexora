import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../lib/api'
import './Notifications.css'

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'JUST NOW'
  if (mins < 60) return `${mins}M AGO`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}H AGO`
  const days = Math.floor(hours / 24)
  return `${days}D AGO`
}

export default function Notifications() {
  const [filter, setFilter] = useState('all')
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.notifications().then(setItems).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const markRead = async (id) => {
    try {
      await api.markNotificationRead(id)
      setItems(prev => prev.map(item => item.id === id ? { ...item, is_read: true } : item))
    } catch { /* fail silently */ }
  }

  const markAllRead = async () => {
    try {
      await api.markAllNotificationsRead()
      setItems(prev => prev.map(item => ({ ...item, is_read: true })))
    } catch { /* fail silently */ }
  }

  const filteredItems = items.filter((item) => {
    if (filter === 'unread') return !item.is_read
    if (filter === 'critical') return item.priority === 'critical'
    if (filter === 'matches') return item.category === 'ai_match'
    return true
  })

  const unreadCount = items.filter((i) => !i.is_read).length


  return (
    <div className="prism-notifs bg-white min-h-screen pt-24 pb-20 font-sans relative overflow-hidden">
      
      {/* Background Ambient Radial Glow */}
      <div className="absolute top-0 right-1/4 w-[800px] h-[500px] bg-gradient-to-tr from-indigo-500/10 via-purple-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-[1240px] mx-auto px-6 relative z-10 space-y-8">

        {/* 1. Header Bar */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-slate-200">
          <div className="space-y-2">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight leading-[1.1]">
              Notifications &amp; Alerts
            </h1>
            <p className="text-base text-slate-500 max-w-xl leading-relaxed">
              Quiet, high-precision signal dispatches for deadlines, vector matches, and status updates.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={markAllRead}
              className="bg-slate-100 hover:bg-slate-200 text-slate-800 px-5 py-2.5 rounded-2xl text-xs font-bold transition-all border border-slate-200"
            >
              Mark All Read ({unreadCount})
            </button>
          </div>
        </div>

        {/* 2. Filter Pills Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${filter === 'all' ? 'bg-[#0A0A0A] text-white border-[#0A0A0A]' : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'}`}
            >
              All Signals ({items.length})
            </button>
            <button
              onClick={() => setFilter('unread')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${filter === 'unread' ? 'bg-[#0A0A0A] text-white border-[#0A0A0A]' : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'}`}
            >
              Unread ({unreadCount})
            </button>
            <button
              onClick={() => setFilter('critical')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${filter === 'critical' ? 'bg-red-600 text-white border-red-600' : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'}`}
            >
              Critical Deadlines
            </button>
          </div>

          <span className="prism-mono text-xs text-slate-400 font-bold">
            INDEXED PORTALS: 1,420 ACTIVE
          </span>
        </div>

        {/* 3. Notifications Feed Stream */}
        <div className="space-y-4 max-w-4xl">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              className={`p-5 sm:p-6 rounded-3xl border transition-all duration-300 flex flex-col sm:flex-row items-start justify-between gap-4 sm:gap-6 ${item.is_read ? 'bg-white border-slate-200 opacity-80' : 'bg-white border-slate-300 shadow-lg hover:border-indigo-300'}`}
            >
              <div className="flex items-start gap-4 min-w-0">
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-base shrink-0 font-bold ${item.priority === 'critical' ? 'bg-red-50 text-red-600' : 'bg-indigo-50 text-indigo-600'}`}>
                  <i className={item.priority === 'critical' ? 'ti ti-bell-ringing-filled' : 'ti ti-sparkles'} />
                </div>

                <div className="space-y-1.5">
                <div className="flex flex-wrap items-center gap-2 font-mono text-[10px]">
                    <span className="bg-slate-900 text-white px-2.5 py-0.5 rounded-full font-bold uppercase">
                      {item.organizer}
                    </span>
                    <span className="text-slate-400 font-bold">{timeAgo(item.created_at)}</span>
                    {!item.is_read && (
                      <span className="text-indigo-600 font-bold">● New</span>
                    )}
                  </div>

                  <h3 className="font-extrabold text-slate-950 text-base leading-snug">{item.title}</h3>
                  <p className="font-serif text-xs text-slate-600 leading-relaxed max-w-2xl">{item.message}</p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 shrink-0">
                {!item.is_read && (
                  <button
                    onClick={() => markRead(item.id)}
                    className="p-2 rounded-xl border border-slate-200 text-slate-500 hover:text-slate-900 hover:bg-slate-50 text-xs"
                    title="Mark as Read"
                  >
                    <i className="ti ti-mail" />
                  </button>
                )}
              </div>
            </div>
          ))}

          {filteredItems.length === 0 && (
            <div className="p-12 bg-slate-50 border border-slate-200 rounded-3xl text-center space-y-3">
              <p className="font-serif text-sm text-slate-500">No active notifications matching current filter criteria.</p>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
