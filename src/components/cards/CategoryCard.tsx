import { Link } from 'react-router-dom'
import type { CategoryConfig } from '../../types/product'

interface CategoryCardProps {
  category: CategoryConfig
}

export default function CategoryCard({ category }: CategoryCardProps) {
  return (
    <Link
      to={`/${category.slug}`}
      className="group relative overflow-hidden rounded-3xl border border-border bg-surface p-8 shadow-xl transition-all duration-300 hover:-translate-y-1 hover:border-primary/60 hover:shadow-primary/10"
    >
      <div
        aria-hidden="true"
        className="absolute -right-8 -top-8 h-32 w-32 rounded-full opacity-0 blur-2xl transition-opacity duration-300 group-hover:opacity-100"
        style={{ backgroundImage: 'linear-gradient(135deg, rgba(193,39,45,0.30), rgba(232,176,75,0.20))' }}
      />
      <span aria-hidden="true" className="mb-4 block text-5xl">
        {category.icon}
      </span>
      <h2 className="text-xl font-bold text-ink">{category.name}</h2>
      <p className="mt-2 text-sm leading-relaxed text-ink-muted">{category.description}</p>
      <span className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-accent transition-transform duration-300 group-hover:translate-x-1">
        Esplora
        <span aria-hidden="true">→</span>
      </span>
    </Link>
  )
}
