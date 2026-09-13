import type { PriceOptionValue } from '../../types/product'

/**
 * Colori di scocca realmente disponibili per ciascun modello di console,
 * usati per popolare il gruppo "Colore Scocca" (vedi `buildColoreScoccaGroup`
 * in `consoleOptions.ts`). Sono solo dati informativi per il preventivo: il
 * canvas del configuratore non ridisegna la scocca nel colore scelto, che
 * viene invece riportato nel riepilogo inviato a RetroAvia.
 */

export const gbaSpColors: PriceOptionValue[] = [
  { id: 'grey', label: 'Grigio', color: '#8a8f94', priceDelta: 0 },
  { id: 'solid-black', label: 'Nero Solido', color: '#1b1b1d', priceDelta: 0 },
  { id: 'clear', label: 'Trasparente', color: '#c9d6dd', translucent: true, priceDelta: 0 },
  { id: 'pure-white', label: 'Bianco Puro', color: '#f5f4f0', priceDelta: 0 },
  { id: 'solid-green', label: 'Verde Solido', color: '#2f6b3a', priceDelta: 0 },
  { id: 'solid-yellow', label: 'Giallo Solido', color: '#e8c93a', priceDelta: 0 },
  { id: 'solid-purple', label: 'Viola Solido', color: '#5b3a8f', priceDelta: 0 },
  { id: 'solid-red', label: 'Rosso Solido', color: '#b5342f', priceDelta: 0 },
  { id: 'solid-orange', label: 'Arancione Solido', color: '#d97b2b', priceDelta: 0 },
  { id: 'solid-blue', label: 'Blu Solido', color: '#2e5aa8', priceDelta: 0 },
  { id: 'clear-blue', label: 'Blu Trasparente', color: '#3f7fd1', translucent: true, priceDelta: 0 },
  { id: 'amber', label: 'Ambra', color: '#c98a2b', translucent: true, priceDelta: 0 },
  { id: 'clear-purple', label: 'Viola Trasparente', color: '#7a4fb0', translucent: true, priceDelta: 0 },
  { id: 'clear-red', label: 'Rosso Trasparente', color: '#c9463e', translucent: true, priceDelta: 0 },
  { id: 'clear-yellow', label: 'Giallo Trasparente', color: '#d9c24a', translucent: true, priceDelta: 0 },
]

export const gbaColorColors: PriceOptionValue[] = [
  { id: 'white', label: 'Bianco', color: '#f2f2ef', priceDelta: 0 },
  { id: 'solid-black-usbc', label: 'Nero Solido', note: 'USB-C', color: '#1b1b1d', priceDelta: 0 },
  { id: 'clear-black', label: 'Nero Trasparente', color: '#2a2a2e', translucent: true, priceDelta: 3 },
  { id: 'purple', label: 'Viola', color: '#6a3fa0', priceDelta: 3 },
  { id: 'clear', label: 'Trasparente', color: '#c9d6dd', translucent: true, priceDelta: 3 },
  { id: 'orange', label: 'Arancione', color: '#d9772a', priceDelta: 3 },
  { id: 'clear-red', label: 'Rosso Trasparente', color: '#c9463e', translucent: true, priceDelta: 3 },
  { id: 'clear-yellow', label: 'Giallo Trasparente', color: '#d9c24a', translucent: true, priceDelta: 3 },
  { id: 'grey', label: 'Grigio', color: '#8a8f94', priceDelta: 3 },
  { id: 'pastel-green', label: 'Verde Pastello', color: '#a8d0a0', priceDelta: 3 },
]

export const gbaAdvanceColors: PriceOptionValue[] = [
  { id: 'amber', label: 'Ambra', color: '#c98a2b', translucent: true, priceDelta: 0 },
  { id: 'sunburst', label: 'Sunburst', color: '#e0902f', priceDelta: 0 },
  { id: 'solid-black', label: 'Nero Solido', color: '#1b1b1d', priceDelta: 0 },
  { id: 'clear', label: 'Trasparente', color: '#c9d6dd', translucent: true, priceDelta: 0 },
  { id: 'pure-white', label: 'Bianco Puro', color: '#f5f4f0', priceDelta: 0 },
  { id: 'sfc', label: 'SFC', color: '#9c8fae', priceDelta: 0 },
  { id: 'crystal-clear', label: 'Cristallo Trasparente', color: '#dbe6ec', translucent: true, priceDelta: 0 },
  { id: 'crystal-red', label: 'Cristallo Rosso', color: '#c9463e', translucent: true, priceDelta: 0 },
  { id: 'crystal-blue', label: 'Cristallo Blu', color: '#3f7fd1', translucent: true, priceDelta: 0 },
  { id: 'crystal-yellow', label: 'Cristallo Giallo', color: '#d9c24a', translucent: true, priceDelta: 0 },
  { id: 'crystal-purple', label: 'Cristallo Viola', color: '#7a4fb0', translucent: true, priceDelta: 0 },
  { id: 'ice', label: 'Ghiaccio', color: '#cfe7ef', translucent: true, priceDelta: 0 },
  { id: 'mint', label: 'Menta', color: '#8fd0b8', priceDelta: 0 },
  { id: 'sapphire', label: 'Zaffiro', color: '#1f5fa8', priceDelta: 0 },
]
