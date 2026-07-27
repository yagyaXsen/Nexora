import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../lib/auth.jsx'
import { NexoraLogoIcon } from './common/NexoraLogo.jsx'

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="fixed inset-0 bg-slate-950 z-50 flex flex-col items-center justify-center space-y-6 text-white font-sans">
        <div className="relative">
          <div className="absolute -inset-4 bg-indigo-500/20 rounded-full blur-xl animate-pulse" />
          <NexoraLogoIcon className="w-12 h-12 relative animate-bounce" fillSquare="#FFFFFF" fillN="#000000" />
        </div>
        <div className="flex flex-col items-center space-y-2">
          <div className="flex items-center gap-2 text-sm font-bold tracking-wide">
            <i className="ti ti-loader-2 animate-spin text-indigo-400 text-base" />
            <span>Validating Secure Session…</span>
          </div>
          <p className="text-xs text-slate-400 font-mono">Swiss Standard Encryption</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: `${location.pathname}${location.search}` }} replace />
  }

  return children
}
