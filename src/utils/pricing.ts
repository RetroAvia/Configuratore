import type { PriceOptionGroup, ProductPricing } from '../types/product'

/**
 * Motore di calcolo del pannello "Opzioni e Prezzo": legge la configurazione
 * dichiarativa di un prodotto (`ProductPricing`) e le scelte correnti
 * dell'utente e ne ricava prezzo totale, formattazione ed il riepilogo
 * testuale da includere nel messaggio inviato a RetroAvia.
 *
 * Ogni gruppo di opzioni si comporta come un set di radio button: in ogni
 * momento è selezionata esattamente un'opzione per gruppo (`selections`
 * mappa `groupId -> optionId`; se manca una voce si usa la prima opzione del
 * gruppo, che è sempre il valore di default).
 */

/** Scelte correnti dell'utente nel pannello Opzioni e Prezzo: `groupId -> optionId`. */
export type PricingSelections = Record<string, string>

/** Selezioni iniziali: la prima opzione di ogni gruppo (coerente con quella evidenziata di default nell'interfaccia). */
export function getDefaultSelections(pricing: ProductPricing): PricingSelections {
  const selections: PricingSelections = {}
  pricing.groups.forEach((group) => {
    const first = group.options[0]
    if (first) selections[group.id] = first.id
  })
  return selections
}

function resolveSelectedOption(group: PriceOptionGroup, selections: PricingSelections) {
  const selectedId = selections[group.id]
  return group.options.find((o) => o.id === selectedId) ?? group.options[0]
}

/** Prezzo totale (in euro) per le selezioni correnti. */
export function computeTotal(pricing: ProductPricing, selections: PricingSelections): number {
  return pricing.groups.reduce((total, group) => {
    const option = resolveSelectedOption(group, selections)
    return total + (option?.priceDelta ?? 0)
  }, pricing.basePrice)
}

/**
 * Prezzo "a partire da" mostrato nelle card prodotto: per ogni gruppo usa la
 * variazione più economica tra quelle NON negative (cioè ignora sconti come
 * "Game Boy fornito dal cliente", che presuppongono una condizione speciale
 * e non vanno confusi con il prezzo di partenza standard).
 */
export function getStartingPrice(pricing: ProductPricing): number {
  return pricing.groups.reduce((total, group) => {
    const nonNegativeDeltas = group.options.map((o) => o.priceDelta).filter((delta) => delta >= 0)
    const min = nonNegativeDeltas.length > 0 ? Math.min(...nonNegativeDeltas) : (group.options[0]?.priceDelta ?? 0)
    return total + min
  }, pricing.basePrice)
}

/** Formatta un importo assoluto in euro secondo le convenzioni italiane (es. 39,90 € oppure 80 €). */
function formatAmount(value: number): string {
  const abs = Math.abs(value)
  const hasCents = Math.round(abs * 100) % 100 !== 0
  return abs.toLocaleString('it-IT', { minimumFractionDigits: hasCents ? 2 : 0, maximumFractionDigits: 2 })
}

/** Formatta un totale assoluto, es. "119,90 €". */
export function formatTotal(value: number): string {
  return `${formatAmount(value)} €`
}

/** Formatta la variazione di prezzo di una singola opzione: "Gratis", "+5 €", "-50 €". */
export function formatPriceDelta(delta: number): string {
  if (delta === 0) return 'Gratis'
  return `${delta > 0 ? '+' : '-'}${formatAmount(delta)} €`
}

/** Una riga del riepilogo ordine: gruppo, opzione scelta e relativa variazione di prezzo. */
export interface OrderSummaryLine {
  groupTitle: string
  optionLabel: string
  optionNote?: string
  priceDelta: number
}

/** Riepilogo leggibile (una riga per gruppo) delle scelte correnti, nello stesso ordine dei gruppi. */
export function buildOrderSummary(pricing: ProductPricing, selections: PricingSelections): OrderSummaryLine[] {
  return pricing.groups.map((group) => {
    const option = resolveSelectedOption(group, selections)
    return {
      groupTitle: group.title,
      optionLabel: option?.label ?? '',
      optionNote: option?.note,
      priceDelta: option?.priceDelta ?? 0,
    }
  })
}

/**
 * Riepilogo come testo semplice (una riga per gruppo + totale), pronto per
 * essere inserito nel corpo dell'email o copiato per Instagram: è l'unico
 * modo per far arrivare a RetroAvia le opzioni scelte dal cliente, dato che
 * il sito è 100% statico e non ha alcun backend/ordine strutturato.
 */
export function formatOrderSummaryText(pricing: ProductPricing, selections: PricingSelections, notes: string): string {
  const lines = buildOrderSummary(pricing, selections)
  const total = computeTotal(pricing, selections)

  const rows = [
    `${pricing.baseLabel}: ${formatTotal(pricing.basePrice)}`,
    ...lines.map((line) => {
      const note = line.optionNote ? ` (${line.optionNote})` : ''
      return `${line.groupTitle}: ${line.optionLabel}${note} — ${formatPriceDelta(line.priceDelta)}`
    }),
    `Totale stimato: ${formatTotal(total)}`,
  ]

  if (notes.trim()) {
    rows.push('', `Note: ${notes.trim()}`)
  }

  return rows.join('\n')
}
