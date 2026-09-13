import type { ProductConfig } from '../../types/product'

/**
 * Configurazione del Casio F-91W.
 *
 * L'immagine caricata dall'utente viene inserita SOLO nel rettangolo dello
 * schermo LCD (`clipArea`). Sopra di essa viene poi ridisegnata `overlayImage`,
 * un ritaglio con trasparenza delle cifre/icone del display estratto dalla
 * foto reale del prodotto: in questo modo l'ora "88:88", i giorni della
 * settimana e le icone restano sempre perfettamente leggibili sopra alla
 * foto personalizzata dell'utente, invece di sparire sotto di essa.
 */
export const casioF91w: ProductConfig = {
  slug: 'casio-f91w',
  name: 'Casio F-91W',
  categorySlug: 'orologi',
  description:
    "L'iconico orologio digitale Casio. Carica una tua immagine e personalizza il quadrante a modo tuo.",
  thumbnail: '/products/casio-f91w/base.png',
  baseImage: '/products/casio-f91w/base.png',
  overlayImage: '/products/casio-f91w/overlay.png',
  canvas: {
    width: 1114,
    height: 2021,
  },
  clipArea: {
    type: 'rect',
    x: 249,
    y: 804,
    width: 581,
    height: 289,
    radius: 10,
  },
  emptyAreaColor: '#8a9a8f',
  exportFileName: 'casio-f91w-personalizzato.png',
  pricing: {
    basePrice: 39.9,
    baseLabel: 'Immagine Personalizzata',
    groups: [
      {
        id: 'box',
        title: 'Box',
        icon: '📦',
        options: [
          { id: 'no', label: 'No', icon: '🚫', priceDelta: 0 },
          { id: 'si', label: 'Sì, aggiungi il box', icon: '🎁', priceDelta: 10 },
        ],
      },
    ],
    notesPlaceholder: 'Hai richieste particolari per la tua personalizzazione? Scrivile qui.',
  },
}
