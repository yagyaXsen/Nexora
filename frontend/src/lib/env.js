// Environment guards for localhost-only features (e.g. the admin console).
// Keeps private tooling from ever leaking onto the live site.

const LOCAL_HOSTNAMES = new Set(['localhost', '127.0.0.1', '[::1]', '::1'])

export function isLocalhost() {
  if (typeof window === 'undefined') return false
  const host = window.location.hostname
  return LOCAL_HOSTNAMES.has(host) || host.startsWith('127.')
}

// Dev-only "no login" mode for the admin console. Set VITE_ADMIN_NO_LOGIN=true
// in frontend/.env.local to open /admin without signing in. `import.meta.env.DEV`
// is statically replaced with `false` in production builds, so this constant is
// always `false` on the live site and can never enable anything there.
export const ADMIN_NO_LOGIN =
  import.meta.env.DEV && import.meta.env.VITE_ADMIN_NO_LOGIN === 'true'
