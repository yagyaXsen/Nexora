import { useNavigate } from 'react-router-dom'
import { api } from '../lib/api'
import { useAuth } from '../lib/auth.jsx'

/**
 * Gates the Apply action behind login and records it in the tracker.
 *
 * Returns an onClick handler for an <a href={applyUrl(id)} target="_blank">.
 * The anchor is deliberately left intact: we only preventDefault when sending an
 * anonymous user to login. For a logged-in user the browser follows the href
 * immediately while the POST happens in the background, so a slow or failing API
 * can never stop someone reaching the organizer's site.
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
    api
      .applyToOpportunity(opp.id)
      .then(() => onRecorded?.(opp))
      .catch(() => {
        /* best-effort: the user is already on their way to the organizer */
      })
  }
}
