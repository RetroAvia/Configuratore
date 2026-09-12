import type { ProductConfig } from '../types/product'
import type { ImageTransform } from '../hooks/useImageTransform'
import { clipSimpleShape2D } from './clipShapes'

interface RenderCompositeParams {
  product: ProductConfig
  baseImageEl: HTMLImageElement
  userImageEl: HTMLImageElement
  transform: ImageTransform
  overlayImageEl?: HTMLImageElement | null
}

/**
 * Compone l'immagine finale ad alta risoluzione: sfondo del prodotto +
 * immagine dell'utente ritagliata rigorosamente nell'area del quadrante +
 * eventuale livello sopra (es. vetro/riflesso). Tutto avviene su un canvas
 * offscreen, alla risoluzione nativa del prodotto — mai a quella (più bassa)
 * usata per l'anteprima a schermo.
 *
 * Per i prodotti con clip area "compound" (contorno esterno + fori, es. la
 * scocca di una console che deve escludere schermo e pulsanti), l'immagine
 * dell'utente viene ritagliata sul solo CONTORNO ESTERNO, poi per ogni foro
 * si ridisegna sopra un ritaglio della foto originale del prodotto — la
 * stessa identica tecnica usata nell'anteprima dal vivo in
 * `ConfiguratorCanvas`, cosa che garantisce che l'esportazione corrisponda
 * sempre esattamente a quello che si vede nell'editor.
 */
export async function renderProductComposite({
  product,
  baseImageEl,
  userImageEl,
  transform,
  overlayImageEl,
}: RenderCompositeParams): Promise<Blob> {
  const { width, height } = product.canvas
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height

  const ctx = canvas.getContext('2d')
  if (!ctx) {
    throw new Error("Impossibile creare il contesto di disegno per l'esportazione.")
  }

  // 1. Immagine di base del prodotto.
  ctx.drawImage(baseImageEl, 0, 0, width, height)

  // 2. Immagine dell'utente, ritagliata sul contorno esterno del quadrante/scocca.
  const outerShape = product.clipArea.type === 'compound' ? product.clipArea.outer : product.clipArea
  ctx.save()
  clipSimpleShape2D(ctx, outerShape)
  ctx.translate(transform.x, transform.y)
  ctx.rotate((transform.rotation * Math.PI) / 180)
  ctx.scale(transform.scale, transform.scale)
  ctx.drawImage(userImageEl, -userImageEl.naturalWidth / 2, -userImageEl.naturalHeight / 2)
  ctx.restore()

  // 3. Fori (schermo, D-pad, pulsanti...): ridisegnano sopra un ritaglio della
  // foto originale, così l'immagine dell'utente non compare mai lì.
  if (product.clipArea.type === 'compound') {
    for (const hole of product.clipArea.holes) {
      ctx.save()
      clipSimpleShape2D(ctx, hole)
      ctx.drawImage(baseImageEl, 0, 0, width, height)
      ctx.restore()
    }
  }

  // 4. Eventuale livello sopra (es. vetro/riflesso dello schermo), se configurato per il prodotto.
  if (overlayImageEl) {
    ctx.drawImage(overlayImageEl, 0, 0, width, height)
  }

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob)
      else reject(new Error("L'esportazione dell'immagine non è riuscita."))
    }, 'image/png')
  })
}

/** Avvia il download di un Blob nel browser dell'utente, con il nome file indicato. */
export function downloadBlob(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  document.body.appendChild(link)
  link.click()
  link.remove()
  // Rilascia l'URL oggetto dopo un istante, per dare tempo al browser di avviare il download.
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
