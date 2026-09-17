import type { ContactInfo } from '../types/order'
import { absoluteUrl } from '../config/site'

/**
 * Configurazione condivisibile: prodotto + opzioni scelte + note + contatti,
 * codificati in una stringa da mettere nella query string dell'URL
 * (`?c=…`).
 *
 * È il pezzo che mancava al flusso di richiesta: il sito non ha un backend,
 * quindi finora l'unico modo per far arrivare un preventivo a RetroAvia era
 * un'immagine PNG — dalla quale la configurazione NON è ricostruibile. Con
 * un link, invece, RetroAvia riapre il configuratore esattamente com'era
 * (opzioni selezionate, note, totale) e può modificarlo, correggerlo o
 * rimandarlo indietro al cliente.
 *
 * L'immagine caricata dall'utente NON viaggia mai nel link: sarebbe enorme
 * e violerebbe la promessa "nessun upload" del sito. Il link porta solo le
 * scelte; la foto continua ad arrivare come allegato/render.
 */

/** Versione del formato: se un giorno cambierà la struttura, i link vecchi restano riconoscibili (e ignorabili). */
const FORMAT_VERSION = 1

/** Nome del parametro nella query string. */
export const CONFIG_PARAM = 'c'

export interface SharedConfig {
  categorySlug: string
  modelSlug: string
  selections: Record<string, string>
  notes: string
  contact?: ContactInfo
}

/** Forma compatta effettivamente serializzata (chiavi corte per tenere l'URL breve). */
interface PackedConfig {
  v: number
  p: string
  s: Record<string, string>
  n?: string
  c?: { n?: string; e?: string; i?: string }
}

// ─── base64url ──────────────────────────────────────────────────────────────
// Si usa base64 "URL-safe" (+ → -, / → _, senza padding) perché il risultato
// finisce in un indirizzo web: i caratteri + e / verrebbero interpretati male
// da alcuni client di messaggistica quando accorciano o incollano il link.

function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = ''
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i])
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function base64UrlToBytes(value: string): Uint8Array {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/')
  const padded = normalized + '='.repeat((4 - (normalized.length % 4)) % 4)
  const binary = atob(padded)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return bytes
}

// ─── Codifica / decodifica ──────────────────────────────────────────────────

/** Serializza una configurazione nella stringa compatta da mettere in `?c=`. */
export function encodeConfig(config: SharedConfig): string {
  const packed: PackedConfig = {
    v: FORMAT_VERSION,
    p: `${config.categorySlug}/${config.modelSlug}`,
    s: config.selections,
  }

  const notes = config.notes.trim()
  if (notes) packed.n = notes

  if (config.contact) {
    const contact: NonNullable<PackedConfig['c']> = {}
    if (config.contact.name.trim()) contact.n = config.contact.name.trim()
    if (config.contact.email.trim()) contact.e = config.contact.email.trim()
    if (config.contact.instagram.trim()) contact.i = config.contact.instagram.trim()
    if (Object.keys(contact).length > 0) packed.c = contact
  }

  return bytesToBase64Url(new TextEncoder().encode(JSON.stringify(packed)))
}

/**
 * Ricostruisce una configurazione da una stringa `?c=…`, oppure restituisce
 * `null` se il valore è assente, corrotto, di un formato più recente o
 * semplicemente non è una configurazione. Non lancia MAI: un link storpiato
 * da un client di messaggistica deve solo essere ignorato, non rompere la
 * pagina.
 */
export function decodeConfig(raw: string | null | undefined): SharedConfig | null {
  if (!raw) return null
  try {
    const json = new TextDecoder().decode(base64UrlToBytes(raw))
    const parsed = JSON.parse(json) as Partial<PackedConfig>

    if (!parsed || typeof parsed !== 'object') return null
    if (parsed.v !== FORMAT_VERSION) return null
    if (typeof parsed.p !== 'string') return null

    const [categorySlug, modelSlug] = parsed.p.split('/')
    if (!categorySlug || !modelSlug) return null

    // Le selezioni vengono ripulite qui da qualunque valore non testuale;
    // la verifica che gruppi e opzioni esistano davvero avviene poi in
    // `sanitizeSelections` (utils/pricing.ts), che conosce il prodotto.
    const selections: Record<string, string> = {}
    if (parsed.s && typeof parsed.s === 'object') {
      for (const [key, value] of Object.entries(parsed.s)) {
        if (typeof key === 'string' && typeof value === 'string') selections[key] = value
      }
    }

    const contact: ContactInfo = {
      name: typeof parsed.c?.n === 'string' ? parsed.c.n : '',
      email: typeof parsed.c?.e === 'string' ? parsed.c.e : '',
      instagram: typeof parsed.c?.i === 'string' ? parsed.c.i : '',
    }

    return {
      categorySlug,
      modelSlug,
      selections,
      notes: typeof parsed.n === 'string' ? parsed.n : '',
      contact,
    }
  } catch {
    return null
  }
}

/** URL pubblico completo che riapre il configuratore su questa esatta configurazione. */
export function buildConfigUrl(config: SharedConfig): string {
  const encoded = encodeConfig(config)
  return `${absoluteUrl(`/${config.categorySlug}/${config.modelSlug}`)}?${CONFIG_PARAM}=${encoded}`
}

// ─── Codice richiesta ───────────────────────────────────────────────────────

/** Alfabeto senza caratteri ambigui (niente I/L/O/U/0/1): un codice letto al telefono non dev'essere interpretabile in due modi. */
const CODE_ALPHABET = '23456789ABCDEFGHJKMNPQRSTVWXYZ'

/**
 * Codice breve e leggibile (es. `RA-7F3KQ`) derivato in modo deterministico
 * dalla configurazione: la stessa configurazione produce sempre lo stesso
 * codice, configurazioni diverse quasi sempre codici diversi.
 *
 * Serve come riferimento umano nelle conversazioni ("ciao, la richiesta
 * RA-7F3KQ") e viene stampato sul biglietto preventivo e incluso nel testo
 * del messaggio: non è un identificativo sicuro né univoco al 100% — è un
 * appiglio per ritrovarsi, non una chiave di database.
 */
export function makeOrderCode(config: SharedConfig): string {
  // Il codice è calcolato SENZA i dati di contatto, così resta stabile anche
  // se il cliente aggiunge il proprio nome dopo aver già mandato il link.
  const payload = encodeConfig({ ...config, contact: undefined })

  // FNV-1a a 32 bit: minuscolo, veloce, nessuna dipendenza, distribuzione
  // più che sufficiente per un codice di 5 caratteri.
  let hash = 0x811c9dc5
  for (let i = 0; i < payload.length; i++) {
    hash ^= payload.charCodeAt(i)
    hash = Math.imul(hash, 0x01000193) >>> 0
  }

  let code = ''
  let remaining = hash
  for (let i = 0; i < 5; i++) {
    code += CODE_ALPHABET[remaining % CODE_ALPHABET.length]
    remaining = Math.floor(remaining / CODE_ALPHABET.length)
  }

  return `RA-${code}`
}
