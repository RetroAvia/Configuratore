import { memo, useMemo, useState } from 'react'
import type { CSSProperties } from 'react'
import type { OptionRequirement, ProductPricing } from '../../types/product'
import type { PricingSelections } from '../../utils/pricing'
import {
  computeTotal,
  describeRequirement,
  formatPriceDelta,
  formatTotal,
  getUnmetRequirements,
  isGroupAvailable,
  isOptionAvailable,
  resolveSelections,
} from '../../utils/pricing'
import { playClick } from '../../utils/sound'
import { useAnimatedNumber } from '../../hooks/useAnimatedNumber'
import { useLanguage } from '../../i18n/LanguageContext'
import InfoTooltip from './InfoTooltip'

/** Lunghezza massima delle note libere: vedi il commento sul `maxLength` del campo. */
export const NOTES_MAX_LENGTH = 600

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
function PricingPanel({
  pricing,
  selections,
  onSelect,
  notes,
  onNotesChange,
  draftRestored,
  onDiscardDraft,
}: PricingPanelProps) {
  const { t, tr, locale } = useLanguage()

  // Le selezioni vengono sempre "risolte" prima di essere mostrate: una
  // combinazione impossibile (es. display IPS senza scocca nuova) non deve
  // mai comparire come selezionata, nemmeno per un istante.
  const resolved = useMemo(() => resolveSelections(pricing, selections), [pricing, selections])

  const total = computeTotal(pricing, resolved)
  const animatedTotal = useAnimatedNumber(total)

  /** Spiegazione leggibile del perché un'opzione o un gruppo sono disattivati. */
  const explainRequirements = (requirements: OptionRequirement[]): string | null => {
    const described = requirements
      .map((requirement) => describeRequirement(pricing, requirement, locale))
      .filter((value): value is NonNullable<typeof value> => value !== null)
      .map((value) => `${value.groupTitle}: ${value.optionLabels.join(' / ')}`)
    if (described.length === 0) return null
    return t('pricingPanel.requiresHint', { requirements: described.join(' · ') })
  }
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
          const selectedId = resolved[group.id] ?? group.options[0]?.id
          const groupAvailable = isGroupAvailable(group, resolved)
          const groupReason = groupAvailable ? null : explainRequirements(getUnmetRequirements(group, resolved))
          const groupHintId = `${group.id}-requires`

          return (
            <div
              key={group.id}
              className={`rounded-2xl border p-4 transition-opacity ${
                group.highlighted ? 'border-success/50 bg-success/5' : 'border-border bg-surface-2'
              } ${groupAvailable ? '' : 'opacity-60'}`}
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
              {groupReason && (
                <p id={groupHintId} className="mt-2 rounded-lg border border-border bg-surface px-2.5 py-1.5 text-[11px] leading-relaxed text-ink-muted">
                  <span aria-hidden="true">🔒</span> {groupReason}
                </p>
              )}

              <div className="mt-3 flex flex-col gap-2">
                {group.options.map((option) => {
                  const isSelected = option.id === selectedId
                  const available = isOptionAvailable(group, option, resolved)
                  // Se è l'intero gruppo a non essere disponibile la spiegazione è
                  // già scritta una volta sopra: non la si ripete su ogni riga.
                  const optionReason =
                    available || !groupAvailable ? null : explainRequirements(getUnmetRequirements(option, resolved))
                  const optionHintId = `${group.id}-${option.id}-requires`

                  return (
                    <label
                      key={option.id}
                      title={optionReason ?? undefined}
                      className={`relative flex items-center justify-between gap-3 overflow-hidden rounded-xl border px-3.5 py-2.5 text-sm transition-colors ${
                        available ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'
                      } ${
                        isSelected
                          ? 'border-primary bg-primary/10 text-ink'
                          : available
                            ? 'border-border bg-surface text-ink-muted hover:border-primary/40 hover:text-ink'
                            : 'border-border bg-surface text-ink-muted'
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
                          disabled={!available}
                          aria-describedby={optionReason ? optionHintId : groupReason ? groupHintId : undefined}
                          onChange={() => {
                            if (!available) return
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
                      {optionReason && (
                        <span id={optionHintId} className="sr-only">
                          {optionReason}
                        </span>
                      )}
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
          // Il limite non è estetico: le note finiscono dentro il link "mailto:",
          // e diversi client di posta troncano (o ignorano) gli indirizzi troppo
          // lunghi. Meglio un limite chiaro qui che un'email tagliata a metà.
          maxLength={NOTES_MAX_LENGTH}
          className="mt-2 w-full resize-none rounded-xl border border-border bg-surface px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-muted focus:outline-none focus-visible:outline-2 focus-visible:outline-accent"
        />
        {notes.length > NOTES_MAX_LENGTH * 0.8 && (
          <p className="mt-1.5 text-right text-[11px] text-ink-muted">
            {t('pricingPanel.notesCounter', { used: notes.length, max: NOTES_MAX_LENGTH })}
          </p>
        )}
      </div>

      <div
        className="flex items-center justify-between rounded-2xl px-5 py-4 shadow-lg shadow-primary/20"
        style={{ backgroundImage: 'linear-gradient(90deg, #c1272d, #e8b04b)' }}
      >
        <span className="text-sm font-bold uppercase tracking-wide text-white/90">{t('pricingPanel.totalLabel')}</span>
        {/* `aria-live` fa annunciare il nuovo totale da uno screen reader a ogni
            cambio di opzione: senza, chi non vede lo schermo sceglie alla cieca.
            Il valore annunciato è quello reale, non quello in mezzo all'animazione. */}
        <span className="sr-only" aria-live="polite">
          {formatTotal(total, locale)}
        </span>
        <span aria-hidden="true" className="font-mono text-2xl font-extrabold text-white">
          {formatTotal(animatedTotal, locale)}
        </span>
      </div>
    </div>
  )
}

/**
 * `memo`: durante il trascinamento di un'immagine sul canvas il componente
 * padre si ri-renderizza decine di volte al secondo. Senza questa memoizzazione
 * l'intero pannello (fino a 11 gruppi e una trentina di radio) verrebbe
 * ricalcolato a ogni singolo movimento del dito, con uno scatto ben visibile
 * sui telefoni di fascia media.
 */
export default memo(PricingPanel)
