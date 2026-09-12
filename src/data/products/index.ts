import type { ProductConfig } from '../../types/product'
import { casioF91w } from './casio-f91w'
import { casioA158w } from './casio-a158w'
import { gbaSp } from './gba-sp'
import { gbaColor } from './gba-color'
import { gbaAdvance } from './gba-advance'

/**
 * Elenco di tutti i prodotti configurabili disponibili nel sito.
 *
 * Per aggiungere un nuovo modello in futuro:
 *
 *  1. Crea un nuovo file in questa cartella (es. `casio-a168.ts`) che esporti
 *     un oggetto `ProductConfig` — usa uno dei file esistenti come esempio.
 *  2. Importalo e aggiungilo all'array `allProducts` qui sotto.
 *  3. Aggiungi le immagini necessarie in `public/products/<slug>/`.
 *
 * Non serve modificare nessun'altra parte del codice: pagine, router e
 * motore di editing leggono tutto da qui in modo generico.
 */
export const allProducts: ProductConfig[] = [casioF91w, casioA158w, gbaSp, gbaColor, gbaAdvance]

export function getProductsByCategory(categorySlug: string): ProductConfig[] {
  return allProducts.filter((product) => product.categorySlug === categorySlug)
}

export function getProduct(categorySlug: string, slug: string): ProductConfig | undefined {
  return allProducts.find((product) => product.categorySlug === categorySlug && product.slug === slug)
}
