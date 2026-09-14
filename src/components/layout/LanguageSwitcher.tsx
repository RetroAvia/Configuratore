import { useEffect, useRef, useState } from 'react'
import { LOCALE_LABELS, SUPPORTED_LOCALES } from '../../i18n/locale'
import { useLanguage } from '../../i18n/LanguageContext'
import { playClick } from '../../utils/sound'

/**
 * Selettore di lingua (bandiera + nome) nell'header: stesso pattern
 * click-to-toggle di `InfoTooltip` (funziona anche su mobile, dove l'hover
 * non esiste), chiuso da un click fuori o dal tasto Escape.
 */
export default function LanguageSwitcher() {
  const { locale, setLocale, t } = useLanguage()
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handlePointerDown = (e: PointerEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('pointerdown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [open])

  return (
    <div ref={containerRef} className="relative inline-flex">
      <button
        type="button"
        onClick={() => {
          playClick()
          setOpen((v) => !v)
        }}
        aria-label={t('header.languageLabel')}
        aria-expanded={open}
        title={t('header.languageLabel')}
        className="grid h-10 min-w-10 place-items-center rounded-full border border-border px-2 text-base text-ink-muted transition-colors hover:border-primary/60 hover:text-primary"
      >
        <span aria-hidden="true">{LOCALE_LABELS[locale].flag}</span>
      </button>
      {open && (
        <div
          role="menu"
          className="glass-surface absolute right-0 top-full z-30 mt-2 w-40 overflow-hidden rounded-2xl border border-border/70 p-1.5"
        >
          {SUPPORTED_LOCALES.map((loc) => (
            <button
              key={loc}
              type="button"
              role="menuitemradio"
              aria-checked={loc === locale}
              onClick={() => {
                playClick()
                setLocale(loc)
                setOpen(false)
              }}
              className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium transition-colors ${
                loc === locale ? 'bg-primary/10 text-ink' : 'text-ink-muted hover:bg-surface-2 hover:text-ink'
              }`}
            >
              <span aria-hidden="true">{LOCALE_LABELS[loc].flag}</span>
              {LOCALE_LABELS[loc].name}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
