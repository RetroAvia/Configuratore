import { categories } from '../data/categories'
import CategoryCard from '../components/cards/CategoryCard'

export default function HomePage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
      <div className="mx-auto max-w-2xl text-center">
        <span className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-accent">
          100% nel tuo browser · nessun upload su server
        </span>
        <h1 className="mt-6 text-4xl font-extrabold tracking-tight text-ink sm:text-5xl">
          Rendi unico il tuo{' '}
          <span
            className="bg-clip-text text-transparent"
            style={{ backgroundImage: 'linear-gradient(90deg, #c1272d, #e8b04b)' }}
          >
            gadget preferito
          </span>
        </h1>
        <p className="mt-5 text-lg leading-relaxed text-ink-muted">
          Carica una tua immagine, posizionala con precisione e scarica il risultato: gratis, veloce e
          senza installare nulla.
        </p>
      </div>

      <div className="mt-16">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-muted">Scegli una categoria</h2>
        <div className="mt-4 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((category) => (
            <CategoryCard key={category.slug} category={category} />
          ))}
        </div>
      </div>
    </div>
  )
}
