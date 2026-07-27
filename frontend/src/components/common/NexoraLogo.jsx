import { Link } from 'react-router-dom'

export function NexoraLogoIcon({ className = 'w-7 h-7', fillSquare = '#000000', fillN = '#FFFFFF' }) {
  return (
    <svg className={className} viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
      <rect x="64" y="64" width="896" height="896" rx="120" ry="120" fill={fillSquare} />
      <path fill={fillN} d="M344 256 H430 L594 595 V256 H680 V768 H590 L430 430 V768 H344 Z" />
    </svg>
  )
}

export default function NexoraLogo({ 
  to = '/', 
  textClassName = 'text-white font-extrabold tracking-tight text-lg',
  iconClassName = 'w-7 h-7',
  fillSquare = '#000000',
  fillN = '#FFFFFF'
}) {
  return (
    <a href={to} className="flex items-center gap-2.5 group">
      <NexoraLogoIcon className={`${iconClassName} shadow-md group-hover:scale-105 transition-transform shrink-0`} fillSquare={fillSquare} fillN={fillN} />
      <span className={textClassName}>Nexora</span>
    </a>
  )
}
