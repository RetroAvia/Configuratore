import {
  RETROAVIA_EMAIL,
  RETROAVIA_INSTAGRAM_DM,
  RETROAVIA_INSTAGRAM_PROFILE,
  RETROAVIA_WHATSAPP,
} from '../config/site'

export { RETROAVIA_EMAIL, RETROAVIA_INSTAGRAM_DM, RETROAVIA_INSTAGRAM_PROFILE }

/**
 * Link pronti all'uso per far arrivare la richiesta a RetroAvia.
 *
 * I contatti non sono più scritti qui ma in `config/site.ts`, insieme al
 * dominio pubblico: un posto solo da aggiornare se cambia un indirizzo.
 */

/**
 * Oltre questa lunghezza un link `mailto:` diventa inaffidabile: alcuni
 * client di posta (e alcuni browser su Windows) troncano il corpo del
 * messaggio o ignorano del tutto il link. Con 11 gruppi di opzioni più le
 * note ci si arriva davvero, quindi il pannello di invio se ne accorge e
 * suggerisce di copiare il riepilogo invece di aprire l'email a vuoto.
 */
export const MAILTO_SAFE_LENGTH = 1800

/**
 * Costruisce il link "mailto:" pre-compilato per inviare l'idea di
 * personalizzazione a RetroAvia. Un sito statico non può allegare file in
 * automatico a un'email: il link prepara solo oggetto e testo, ricordando
 * all'utente di allegare a mano il render appena scaricato. Il render
 * contiene già l'intero collage (tutte le immagini caricate, composte
 * insieme), quindi basta un solo file da allegare.
 *
 * Quando il prodotto ha un pannello Opzioni e Prezzo (`orderSummaryText`),
 * il riepilogo delle scelte, il totale stimato, il codice della richiesta e
 * il link che riapre l'esatta configurazione vengono inclusi nel corpo
 * dell'email (vedi `formatOrderSummaryText` in `utils/pricing.ts`).
 */
export function buildMailtoHref(productName: string, orderSummaryText?: string): string {
  const subject = `Idea di personalizzazione – ${productName}`

  const bodyParts = [
    'Ciao RetroAvia,',
    '',
    `vorrei informazioni per questa personalizzazione: ${productName}.`,
    'Ho scaricato il render finale: lo allego qui sotto.',
  ]

  if (orderSummaryText) {
    bodyParts.push('', 'Ecco le opzioni che ho scelto:', '', orderSummaryText)
  }

  bodyParts.push('', '(Prima di inviare, ricordati di allegare manualmente il file appena scaricato dal browser.)')

  return `mailto:${RETROAVIA_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(bodyParts.join('\n'))}`
}

/** True se il link è abbastanza lungo da rischiare di essere troncato dal client di posta. */
export function isMailtoRisky(href: string): boolean {
  return href.length > MAILTO_SAFE_LENGTH
}

/** Link diretto per aprire una conversazione Instagram con RetroAvia. */
export function buildInstagramDmHref(): string {
  return RETROAVIA_INSTAGRAM_DM
}

/** True se è stato configurato un numero WhatsApp (vedi `RETROAVIA_WHATSAPP` in `config/site.ts`). */
export function hasWhatsApp(): boolean {
  return /^\d{8,15}$/.test(RETROAVIA_WHATSAPP.trim())
}

/**
 * Link WhatsApp con il messaggio GIÀ precompilato.
 *
 * È l'unico dei tre canali in cui il testo arriva davvero scritto: Instagram
 * non permette di precompilare nulla e l'email dipende dal client installato.
 * Per questo, quando un numero è configurato, WhatsApp è il canale più
 * affidabile per ricevere il riepilogo completo senza copiaincolla.
 */
export function buildWhatsAppHref(productName: string, orderSummaryText?: string): string | null {
  if (!hasWhatsApp()) return null

  const parts = ['Ciao RetroAvia!', '', `Vorrei informazioni per questa personalizzazione: ${productName}.`]
  if (orderSummaryText) parts.push('', orderSummaryText)

  return `https://wa.me/${RETROAVIA_WHATSAPP.trim()}?text=${encodeURIComponent(parts.join('\n'))}`
}
