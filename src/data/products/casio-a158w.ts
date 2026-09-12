import type { ProductConfig } from '../../types/product'

/**
 * Configurazione del Casio A158W (il modello con cassa in acciaio).
 *
 * Stesso principio del Casio F-91W: l'immagine dell'utente viene ritagliata
 * nello schermo LCD e le cifre/icone del display (`overlayImage`, estratte
 * dalla foto reale) vengono ridisegnate sopra per restare sempre leggibili.
 */
export const casioA158w: ProductConfig = {
  slug: 'casio-a158w',
  name: 'Casio A158W',
  categorySlug: 'orologi',
  description:
    "Il classico Casio in acciaio con display digitale. Personalizza il quadrante con una tua immagine.",
  thumbnail: '/products/casio-a158w/base.png',
  baseImage: '/products/casio-a158w/base.png',
  overlayImage: '/products/casio-a158w/overlay.png',
  canvas: {
    width: 1208,
    height: 2224,
  },
  clipArea: {
    type: 'rect',
    x: 276,
    y: 937,
    width: 635,
    height: 308,
    radius: 10,
  },
  emptyAreaColor: '#8a9a8f',
  exportFileName: 'casio-a158w-personalizzato.png',
}
