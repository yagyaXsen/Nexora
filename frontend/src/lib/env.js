// Environment guards for localhost-only features (e.g. the admin console).
// Keeps private tooling from ever leaking onto the live site.

const LOCAL_HOSTNAMES = new Set(['localhost', '127.0.0.1', '[::1]', '::1'])

export function isLocalhost() {
  if (typeof window === 'undefined') return false
  const host = window.location.hostname
  return LOCAL_HOSTNAMES.has(host) || host.startsWith('127.')
}
