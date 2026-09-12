import type { ImageTransform } from '../hooks/useImageTransform'

/** Immagine dell'utente decodificata e pronta per essere disegnata (su schermo o su canvas). */
export interface LoadedUserImage {
  /** Identificativo dell'immagine (il suo URL oggetto locale): cambia solo quando viene caricato un nuovo file. */
  key: string
  element: HTMLImageElement
  width: number
  height: number
}

/**
 * Un singolo "strato" immagine posizionabile all'interno dell'area
 * personalizzabile del prodotto. Il configuratore supporta più strati
 * contemporaneamente (un vero e proprio collage): ognuno ha la propria
 * immagine e la propria trasformazione (posizione, scala, rotazione),
 * completamente indipendente dagli altri — si possono trascinare,
 * ridimensionare e ruotare uno per uno per comporre il collage a mano.
 */
export interface ImageLayer {
  /** Identificativo univoco dello strato, stabile per tutta la sua vita anche se l'immagine viene sostituita. */
  id: string
  image: LoadedUserImage
  transform: ImageTransform
}
