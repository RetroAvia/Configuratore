import { describe, expect, it } from 'vitest'
import { buildConfigUrl, decodeConfig, encodeConfig, makeOrderCode } from './shareConfig'
import type { SharedConfig } from './shareConfig'

/**
 * Il link di configurazione è ciò che permette a RetroAvia di riaprire il
 * preventivo di un cliente invece di ricostruirlo a mano: se la codifica si
 * rompe, si rompe il canale di richiesta. Questi test coprono il giro
 * completo, i caratteri accentati e i link manomessi.
 */

const config: SharedConfig = {
  categorySlug: 'console',
  modelSlug: 'gba-sp',
  selections: {
    'livello-modifica': 'scocca-personalizzata',
    display: 'ips-v3',
    'colore-scocca': 'clear-purple',
  },
  notes: 'Vorrei il logo più in alto, grazie! àèìòù €',
  contact: { name: 'Gabriele Rossi', email: 'test@esempio.it', instagram: 'retroavia_' },
}

describe('codifica e decodifica', () => {
  it('sopravvive al giro completo, accenti compresi', () => {
    expect(decodeConfig(encodeConfig(config))).toEqual(config)
  })

  it('produce una stringa sicura da mettere in un indirizzo web', () => {
    const encoded = encodeConfig(config)
    // Niente +, / o = : alcuni client di messaggistica li interpretano male
    // quando accorciano o incollano un link.
    expect(encoded).toMatch(/^[A-Za-z0-9_-]+$/)
  })

  it('omette le parti vuote per non allungare il link', () => {
    const minimal: SharedConfig = { ...config, notes: '', contact: { name: '', email: '', instagram: '' } }
    expect(encodeConfig(minimal).length).toBeLessThan(encodeConfig(config).length)

    const decoded = decodeConfig(encodeConfig(minimal))
    expect(decoded?.notes).toBe('')
    expect(decoded?.contact).toEqual({ name: '', email: '', instagram: '' })
  })

  it('un link manomesso viene ignorato invece di rompere la pagina', () => {
    expect(decodeConfig(null)).toBeNull()
    expect(decodeConfig('')).toBeNull()
    expect(decodeConfig('!!!non-valido!!!')).toBeNull()
    expect(decodeConfig('aGVsbG8')).toBeNull() // base64 valido, ma non è una configurazione
    expect(decodeConfig(encodeConfig(config).slice(0, 20))).toBeNull()
  })

  it('costruisce un indirizzo completo che punta al prodotto giusto', () => {
    const url = buildConfigUrl(config)
    expect(url).toContain('/console/gba-sp?c=')
    expect(() => new URL(url)).not.toThrow()

    const param = new URL(url).searchParams.get('c')
    expect(decodeConfig(param)).toEqual(config)
  })
})

describe('codice richiesta', () => {
  it('è stabile: la stessa configurazione dà sempre lo stesso codice', () => {
    expect(makeOrderCode(config)).toBe(makeOrderCode({ ...config }))
  })

  it('non cambia se il cliente aggiunge i propri contatti dopo', () => {
    const withoutContact: SharedConfig = { ...config, contact: { name: '', email: '', instagram: '' } }
    expect(makeOrderCode(withoutContact)).toBe(makeOrderCode(config))
  })

  it('cambia se cambia una scelta', () => {
    const other: SharedConfig = { ...config, selections: { ...config.selections, display: 'originale' } }
    expect(makeOrderCode(other)).not.toBe(makeOrderCode(config))
  })

  it('ha un formato leggibile e senza caratteri ambigui', () => {
    const code = makeOrderCode(config)
    expect(code).toMatch(/^RA-[23456789ABCDEFGHJKMNPQRSTVWXYZ]{5}$/)
  })

  it('genera pochissime collisioni su molte configurazioni diverse', () => {
    const codes = new Set<string>()
    for (let i = 0; i < 2000; i++) {
      codes.add(makeOrderCode({ ...config, notes: `variante ${i}` }))
    }
    // Con 5 caratteri su 30 simboli le collisioni sono possibili ma devono
    // restare rarissime: il codice serve a ritrovarsi in chat, non a
    // identificare univocamente un ordine.
    expect(codes.size).toBeGreaterThan(1990)
  })
})
