import type { CategoryConfig } from '../types/product'

/**
 * Elenco delle categorie di prodotto disponibili nel sito.
 *
 * Per aggiungere una nuova categoria in futuro, aggiungi semplicemente un
 * nuovo oggetto a questo array: la home page e la navigazione si
 * aggiornano automaticamente, senza altre modifiche al codice.
 */
export const categories: CategoryConfig[] = [
  {
    slug: 'orologi',
    name: 'Orologi',
    description: 'Personalizza il quadrante dei tuoi orologi digitali preferiti.',
    icon: '⌚',
    nameI18n: { en: 'Watches', es: 'Relojes', fr: 'Montres' },
    descriptionI18n: {
      en: 'Customize the dial of your favorite digital watches.',
      es: 'Personaliza la esfera de tus relojes digitales favoritos.',
      fr: 'Personnalisez le cadran de vos montres digitales préférées.',
    },
  },
  {
    slug: 'console',
    name: 'Console',
    description: 'Dai un nuovo stile alle tue console portatili preferite.',
    icon: '🎮',
    nameI18n: { en: 'Consoles', es: 'Consolas', fr: 'Consoles' },
    descriptionI18n: {
      en: 'Give your favorite handheld consoles a brand new look.',
      es: 'Dale un nuevo estilo a tus consolas portátiles favoritas.',
      fr: 'Offrez un nouveau look à vos consoles portables préférées.',
    },
  },
]

export function getCategory(slug: string): CategoryConfig | undefined {
  return categories.find((c) => c.slug === slug)
}
