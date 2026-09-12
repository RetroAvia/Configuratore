import type { ClipShape } from '../types/product'
import { getClipAreaBounds, getClipAreaCenter } from '../utils/clipShapes'

/** Stato di posizionamento di uno strato immagine nel configuratore, in pixel/gradi del canvas nativo. */
export interface ImageTransform {
  /** Coordinata X del centro dell'immagine. */
  x: number
  /** Coordinata Y del centro dell'immagine. */
  y: number
  /** Fattore di scala applicato alla dimensione naturale dell'immagine. */
  scale: number
  /** Rotazione, in gradi. */
  rotation: number
}

export const MIN_SCALE = 0.05
export const MAX_SCALE = 8

export function clampScale(scale: number): number {
  return Math.min(MAX_SCALE, Math.max(MIN_SCALE, scale))
}

/** Normalizza un angolo in gradi nell'intervallo (-180, 180], più leggibile in UI. */
export function normalizeRotation(rotation: number): number {
  let normalized = rotation % 360
  if (normalized > 180) normalized -= 360
  if (normalized <= -180) normalized += 360
  return normalized
}

/**
 * Calcola la trasformazione che copre interamente la clip area ("cover
 * fit"): l'immagine viene centrata e scalata al minimo necessario per
 * riempirla senza lasciare spazi vuoti, mantenendo le proporzioni originali.
 *
 * Usata per il PRIMO strato caricato per un prodotto (comportamento più
 * naturale quando c'è una sola immagine: nessuno spazio vuoto attorno) e
 * per "Centra automaticamente"/"Reset" su uno strato già esistente.
 */
export function computeCoverTransform(
  clip: ClipShape,
  naturalWidth: number,
  naturalHeight: number,
  rotation = 0,
): ImageTransform {
  const center = getClipAreaCenter(clip)
  const bounds = getClipAreaBounds(clip)
  const scale = clampScale(Math.max(bounds.width / naturalWidth, bounds.height / naturalHeight))
  return { x: center.x, y: center.y, scale, rotation }
}

/**
 * Calcola una trasformazione di partenza ragionevole per uno strato
 * AGGIUNTIVO (il secondo, il terzo, ...) quando si sta componendo un
 * collage: a differenza di `computeCoverTransform`, non riempie tutta
 * l'area (altrimenti nasconderebbe subito gli strati sottostanti), ma parte
 * più piccola e sfalsata attorno al centro — così ogni nuova immagine è
 * subito visibile e libera di essere trascinata dove serve.
 */
export function computeAdditionalLayerTransform(
  clip: ClipShape,
  naturalWidth: number,
  naturalHeight: number,
  layerIndex: number,
): ImageTransform {
  const center = getClipAreaCenter(clip)
  const bounds = getClipAreaBounds(clip)
  const targetSize = Math.min(bounds.width, bounds.height) * 0.5
  const scale = clampScale(targetSize / Math.max(naturalWidth, naturalHeight))

  // Sfalsamento "a cascata" attorno al centro, diverso per ogni strato
  // successivo, così due immagini aggiunte una dopo l'altra non finiscono
  // esattamente sovrapposte (il che le farebbe sembrare sparite l'una
  // dentro l'altra).
  const angleStep = (Math.PI * 2) / 5
  const angle = (layerIndex - 1) * angleStep
  const radius = Math.min(bounds.width, bounds.height) * 0.16

  return {
    x: center.x + Math.cos(angle) * radius,
    y: center.y + Math.sin(angle) * radius,
    scale,
    rotation: 0,
  }
}
