import { useEffect, useRef, useState } from 'react'
import { useLanguage } from '../../i18n/LanguageContext'

/**
 * Piccolo pulsante "ⓘ" che mostra una spiegazione al tocco/click — usato
 * accanto ai titoli dei gruppi meno immediati (Kit LED, Display, Box 3D...)
 * per chi non mastica il gergo del modding. Click-to-toggle invece di solo
 * hover: su mobile l'hover non esiste, quindi deve funzionare anche al tocco.
 */
export default function InfoTooltip({ text }: { text: string }) {
  const { t } = useLanguage()
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
        aria-label={t('infoTooltip.aria')}
        aria-expanded={open}
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          setOpen((v) => !v)
        }}
        className="grid h-4 w-4 shrink-0 place-items-center rounded-full border border-border text-[10px] font-bold leading-none text-ink-muted transition-colors hover:border-accent hover:text-accent"
      >
        i
      </button>
      {open && (
        <div
          role="tooltip"
          className="glass-surface absolute left-1/2 top-full z-20 mt-2 w-56 -translate-x-1/2 rounded-xl border border-border/70 p-3 text-xs leading-relaxed text-ink-muted"
        >
          {text}
        </div>
      )}
    </div>
  )
}
