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
  descriptionI18n: {
    en: 'The classic steel Casio with a digital display. Customize the dial with your own image.',
    es: 'El clásico Casio de acero con pantalla digital. Personaliza la esfera con tu propia imagen.',
    fr: 'La Casio classique en acier à affichage digital. Personnalisez le cadran avec votre propre image.',
  },
  thumbnail: '/products/casio-a158w/thumb.webp',
  baseImage: '/products/casio-a158w/base.webp',
  overlayImage: '/products/casio-a158w/overlay.webp',
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
  pricing: {
    basePrice: 54.9,
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
    notesPlaceholderI18n: {
      en: 'Any special requests for your customization? Write them here.',
      es: '¿Tienes peticiones especiales para tu personalización? Escríbelas aquí.',
      fr: 'Des demandes particulières pour votre personnalisation ? Écrivez-les ici.',
    },
  },
}
