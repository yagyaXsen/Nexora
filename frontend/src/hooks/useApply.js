import { useNavigate } from 'react-router-dom'
import { api, trackApplyClick } from '../lib/api'
import { useAuth } from '../lib/auth.jsx'

/**
 * Gates the Apply action behind login, fires a sendBeacon to record the
 * click (no round-trip blocking), and records the application in the
 * tracker via a best-effort background POST.
 *
 * The <a> navigates directly to opp.apply_url — the user reaches the
 * destination immediately without waiting for any backend call.
 *
 * @param {() => void} [onRecorded] called once the tracker row is confirmed,
 *   e.g. to flip local "saved" state.
 */
export function useApply(onRecorded) {
  const { user } = useAuth()
  const navigate = useNavigate()

  return (opp, returnTo) => (e) => {
    if (!user) {
      e.preventDefault()
      navigate('/login', {
        state: { from: returnTo ?? `/opportunities/${opp.slug || opp.id}` },
      })
      return
    }

    // Fire-and-forget: beacon records the click, POST records in tracker.
    // Neither blocks navigation — the <a href> is followed by the browser.
    trackApplyClick(opp.id)

    api
      .applyToOpportunity(opp.id)
      .then(() => onRecorded?.(opp))
      .catch(() => {
        /* best-effort: the user is already on their way to the organizer */
      })
  }
}
