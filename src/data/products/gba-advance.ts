import type { ProductConfig } from '../../types/product'

/**
 * Configurazione del Nintendo Game Boy Advance (originale).
 *
 * Stesso principio del Game Boy Color: `clipArea` è una forma "compound"
 * che copre l'intera scocca escludendo schermo, D-pad, A, B, Start e
 * Select — vedi il commento in `gba-color.ts` per i dettagli.
 */
export const gbaAdvance: ProductConfig = {
  slug: 'gba-advance',
  name: 'Game Boy Advance',
  categorySlug: 'console',
  description:
    'La storica console portatile Nintendo. Personalizza la scocca con una tua immagine, lasciando invariati schermo e tasti.',
  thumbnail: '/products/gba-advance/base.png',
  baseImage: '/products/gba-advance/base.png',
  canvas: {
    width: 2440,
    height: 1434,
  },
  clipArea: {
    type: 'compound',
    outer: {
      type: 'rect',
      x: 0,
      y: 0,
      width: 2440,
      height: 1434,
      radius: 20,
    },
    holes: [
      // Schermo LCD (bordo incluso).
      { type: 'rect', x: 684, y: 262, width: 1110, height: 775, radius: 24 },
      // Croce direzionale (D-pad).
      {
        type: 'polygon',
        points: [
          [248, 403],
          [412, 403],
          [412, 518],
          [512, 518],
          [512, 662],
          [412, 662],
          [412, 802],
          [248, 802],
          [248, 662],
          [148, 662],
          [148, 518],
          [248, 518],
        ],
      },
      // Tasto B.
      { type: 'ellipse', cx: 2020.5, cy: 666.5, rx: 113, ry: 113 },
      // Tasto A.
      { type: 'ellipse', cx: 2228, cy: 586, rx: 111, ry: 111 },
      // Tasto Start.
      { type: 'rect', x: 448, y: 904, width: 98, height: 123, radius: 49 },
      // Tasto Select.
      { type: 'rect', x: 446, y: 1045, width: 101, height: 129, radius: 50 },
    ],
  },
  emptyAreaColor: '#dfe3ea',
  exportFileName: 'game-boy-advance-personalizzato.png',
}
