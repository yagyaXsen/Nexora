const TOKEN_KEY = 'nexora_token'
const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '')

function apiUrl(path) {
  return `${API_BASE_URL}${path}`
}

export function getToken() {
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token) {
  localStorage.setItem(TOKEN_KEY, token)
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY)
}

export class ApiError extends Error {
  constructor(status, detail) {
    super(typeof detail === 'string' ? detail : 'Request failed')
    this.status = status
    this.detail = detail
  }
}

async function request(path, { method = 'GET', body, form } = {}) {
  const headers = {}
  const token = getToken()
  if (token) headers.Authorization = `Bearer ${token}`

  let payload
  if (form) {
    headers['Content-Type'] = 'application/x-www-form-urlencoded'
    payload = new URLSearchParams(form).toString()
  } else if (body !== undefined) {
    headers['Content-Type'] = 'application/json'
    payload = JSON.stringify(body)
  }

  const res = await fetch(apiUrl(path), { method, headers, body: payload })

  if (res.status === 204) return null

  let data = null
  try {
    data = await res.json()
  } catch {
    /* non-JSON body */
  }

  if (!res.ok) {
    if (res.status === 401 && token) {
      clearToken()
      const returnTo = `${window.location.pathname}${window.location.search}`
      sessionStorage.setItem('nexora_return_to', returnTo)
      if (window.location.pathname !== '/login') window.location.assign('/login')
    }
    throw new ApiError(res.status, data?.detail ?? data?.error?.message ?? `HTTP ${res.status}`)
  }
  return data
}

export const api = {
  // ─────────────────────────────────────────────
  // Auth
  // ─────────────────────────────────────────────
  register: (name, email, password) =>
    request('/api/auth/register', { method: 'POST', body: { name, email, password } }),
  login: (email, password) =>
    request('/api/auth/login', { method: 'POST', form: { username: email, password } }),
  loginWithGoogle: (payload) =>
    request('/api/auth/google', {
      method: 'POST',
      body: typeof payload === 'string' ? { credential: payload } : payload,
    }),
  me: () => request('/api/auth/me'),
  logout: () => request('/api/auth/logout', { method: 'POST' }),
  updateMe: (payload) => request('/api/auth/me', { method: 'PATCH', body: payload }),
  deleteMe: () => request('/api/auth/me', { method: 'DELETE' }),
  forgotPassword: (email) =>
    request('/api/auth/forgot-password', { method: 'POST', body: { email } }),
  resetPassword: (token, password) =>
    request('/api/auth/reset-password', { method: 'POST', body: { token, password } }),

  // ─────────────────────────────────────────────
  // Profile
  // ─────────────────────────────────────────────
  getProfile: () => request('/api/profile/me'),
  updateProfile: (payload) => request('/api/profile/me', { method: 'PATCH', body: payload }),
  dashboardSummary: () => request('/api/profile/dashboard'),

  // ─────────────────────────────────────────────
  // Opportunities
  // ─────────────────────────────────────────────
  opportunities: (params = {}) => {
    const qs = new URLSearchParams(
      Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '')
    ).toString()
    return request(`/api/opportunities${qs ? `?${qs}` : ''}`)
  },
  opportunity: (idOrSlug) => request(`/api/opportunities/${idOrSlug}`),
  recommendations: (limit = 6) =>
    request(`/api/opportunities?page_size=${limit}`).then((r) => r?.items ?? []),
  trending: (limit = 4) => request(`/api/opportunities/trending?limit=${limit}`),
  stats: () => request('/api/opportunities/stats'),

  // AI Search
  search: (query) =>
    request('/api/opportunities/search', { method: 'POST', body: { query } }),

  // ─────────────────────────────────────────────
  // Applications / Tracker
  // ─────────────────────────────────────────────
  applications: (status) =>
    request(`/api/applications${status ? `?status=${encodeURIComponent(status)}` : ''}`),
  saveApplication: (opportunity_id) =>
    request('/api/applications', { method: 'POST', body: { opportunity_id } }),
  // Records the apply and returns the organizer URL. The caller navigates via its
  // own <a href>, so a failure here never blocks the outbound trip.
  applyToOpportunity: (opportunity_id) =>
    request('/api/applications/apply', { method: 'POST', body: { opportunity_id } }),
  unsaveOpportunity: (opportunity_id) =>
    request(`/api/applications/by-opportunity/${opportunity_id}`, { method: 'DELETE' }),
  updateApplication: (id, payload) =>
    request(`/api/applications/${id}`, { method: 'PATCH', body: payload }),
  deleteApplication: (id) =>
    request(`/api/applications/${id}`, { method: 'DELETE' }),
  upcoming: (days = 14) => request(`/api/applications/upcoming?days=${days}`),
  remindersUpcoming: (days = 14) => request(`/api/applications/upcoming?days=${days}`),

  // ─────────────────────────────────────────────
  // Organizations
  // ─────────────────────────────────────────────
  organizations: (q) =>
    request(`/api/organizations${q ? `?q=${encodeURIComponent(q)}` : ''}`),
  organization: (slugOrId) => request(`/api/organizations/${slugOrId}`),
  followOrganization: (id) =>
    request(`/api/organizations/${id}/follow`, { method: 'POST' }),
  unfollowOrganization: (id) =>
    request(`/api/organizations/${id}/follow`, { method: 'DELETE' }),
  isFollowingOrganization: (id) =>
    request(`/api/organizations/${id}/following`),

  // ─────────────────────────────────────────────
  // Notifications
  // ─────────────────────────────────────────────
  notifications: (unreadOnly = false) =>
    request(`/api/notifications${unreadOnly ? '?unread_only=true' : ''}`),
  notificationUnreadCount: () => request('/api/notifications/unread-count'),
  markNotificationRead: (id) =>
    request(`/api/notifications/${id}/read`, { method: 'PATCH' }),
  markAllNotificationsRead: () =>
    request('/api/notifications/read-all', { method: 'PATCH' }),
}

export function applyUrl(opp) {
  // Resolve the direct apply URL client-side — no backend round-trip.
  // Click tracking is handled separately via navigator.sendBeacon
  // in the useApply hook, so the user reaches the destination immediately
  // without waiting for a backend redirect.
  if (opp && typeof opp === 'object') {
    return opp.apply_url || apiUrl(`/api/opportunities/${opp.id}/apply`)
  }
  return apiUrl(`/api/opportunities/${String(opp)}/apply`)
}

/**
 * Fire a fire-and-forget beacon to record an Apply click.
 * Uses navigator.sendBeacon which is guaranteed to be sent even during
 * page unload, unlike fetch/XHR. Returns true if queued successfully.
 */
export function trackApplyClick(oppId) {
  try {
    return navigator.sendBeacon(
      apiUrl(`/api/opportunities/${oppId}/click`),
      'ping'
    )
  } catch {
    return false
  }
}
