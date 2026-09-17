import type { OptionRequirement, PriceOptionGroup, PriceOptionValue, ProductPricing } from '../types/product'
import type { Locale } from '../i18n/locale'
import { tr } from '../i18n/locale'
import type { ContactInfo } from '../types/order'
import { hasContact, normalizeInstagramHandle } from '../types/order'

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
 *
 * Alcune opzioni sono disponibili solo in presenza di certe scelte fatte in
 * altri gruppi (vedi `OptionRequirement` in `types/product.ts`): tutte le
 * funzioni pubbliche di questo file lavorano sempre su selezioni già
 * "risolte" (`resolveSelections`), cioè ripulite da qualunque combinazione
 * impossibile. Questo garantisce che il totale mostrato, il riepilogo a
 * schermo e il testo inviato a RetroAvia raccontino sempre la stessa cosa,
 * e che non venga mai proposto un preventivo non realizzabile.
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

// ─── Disponibilità delle opzioni ────────────────────────────────────────────

/** True se la condizione è soddisfatta dalle selezioni correnti (basta una delle opzioni elencate). */
export function isRequirementMet(requirement: OptionRequirement, selections: PricingSelections): boolean {
  const selected = selections[requirement.groupId]
  if (!selected) return false
  return requirement.optionIds.includes(selected)
}

/** Condizioni NON soddisfatte per un'opzione o un gruppo: serve anche a spiegare all'utente il perché della disattivazione. */
export function getUnmetRequirements(
  item: { requires?: OptionRequirement[] },
  selections: PricingSelections,
): OptionRequirement[] {
  if (!item.requires || item.requires.length === 0) return []
  return item.requires.filter((requirement) => !isRequirementMet(requirement, selections))
}

/** True se l'intero gruppo è selezionabile con le scelte correnti. */
export function isGroupAvailable(group: PriceOptionGroup, selections: PricingSelections): boolean {
  return getUnmetRequirements(group, selections).length === 0
}

/** True se la singola opzione è selezionabile con le scelte correnti (il gruppo che la contiene dev'essere a sua volta disponibile). */
export function isOptionAvailable(
  group: PriceOptionGroup,
  option: PriceOptionValue,
  selections: PricingSelections,
): boolean {
  if (!isGroupAvailable(group, selections)) return false
  return getUnmetRequirements(option, selections).length === 0
}

/** Descrizione leggibile di una condizione non soddisfatta, già tradotta: serve a spiegare all'utente PERCHÉ un'opzione è disattivata. */
export interface RequirementDescription {
  groupTitle: string
  optionLabels: string[]
}

/**
 * Traduce una condizione tecnica (`{ groupId, optionIds }`) in qualcosa di
 * comprensibile — "Livello di Modifica: Con scocca semplice o Con scocca
 * personalizzata" — leggendo titoli ed etichette reali dal prodotto. Se il
 * gruppo citato non esiste (dato incoerente) restituisce `null`, così
 * l'interfaccia non mostra mai una spiegazione vuota o a metà.
 */
export function describeRequirement(
  pricing: ProductPricing,
  requirement: OptionRequirement,
  locale: Locale = 'it',
): RequirementDescription | null {
  const group = pricing.groups.find((candidate) => candidate.id === requirement.groupId)
  if (!group) return null

  const optionLabels = requirement.optionIds
    .map((id) => group.options.find((option) => option.id === id))
    .filter((option): option is PriceOptionValue => option !== undefined)
    .map((option) => tr(option.label, option.labelI18n, locale))

  if (optionLabels.length === 0) return null
  return { groupTitle: tr(group.title, group.titleI18n, locale), optionLabels }
}

/**
 * Riporta le selezioni a uno stato sempre coerente:
 *
 *  - un gruppo non disponibile torna alla sua prima opzione (che per
 *    costruzione è sempre quella neutra, a costo zero);
 *  - un'opzione selezionata ma non più disponibile viene sostituita dalla
 *    prima opzione disponibile del suo gruppo;
 *  - una selezione mancante o riferita a un'opzione inesistente viene
 *    riportata al default.
 *
 * Si ripete finché nulla cambia (con un tetto di sicurezza sul numero di
 * passaggi), perché correggere un gruppo può rendere non disponibile un
 * gruppo che dipende da quest'ultimo.
 */
