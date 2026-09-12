import { useEffect, useState } from 'react'

/**
 * Carica un'immagine (dato il suo URL/percorso) come `HTMLImageElement`,
 * pronta per essere disegnata su un canvas o mostrata a schermo. Utile per
 * le immagini "statiche" del prodotto (sfondo, eventuale overlay), che
 * servono sia per l'anteprima sia per l'esportazione finale.
 */
export function useHtmlImage(src: string | undefined | null): HTMLImageElement | null {
  const [image, setImage] = useState<HTMLImageElement | null>(null)

  useEffect(() => {
    if (!src) {
      setImage(null)
      return
    }
    let cancelled = false
    const img = new Image()
    img.onload = () => {
      if (!cancelled) setImage(img)
    }
    img.onerror = () => {
      if (!cancelled) setImage(null)
    }
    img.src = src
    return () => {
      cancelled = true
    }
  }, [src])

  return image
}
