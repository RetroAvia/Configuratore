/**
 * Tipi condivisi che descrivono un prodotto configurabile e la sua categoria.
 *
 * Questo file è il "contratto" tra il motore di editing (generico, non sa
 * nulla di uno specifico prodotto) e i dati di ogni singolo modello, definiti
 * in `src/data/products/*.ts`. Aggiungere un nuovo prodotto o una nuova
 * categoria NON richiede mai di modificare questo file.
 */

/**
 * Forma "semplice" dell'area di ritaglio — un singolo contorno, senza fori.
 *
 * Le coordinate sono sempre espresse in pixel nello stesso sistema di
 * riferimento dell'immagine di base del prodotto (vedi `ProductConfig.canvas`),
 * NON normalizzate (0..1): questo rende semplice ricavarle direttamente da un
 * editor grafico, leggendo le coordinate in pixel sull'immagine di base.
 */
export type SimpleClipShape =
  | {
      type: 'rect'
      x: number
      y: number
      width: number
      height: number
      /** Raggio degli angoli arrotondati, in pixel. Opzionale (default 0). */
      radius?: number
    }
  | {
      type: 'ellipse'
      cx: number
      cy: number
      rx: number
      ry: number
      /** Rotazione della forma stessa, in gradi. Opzionale (default 0). */
      rotation?: number
    }
  | {
      type: 'polygon'
      /** Elenco di punti [x, y] in pixel, in ordine (orario o antiorario). */
      points: [number, number][]
    }

/**
 * Forma "composta" dell'area di ritaglio: un contorno esterno con uno o più
 * fori (aree escluse) al suo interno.
 *
 * Serve per i prodotti in cui l'immagine dell'utente deve coprire l'intera
 * scocca MA senza mai sovrapporsi a elementi funzionali come lo schermo o i
 * pulsanti (es. Game Boy Color / Game Boy Advance, dove il grafico
 * personalizzato va solo sulla scocca, lasciando schermo e tasti invariati).
 *
 * Ogni foro è a sua volta una `SimpleClipShape`: niente fori dentro ai fori.
 */
export interface CompoundClipShape {
  type: 'compound'
  /** Contorno esterno complessivo (es. la sagoma dell'intera scocca). */
  outer: SimpleClipShape
  /** Aree escluse dal ritaglio (es. schermo, D-pad, pulsanti). */
  holes: SimpleClipShape[]
}

export type ClipShape = SimpleClipShape | CompoundClipShape

export interface ProductConfig {
  /** Identificativo univoco del prodotto, usato come slug nell'URL. */
  slug: string
  /** Nome visualizzato del prodotto. */
  name: string
  /** Slug della categoria di appartenenza (deve esistere in `data/categories.ts`). */
  categorySlug: string
  /** Breve descrizione mostrata nelle card e nella pagina del configuratore. */
  description: string
  /**
   * Percorso (in `public/`) dell'immagine miniatura usata nelle card di
   * elenco. Può coincidere con `baseImage` se non hai ancora una miniatura
   * dedicata e ottimizzata.
   */
  thumbnail: string
  /**
   * Percorso (in `public/`) dell'immagine frontale ad alta risoluzione del
   * prodotto, usata come sfondo nel configuratore. Le sue dimensioni native
   * dovrebbero corrispondere a `canvas.width` × `canvas.height`.
   */
  baseImage: string
  /**
   * Percorso opzionale di un'immagine (con trasparenza) da disegnare SOPRA
   * l'immagine caricata dall'utente — ad es. le cifre/icone del display LCD,
   * che devono restare leggibili sopra alla foto dell'utente. Se omesso, non
   * viene disegnato nulla sopra.
   */
  overlayImage?: string
  /**
   * Dimensioni native (in pixel) dell'immagine di base: determinano la
   * risoluzione del canvas di lavoro e dell'immagine esportata.
   */
  canvas: {
    width: number
    height: number
  }
  /** Area in cui l'immagine caricata dall'utente viene ritagliata. */
  clipArea: ClipShape
  /** Colore di sfondo mostrato nell'area di ritaglio prima del caricamento di un'immagine. */
  emptyAreaColor?: string
  /** Nome del file suggerito per il download del risultato finale (es. "casio-f91w-personalizzato.png"). */
  exportFileName: string
}

export interface CategoryConfig {
  /** Identificativo univoco della categoria, usato come slug nell'URL. */
  slug: string
  /** Nome visualizzato della categoria. */
  name: string
  /** Breve descrizione mostrata nella home. */
  description: string
  /** Emoji o breve simbolo usato come icona nella home (nessun asset da caricare). */
  icon: string
}
