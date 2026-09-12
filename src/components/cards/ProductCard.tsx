import { Link } from 'react-router-dom'
import type { ProductConfig } from '../../types/product'

interface ProductCardProps {
  product: ProductConfig
}

export default function ProductCard({ product }: ProductCardProps) {
  return (
    <Link
      to={`/${product.categorySlug}/${product.slug}`}
      className="group flex flex-col overflow-hidden rounded-3xl border border-border bg-surface shadow-xl transition-all duration-300 hover:-translate-y-1 hover:border-primary/60 hover:shadow-primary/10"
    >
      <div className="flex aspect-[4/5] items-center justify-center overflow-hidden bg-surface-2 p-6">
        <img
          src={product.thumbnail}
          alt={product.name}
          className="h-full w-full object-contain transition-transform duration-300 group-hover:scale-105"
          loading="lazy"
        />
      </div>
      <div className="flex flex-1 flex-col p-5">
        <h3 className="text-lg font-bold text-ink">{product.name}</h3>
        <p className="mt-1 flex-1 text-sm leading-relaxed text-ink-muted">{product.description}</p>
        <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-accent transition-transform duration-300 group-hover:translate-x-1">
          Personalizza ora
          <span aria-hidden="true">→</span>
        </span>
      </div>
    </Link>
  )
}
