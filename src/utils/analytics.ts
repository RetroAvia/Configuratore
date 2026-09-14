declare global {
  interface Window {
    va?: (...args: unknown[]) => void
  }
}

export type AnalyticsEventName =
  | 'render_generated'
  | 'quote_card_generated'
  | 'email_send_clicked'
  | 'instagram_send_clicked'
  | 'summary_copied'

type AnalyticsEventData = Record<string, string | number | boolean | null>

/**
 * Invia un evento business a Vercel Web Analytics. Non invia mai immagini o
 * dati personali: solo metadati (slug prodotto/categoria, nomi di file).
 * Non lancia mai eccezioni: un problema di analytics non deve mai rompere
 * l'esperienza dell'utente.
 */
export function trackEvent(name: AnalyticsEventName, data?: AnalyticsEventData): void {
  try {
    window.va?.('event', { name, data })
  } catch {
    // Silenzioso di proposito: l'analytics non deve mai interrompere l'UX.
  }
}
