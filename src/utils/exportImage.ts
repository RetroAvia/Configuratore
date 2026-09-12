import type { ProductConfig } from '../types/product'
import type { ImageTransform } from '../hooks/useImageTransform'
import { clipSimpleShape2D } from './clipShapes'

interface CompositeLayer {
  element: HTMLImageElement
  transform: ImageTransform
}

interface RenderCompositeParams {
  product: ProductConfig
  baseImageEl: HTMLImageElement
  /** Tutti gli strati del collage, nell'ordine in cui vanno disegnati (il primo sotto, l'ultimo sopra). */
  layers: CompositeLayer[]
  overlayImageEl?: HTMLImageElement | null
}

/**
 * Compone l'immagine finale ad alta risoluzione: sfondo del prodotto + TUTTI
 * gli strati del collage dell'utente (uno sopra l'altro, nello stesso
 * ordine dell'anteprima) ritagliati rigorosamente nell'area del
 * quadrante/scocca + eventuale livello sopra (es. vetro/riflesso). Tutto
 * avviene su un canvas offscreen, alla risoluzione nativa del prodotto —
 * mai a quella (più bassa) usata per l'anteprima a schermo.
 *
 * Per i prodotti con clip area "compound" (contorno esterno + fori, es. la
 * scocca di una console che deve escludere schermo e pulsanti), tutti gli
 * strati vengono ritagliati sul solo CONTORNO ESTERNO, poi per ogni foro si
 * ridisegna sopra un ritaglio della foto originale del prodotto — la stessa
 * identica tecnica usata nell'anteprima dal vivo in `ConfiguratorCanvas`,
 * cosa che garantisce che l'esportazione corrisponda sempre esattamente a
 * quello che si vede nell'editor.
 */
export async function renderProductComposite({
  product,
  baseImageEl,
  layers,
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

  // 2. Tutti gli strati del collage, ritagliati sul contorno esterno del
  // quadrante/scocca, nello stesso ordine di sovrapposizione dell'anteprima.
  const outerShape = product.clipArea.type === 'compound' ? product.clipArea.outer : product.clipArea
  ctx.save()
  clipSimpleShape2D(ctx, outerShape)
  for (const layer of layers) {
    ctx.save()
    ctx.translate(layer.transform.x, layer.transform.y)
    ctx.rotate((layer.transform.rotation * Math.PI) / 180)
    ctx.scale(layer.transform.scale, layer.transform.scale)
    ctx.drawImage(layer.element, -layer.element.naturalWidth / 2, -layer.element.naturalHeight / 2)
    ctx.restore()
  }
  ctx.restore()

  // 3. Fori (schermo, D-pad, pulsanti...): ridisegnano sopra un ritaglio della
  // foto originale, così nessuno strato del collage vi compare mai sopra.
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
