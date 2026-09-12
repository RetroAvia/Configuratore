interface InstagramIconProps {
  className?: string
}

/** Icona Instagram (glifo a fotocamera), disegnata inline per non dipendere da librerie o font di icone esterni. */
export default function InstagramIcon({ className }: InstagramIconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className={className}>
      <rect x="3" y="3" width="18" height="18" rx="5" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="12" cy="12" r="4.2" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="17.3" cy="6.7" r="1.1" fill="currentColor" />
    </svg>
  )
}
