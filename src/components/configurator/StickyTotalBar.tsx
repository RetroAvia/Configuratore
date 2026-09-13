import { useAnimatedNumber } from '../../hooks/useAnimatedNumber'
import { formatTotal } from '../../utils/pricing'
import { useLanguage } from '../../i18n/LanguageContext'

interface StickyTotalBarProps {
  total: number
  onJumpToOptions: () => void
}

/**
 * Barra del totale sempre visibile in fondo allo schermo, SOLO da telefono
 * (`lg:hidden`): con 11 gruppi di opzioni per le console, senza questa
 * barra il cliente dovrebbe risalire tutta la pagina per ricordarsi quanto
 * sta spendendo mentre sceglie. Su desktop il totale è già ben visibile
 * dentro al pannello Opzioni e Prezzo, quindi qui sarebbe ridondante.
 */
export default function StickyTotalBar({ total, onJumpToOptions }: StickyTotalBarProps) {
  const { t, locale } = useLanguage()
  const animatedTotal = useAnimatedNumber(total)

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-30 border-t border-border/80 bg-page/95 px-4 backdrop-blur-md lg:hidden"
      style={{ paddingTop: '0.75rem', paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom, 0px))' }}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3">
        <div className="leading-tight">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-muted">{t('stickyTotalBar.totalLabel')}</p>
          <p className="font-mono text-lg font-extrabold text-ink">{formatTotal(animatedTotal, locale)}</p>
        </div>
        <button
          type="button"
          onClick={onJumpToOptions}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-full px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-primary/20 transition-transform active:scale-95"
          style={{ backgroundImage: 'linear-gradient(90deg, #c1272d, #e8b04b)' }}
        >
          {t('stickyTotalBar.options')}
          <span aria-hidden="true">↓</span>
        </button>
      </div>
    </div>
  )
}
