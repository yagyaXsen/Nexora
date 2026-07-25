import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Logo } from '../Nav.jsx'

const footerGroups = [
  { title: 'Product', links: [['Discover', '/explore'], ['Intelligence', '#intelligence'], ['For Teams', '#workflow'], ['Pricing', '/signup']] },
  { title: 'Resources', links: [['Journal', '/explore'], ['Case studies', '/explore'], ['Grant database', '/explore'], ['Help center', '/explore']] },
  { title: 'Company', links: [['About', '/explore'], ['Careers', '/explore'], ['Privacy', '/explore'], ['Terms', '/explore']] },
]

function FooterLink({ label, to }) {
  if (to.startsWith('#')) return <a href={to}>{label}</a>
  return <Link to={to}>{label}</Link>
}

export default function PrismFooter() {
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const submitNewsletter = (event) => {
    event.preventDefault()
    if (!event.currentTarget.checkValidity()) return
    setSubmitted(true)
  }

  return (
    <footer className="prism-footer">
      <div className="prism-container">
        <div className="prism-newsletter">
          <div className="prism-newsletter__copy"><div className="prism-newsletter__icon"><i className="ti ti-mail" aria-hidden="true" /></div><div><h2>Weekly signal</h2><p>One concise opportunity digest, every Monday morning.</p></div></div>
          <form className="prism-newsletter__form" onSubmit={submitNewsletter} noValidate>
            <label className="prism-sr-only" htmlFor="prism-email">Institutional email</label>
            <input id="prism-email" type="email" required value={email} onChange={(event) => { setEmail(event.target.value); setSubmitted(false) }} placeholder="Enter your institutional email" aria-describedby="prism-newsletter-status" />
            <button className="prism-button prism-button--dark" type="submit">Subscribe</button>
            <span id="prism-newsletter-status" className="prism-newsletter__status" aria-live="polite">{submitted ? 'You are on the signal list.' : ''}</span>
          </form>
        </div>

        <div className="prism-footer__grid">
          <div className="prism-footer__brand"><div className="prism-footer__brand-mark"><Logo /></div><p>The world's opportunity intelligence engine for researchers, founders, and creators.</p><div className="prism-footer__socials"><Link to="/explore" aria-label="Explore Nexora"><i className="ti ti-arrow-up-right" aria-hidden="true" /></Link><Link to="/explore" aria-label="Read Nexora case studies"><i className="ti ti-book-2" aria-hidden="true" /></Link><Link to="/explore" aria-label="Browse the Nexora index"><i className="ti ti-database" aria-hidden="true" /></Link></div></div>
          {footerGroups.map((group) => <div className="prism-footer__group" key={group.title}><h3 className="prism-mono">{group.title}</h3>{group.links.map(([label, to]) => <FooterLink key={label} label={label} to={to} />)}</div>)}
          <div className="prism-footer__group prism-footer__status"><h3 className="prism-mono">Status</h3><p><span /> Systems operational</p></div>
        </div>

        <div className="prism-footer__bottom"><span className="prism-mono">© 2026 Nexora AG. Zurich · Switzerland</span><div><Link to="/explore">Security</Link><Link to="/explore">Terms</Link><Link to="/explore">Privacy</Link></div></div>
      </div>
    </footer>
  )
}
