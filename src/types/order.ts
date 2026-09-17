/**
 * Tipi condivisi che descrivono una richiesta di personalizzazione: i dati
 * di contatto facoltativi del cliente e la configurazione completa che può
 * essere condivisa tramite link (vedi `utils/shareConfig.ts`).
 *
 * Restano in un file a parte, e non dentro `utils/pricing.ts`, per evitare
 * dipendenze circolari fra il motore prezzi e quello dei link condivisibili.
 */

/**
 * Dati di contatto inseriti facoltativamente dal cliente nel pannello di
 * invio. Non lasciano mai il browser da soli: vengono soltanto inseriti nel
 * testo del messaggio (email/WhatsApp/appunti) che è il cliente stesso a
 * inviare, e salvati in locale per non doverli riscrivere ogni volta.
 */
export interface ContactInfo {
  /** Nome o nickname con cui il cliente vuole essere chiamato. */
  name: string
  /** Email di risposta (facoltativa: c'è già quella del mittente se scrive via email). */
  email: string
  /** Handle Instagram, senza la chiocciola. */
  instagram: string
}

export const EMPTY_CONTACT: ContactInfo = { name: '', email: '', instagram: '' }

/** True se almeno un campo di contatto è stato compilato. */
export function hasContact(contact: ContactInfo | undefined | null): boolean {
  if (!contact) return false
  return Boolean(contact.name.trim() || contact.email.trim() || contact.instagram.trim())
}

/** Normalizza un handle Instagram scritto in tutti i modi possibili (@nome, instagram.com/nome, nome). */
export function normalizeInstagramHandle(raw: string): string {
  return raw
    .trim()
    .replace(/^https?:\/\/(www\.)?instagram\.com\//i, '')
    .replace(/^@/, '')
    .replace(/\/+$/, '')
    .trim()
}
