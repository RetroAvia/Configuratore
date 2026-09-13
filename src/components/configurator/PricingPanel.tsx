import { useState } from 'react'
import type { CSSProperties } from 'react'
import type { ProductPricing } from '../../types/product'
import type { PricingSelections } from '../../utils/pricing'
import { computeTotal, formatPriceDelta, formatTotal } from '../../utils/pricing'
import { playClick } from '../../utils/sound'
import { useAnimatedNumber } from '../../hooks/useAnimatedNumber'
import { useLanguage } from '../../i18n/LanguageContext'
import InfoTooltip from './InfoTooltip'

interface PricingPanelProps {
  pricing: ProductPricing
  selections: PricingSelections
  onSelect: (groupId: string, optionId: string) => void
  notes: string
  onNotesChange: (value: string) => void
  /** True se le scelte correnti provengono da una bozza salvata automaticamente (vedi `utils/pricingStorage.ts`), per mostrare un piccolo avviso. */
  draftRestored?: boolean
  /** Azzera la bozza e riparte dalle opzioni di default. */
  onDiscardDraft?: () => void
}

/**
 * Pallino colore mostrato al posto dell'emoji per i gruppi "colore" (scocca,
 * pulsanti). Le finiture trasparenti (`translucent`) usano un piccolo
 * effetto "vetro" ottenuto solo via CSS (vedi `.swatch-glass` in
 * `index.css`): gradiente + riflesso + ombra interna, senza bisogno di una
 * foto reale per ogni singola finitura.
 */
function ColorSwatch({ color, translucent }: { color: string; translucent?: boolean }) {
  if (translucent) {
    return (
      <span
        aria-hidden="true"
        className="swatch-glass h-5 w-5 shrink-0 rounded-full"
        style={{ ['--swatch-color' as string]: color } as CSSProperties}
      />
    )
  }
  return (
    <span
      aria-hidden="true"
      className="h-5 w-5 shrink-0 rounded-full"
      style={{
        backgroundColor: color,
        border: '1.5px solid rgba(255,255,255,0.18)',
        boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.25)',
      }}
    />
  )
}

/**
 * Pannello "Opzioni e Prezzo": un gruppo di riquadri (uno per gruppo di
 * modifiche) che si comportano come radio button — sempre un'opzione
 * selezionata per gruppo — più un campo note libere e una barra con il
 * totale calcolato in tempo reale (animato: vedi `useAnimatedNumber`).
 *
 * Puramente informativo: le scelte non modificano il rendering del canvas
 * (che resta dedicato all'immagine/collage caricato dall'utente), ma
 * alimentano il riepilogo testuale/il biglietto preventivo inviati a
 * RetroAvia via email/Instagram (vedi `SendPanel`, `utils/pricing.ts` e
 * `utils/exportQuoteCard.ts`).
 */