export function resolveSelections(pricing: ProductPricing, selections: PricingSelections): PricingSelections {
  const resolved: PricingSelections = { ...selections }

  // Al massimo un passaggio per gruppo più uno: oltre non può esserci nessuna
  // catena di dipendenze ancora da propagare (e una configurazione con una
  // dipendenza circolare si ferma comunque, invece di ciclare all'infinito).
  const maxPasses = pricing.groups.length + 1

  for (let pass = 0; pass < maxPasses; pass++) {
    let changed = false

    for (const group of pricing.groups) {
      const fallbackId = group.options[0]?.id
      if (fallbackId === undefined) continue

      let next: string
      if (!isGroupAvailable(group, resolved)) {
        next = fallbackId
      } else {
        const current = group.options.find((option) => option.id === resolved[group.id])
        if (current && isOptionAvailable(group, current, resolved)) {
          next = current.id
        } else {
          next = (group.options.find((option) => isOptionAvailable(group, option, resolved)) ?? group.options[0]).id
        }
      }

      if (resolved[group.id] !== next) {
        resolved[group.id] = next
        changed = true
      }
    }

    if (!changed) break
  }

  return resolved
}

/**
 * Ripulisce selezioni di provenienza esterna (bozza salvata in locale, link
 * condiviso) tenendo solo gruppi e opzioni che esistono davvero nella
 * configurazione attuale del prodotto, e riportando poi il tutto a uno stato
 * coerente. Una bozza vecchia o un link manomesso non possono quindi mai
 * mandare il configuratore in uno stato incoerente.
 */
export function sanitizeSelections(pricing: ProductPricing, raw: PricingSelections | undefined | null): PricingSelections {
  const cleaned: PricingSelections = {}
  pricing.groups.forEach((group) => {
    const candidate = raw?.[group.id]
    const exists = candidate !== undefined && group.options.some((option) => option.id === candidate)
    const fallback = group.options[0]?.id
    if (exists) cleaned[group.id] = candidate
    else if (fallback !== undefined) cleaned[group.id] = fallback
  })
  return resolveSelections(pricing, cleaned)
}

function resolveSelectedOption(group: PriceOptionGroup, selections: PricingSelections) {
  const selectedId = selections[group.id]
  return group.options.find((o) => o.id === selectedId) ?? group.options[0]
}

// ─── Prezzi ─────────────────────────────────────────────────────────────────

