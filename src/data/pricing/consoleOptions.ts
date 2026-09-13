import type { PriceOptionGroup, PriceOptionValue } from '../../types/product'

/**
 * Gruppi di opzioni condivisi da tutte le console Game Boy modificabili
 * (Advance SP, Color, Advance): stesse modifiche disponibili, stessi
 * prezzi. Cambiano da modello a modello solo la batteria/porta di ricarica
 * (vedi `batteriaSpGroup` / `batteriaUsbCGroup` più sotto) e i colori di
 * scocca disponibili, definiti invece in `shellColors.ts` e composti nel
 * file del singolo prodotto tramite `buildColoreScoccaGroup`.
 *
 * Sono oggetti dati semplici e immutabili: possono essere tranquillamente
 * condivisi per riferimento tra i vari prodotti che li usano.
 */

export const livelloDiModificaGroup: PriceOptionGroup = {
  id: 'livello-modifica',
  title: 'Livello di Modifica',
  icon: '🛠️',
  options: [
    { id: 'solo-gameboy', label: 'Solo Game Boy (senza modifiche)', icon: '🕹️', priceDelta: 80 },
    { id: 'scocca-semplice', label: 'Con scocca semplice', icon: '🛡️', priceDelta: 100 },
    { id: 'scocca-personalizzata', label: 'Con scocca personalizzata', icon: '🎨', priceDelta: 120 },
  ],
}

export const etichettaGroup: PriceOptionGroup = {
  id: 'etichetta',
  title: 'Etichetta',
  icon: '🏷️',
  options: [
    { id: 'nintendo-originale', label: 'Nintendo (originale)', icon: '🎯', priceDelta: 0 },
    { id: 'personalizzata-normale', label: 'Personalizzata normale', icon: '🎨', priceDelta: 5 },
    { id: 'personalizzata-olografica', label: 'Personalizzata olografica', icon: '✨', priceDelta: 5 },
  ],
}

export const audioGroup: PriceOptionGroup = {
  id: 'audio',
  title: 'Audio',
  icon: '🔊',
  options: [
    { id: 'originale', label: 'Originale', icon: '🔊', priceDelta: 0 },
    { id: 'nuovo', label: 'Nuovo', icon: '🎵', priceDelta: 10 },
  ],
}

export const displayGroup: PriceOptionGroup = {
  id: 'display',
  title: 'Display',
  icon: '📺',
  info: 'Il pannello IPS V3 è uno schermo LCD sostitutivo: colori più vivi e un angolo di visione molto più ampio rispetto al display originale, che resta invece leggibile solo guardandolo quasi frontalmente.',
  options: [
    { id: 'originale', label: 'Originale', icon: '📺', priceDelta: 0 },
    { id: 'ips-v3', label: 'IPS V3', icon: '✨', priceDelta: 60 },
  ],
}

export const kitLedGroup: PriceOptionGroup = {
  id: 'kit-led',
  title: 'Kit LED',
  icon: '💡',
  info: 'Illuminazione a LED aggiuntiva integrata nella scocca/nei tasti, per un effetto retroilluminato più vistoso rispetto al modello originale.',
  options: [
    { id: 'no', label: 'No', icon: '🌙', priceDelta: 0 },
    { id: 'si', label: 'Sì', icon: '✨', priceDelta: 35 },
  ],
}

export const boxPersonalizzatoGroup: PriceOptionGroup = {
  id: 'box-3d',
  title: 'Box 3D Personalizzato',
  icon: '📦',
  info: 'Scatola stampata in 3D e personalizzata con la tua grafica: pensata per la spedizione o come confezione regalo.',
  options: [
    { id: 'no', label: 'No', icon: '📦', priceDelta: 0 },
    { id: 'si', label: 'Sì', icon: '🎁', priceDelta: 12 },
  ],
}

export const coverTrasparenteGroup: PriceOptionGroup = {
  id: 'cover-trasparente',
  title: 'Cover Trasparente',
  icon: '🔍',
  info: 'Guscio protettivo trasparente da applicare sopra la scocca, per proteggerla dai graffi mantenendo la grafica ben visibile.',
  options: [
    { id: 'no', label: 'No', icon: '🚫', priceDelta: 0 },
    { id: 'si', label: 'Sì', icon: '🔷', priceDelta: 5 },
  ],
}

export const gameBoyFornitoGroup: PriceOptionGroup = {
  id: 'gameboy-fornito',
  title: 'Game Boy fornito dal cliente',
  icon: '✅',
  highlighted: true,
  helperText: 'Se ci invii tu il tuo Game Boy da modificare non dovremo procurartene uno: applichiamo uno sconto.',
  options: [
    { id: 'no', label: 'No', icon: '🚫', priceDelta: 0 },
    { id: 'si', label: 'Sì', icon: '✅', priceDelta: -50 },
  ],
}

export const buttonColorGroup: PriceOptionGroup = {
  id: 'colore-pulsanti',
  title: 'Colore Pulsanti',
  icon: '🎮',
  helperText: "Di serie i pulsanti sono dello stesso colore della scocca scelta qui sopra.",
  options: [
    { id: 'uguale-scocca', label: 'Uguale alla scocca', icon: '🎮', priceDelta: 0 },
    { id: 'diverso', label: 'Colore diverso (specificalo nelle note)', icon: '🖌️', priceDelta: 5 },
  ],
}

/** Batteria del Game Boy Advance SP: originale oppure upgrade a 950 mAh. */
export const batteriaSpGroup: PriceOptionGroup = {
  id: 'batteria',
  title: 'Batteria',
  icon: '🔋',
  info: 'La 950 mAh è una batteria maggiorata rispetto a quella originale della SP: più autonomia prima di dover ricaricare.',
  options: [
    { id: 'originale', label: 'Originale', icon: '🔋', priceDelta: 0 },
    { id: '950mah', label: '950 mAh', icon: '⚡', priceDelta: 15 },
  ],
}

/** Batteria di Game Boy Color e Game Boy Advance: a pile originali, oppure conversione a batteria ricaricabile con porta USB-C. */
export const batteriaUsbCGroup: PriceOptionGroup = {
  id: 'batteria',
  title: 'Batteria',
  icon: '🔋',
  info: "La conversione USB-C sostituisce il vano pile originale con una batteria ricaricabile interna e una porta USB-C, come una console moderna.",
  options: [
    { id: 'originale', label: 'Originale (a pile)', icon: '🔋', priceDelta: 0 },
    { id: 'usb-c', label: 'USB-C (ricaricabile)', icon: '⚡', priceDelta: 39.9 },
  ],
}

/** Costruisce il gruppo "Colore Scocca" a partire dalla lista di colori disponibili per un modello specifico. */
export function buildColoreScoccaGroup(colors: PriceOptionValue[]): PriceOptionGroup {
  return {
    id: 'colore-scocca',
    title: 'Colore Scocca',
    icon: '🎨',
    options: colors,
  }
}
