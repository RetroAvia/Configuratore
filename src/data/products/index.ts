import type { ProductConfig } from '../../types/product'
import { casioF91w } from './casio-f91w'

/**
 * Elenco di tutti i prodotti configurabili disponibili nel sito.
 *
 * Per aggiungere un nuovo modello in futuro (un altro Casio, il Game Boy
 * Advance SP, ecc.):
 *
 *  1. Crea un nuovo file in questa cartella (es. `casio-a168.ts`) che esporti
 *     un oggetto `ProductConfig` — usa `casio-f91w.ts` come esempio/modello.
 *  2. Importalo e aggiungilo all'array `allProducts` qui sotto.
 *  3. Aggiungi le immagini necessarie in `public/products/<slug>/`.
 *
 * Non serve modificare nessun'altra parte del codice: pagine, router e
 * motore di editing leggono tutto da qui in modo generico.
 */
export const allProducts: ProductConfig[] = [casioF91w]

export function getProductsByCategory(categorySlug: string): ProductConfig[] {
  return allProducts.filter((product) => product.categorySlug === categorySlug)
}

export function getProduct(categorySlug: string, slug: string): ProductConfig | undefined {
  return allProducts.find((product) => product.categorySlug === categorySlug && product.slug === slug)
}
