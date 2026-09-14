import { useState } from 'react'
import InstagramIcon from '../icons/InstagramIcon'
import { playClick } from '../../utils/sound'
import { buildInstagramDmHref, buildMailtoHref, RETROAVIA_INSTAGRAM_PROFILE } from '../../utils/sendLinks'
import type { OrderSummaryLine } from '../../utils/pricing'
import { formatPriceDelta, formatTotal } from '../../utils/pricing'
import { useAnimatedNumber } from '../../hooks/useAnimatedNumber'
import { useLanguage } from '../../i18n/LanguageContext'
import { trackEvent } from '../../utils/analytics'

interface SendPanelProps {
  productName: string
  hasGenerated: boolean
  isExporting: boolean
  onGenerate: () => void
  onDownload: () => void
  /** Righe del riepilogo opzioni (una per gruppo), o null se il prodotto non ha un pannello Opzioni e Prezzo. */
  orderSummaryLines: OrderSummaryLine[] | null
  /** Totale stimato in euro, o null se il prodotto non ha pricing. */
  total: number | null
  /** Note libere inserite dall'utente nel pannello Opzioni e Prezzo. */
  notes: string
  /** Riepilogo già formattato come testo semplice, pronto per email/copia (include anche le note). */
  orderSummaryText: string | null
  /** Genera il "biglietto preventivo": un'unica immagine (render + riepilogo + totale) pensata per Instagram. */
  onGenerateQuoteCard: () => void
  isGeneratingQuoteCard: boolean
}

/**
 * Pannello sempre visibile non appena il collage ha almeno un'immagine:
 * mostra il riepilogo dell'ordine (se il prodotto ha un pannello Opzioni e
 * Prezzo) e spiega come far arrivare l'idea a RetroAvia. La gestione delle
 * immagini (quante, quali, come disposte) vive interamente nel pannello
 * "Immagine" del toolbar qui sopra: il render generato al passaggio 1
 * contiene già l'intero collage composto insieme.
 *
 * Trattandosi di un sito 100% statico (senza alcun server dietro), non è
 * possibile allegare automaticamente un file a un'email o precompilare il
 * testo di un messaggio Instagram: per l'email il riepilogo viene incluso
 * direttamente nel corpo del messaggio; per Instagram offriamo un
 * "biglietto preventivo" — un'unica immagine con foto + riepilogo + totale —
 * così basta allegare UN file, invece di dover anche copiare un testo a
 * parte (vedi `utils/exportQuoteCard.ts`).
 */
