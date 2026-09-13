import type { ReactNode } from 'react'
import { useScrollReveal } from '../../hooks/useScrollReveal'

interface RevealProps {
  children: ReactNode
  className?: string
  /** Ritardo dell'animazione in millisecondi: utile per far comparire più elementi in sequenza. */
  delayMs?: number
}

/**
 * Fa comparire il contenuto con una leggera animazione quando entra nel
 * viewport (vedi `useScrollReveal` / classi `.reveal` in `index.css`).
 * Wrapper generico per non ripetere la stessa logica in ogni sezione.
 */
export default function Reveal({ children, className = '', delayMs = 0 }: RevealProps) {
  const { ref, isVisible } = useScrollReveal<HTMLDivElement>()
  return (
    <div
      ref={ref}
      className={`reveal ${isVisible ? 'reveal-visible' : ''} ${className}`}
      style={delayMs ? { transitionDelay: `${delayMs}ms` } : undefined}
    >
      {children}
    </div>
  )
}
