/**
 * Condivisione nativa (Web Share API) e appunti.
 *
 * Su telefono questo è il passaggio che toglie più attrito all'intero
 * flusso: invece di "scarica il file → apri Instagram → allega a mano il
 * file dalla galleria", il cliente tocca un pulsante e sceglie direttamente
 * la conversazione in cui mandare render e riepilogo. Su desktop (dove la
 * Web Share API in genere non è disponibile) resta tutto com'era: download
 * del file + link email/Instagram.
 *
 * Nessuna funzione qui lancia eccezioni: la condivisione è sempre una
 * scorciatoia opzionale, mai l'unico modo per completare la richiesta.
 */

export type ShareOutcome =
  /** Contenuto passato al sistema operativo (non sapremo mai se poi è stato davvero inviato: la Web Share API non lo dice). */
  | 'shared'
  /** L'utente ha chiuso il foglio di condivisione: non è un errore, non va segnalato come tale. */
  | 'cancelled'
  /** Il browser non supporta la condivisione (di file, o in generale). */
  | 'unsupported'
  /** Tentativo fallito per un motivo imprevisto. */
  | 'error'

interface ShareImageOptions {
  blob: Blob
  fileName: string
  title: string
  text: string
}

/** True se il browser sa condividere file immagine (tipicamente: telefoni e tablet). */
export function canShareImage(): boolean {
  try {
    if (typeof navigator === 'undefined' || !navigator.share || !navigator.canShare) return false
    // Un file di prova minimo: `canShare` va interrogata con lo stesso tipo di
    // contenuto che si vorrà condividere davvero, non solo con un oggetto vuoto.
    const probe = new File([new Blob([''], { type: 'image/png' })], 'probe.png', { type: 'image/png' })
    return navigator.canShare({ files: [probe] })
  } catch {
    return false
  }
}

/** True se il browser sa almeno condividere testo/link (più diffuso della condivisione di file). */
export function canShareText(): boolean {
  try {
    return typeof navigator !== 'undefined' && typeof navigator.share === 'function'
  } catch {
    return false
  }
}

/** Condivide un'immagine (più un testo di accompagnamento) tramite il foglio di condivisione del sistema. */
export async function shareImage({ blob, fileName, title, text }: ShareImageOptions): Promise<ShareOutcome> {
  if (!canShareImage()) return 'unsupported'
  try {
    const file = new File([blob], fileName, { type: blob.type || 'image/png' })
    if (!navigator.canShare?.({ files: [file] })) return 'unsupported'
    await navigator.share({ files: [file], title, text })
    return 'shared'
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') return 'cancelled'
    return 'error'
  }
}

/** Condivide solo testo e link (usato quando la condivisione di file non è disponibile). */
export async function shareText(title: string, text: string, url?: string): Promise<ShareOutcome> {
  if (!canShareText()) return 'unsupported'
  try {
    await navigator.share({ title, text, ...(url ? { url } : {}) })
    return 'shared'
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') return 'cancelled'
    return 'error'
  }
}

/**
 * Copia testo negli appunti, con ripiego su un metodo compatibile per i
 * contesti in cui l'API moderna non è disponibile (pagine non sicure,
 * browser datati, permessi negati).
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text)
      return true
    }
  } catch {
    // Si prosegue con il metodo di ripiego qui sotto.
  }

  try {
    const textarea = document.createElement('textarea')
    textarea.value = text
    textarea.setAttribute('readonly', '')
    textarea.style.position = 'fixed'
    textarea.style.opacity = '0'
    textarea.style.pointerEvents = 'none'
    document.body.appendChild(textarea)
    textarea.select()
    const ok = document.execCommand('copy')
    textarea.remove()
    return ok
  } catch {
    return false
  }
}
