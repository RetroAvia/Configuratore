import { useEffect, useRef, useState } from 'react'
import type { RefObject } from 'react'

/**
 * Restituisce un ref da attaccare a un elemento e `true` non appena quello
 * elemento entra nel viewport (con un margine, così la comparsa parte
 * leggermente prima che sia del tutto visibile). Usato con le classi CSS
 * `.reveal` / `.reveal-visible` in `index.css` per una comparsa "a
 * scorrimento" leggera, senza librerie di animazione esterne.
 *
 * Se `IntersectionObserver` non è disponibile (browser molto datati),
 * l'elemento risulta visibile fin da subito invece di restare nascosto.
 */
export function useScrollReveal<T extends HTMLElement>(): { ref: RefObject<T | null>; isVisible: boolean } {
  const ref = useRef<T | null>(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const node = ref.current
    if (!node) return

    if (typeof IntersectionObserver === 'undefined') {
      setIsVisible(true)
      return
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          observer.disconnect()
        }
      },
      { threshold: 0.15, rootMargin: '0px 0px -60px 0px' },
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  return { ref, isVisible }
}
