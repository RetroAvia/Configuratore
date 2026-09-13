import { useEffect } from 'react'

interface PageMetaOptions {
  /** Titolo completo della pagina (mostrato nella scheda del browser, nei preferiti e nella cronologia). */
  title: string
  /** Meta description specifica della pagina, se diversa da quella predefinita del sito. */
  description?: string
}

/**
 * Aggiorna `<title>` e la meta description in base alla pagina corrente.
 *
 * Utile per la scheda del browser, i preferiti/cronologia e per i motori
 * di ricerca che eseguono JavaScript (es. Googlebot).
 *
 * NB: non ha alcun effetto sull'anteprima che compare quando un link viene
 * condiviso su Instagram, WhatsApp o via email — quei servizi leggono
 * l'HTML statico senza eseguire JavaScript, quindi vedono sempre i tag
 * Open Graph fissi definiti in `index.html` (uguali per ogni pagina, dato
 * che il sito non ha un server che genera pagine su misura per rotta).
 */
export function usePageMeta({ title, description }: PageMetaOptions): void {
  useEffect(() => {
    document.title = title

    if (description) {
      const meta = document.querySelector('meta[name="description"]')
      meta?.setAttribute('content', description)
    }
  }, [title, description])
}
