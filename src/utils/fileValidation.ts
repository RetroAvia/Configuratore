const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024 // 20 MB

export class ImageLoadError extends Error {
  code: 'unsupported-type' | 'too-large' | 'decode-error'
  constructor(code: ImageLoadError['code'], message: string) {
    super(message)
    this.code = code
    this.name = 'ImageLoadError'
  }
}

function formatMegabytes(bytes: number): string {
  return (bytes / (1024 * 1024)).toFixed(1)
}

/** Verifica che il file sia un'immagine di un formato/dimensione supportati, lanciando un errore descrittivo altrimenti. */
export function assertValidImageFile(file: File): void {
  if (!ACCEPTED_TYPES.includes(file.type)) {
    throw new ImageLoadError(
      'unsupported-type',
      `Formato non supportato${file.type ? ` (${file.type})` : ''}. Usa un'immagine JPG, PNG o WEBP.`,
    )
  }
  if (file.size > MAX_FILE_SIZE_BYTES) {
    throw new ImageLoadError(
      'too-large',
      `Il file è troppo grande (${formatMegabytes(file.size)} MB). Il limite è ${formatMegabytes(MAX_FILE_SIZE_BYTES)} MB.`,
    )
  }
}

export interface LoadedFileImage {
  element: HTMLImageElement
  /** URL oggetto locale (blob:) — va rilasciato con URL.revokeObjectURL quando non serve più. */
  url: string
  width: number
  height: number
}

/**
 * Carica un file immagine nel browser (senza mai inviarlo altrove) e ne
 * restituisce l'elemento `<img>` decodificato, pronto per essere disegnato
 * su canvas o mostrato a schermo.
 */
export function loadImageFromFile(file: File): Promise<LoadedFileImage> {
  return new Promise((resolve, reject) => {
    // La validazione DEVE avvenire dentro l'esecutore della Promise: se
    // `assertValidImageFile` lanciasse fuori da qui, l'errore uscirebbe come
    // eccezione sincrona invece che come rifiuto della Promise, e i
    // `.catch(...)` di chi chiama questa funzione non lo intercetterebbero
    // mai (un formato non supportato o un file troppo grande farebbe
    // crashare silenziosamente l'upload invece di mostrare il messaggio
    // d'errore previsto).
    try {
      assertValidImageFile(file)
    } catch (err) {
      reject(err)
      return
    }

    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      resolve({ element: img, url, width: img.naturalWidth, height: img.naturalHeight })
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(
        new ImageLoadError(
          'decode-error',
          "Impossibile leggere questa immagine: il file potrebbe essere danneggiato o non è realmente un'immagine.",
        ),
      )
    }
    img.src = url
  })
}
