import type { PricingSelections } from './pricing'
import type { ContactInfo } from '../types/order'
import { EMPTY_CONTACT } from '../types/order'

const STORAGE_PREFIX = 'retroavia-lab:pricing-draft:'
/** Le bozze più vecchie di così vengono ignorate: evita di far ripescare scelte ormai dimenticate da mesi. */
const MAX_DRAFT_AGE_MS = 30 * 24 * 60 * 60 * 1000

interface StoredDraft {
  selections: PricingSelections
  notes: string
  /** Contatti facoltativi, così non vanno riscritti a ogni visita. Restano solo su questo dispositivo. */
  contact?: ContactInfo
  savedAt: number
}

function storageKey(categorySlug: string, modelSlug: string): string {
  return `${STORAGE_PREFIX}${categorySlug}/${modelSlug}`
}

export interface PricingDraft {
  selections: PricingSelections
  notes: string
  contact: ContactInfo
}

/**
 * Salvataggio automatico (solo scelte del pannello Opzioni e Prezzo + note,
 * MAI le immagini caricate/il collage: sarebbero troppo pesanti per
 * localStorage) — così se la pagina si ricarica per sbaglio dopo che il
 * cliente ha già scelto tra gli 11 gruppi di opzioni, non deve ricominciare
 * da capo. `localStorage` può non essere disponibile (modalità privata,
 * quota piena, browser che lo blocca): in quel caso queste funzioni falliscono
 * in silenzio, perché il salvataggio automatico è solo una comodità, mai un
 * requisito.
 */
export function readPricingDraft(categorySlug: string, modelSlug: string): PricingDraft | null {
  try {
    const raw = localStorage.getItem(storageKey(categorySlug, modelSlug))
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<StoredDraft>
    if (!parsed || typeof parsed !== 'object' || typeof parsed.savedAt !== 'number') return null
    if (Date.now() - parsed.savedAt > MAX_DRAFT_AGE_MS) return null
    if (!parsed.selections || typeof parsed.selections !== 'object') return null

    const storedContact = parsed.contact
    const contact: ContactInfo = {
      name: typeof storedContact?.name === 'string' ? storedContact.name : '',
      email: typeof storedContact?.email === 'string' ? storedContact.email : '',
      instagram: typeof storedContact?.instagram === 'string' ? storedContact.instagram : '',
    }

    return {
      selections: parsed.selections as PricingSelections,
      notes: typeof parsed.notes === 'string' ? parsed.notes : '',
      contact,
    }
  } catch {
    return null
  }
}

export function savePricingDraft(
  categorySlug: string,
  modelSlug: string,
  selections: PricingSelections,
  notes: string,
  contact: ContactInfo = EMPTY_CONTACT,
): void {
  try {
    const draft: StoredDraft = { selections, notes, contact, savedAt: Date.now() }
    localStorage.setItem(storageKey(categorySlug, modelSlug), JSON.stringify(draft))
  } catch {
    // Vedi commento sopra: il salvataggio automatico è solo una comodità.
  }
}

export function clearPricingDraft(categorySlug: string, modelSlug: string): void {
  try {
    localStorage.removeItem(storageKey(categorySlug, modelSlug))
  } catch {
    // Vedi commento sopra.
  }
}
