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
  const rafRef = useRef<number | null>(null)
  // Valore realmente a schermo in questo istante: se l'utente cambia opzione
  // mentre un'animazione è ancora in corso, la successiva deve ripartire da
  // QUI e non dall'ultimo valore arrivato a destinazione — altrimenti il
  // numero fa un salto all'indietro prima di risalire (ben visibile cliccando
  // velocemente fra due opzioni).
  const displayRef = useRef(value)
  displayRef.current = display

  useEffect(() => {
    const prefersReducedMotion =
      typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

    if (prefersReducedMotion) {
      setDisplay(value)
      return
    }

    const from = displayRef.current
    const to = value
    if (from === to) return

    const start = performance.now()

    const step = (now: number) => {
      const t = Math.min(1, (now - start) / duration)
      const eased = 1 - Math.pow(1 - t, 3)
      // L'ultimo fotogramma assegna esattamente il valore di arrivo, senza
      // passare dall'interpolazione: evita totali tipo "119,899999 €".
      setDisplay(t < 1 ? from + (to - from) * eased : to)
      if (t < 1) rafRef.current = requestAnimationFrame(step)
    }

    rafRef.current = requestAnimationFrame(step)
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
    }
  }, [value, duration])

  return display
}

export default useAnimatedNumber
