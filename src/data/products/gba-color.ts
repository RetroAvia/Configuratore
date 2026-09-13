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
import { gbaColorColors } from '../pricing/shellColors'

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
      type: 'polygon',
      points: [
      [32, 16], [17, 32], [10, 48], [7, 64], [7, 80], [6, 96], [6, 112], [6, 128],
      [6, 144], [6, 160], [6, 176], [6, 192], [6, 208], [6, 224], [1, 240], [3, 256],
      [6, 272], [6, 288], [5, 304], [0, 320], [6, 336], [5, 352], [5, 368], [2, 384],
      [1, 400], [5, 416], [5, 432], [5, 448], [0, 464], [2, 480], [5, 496], [5, 512],
      [5, 528], [5, 544], [5, 560], [5, 576], [5, 592], [5, 608], [5, 624], [5, 640],
      [5, 656], [5, 672], [5, 688], [4, 704], [4, 720], [4, 736], [4, 752], [4, 768],
      [4, 784], [4, 800], [4, 816], [4, 832], [4, 848], [4, 864], [4, 880], [4, 896],
      [4, 912], [4, 928], [4, 944], [4, 960], [4, 976], [4, 992], [4, 1008], [4, 1024],
      [4, 1040], [4, 1056], [4, 1072], [4, 1088], [4, 1104], [4, 1120], [3, 1136], [3, 1152],
      [3, 1168], [3, 1184], [3, 1200], [3, 1216], [3, 1232], [3, 1248], [3, 1264], [3, 1280],
      [3, 1296], [3, 1312], [3, 1328], [3, 1344], [3, 1360], [3, 1376], [3, 1392], [3, 1408],
      [3, 1424], [3, 1440], [3, 1456], [3, 1472], [2, 1488], [2, 1504], [2, 1520], [2, 1536],
      [2, 1552], [2, 1568], [2, 1584], [2, 1600], [2, 1616], [2, 1632], [2, 1648], [2, 1664],
      [2, 1680], [2, 1696], [2, 1712], [2, 1728], [2, 1744], [2, 1760], [2, 1776], [2, 1792],
      [2, 1808], [2, 1824], [2, 1840], [2, 1856], [2, 1872], [2, 1888], [2, 1904], [1, 1920],
      [1, 1936], [1, 1952], [1, 1968], [1, 1984], [1, 2000], [1, 2016], [1, 2032], [1, 2048],
      [1, 2064], [1, 2080], [1, 2096], [1, 2112], [1, 2128], [1, 2144], [1, 2160], [1, 2176],
      [1, 2192], [1, 2208], [1, 2224], [0, 2240], [0, 2256], [0, 2272], [0, 2288], [0, 2304],
      [1, 2320], [3, 2336], [7, 2352], [12, 2368], [20, 2384], [31, 2400], [46, 2416], [67, 2432],
      [114, 2448], [189, 2464], [279, 2480], [391, 2496], [561, 2512], [726, 2518], [791, 2518], [946, 2512],
      [1112, 2496], [1222, 2480], [1309, 2464], [1385, 2448], [1430, 2432], [1451, 2416], [1466, 2400], [1476, 2384],
      [1485, 2368], [1490, 2352], [1494, 2336], [1496, 2320], [1496, 2304], [1496, 2288], [1496, 2272], [1496, 2256],
      [1496, 2240], [1496, 2224], [1496, 2208], [1496, 2192], [1496, 2176], [1496, 2160], [1495, 2144], [1495, 2128],
      [1495, 2112], [1495, 2096], [1495, 2080], [1495, 2064], [1495, 2048], [1495, 2032], [1495, 2016], [1495, 2000],
      [1495, 1984], [1495, 1968], [1495, 1952], [1495, 1936], [1495, 1920], [1495, 1904], [1495, 1888], [1495, 1872],
      [1495, 1856], [1495, 1840], [1495, 1824], [1495, 1808], [1494, 1792], [1494, 1776], [1494, 1760], [1494, 1744],
      [1494, 1728], [1494, 1712], [1494, 1696], [1494, 1680], [1494, 1664], [1494, 1648], [1494, 1632], [1494, 1616],
      [1494, 1600], [1494, 1584], [1494, 1568], [1494, 1552], [1494, 1536], [1494, 1520], [1494, 1504], [1494, 1488],
      [1494, 1472], [1493, 1456], [1493, 1440], [1493, 1424], [1493, 1408], [1493, 1392], [1493, 1376], [1493, 1360],
      [1493, 1344], [1493, 1328], [1493, 1312], [1493, 1296], [1493, 1280], [1493, 1264], [1493, 1248], [1493, 1232],
      [1493, 1216], [1493, 1200], [1493, 1184], [1493, 1168], [1493, 1152], [1493, 1136], [1493, 1120], [1493, 1104],
      [1492, 1088], [1492, 1072], [1492, 1056], [1492, 1040], [1492, 1024], [1492, 1008], [1492, 992], [1492, 976],
      [1492, 960], [1492, 944], [1492, 928], [1492, 912], [1492, 896], [1492, 880], [1491, 864], [1491, 848],
      [1491, 832], [1491, 816], [1491, 800], [1491, 784], [1491, 768], [1491, 752], [1491, 736], [1491, 720],
      [1491, 704], [1491, 688], [1491, 672], [1491, 656], [1491, 640], [1491, 624], [1491, 608], [1491, 592],
      [1491, 576], [1490, 560], [1490, 544], [1490, 528], [1490, 512], [1490, 496], [1493, 480], [1496, 464],
      [1490, 448], [1490, 432], [1490, 416], [1495, 400], [1495, 384], [1490, 368], [1490, 352], [1490, 336],
      [1495, 320], [1493, 304], [1490, 288], [1490, 272], [1491, 256], [1495, 240], [1489, 224], [1489, 208],
      [1489, 192], [1489, 176], [1489, 160], [1489, 144], [1489, 128], [1489, 112], [1489, 96], [1489, 80],
      [1488, 64], [1486, 48], [1479, 32], [1464, 16],
      ],
    },
    holes: [
      // Pannello anteriore trasparente: schermo LCD + indicatore POWER +
      // logo "GAME BOY COLOR" stampato — è tutto un unico pezzo fisico
      // separato dalla scocca, quindi va escluso per intero (non solo il
      // rettangolo dello schermo), altrimenti l'immagine dell'utente
      // finirebbe per coprire il logo e la scritta POWER.
      { type: 'rect', x: 88, y: 96, width: 1315, height: 1102, radius: 80 },
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
      buildColoreScoccaGroup(gbaColorColors),
      buttonColorGroup,
    ],
    notesPlaceholder:
      'Vuoi pulsanti di un colore diverso dalla scocca o hai altre richieste particolari? Scrivile qui.',
  },
}
