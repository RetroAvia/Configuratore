import { describe, expect, it } from 'vitest'
import { gbaSp } from '../data/products/gba-sp'
import { casioF91w } from '../data/products/casio-f91w'
import {
  buildOrderSummary,
  computeTotal,
  describeRequirement,
  formatOrderSummaryText,
  formatPriceDelta,
  formatTotal,
  getDefaultSelections,
  getMaxPrice,
  getStartingPrice,
  isOptionAvailable,
  isGroupAvailable,
  resolveSelections,
  sanitizeSelections,
} from './pricing'

/**
 * Il motore prezzi è l'unica parte del sito in cui un errore costa soldi
 * veri: un totale sbagliato diventa un preventivo sbagliato mandato a un
 * cliente. Questi test girano sui DATI REALI dei prodotti, non su dati
 * inventati, così coprono anche eventuali incoerenze introdotte nei file di
 * `src/data/`.
 */

const pricing = gbaSp.pricing!
const watchPricing = casioF91w.pricing!

describe('selezioni di default', () => {
  it('sceglie la prima opzione di ogni gruppo', () => {
    const defaults = getDefaultSelections(pricing)
    for (const group of pricing.groups) {
      expect(defaults[group.id]).toBe(group.options[0].id)
    }
  })

  it('le selezioni di default sono già coerenti (non cambiano risolvendole)', () => {
    const defaults = getDefaultSelections(pricing)
    expect(resolveSelections(pricing, defaults)).toEqual(defaults)
  })
})

describe('regole di compatibilità', () => {
  it('senza scocca nuova le lavorazioni interne non sono disponibili', () => {
    const selections = { ...getDefaultSelections(pricing), 'livello-modifica': 'solo-gameboy' }

    const display = pricing.groups.find((g) => g.id === 'display')!
    const ips = display.options.find((o) => o.id === 'ips-v3')!
    expect(isOptionAvailable(display, ips, selections)).toBe(false)

    const shellColor = pricing.groups.find((g) => g.id === 'colore-scocca')!
    expect(isGroupAvailable(shellColor, selections)).toBe(false)
  })

  it('con la scocca personalizzata tutto torna disponibile', () => {
    const selections = { ...getDefaultSelections(pricing), 'livello-modifica': 'scocca-personalizzata' }

    for (const group of pricing.groups) {
      expect(isGroupAvailable(group, selections)).toBe(true)
      for (const option of group.options) {
        expect(isOptionAvailable(group, option, selections)).toBe(true)
      }
    }
  })

  it('tornando a "solo Game Boy" le opzioni impossibili si azzerano da sole', () => {
    const full = {
      ...getDefaultSelections(pricing),
      'livello-modifica': 'scocca-personalizzata',
      display: 'ips-v3',
      'kit-led': 'si',
      audio: 'nuovo',
      batteria: '950mah',
      'box-3d': 'si',
    }
    const resolved = resolveSelections(pricing, { ...full, 'livello-modifica': 'solo-gameboy' })

    expect(resolved.display).toBe('originale')
    expect(resolved['kit-led']).toBe('no')
    expect(resolved.audio).toBe('originale')
    expect(resolved.batteria).toBe('originale')
    // Il box 3D è esterno alla console: non dipende dal livello di modifica.
    expect(resolved['box-3d']).toBe('si')
  })

  it('la risoluzione è idempotente', () => {
    const once = resolveSelections(pricing, { 'livello-modifica': 'solo-gameboy', display: 'ips-v3' })
    expect(resolveSelections(pricing, once)).toEqual(once)
  })

  it('spiega in modo leggibile perché un’opzione è bloccata', () => {
    const display = pricing.groups.find((g) => g.id === 'display')!
    const requirement = display.options.find((o) => o.id === 'ips-v3')!.requires![0]
    const described = describeRequirement(pricing, requirement)

    expect(described?.groupTitle).toBe('Livello di Modifica')
    expect(described?.optionLabels).toEqual(['Con scocca semplice', 'Con scocca personalizzata'])
  })
})

