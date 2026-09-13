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

/**
 * Una singola opzione selezionabile all'interno di un gruppo di modifiche
 * (es. "Con scocca semplice" dentro al gruppo "Livello di Modifica").
 *
 * Ogni gruppo si comporta come un set di radio button: in ogni momento è
 * selezionata esattamente un'opzione (la prima dell'array di default).
 */
export interface PriceOptionValue {
  /** Identificativo univoco dell'opzione all'interno del suo gruppo. */
  id: string
  /** Etichetta mostrata all'utente. */
  label: string
  /** Emoji mostrata a sinistra dell'etichetta. Alternativa a `color`, per i gruppi che non sono di tipo "colore". */
  icon?: string
  /** Colore (hex) mostrato come pallino a sinistra dell'etichetta, per i gruppi "colore scocca/pulsanti". */
  color?: string
  /** Se true, il pallino colore viene disegnato con un effetto "trasparente" (bordo tratteggiato + retro a scacchiera), per le finiture Clear/Crystal. */
  translucent?: boolean
  /**
   * Variazione di prezzo (in euro) rispetto a `ProductPricing.basePrice`,
   * sommata quando questa opzione è quella selezionata nel suo gruppo. Può
   * essere negativa (es. sconto per chi fornisce il proprio Game Boy).
   */
  priceDelta: number
  /** Nota breve mostrata accanto all'etichetta, tra parentesi (es. "USB-C"). */
  note?: string
}

/** Un gruppo di opzioni mutuamente esclusive: esattamente una selezionata, come un set di radio button. */
export interface PriceOptionGroup {
  /** Identificativo univoco del gruppo all'interno del prodotto. */
  id: string
  /** Titolo del gruppo, mostrato come intestazione del riquadro. */
  title: string
  /** Emoji mostrata accanto al titolo del gruppo. */
  icon: string
  options: PriceOptionValue[]
  /** Testo informativo opzionale mostrato sotto il titolo del gruppo. */
  helperText?: string
  /**
   * Se true, il riquadro del gruppo viene evidenziato graficamente (bordo e
   * titolo in evidenza): usato per opzioni particolari come "Game Boy
   * fornito dal cliente", che modificano lo sconto in modo importante.
   */
  highlighted?: boolean
  /**
   * Testo opzionale mostrato in un piccolo popover "ⓘ" accanto al titolo del
   * gruppo: usato per i gruppi meno immediati per chi non conosce il gergo
   * del modding (es. cosa sia un "Kit LED" o un pannello "IPS V3").
   */
  info?: string
}

/**
 * Configurazione prezzi/opzioni di un prodotto: alimenta il pannello
 * "Opzioni e Prezzo" mostrato nella pagina del configuratore, che calcola in
 * tempo reale il totale in base alle scelte dell'utente.
 */
export interface ProductPricing {
  /** Prezzo di partenza (in euro), a cui si sommano le variazioni di tutte le opzioni selezionate. */
  basePrice: number
  /** Etichetta mostrata accanto al prezzo di partenza nel riepilogo (es. "Immagine personalizzata"). */
  baseLabel: string
  groups: PriceOptionGroup[]
  /** Testo segnaposto del campo note libere, mostrato sotto ai gruppi di opzioni. */
  notesPlaceholder: string
}

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
  /**
   * Configurazione opzionale del pannello "Opzioni e Prezzo". Se omessa, il
   * configuratore non mostra alcun calcolo prezzo per questo prodotto.
   */
  pricing?: ProductPricing
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
