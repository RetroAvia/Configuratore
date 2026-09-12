import type { ProductConfig } from '../../types/product'

/**
 * Configurazione del Casio F-91W.
 *
 * ATTENZIONE — questo modello usa ancora un'illustrazione segnaposto
 * (`public/products/casio-f91w/base.svg`) al posto di una vera fotografia
 * del prodotto. Per sostituirla con la foto reale:
 *
 *  1. Procurati una foto/render frontale del Casio F-91W, ad alta
 *     risoluzione, ben centrata e senza prospettiva (vista dritta dall'alto).
 *  2. Salvala in `public/products/casio-f91w/` (es. `base.png`) e aggiorna
 *     `baseImage` qui sotto con il nuovo percorso.
 *  3. Aggiorna `canvas.width` / `canvas.height` con le dimensioni ESATTE (in
 *     pixel) della nuova immagine.
 *  4. Ricalcola le coordinate di `clipArea` in modo che corrispondano
 *     esattamente al riquadro dello schermo LCD nella nuova immagine.
 *     Per farlo comodamente, apri il configuratore aggiungendo "?debug=1"
 *     all'URL (es. /orologi/casio-f91w?debug=1): muovendo il mouse sul
 *     canvas vedrai in tempo reale le coordinate in pixel, utili per
 *     individuare gli angoli dello schermo nella tua immagine.
 *  5. Se disponibile, aggiungi anche un file per la miniatura (`thumbnail`)
 *     più leggero, oppure lascia che punti alla stessa `baseImage`.
 */
export const casioF91w: ProductConfig = {
  slug: 'casio-f91w',
  name: 'Casio F-91W',
  categorySlug: 'orologi',
  description:
    "L'iconico orologio digitale Casio. Carica una tua immagine e personalizza il quadrante a modo tuo.",
  thumbnail: '/products/casio-f91w/base.svg',
  baseImage: '/products/casio-f91w/base.svg',
  canvas: {
    width: 1000,
    height: 1300,
  },
  clipArea: {
    type: 'rect',
    x: 300,
    y: 380,
    width: 400,
    height: 300,
    radius: 16,
  },
  emptyAreaColor: '#b9c6b2',
  exportFileName: 'casio-f91w-personalizzato.png',
}
