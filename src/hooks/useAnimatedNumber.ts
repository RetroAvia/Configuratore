import { useEffect, useRef, useState } from 'react'

/**
 * Anima la transizione di un numero da un valore al successivo — usato per
 * il totale prezzo, che altrimenti scatterebbe di colpo a ogni cambio di
 * opzione. Interpola con un'easing "ease-out" su `duration` millisecondi e
 * rispetta `prefers-reduced-motion` (in quel caso salta dritto al valore
 * finale, senza animare nulla).
 */
export function useAnimatedNumber(value: number, duration = 350): number {
  const [display, setDisplay] = useState(value)
  const fromRef = useRef(value)
  const rafRef = useRef<number | null>(null)

  useEffect(() => {
    const prefersReducedMotion =
      typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

    if (prefersReducedMotion) {
      setDisplay(value)
      fromRef.current = value
      return
    }

    const from = fromRef.current
    const to = value
    if (from === to) return

    const start = performance.now()

    const step = (now: number) => {
      const t = Math.min(1, (now - start) / duration)
      const eased = 1 - Math.pow(1 - t, 3)
      setDisplay(from + (to - from) * eased)
      if (t < 1) {
        rafRef.current = requestAnimationFrame(step)
      } else {
        fromRef.current = to
      }
    }

    rafRef.current = requestAnimationFrame(step)
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
    }
  }, [value, duration])

  return display
}

export default useAnimatedNumber
