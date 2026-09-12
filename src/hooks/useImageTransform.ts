import { useCallback, useEffect, useState } from 'react'
import type { ClipShape } from '../types/product'
import { getClipAreaBounds, getClipAreaCenter } from '../utils/clipShapes'

/** Stato di posizionamento dell'immagine caricata dall'utente, in pixel/gradi del canvas nativo. */
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

interface LoadedImageInfo {
  /** Identificativo univoco dell'immagine corrente (es. l'object URL): cambia solo quando viene caricata una nuova immagine. */
  key: string
  width: number
  height: number
}

/**
 * Gestisce lo stato di trasformazione (posizione, scala, rotazione)
 * dell'immagine caricata dall'utente all'interno del configuratore.
 *
 * La trasformazione viene ricalcolata automaticamente in "cover fit" ogni
 * volta che viene caricata una nuova immagine (cambio di `image.key`) o
 * quando cambia la clip area del prodotto (es. navigando tra due modelli).
 */
export function useImageTransform(clip: ClipShape, image: LoadedImageInfo | null) {
  const [transform, setTransform] = useState<ImageTransform>(() =>
    image ? computeCoverTransform(clip, image.width, image.height) : { x: 0, y: 0, scale: 1, rotation: 0 },
  )

  useEffect(() => {
    if (image) {
      setTransform(computeCoverTransform(clip, image.width, image.height))
    }
    // Il ricalcolo deve avvenire SOLO quando cambia l'immagine caricata o il
    // prodotto attivo, non ad ogni render (altrimenti si perderebbero le
    // modifiche manuali dell'utente).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [image?.key, clip])

  /** Ripristina la trasformazione iniziale ("cover fit"), azzerando anche la rotazione. */
  const reset = useCallback(() => {
    if (!image) return
    setTransform(computeCoverTransform(clip, image.width, image.height, 0))
  }, [clip, image])

  /** Ricentra e riadatta l'immagine all'area disponibile, mantenendo la rotazione corrente. */
  const centerAndFit = useCallback(() => {
    if (!image) return
    setTransform((current) => computeCoverTransform(clip, image.width, image.height, current.rotation))
  }, [clip, image])

  const setPosition = useCallback((x: number, y: number) => {
    setTransform((current) => ({ ...current, x, y }))
  }, [])

  const translate = useCallback((dx: number, dy: number) => {
    setTransform((current) => ({ ...current, x: current.x + dx, y: current.y + dy }))
  }, [])

  const setScale = useCallback((updater: number | ((scale: number) => number)) => {
    setTransform((current) => {
      const next = typeof updater === 'function' ? updater(current.scale) : updater
      return { ...current, scale: clampScale(next) }
    })
  }, [])

  const setRotation = useCallback((updater: number | ((rotation: number) => number)) => {
    setTransform((current) => {
      const next = typeof updater === 'function' ? updater(current.rotation) : updater
      return { ...current, rotation: normalizeRotation(next) }
    })
  }, [])

  return {
    transform,
    setTransform,
    setPosition,
    translate,
    setScale,
    setRotation,
    reset,
    centerAndFit,
  }
}