describe('calcolo del totale', () => {
  it('il totale di partenza del Game Boy Advance SP è 80 €', () => {
    expect(computeTotal(pricing, getDefaultSelections(pricing))).toBe(80)
  })

  it('somma correttamente una configurazione completa', () => {
    const selections = {
      ...getDefaultSelections(pricing),
      'livello-modifica': 'scocca-personalizzata', // 120
      etichetta: 'personalizzata-olografica', //       5
      batteria: '950mah', //                          15
      audio: 'nuovo', //                              10
      display: 'ips-v3', //                           60
      'kit-led': 'si', //                             35
      'box-3d': 'si', //                              12
      'cover-trasparente': 'si', //                    5
      'colore-pulsanti': 'diverso', //                 5
    }
    expect(computeTotal(pricing, selections)).toBe(267)
  })

  it('lo sconto "Game Boy fornito dal cliente" sottrae 50 €', () => {
    const base = getDefaultSelections(pricing)
    const withDiscount = { ...base, 'gameboy-fornito': 'si' }
    expect(computeTotal(pricing, withDiscount)).toBe(computeTotal(pricing, base) - 50)
  })

  it('non conta mai un’opzione impossibile nel totale', () => {
    const impossible = { ...getDefaultSelections(pricing), 'livello-modifica': 'solo-gameboy', display: 'ips-v3' }
    expect(computeTotal(pricing, impossible)).toBe(80)
  })

  it('prezzo di partenza e prezzo massimo', () => {
    expect(getStartingPrice(pricing)).toBe(80)
    expect(getMaxPrice(pricing)).toBe(267)
    expect(getStartingPrice(watchPricing)).toBe(39.9)
    expect(getMaxPrice(watchPricing)).toBe(49.9)
  })

  it('il prezzo di partenza ignora gli sconti condizionati', () => {
    // Altrimenti ogni card mostrerebbe "da 30 €" grazie allo sconto di chi
    // fornisce il proprio Game Boy, che non è la condizione normale.
    expect(getStartingPrice(pricing)).toBeGreaterThan(0)
    expect(getStartingPrice(pricing)).toBe(80)
  })
})

describe('formattazione', () => {
  it('formatta i totali secondo la lingua', () => {
    expect(formatTotal(80)).toBe('80 €')
    expect(formatTotal(39.9)).toBe('39,90 €')
    expect(formatTotal(39.9, 'en')).toBe('39.90 €')
  })

  it('formatta le variazioni di prezzo', () => {
    expect(formatPriceDelta(0)).toBe('Gratis')
    expect(formatPriceDelta(0, 'en')).toBe('Free')
    expect(formatPriceDelta(15)).toBe('+15 €')
    expect(formatPriceDelta(-50)).toBe('-50 €')
  })
})

describe('selezioni di provenienza esterna', () => {
  it('scarta gruppi e opzioni inesistenti tornando ai valori di default', () => {
    const cleaned = sanitizeSelections(pricing, {
      display: 'non-esiste',
      'gruppo-fantasma': 'qualsiasi',
    })

    expect(cleaned.display).toBe('originale')
    expect(cleaned['gruppo-fantasma']).toBeUndefined()
    expect(Object.keys(cleaned).sort()).toEqual(pricing.groups.map((g) => g.id).sort())
  })

  it('regge valori vuoti o assenti', () => {
    expect(() => sanitizeSelections(pricing, null)).not.toThrow()
    expect(sanitizeSelections(pricing, null)).toEqual(getDefaultSelections(pricing))
  })
})

describe('riepilogo testuale inviato a RetroAvia', () => {
  const selections = { ...getDefaultSelections(pricing), 'livello-modifica': 'scocca-personalizzata' }

  it('una riga per gruppo, con id stabile', () => {
    const summary = buildOrderSummary(pricing, selections)
    expect(summary).toHaveLength(pricing.groups.length)
    expect(summary.map((line) => line.groupId)).toEqual(pricing.groups.map((group) => group.id))
  })

  it('include codice richiesta, contatti e link quando disponibili', () => {
    const text = formatOrderSummaryText(pricing, selections, 'Nota di prova', {
      orderCode: 'RA-ABCDE',
      configUrl: 'https://esempio.test/console/gba-sp?c=xyz',
      contact: { name: 'Mario', email: 'mario@esempio.it', instagram: '@mario' },
    })

    expect(text).toContain('RA-ABCDE')
    expect(text).toContain('Nota di prova')
    expect(text).toContain('Mario')
    expect(text).toContain('mario@esempio.it')
    // La chiocciola viene normalizzata: "@@mario" sarebbe un errore da copia-incolla.
    expect(text).toContain('Instagram: @mario')
    expect(text).not.toContain('@@')
    expect(text).toContain('https://esempio.test/console/gba-sp?c=xyz')
    expect(text).toContain('Totale stimato')
  })

  it('resta in italiano anche se il cliente naviga in un’altra lingua', () => {
    // Il riepilogo è indirizzato a RetroAvia, non al cliente.
    const text = formatOrderSummaryText(pricing, selections, '')
    expect(text).toContain('Totale stimato')
  })
})
