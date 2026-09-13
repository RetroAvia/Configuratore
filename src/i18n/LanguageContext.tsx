import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import type { Locale, Localized } from './locale'
import { readInitialLocale, saveLocale, tr as trBase } from './locale'
import { t as tBase } from './translations'
import type { TranslationKey } from './translations'

interface LanguageContextValue {
  locale: Locale
  setLocale: (locale: Locale) => void
  /** Traduce una stringa dell'interfaccia (dizionario UI, `i18n/translations.ts`) nella lingua corrente. */
  t: (key: TranslationKey, vars?: Record<string, string | number>) => string
  /** Traduce un contenuto "dati" (prodotto, categoria, gruppo/opzione prezzo...) nella lingua corrente. */
  tr: (base: string, translations: Localized | undefined) => string
}

const LanguageContext = createContext<LanguageContextValue | null>(null)

/**
 * Fornisce la lingua corrente a tutta l'app (letta da `localStorage`, poi
 * dalle preferenze del browser — vedi `readInitialLocale` in `./locale.ts`)
 * e le due funzioni di traduzione: `t()` per i testi fissi dell'interfaccia,
 * `tr()` per i contenuti che vivono nei dati di prodotto/categoria/prezzo.
 */
export function LanguageProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(() => readInitialLocale())

  // Tiene l'attributo lang dell'HTML coerente con la lingua scelta, utile
  // per screen reader, correttori automatici e motori di ricerca.
  useEffect(() => {
    document.documentElement.lang = locale
  }, [locale])

  const setLocale = (next: Locale) => {
    setLocaleState(next)
    saveLocale(next)
  }

  const value = useMemo<LanguageContextValue>(
    () => ({
      locale,
      setLocale,
      t: (key, vars) => tBase(locale, key, vars),
      tr: (base, translations) => trBase(base, translations, locale),
    }),
    [locale],
  )

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}

export function useLanguage(): LanguageContextValue {
  const ctx = useContext(LanguageContext)
  if (!ctx) {
    throw new Error('useLanguage deve essere usato dentro <LanguageProvider>.')
  }
  return ctx
}
