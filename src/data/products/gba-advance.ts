import type { ProductConfig } from '../../types/product'
import {
  livelloDiModificaGroup,
  etichettaGroup,
  batteriaUsbCGroup,
  audioGroup,
  displayGroup,
  kitLedGroup,
  boxPersonalizzatoGroup,
  coverTrasparenteGroup,
  gameBoyFornitoGroup,
  buttonColorGroup,
  buildColoreScoccaGroup,
} from '../pricing/consoleOptions'
import { gbaAdvanceColors } from '../pricing/shellColors'

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
      type: 'polygon',
      points: [
      [716, 0], [608, 14], [570, 28], [544, 42], [452, 56], [355, 70], [255, 84], [195, 98],
      [165, 112], [143, 126], [127, 140], [113, 154], [102, 168], [93, 182], [85, 196], [79, 210],
      [74, 224], [70, 238], [78, 252], [86, 266], [84, 280], [82, 294], [59, 308], [56, 322],
      [54, 336], [52, 350], [50, 364], [48, 378], [46, 392], [45, 406], [43, 420], [41, 434],
      [39, 448], [38, 462], [36, 476], [34, 490], [33, 504], [31, 518], [30, 532], [28, 546],
      [27, 560], [25, 574], [24, 588], [22, 602], [21, 616], [20, 630], [19, 644], [18, 658],
      [17, 672], [16, 686], [14, 700], [13, 714], [12, 728], [11, 742], [11, 756], [10, 770],
      [9, 784], [8, 798], [7, 812], [6, 826], [6, 840], [5, 854], [5, 868], [4, 882],
      [3, 896], [3, 910], [2, 924], [2, 938], [2, 952], [1, 966], [1, 980], [0, 994],
      [0, 1008], [0, 1022], [0, 1036], [1, 1050], [3, 1064], [5, 1078], [8, 1092], [12, 1106],
      [17, 1120], [23, 1134], [31, 1148], [40, 1162], [50, 1176], [62, 1190], [76, 1204], [94, 1218],
      [117, 1232], [219, 1246], [268, 1260], [319, 1274], [372, 1288], [426, 1302], [472, 1316], [510, 1330],
      [543, 1344], [578, 1358], [620, 1372], [677, 1386], [759, 1400], [873, 1414], [1048, 1428], [1176, 1433],
      [1306, 1433], [1432, 1428], [1602, 1414], [1715, 1400], [1799, 1386], [1857, 1372], [1899, 1358], [1934, 1344],
      [1966, 1330], [2001, 1316], [2043, 1302], [2088, 1288], [2134, 1274], [2178, 1260], [2222, 1246], [2322, 1232],
      [2345, 1218], [2363, 1204], [2377, 1190], [2389, 1176], [2399, 1162], [2407, 1148], [2415, 1134], [2421, 1120],
      [2426, 1106], [2430, 1092], [2434, 1078], [2436, 1064], [2438, 1050], [2439, 1036], [2439, 1022], [2439, 1008],
      [2438, 994], [2438, 980], [2438, 966], [2437, 952], [2437, 938], [2436, 924], [2436, 910], [2435, 896],
      [2435, 882], [2434, 868], [2434, 854], [2433, 840], [2432, 826], [2432, 812], [2431, 798], [2430, 784],
      [2429, 770], [2429, 756], [2428, 742], [2427, 728], [2426, 714], [2425, 700], [2424, 686], [2423, 672],
      [2422, 658], [2420, 644], [2419, 630], [2418, 616], [2416, 602], [2415, 588], [2414, 574], [2412, 560],
      [2411, 546], [2410, 532], [2410, 518], [2409, 504], [2408, 490], [2407, 476], [2405, 462], [2404, 448],
      [2403, 434], [2406, 420], [2406, 406], [2406, 392], [2403, 378], [2402, 364], [2399, 350], [2396, 336],
      [2395, 322], [2394, 308], [2375, 294], [2369, 280], [2366, 266], [2369, 252], [2379, 238], [2379, 224],
      [2375, 210], [2368, 196], [2361, 182], [2351, 168], [2338, 154], [2323, 140], [2307, 126], [2287, 112],
      [2258, 98], [2205, 84], [2114, 70], [2021, 56], [1928, 42], [1903, 28], [1866, 14], [1753, 0],
      ],
    },
    holes: [
      // Pannello anteriore: schermo LCD + logo "GAME BOY ADVANCE" stampato
      // sotto — è un unico pannello incassato nella scocca, quindi va
      // escluso per intero (non solo il rettangolo dello schermo),
      // altrimenti l'immagine dell'utente finirebbe per coprire il logo.
      { type: 'rect', x: 618, y: 178, width: 1212, height: 1117, radius: 190 },
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
  pricing: {
    basePrice: 0,
    baseLabel: 'Livello di Modifica (base)',
    groups: [
      livelloDiModificaGroup,
      etichettaGroup,
      batteriaUsbCGroup,
      audioGroup,
      displayGroup,
      kitLedGroup,
      boxPersonalizzatoGroup,
      coverTrasparenteGroup,
      gameBoyFornitoGroup,
      buildColoreScoccaGroup(gbaAdvanceColors),
      buttonColorGroup,
    ],
    notesPlaceholder:
      'Vuoi pulsanti di un colore diverso dalla scocca o hai altre richieste particolari? Scrivile qui.',
  },
}
