import type { CategoryConfig } from '../types/product'

/**
 * Elenco delle categorie di prodotto disponibili nel sito.
 *
 * Per aggiungere una nuova categoria in futuro, aggiungi semplicemente un
 * nuovo oggetto a questo array: la home page e la navigazione si
 * aggiornano automaticamente, senza altre modifiche al codice.
 *
 * Esempio (quando sarà pronto un modello nella categoria "Console"):
 *
 * {
 *   slug: 'console',
 *   name: 'Console',
 *   description: 'Dai un nuovo stile alle tue console portatili preferite.',
 *   icon: '🎮',
 * }
 */
export const categories: CategoryConfig[] = [
  {
    slug: 'orologi',
    name: 'Orologi',
    description: 'Personalizza il quadrante dei tuoi orologi digitali preferiti.',
    icon: '⌚',
  },
]

export function getCategory(slug: string): CategoryConfig | undefined {
  return categories.find((c) => c.slug === slug)
}
