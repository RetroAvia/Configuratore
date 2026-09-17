import { useEffect } from 'react'
import { absoluteUrl } from '../config/site'

interface PageMetaOptions {
  /** Titolo completo della pagina (mostrato nella scheda del browser, nei preferiti e nella cronologia). */
  title: string
  /** Meta description specifica della pagina, se diversa da quella predefinita del sito. */
  description?: string
  /**
   * Percorso canonico della pagina (es. `/orologi/casio-f91w`). Serve a
   * dichiarare a Google qual è l'indirizzo "ufficiale" del contenuto:
   * senza, lo stesso configuratore raggiunto con una query string diversa
   * (un link di configurazione condiviso, un parametro di tracciamento
   * incollato da un social) viene visto come una pagina duplicata distinta,
   * e le pagine duplicate si fanno concorrenza da sole nei risultati.
   */
  path?: string
  /** True per chiedere ai motori di ricerca di non indicizzare la pagina (es. "pagina non trovata"). */
  noindex?: boolean
}

/** Crea o aggiorna un `<meta>` identificato da un attributo (`name` o `property`). */
function upsertMeta(attribute: 'name' | 'property', key: string, content: string): void {
  let element = document.head.querySelector<HTMLMetaElement>(`meta[${attribute}="${key}"]`)
  if (!element) {
    element = document.createElement('meta')
    element.setAttribute(attribute, key)
    document.head.appendChild(element)
  }
  element.setAttribute('content', content)
}

/** Crea o aggiorna un `<link rel="…">`. */
function upsertLink(rel: string, href: string): void {
  let element = document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`)
  if (!element) {
    element = document.createElement('link')
    element.setAttribute('rel', rel)
    document.head.appendChild(element)
  }
  element.setAttribute('href', href)
}

/**
 * Aggiorna titolo, descrizione, indirizzo canonico e anteprima social della
 * pagina corrente.
 *
 * NB — e il limite è importante da conoscere: i bot che generano l'anteprima
 * dei link su Instagram, WhatsApp e simili leggono l'HTML statico SENZA
 * eseguire JavaScript, quindi non vedono nulla di quanto impostato qui.
 * Per loro è il file HTML servito dal server a contare: la build genera una
 * pagina statica per ogni rotta, ciascuna con i propri meta tag già dentro
 * (vedi il plugin `seoStaticPages` in `vite.config.ts`). Quanto avviene qui
 * serve invece al browser, ai preferiti e ai motori di ricerca che il
 * JavaScript lo eseguono (Google).
 */
export function usePageMeta({ title, description, path, noindex }: PageMetaOptions): void {
  useEffect(() => {
    document.title = title
    upsertMeta('property', 'og:title', title)
    upsertMeta('name', 'twitter:title', title)

    if (description) {
      upsertMeta('name', 'description', description)
      upsertMeta('property', 'og:description', description)
      upsertMeta('name', 'twitter:description', description)
    }

    if (path) {
      const canonical = absoluteUrl(path)
      upsertLink('canonical', canonical)
      upsertMeta('property', 'og:url', canonical)
    }

    // `robots` viene sempre impostato esplicitamente, e non solo quando serve
    // escludere la pagina: navigando da una rotta esclusa a una normale il
    // valore precedente resterebbe altrimenti appiccicato al documento.
    upsertMeta('name', 'robots', noindex ? 'noindex, follow' : 'index, follow')
  }, [title, description, path, noindex])
}