export default function SendPanel({
  productName,
  hasGenerated,
  isExporting,
  onGenerate,
  onDownload,
  orderSummaryLines,
  total,
  notes,
  orderSummaryText,
  onGenerateQuoteCard,
  isGeneratingQuoteCard,
}: SendPanelProps) {
  const { t, locale } = useLanguage()
  const [copied, setCopied] = useState(false)
  const mailtoHref = buildMailtoHref(productName, orderSummaryText ?? undefined)
  const instagramHref = buildInstagramDmHref()
  const animatedTotal = useAnimatedNumber(total ?? 0)

  const handleCopySummary = async () => {
    playClick()
    if (!orderSummaryText) return
    try {
      await navigator.clipboard.writeText(orderSummaryText)
      setCopied(true)
      trackEvent('summary_copied', { product: productName })
      setTimeout(() => setCopied(false), 2500)
    } catch {
      // La clipboard è solo una comodità: se non è disponibile, l'utente può comunque leggere il riepilogo qui sotto.
    }
  }

  return (
    <div className="flex flex-col gap-5 rounded-3xl border border-border bg-surface p-5 shadow-xl sm:p-6">
      <div>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-muted">{t('sendPanel.heading')}</h2>
        <p className="mt-2 text-sm leading-relaxed text-ink-muted">{t('sendPanel.description')}</p>
      </div>

      {orderSummaryLines && orderSummaryLines.length > 0 && (
        <div className="rounded-2xl border border-border bg-surface-2 p-4">
          <p className="flex items-center gap-2 text-sm font-medium text-ink">
            <span aria-hidden="true">🧾</span>
            {t('sendPanel.orderSummaryHeading')}
          </p>
          <ul className="mt-3 flex flex-col gap-1.5">
            {orderSummaryLines.map((line) => (
              <li key={line.groupTitle} className="flex items-center justify-between gap-3 text-xs">
                <span className="min-w-0 truncate text-ink-muted">{line.groupTitle}</span>
                <span className="shrink-0 text-right font-medium text-ink">
                  {line.optionLabel}
                  <span className="ml-1.5 font-mono text-ink-muted">{formatPriceDelta(line.priceDelta, locale)}</span>
                </span>
              </li>
            ))}
          </ul>
          {notes.trim() && (
            <p className="mt-3 border-t border-border pt-3 text-xs leading-relaxed text-ink-muted">
              <span className="font-medium text-ink">{t('sendPanel.notesPrefix')}</span>
              {notes.trim()}
            </p>
          )}
          {total !== null && (
            <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
              <span className="text-sm font-bold text-ink">{t('sendPanel.totalLabel')}</span>
              <span className="font-mono text-lg font-extrabold text-accent">{formatTotal(animatedTotal, locale)}</span>
            </div>
          )}
        </div>
      )}

      {/* Passaggio 1: genera il render */}
      <div className="rounded-2xl border border-border bg-surface-2 p-4">
        <p className="text-sm font-medium text-ink">{t('sendPanel.step1Heading')}</p>
        <p className="mt-1 text-xs text-ink-muted">{t('sendPanel.step1Description')}</p>
        <button
          type="button"
          onClick={() => {
            playClick()
            onGenerate()
          }}
          disabled={isExporting}
          className="mt-3 inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-primary/20 transition-all hover:brightness-110 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-60"
          style={{ backgroundImage: 'linear-gradient(90deg, #c1272d, #e8b04b)' }}
        >
          {isExporting ? (
            t('sendPanel.generating')
          ) : (
            <>
              <span aria-hidden="true">📨</span>
              {hasGenerated ? t('sendPanel.regenerate') : t('sendPanel.generateAndDownload')}
            </>
          )}
        </button>
        {hasGenerated && !isExporting && (
          <p className="animate-gentle-pop mt-2 text-xs font-medium text-success">{t('sendPanel.downloadedConfirm')}</p>
        )}
      </div>

      {/* Passaggio 2: invio */}
      <div className="rounded-2xl border border-border bg-surface-2 p-4">
        <p className="text-sm font-medium text-ink">{t('sendPanel.step2Heading')}</p>
        <p className="mt-1 text-xs text-ink-muted">{t('sendPanel.step2Description')}</p>

        <button
          type="button"
          onClick={() => {
            playClick()
            onDownload()
          }}
          disabled={!hasGenerated}
          className="mt-3 inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-surface px-4 py-2.5 text-sm font-semibold text-ink transition-colors hover:border-primary/60 disabled:pointer-events-none disabled:opacity-40"
        >
          <span aria-hidden="true">⬇️</span>
          {t('sendPanel.downloadAgain')}
        </button>

        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <a
            href={mailtoHref}
            onClick={() => {
              playClick()
              trackEvent('email_send_clicked', { product: productName })
            }}
            className="inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold text-white shadow-lg shadow-primary/20 transition-all hover:brightness-110 active:scale-[0.98]"
            style={{ backgroundImage: 'linear-gradient(90deg, #c1272d, #e8b04b)' }}
          >
            <span aria-hidden="true">✉️</span>
            {t('sendPanel.sendEmail')}
          </a>
          <a
            href={instagramHref}
            target="_blank"
            rel="noreferrer"
            onClick={() => {
              playClick()
              trackEvent('instagram_send_clicked', { product: productName })
            }}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-surface-2 px-4 py-3 text-sm font-bold text-ink transition-all hover:border-primary/60 active:scale-[0.98]"
          >
            <InstagramIcon className="h-4 w-4" />
            {t('sendPanel.sendInstagram')}
          </a>
        </div>

        {orderSummaryLines && (
          <div className="mt-3 rounded-xl border border-dashed border-accent/40 bg-accent/5 p-3">
            <p className="flex items-center gap-1.5 text-xs font-semibold text-ink">
              <span aria-hidden="true">🎟️</span>
              {t('sendPanel.instagramRecommended')}
            </p>
            <p className="mt-1 text-xs leading-relaxed text-ink-muted">{t('sendPanel.instagramRecommendedDescription')}</p>
            <button
              type="button"
              onClick={() => {
                playClick()
                onGenerateQuoteCard()
              }}
              disabled={!hasGenerated || isGeneratingQuoteCard}
              className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-accent/50 bg-page px-4 py-2.5 text-sm font-bold text-accent transition-colors hover:bg-accent/10 disabled:pointer-events-none disabled:opacity-40"
            >
              <span aria-hidden="true">🖼️</span>
              {isGeneratingQuoteCard ? t('sendPanel.generatingQuoteCard') : t('sendPanel.generateQuoteCard')}
            </button>
            {!hasGenerated && (
              <p className="mt-1.5 text-[11px] text-ink-muted">{t('sendPanel.generateQuoteCardHint')}</p>
            )}
          </div>
        )}

        {orderSummaryText && (
          <button
            type="button"
            onClick={handleCopySummary}
            className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-border px-4 py-2.5 text-xs font-semibold text-ink-muted transition-colors hover:border-primary/60 hover:text-ink"
          >
            <span aria-hidden="true">{copied ? '✅' : '📋'}</span>
            {copied ? t('sendPanel.copiedSummary') : t('sendPanel.copySummary')}
          </button>
        )}

        <p className="mt-3 text-center text-xs text-ink-muted">
          {t('sendPanel.noOpenFooter')}{' '}
          <a href={RETROAVIA_INSTAGRAM_PROFILE} target="_blank" rel="noreferrer" className="underline hover:text-accent">
            {t('sendPanel.noOpenFooterLink')}
          </a>
          .
        </p>
      </div>
    </div>
  )
}