/** Prezzo totale (in euro) per le selezioni correnti, già rese coerenti. */
export function computeTotal(pricing: ProductPricing, selections: PricingSelections): number {
  const resolved = resolveSelections(pricing, selections)
  return pricing.groups.reduce((total, group) => {
    const option = resolveSelectedOption(group, resolved)
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

/**
 * Prezzo massimo raggiungibile scegliendo ovunque l'opzione più costosa:
 * usato SOLO nei dati strutturati Schema.org (`AggregateOffer`), per
 * dichiarare a Google un intervallo di prezzo onesto invece di un singolo
 * valore minimo che quasi nessun ordine reale rispetta.
 */
export function getMaxPrice(pricing: ProductPricing): number {
  return pricing.groups.reduce((total, group) => {
    const deltas = group.options.map((o) => o.priceDelta)
    return total + (deltas.length > 0 ? Math.max(...deltas) : 0)
  }, pricing.basePrice)
}

/** Convenzioni di formattazione numerica per lingua (separatore decimale, raggruppamento cifre). La valuta resta sempre l'euro: RetroAvia è un'attività italiana, cambia solo la lingua di chi guarda, non la valuta. */
const NUMBER_LOCALES: Record<Locale, string> = { it: 'it-IT', en: 'en-GB', es: 'es-ES', fr: 'fr-FR' }

/** "Gratis"/"Free"/"Gratis"/"Gratuit" per un'opzione a costo zero: unica parola del motore prezzi che dipende dalla lingua invece che restare fissa in italiano (le altre restano italiane di proposito, vedi `formatOrderSummaryText`). */
const FREE_LABEL: Record<Locale, string> = { it: 'Gratis', en: 'Free', es: 'Gratis', fr: 'Gratuit' }

/**
 * Formatta un importo assoluto in euro secondo le convenzioni della lingua
 * indicata (es. "39,90 €" in italiano, "39.90 €" in inglese). Il parametro
 * `locale` è opzionale e di default resta `'it'`: così il riepilogo testuale
 * inviato a RetroAvia via email/Instagram (`formatOrderSummaryText`, che non
 * lo passa mai) resta sempre in italiano, indipendentemente dalla lingua
 * scelta dal cliente per navigare il sito.
 */
function formatAmount(value: number, locale: Locale = 'it'): string {
  const abs = Math.abs(value)
  const hasCents = Math.round(abs * 100) % 100 !== 0
  return abs.toLocaleString(NUMBER_LOCALES[locale], { minimumFractionDigits: hasCents ? 2 : 0, maximumFractionDigits: 2 })
}

/** Formatta un totale assoluto, es. "119,90 €" (o l'equivalente nella lingua indicata). */
export function formatTotal(value: number, locale: Locale = 'it'): string {
  return `${formatAmount(value, locale)} €`
}

/** Formatta la variazione di prezzo di una singola opzione: "Gratis", "+5 €", "-50 €" (o l'equivalente nella lingua indicata). */
export function formatPriceDelta(delta: number, locale: Locale = 'it'): string {
  if (delta === 0) return FREE_LABEL[locale]
  return `${delta > 0 ? '+' : '-'}${formatAmount(delta, locale)} €`
}

// ─── Riepilogo ──────────────────────────────────────────────────────────────

/** Una riga del riepilogo ordine: gruppo, opzione scelta e relativa variazione di prezzo. */
export interface OrderSummaryLine {
  /** Id del gruppo: identificativo stabile, usato come chiave nelle liste (i titoli possono ripetersi o cambiare con la lingua). */
  groupId: string
  groupTitle: string
  optionLabel: string
  optionNote?: string
  priceDelta: number
}

/**
 * Riepilogo leggibile (una riga per gruppo) delle scelte correnti, nello
 * stesso ordine dei gruppi. Il parametro `locale` è opzionale e di default
 * resta `'it'`: passato esplicitamente (es. dal pannello "Riepilogo ordine"
 * mostrato a schermo) traduce titoli/etichette per il cliente; se omesso
 * (come fa `formatOrderSummaryText` qui sotto) il testo resta in italiano,
 * dato che quel riepilogo è indirizzato a RetroAvia via email/Instagram.
 */
export function buildOrderSummary(
  pricing: ProductPricing,
  selections: PricingSelections,
  locale: Locale = 'it',
): OrderSummaryLine[] {
  const resolved = resolveSelections(pricing, selections)
  return pricing.groups.map((group) => {
    const option = resolveSelectedOption(group, resolved)
    return {
      groupId: group.id,
      groupTitle: tr(group.title, group.titleI18n, locale),
      optionLabel: option ? tr(option.label, option.labelI18n, locale) : '',
      optionNote: option?.note !== undefined ? tr(option.note, option.noteI18n, locale) : undefined,
      priceDelta: option?.priceDelta ?? 0,
    }
  })
}

/** Informazioni aggiuntive incluse nel messaggio inviato a RetroAvia, tutte facoltative. */
export interface OrderTextExtras {
  /** Codice breve della richiesta (vedi `utils/shareConfig.ts`), per ritrovarla nelle conversazioni. */
  orderCode?: string
  /** Link che riapre il configuratore su questa esatta configurazione. */
  configUrl?: string
  /** Dati di contatto inseriti dal cliente. */
  contact?: ContactInfo
}

/**
 * Riepilogo come testo semplice (una riga per gruppo + totale), pronto per
 * essere inserito nel corpo dell'email, in un messaggio WhatsApp o copiato
 * per Instagram.
 *
 * Include, quando disponibili, il codice della richiesta e il link che
 * riapre l'esatta configurazione: sono i due elementi che permettono a
 * RetroAvia di ricostruire e modificare un preventivo senza dover chiedere
 * di nuovo tutto al cliente.
 */
export function formatOrderSummaryText(
  pricing: ProductPricing,
  selections: PricingSelections,
  notes: string,
  extras: OrderTextExtras = {},
): string {
  const lines = buildOrderSummary(pricing, selections)
  const total = computeTotal(pricing, selections)

  const rows: string[] = []

  if (extras.orderCode) rows.push(`Richiesta ${extras.orderCode}`, '')

  rows.push(
    `${pricing.baseLabel}: ${formatTotal(pricing.basePrice)}`,
    ...lines.map((line) => {
      const note = line.optionNote ? ` (${line.optionNote})` : ''
      return `${line.groupTitle}: ${line.optionLabel}${note} — ${formatPriceDelta(line.priceDelta)}`
    }),
    `Totale stimato: ${formatTotal(total)}`,
  )

  if (notes.trim()) {
    rows.push('', `Note: ${notes.trim()}`)
  }

  if (hasContact(extras.contact) && extras.contact) {
    const contactRows: string[] = []
    if (extras.contact.name.trim()) contactRows.push(`Nome: ${extras.contact.name.trim()}`)
    if (extras.contact.email.trim()) contactRows.push(`Email: ${extras.contact.email.trim()}`)
    const handle = normalizeInstagramHandle(extras.contact.instagram)
    if (handle) contactRows.push(`Instagram: @${handle}`)
    if (contactRows.length > 0) rows.push('', 'Contatti:', ...contactRows)
  }

  if (extras.configUrl) {
    rows.push('', 'Apri questa configurazione:', extras.configUrl)
  }

  return rows.join('\n')
}
