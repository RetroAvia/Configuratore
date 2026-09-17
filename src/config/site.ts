/**
 * Configurazione centrale del sito.
 *
 * Tutto ciò che prima era scritto a mano in più punti (dominio pubblico,
 * contatti, numero WhatsApp) vive qui: cambiarlo in un posto solo aggiorna
 * meta tag, dati strutturati Schema.org, sitemap, link di invio e biglietto
 * preventivo, senza rischiare di dimenticarne uno.
 *
 * ── DOMINIO ────────────────────────────────────────────────────────────────
 * `SITE_URL` si può sovrascrivere a build-time senza toccare il codice,
 * impostando la variabile d'ambiente `VITE_SITE_URL` (su Vercel:
 * Settings → Environment Variables). Quando comprerai un dominio tuo
 * (es. https://lab.retroavia.it) basterà impostarla lì.
 */

function readEnv(key: string): string | undefined {
  // `import.meta.env` esiste solo quando il codice viene compilato da Vite:
  // il controllo difensivo serve per i test, che girano fuori da Vite.
  const env = (import.meta as unknown as { env?: Record<string, string | undefined> }).env
  const value = env?.[key]
  return value && value.trim() ? value.trim() : undefined
}

/** Origine pubblica del sito, SENZA slash finale (es. "https://lab.retroavia.it"). */
export const SITE_URL = (readEnv('VITE_SITE_URL') ?? 'https://configuratore-five.vercel.app').replace(/\/+$/, '')

/** Nome del sito, usato in Open Graph, Schema.org e nei titoli delle pagine. */
export const SITE_NAME = 'RetroAvia Lab'

/** Nome del brand (l'attività), distinto dal nome del sito/configuratore. */
export const BRAND_NAME = 'RetroAvia'

/** Costruisce un URL assoluto a partire da un percorso interno ("/orologi" → "https://…/orologi"). */
export function absoluteUrl(path: string): string {
  if (/^https?:\/\//i.test(path)) return path
  return `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`
}

// ─── Contatti ───────────────────────────────────────────────────────────────

export const RETROAVIA_EMAIL = 'retroaviaofficial@gmail.com'
export const RETROAVIA_INSTAGRAM_HANDLE = 'retroavia_'
export const RETROAVIA_INSTAGRAM_DM = `https://ig.me/m/${RETROAVIA_INSTAGRAM_HANDLE}`
export const RETROAVIA_INSTAGRAM_PROFILE = `https://www.instagram.com/${RETROAVIA_INSTAGRAM_HANDLE}/`

/**
 * Numero WhatsApp in formato internazionale SENZA "+", spazi o trattini
 * (es. '393331234567'). A differenza di Instagram, WhatsApp permette di
 * precompilare davvero il testo del messaggio: se valorizzato, nel pannello
 * di invio compare un pulsante "Invia su WhatsApp" con già dentro il
 * riepilogo completo delle opzioni scelte.
 *
 * Lasciandolo stringa vuota, il pulsante semplicemente non viene mostrato:
 * nessun link rotto, nessuna modifica al codice necessaria.
 */
export const RETROAVIA_WHATSAPP: string = ''

// ─── Informazioni commerciali (facoltative) ─────────────────────────────────

/**
 * Riquadro "Informazioni utili" mostrato sotto al pannello di invio:
 * tempi di realizzazione, spedizione, pagamento, cosa succede se il cliente
 * invia la propria console. Sono informazioni che un cliente cerca PRIMA di
 * scrivere, e non averle è uno dei motivi più comuni per cui non scrive.
 *
 * Ogni voce non valorizzata viene semplicemente omessa; se sono tutte vuote
 * (come adesso) il riquadro non compare affatto. Compila solo quelle di cui
 * conosci la risposta — meglio tre voci vere che sei inventate.
 *
 * Esempio:
 *   productionTime: '10–15 giorni lavorativi dalla conferma.',
 *   shipping: 'Spedizione tracciata in Italia: 7 € (gratis sopra i 150 €).',
 *   payment: 'Pagamento con bonifico o PayPal, 50% all’ordine.',
 *   customerHardware: 'Se mandi la tua console, le spese di spedizione verso il laboratorio sono a tuo carico: consigliata la spedizione assicurata.',
 */
export interface BusinessInfo {
  /** Tempi di realizzazione. */
  productionTime?: string
  /** Spedizione: costi, corriere, tempi. */
  shipping?: string
  /** Modalità e tempi di pagamento. */
  payment?: string
  /** Cosa succede quando è il cliente a inviare la propria console. */
  customerHardware?: string
}

export const BUSINESS_INFO: BusinessInfo = {
  productionTime: '',
  shipping: '',
  payment: '',
  customerHardware: '',
}

/** True se almeno una voce di `BUSINESS_INFO` è compilata (usato per decidere se mostrare il riquadro). */
export function hasBusinessInfo(): boolean {
  return Object.values(BUSINESS_INFO).some((value) => typeof value === 'string' && value.trim().length > 0)
}
