import type { ToastItem } from '../../hooks/useToasts'
import { useLanguage } from '../../i18n/LanguageContext'

interface ToastStackProps {
  toasts: ToastItem[]
  onDismiss: (id: number) => void
}

/**
 * Pila di notifiche flottanti, fissa in alto: centrata da telefono (sotto
 * l'header), allineata a destra da desktop. `pointer-events-none` sul
 * contenitore e `pointer-events-auto` su ogni singolo toast, così l'area
 * vuota intorno resta cliccabile e non blocca il resto della pagina.
 */
export default function ToastStack({ toasts, onDismiss }: ToastStackProps) {
  const { t } = useLanguage()
  if (toasts.length === 0) return null

  return (
    <div className="pointer-events-none fixed inset-x-0 top-20 z-50 flex flex-col items-center gap-2 px-4 sm:left-auto sm:right-4 sm:items-end">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          role={toast.variant === 'error' ? 'alert' : 'status'}
          className={`glass-surface animate-toast-in pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-2xl border px-4 py-3 text-sm shadow-2xl ${
            toast.variant === 'error' ? 'border-danger/40' : 'border-success/40'
          }`}
        >
          <span aria-hidden="true" className="mt-0.5 shrink-0 text-base">
            {toast.variant === 'error' ? '⚠️' : '✓'}
          </span>
          <p className="flex-1 leading-snug text-ink">{toast.message}</p>
          <button
            type="button"
            onClick={() => onDismiss(toast.id)}
            aria-label={t('toast.dismiss')}
            className="shrink-0 rounded-full text-ink-muted transition-colors hover:text-ink"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  )
}