export default function PricingPanel({
  pricing,
  selections,
  onSelect,
  notes,
  onNotesChange,
  draftRestored,
  onDiscardDraft,
}: PricingPanelProps) {
  const { t, tr, locale } = useLanguage()
  const total = computeTotal(pricing, selections)
  const animatedTotal = useAnimatedNumber(total)
  // Traccia l'ultima opzione scelta DALL'UTENTE (non quella selezionata di
  // default al primo render), per far comparire l'anello di conferma solo
  // su un vero cambio, non su ogni riquadro già selezionato al caricamento.
  const [justSelected, setJustSelected] = useState<string | null>(null)

  return (
    <div id="opzioni-e-prezzo" className="flex flex-col gap-5 rounded-3xl border border-border bg-surface p-5 shadow-xl sm:p-6">
      <div>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-muted">{t('pricingPanel.heading')}</h2>
        <p className="mt-2 text-sm leading-relaxed text-ink-muted">{t('pricingPanel.description')}</p>
        {draftRestored && (
          <p className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 rounded-xl border border-accent/30 bg-accent/10 px-3 py-2 text-xs text-ink">
            <span aria-hidden="true">↺</span>
            {t('pricingPanel.draftRestored')}
            {onDiscardDraft && (
              <button
                type="button"
                onClick={onDiscardDraft}
                className="font-semibold text-accent underline underline-offset-2 hover:text-ink"
              >
                {t('pricingPanel.discardDraft')}
              </button>
            )}
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {pricing.groups.map((group) => {
          const selectedId = selections[group.id] ?? group.options[0]?.id

          return (
            <div
              key={group.id}
              className={`rounded-2xl border p-4 ${
                group.highlighted ? 'border-success/50 bg-success/5' : 'border-border bg-surface-2'
              }`}
            >
              <div className="flex items-center gap-2">
                <span aria-hidden="true">{group.icon}</span>
                <h3 className={`text-sm font-semibold ${group.highlighted ? 'text-success' : 'text-ink'}`}>
                  {tr(group.title, group.titleI18n)}
                </h3>
                {group.info && <InfoTooltip text={tr(group.info, group.infoI18n)} />}
              </div>
              {group.helperText && (
                <p className="mt-1 text-xs leading-relaxed text-ink-muted">{tr(group.helperText, group.helperTextI18n)}</p>
              )}

              <div className="mt-3 flex flex-col gap-2">
                {group.options.map((option) => {
                  const isSelected = option.id === selectedId
                  return (
                    <label
                      key={option.id}
                      className={`relative flex cursor-pointer items-center justify-between gap-3 overflow-hidden rounded-xl border px-3.5 py-2.5 text-sm transition-colors ${
                        isSelected
                          ? 'border-primary bg-primary/10 text-ink'
                          : 'border-border bg-surface text-ink-muted hover:border-primary/40 hover:text-ink'
                      }`}
                    >
                      {justSelected === `${group.id}:${option.id}` && (
                        <span
                          aria-hidden="true"
                          onAnimationEnd={() => setJustSelected(null)}
                          className="animate-option-select pointer-events-none absolute inset-0 rounded-xl"
                        />
                      )}
                      <span className="flex min-w-0 items-center gap-2.5">
                        <input
                          type="radio"
                          name={group.id}
                          checked={isSelected}
                          onChange={() => {
                            if (!isSelected) {
                              playClick()
                              setJustSelected(`${group.id}:${option.id}`)
                            }
                            onSelect(group.id, option.id)
                          }}
                          className="h-4 w-4 shrink-0 accent-primary"
                        />
                        {option.color ? (
                          <ColorSwatch color={option.color} translucent={option.translucent} />
                        ) : (
                          <span aria-hidden="true">{option.icon}</span>
                        )}
                        <span className="truncate font-medium">
                          {tr(option.label, option.labelI18n)}
                          {option.note && (
                            <span className="ml-1 font-normal text-ink-muted">({tr(option.note, option.noteI18n)})</span>
                          )}
                        </span>
                      </span>
                      <span
                        className={`shrink-0 font-mono text-xs font-semibold ${
                          option.priceDelta >= 0 ? 'text-success' : 'text-accent'
                        }`}
                      >
                        {formatPriceDelta(option.priceDelta, locale)}
                      </span>
                    </label>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>

      <div className="rounded-2xl border border-border bg-surface-2 p-4">
        <label htmlFor="pricing-notes" className="flex items-center gap-2 text-sm font-semibold text-ink">
          <span aria-hidden="true">📝</span>
          {t('pricingPanel.notesLabel')}
        </label>
        <textarea
          id="pricing-notes"
          value={notes}
          onChange={(e) => onNotesChange(e.target.value)}
          placeholder={tr(pricing.notesPlaceholder, pricing.notesPlaceholderI18n)}
          rows={3}
          className="mt-2 w-full resize-none rounded-xl border border-border bg-surface px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-muted focus:outline-none focus-visible:outline-2 focus-visible:outline-accent"
        />
      </div>

      <div
        className="flex items-center justify-between rounded-2xl px-5 py-4 shadow-lg shadow-primary/20"
        style={{ backgroundImage: 'linear-gradient(90deg, #c1272d, #e8b04b)' }}
      >
        <span className="text-sm font-bold uppercase tracking-wide text-white/90">{t('pricingPanel.totalLabel')}</span>
        <span className="font-mono text-2xl font-extrabold text-white">{formatTotal(animatedTotal, locale)}</span>
      </div>
    </div>
  )
}
