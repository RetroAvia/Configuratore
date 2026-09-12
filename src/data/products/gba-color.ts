import type { ProductConfig } from '../../types/product'

/**
 * Configurazione del Nintendo Game Boy Color.
 *
 * A differenza degli orologi (dove l'immagine va SOLO nello schermo) e del
 * GBA SP (dove copre l'intera scocca), qui l'immagine dell'utente deve
 * coprire l'intera scocca TRANNE lo schermo e i tasti (D-pad, A, B,
 * Select, Start), che devono restare sempre quelli originali della foto.
 *
 * Per questo `clipArea` è una forma "compound": un contorno esterno (la
 * sagoma della scocca) con una serie di fori che escludono esattamente
 * quelle aree. Il motore di rendering disegna l'immagine dell'utente solo
 * nella zona risultante (scocca meno fori), sia nell'editor che nel PNG
 * esportato.
 */
export const gbaColor: ProductConfig = {
  slug: 'gba-color',
  name: 'Game Boy Color',
  categorySlug: 'console',
  description:
    'La console portatile a colori Nintendo. Personalizza la scocca con una tua immagine, lasciando invariati schermo e tasti.',
  thumbnail: '/products/gba-color/base.png',
  baseImage: '/products/gba-color/base.png',
  canvas: {
    width: 1497,
    height: 2519,
  },
  clipArea: {
    type: 'compound',
    outer: {
      type: 'rect',
      x: 0,
      y: 0,
      width: 1497,
      height: 2519,
      radius: 24,
    },
    holes: [
      // Schermo LCD.
      { type: 'rect', x: 302, y: 216, width: 892, height: 791, radius: 16 },
      // Croce direzionale (D-pad).
      {
        type: 'polygon',
        points: [
          [225, 1435],
          [395, 1435],
          [395, 1570],
          [515, 1570],
          [515, 1705],
          [395, 1705],
          [395, 1880],
          [225, 1880],
          [225, 1705],
          [105, 1705],
          [105, 1570],
          [225, 1570],
        ],
      },
      // Tasto B.
      { type: 'ellipse', cx: 1012, cy: 1711, rx: 107, ry: 107 },
      // Tasto A.
      { type: 'ellipse', cx: 1280, cy: 1628, rx: 107, ry: 107 },
      // Tasto Select.
      { type: 'rect', x: 525, y: 2025, width: 220, height: 115, radius: 57 },
      // Tasto Start.
      { type: 'rect', x: 760, y: 2025, width: 205, height: 115, radius: 57 },
    ],
  },
  emptyAreaColor: '#dfe3ea',
  exportFileName: 'game-boy-color-personalizzato.png',
}
