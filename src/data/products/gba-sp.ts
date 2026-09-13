import type { ProductConfig } from '../../types/product'
import {
  livelloDiModificaGroup,
  etichettaGroup,
  batteriaSpGroup,
  audioGroup,
  displayGroup,
  kitLedGroup,
  boxPersonalizzatoGroup,
  coverTrasparenteGroup,
  gameBoyFornitoGroup,
  buttonColorGroup,
  buildColoreScoccaGroup,
} from '../pricing/consoleOptions'
import { gbaSpColors } from '../pricing/shellColors'

/**
 * Configurazione del Nintendo Game Boy Advance SP (scocca frontale, chiusa).
 *
 * L'immagine dell'utente copre l'intera scocca frontale, ESCLUSA l'area
 * della cerniera in alto: la clip area è un poligono che segue da vicino il
 * profilo reale della scocca (angoli inferiori arrotondati) partendo appena
 * sotto al punto più basso della cerniera, con un margine di sicurezza per
 * non sconfinare mai su di essa.
 */
export const gbaSp: ProductConfig = {
  slug: 'gba-sp',
  name: 'Game Boy Advance SP',
  categorySlug: 'console',
  description:
    'La console portatile a conchiglia Nintendo. Personalizza la scocca frontale con una tua immagine.',
  thumbnail: '/products/gba-sp/base.png',
  baseImage: '/products/gba-sp/base.png',
  canvas: {
    width: 1747,
    height: 1762,
  },
  clipArea: {
    type: 'polygon',
    points: [
      [0, 227],
      [1747, 227],
      [1747, 1647],
      [1744.8, 1669.4],
      [1738.2, 1691.0],
      [1727.6, 1710.9],
      [1713.3, 1728.3],
      [1695.9, 1742.6],
      [1676.0, 1753.2],
      [1654.4, 1759.8],
      [1632.0, 1762.0],
      [115, 1762],
      [92.6, 1759.8],
      [71.0, 1753.2],
      [51.1, 1742.6],
      [33.7, 1728.3],
      [19.4, 1710.9],
      [8.8, 1691.0],
      [2.2, 1669.4],
      [0.0, 1647.0],
    ],
  },
  emptyAreaColor: '#c7cdd4',
  exportFileName: 'gba-sp-personalizzato.png',
  pricing: {
    basePrice: 0,
    baseLabel: 'Livello di Modifica (base)',
    groups: [
      livelloDiModificaGroup,
      etichettaGroup,
      batteriaSpGroup,
      audioGroup,
      displayGroup,
      kitLedGroup,
      boxPersonalizzatoGroup,
      coverTrasparenteGroup,
      gameBoyFornitoGroup,
      buildColoreScoccaGroup(gbaSpColors),
      buttonColorGroup,
    ],
    notesPlaceholder:
      'Vuoi pulsanti di un colore diverso dalla scocca o hai altre richieste particolari? Scrivile qui.',
  },
}
