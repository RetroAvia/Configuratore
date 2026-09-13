export type Locale = 'it' | 'en' | 'es' | 'fr'

export const SUPPORTED_LOCALES: Locale[] = ['it', 'en', 'es', 'fr']

export const DEFAULT_LOCALE: Locale = 'it'

export const LOCALE_LABELS: Record<Locale, { flag: string; name: string }> = {
  it: { flag: '🇮🇹', name: 'Italiano' },
  en: { flag: '🇬🇧', name: 'English' },
  es: { flag: '🇪🇸', name: 'Español' },
  fr: { flag: '🇫🇷', name: 'Français' },
}

/** Un valore testuale con eventuali traduzioni: la lingua di partenza (italiano) vive nel campo base, le altre in questa mappa opzionale. */
export type Localized = Partial<Record<Exclude<Locale, 'it'>, string>>

/**
 * Risolve un testo nella lingua corrente: se `it`, o se manca la
 * traduzione per la lingua richiesta, ricade sempre sul testo italiano
 * originale (mai una stringa vuota o un errore).
 */
export function tr(base: string, translations: Localized | undefined, locale: Locale): string {
  if (locale === 'it') return base
  return translations?.[locale] ?? base
}

function detectBrowserLocale(): Locale {
  if (typeof navigator === 'undefined') return DEFAULT_LOCALE
  const candidates = navigator.languages && navigator.languages.length > 0 ? navigator.languages : [navigator.language]
  for (const candidate of candidates) {
    const short = candidate.slice(0, 2).toLowerCase()
    if (SUPPORTED_LOCALES.includes(short as Locale)) return short as Locale
  }
  return DEFAULT_LOCALE
}

const STORAGE_KEY = 'retroavia-lab:locale'

/** Legge la lingua preferita salvata, altrimenti prova a indovinarla dalle preferenze del browser. */
export function readInitialLocale(): Locale {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved && SUPPORTED_LOCALES.includes(saved as Locale)) return saved as Locale
  } catch {
    // localStorage non disponibile (modalità privata, ecc.): nessun problema, si prosegue con il rilevamento.
  }
  return detectBrowserLocale()
}

export function saveLocale(locale: Locale): void {
  try {
    localStorage.setItem(STORAGE_KEY, locale)
  } catch {
    // Non blocca nulla: la scelta semplicemente non verrà ricordata al prossimo giro.
  }
}
