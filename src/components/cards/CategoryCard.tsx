import { Link } from 'react-router-dom'
import type { CategoryConfig } from '../../types/product'
import { useLanguage } from '../../i18n/LanguageContext'
import { getProductsByCategory } from '../../data/products'

interface CategoryCardProps {
  category: CategoryConfig
}

/** Stessa sfumatura del brand usata per i badge di HowItWorks, i bottoni principali e l'evidenziazione nell'hero: qui sull'icona rende il riquadro subito più "di prodotto" invece di una semplice emoji fluttuante. */
const BRAND_GRADIENT = 'linear-gradient(135deg, #c1272d, #e8b04b)'

export default function CategoryCard({ category }: CategoryCardProps) {
  const { t, tr } = useLanguage()
  const modelsCount = getProductsByCategory(category.slug).length

  return (
    <Link
      to={`/${category.slug}`}
      className="group relative flex flex-col overflow-hidden rounded-3xl border border-border bg-surface p-7 shadow-lg transition-all duration-500 ease-fluid hover:-translate-y-1.5 hover:border-primary/60 hover:shadow-2xl hover:shadow-primary/10 sm:p-8"
    >
      {/* Alone di colore sempre leggermente visibile (non solo in hover): dà profondità al riquadro anche a riposo, invece di un unico piano di colore piatto. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-10 -top-14 h-44 w-44 rounded-full opacity-[0.14] blur-3xl transition-opacity duration-500 ease-fluid group-hover:opacity-40"
        style={{ backgroundImage: BRAND_GRADIENT }}
      />

      <span
        aria-hidden="true"
        className="mb-5 grid h-16 w-16 shrink-0 place-items-center rounded-2xl text-3xl shadow-lg shadow-primary/20 ring-1 ring-white/10 transition-transform duration-500 ease-fluid group-hover:scale-105 group-hover:-rotate-3"
        style={{ backgroundImage: BRAND_GRADIENT }}
      >
        {category.icon}
      </span>

      <h2 className="text-xl font-bold text-ink">{tr(category.name, category.nameI18n)}</h2>
      <p className="mt-2 flex-1 text-sm leading-relaxed text-ink-muted">
        {tr(category.description, category.descriptionI18n)}
      </p>

      <div className="mt-6 flex items-center justify-between border-t border-border/70 pt-4">
        <span className="text-xs font-medium text-ink-muted">{t('categoryCard.modelsCount', { count: modelsCount })}</span>
        <span className="inline-flex items-center gap-1 text-sm font-semibold text-accent transition-transform duration-500 ease-fluid group-hover:translate-x-1.5">
          {t('categoryCard.explore')}
          <span aria-hidden="true">→</span>
        </span>
      </div>
    </Link>
  )
}
