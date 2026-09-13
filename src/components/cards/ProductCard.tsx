import { Link } from 'react-router-dom'
import type { ProductConfig } from '../../types/product'
import { formatTotal, getStartingPrice } from '../../utils/pricing'
import { useLanguage } from '../../i18n/LanguageContext'

interface ProductCardProps {
  product: ProductConfig
}

export default function ProductCard({ product }: ProductCardProps) {
  const { t, tr, locale } = useLanguage()
  const startingPrice = product.pricing ? getStartingPrice(product.pricing) : null

  return (
    <Link
      to={`/${product.categorySlug}/${product.slug}`}
      className="group flex flex-col overflow-hidden rounded-3xl border border-border bg-surface shadow-xl transition-all duration-500 ease-fluid hover:-translate-y-1.5 hover:border-primary/60 hover:shadow-2xl hover:shadow-primary/10"
    >
      <div className="relative flex aspect-[4/5] items-center justify-center overflow-hidden bg-surface-2 p-6">
        <img
          src={product.thumbnail}
          alt={product.name}
          className="h-full w-full object-contain transition-transform duration-500 ease-fluid group-hover:scale-110"
          loading="lazy"
        />
        {startingPrice !== null && (
          <span className="absolute right-3 top-3 rounded-full border border-border bg-page/80 px-3 py-1 text-xs font-bold text-accent shadow-lg backdrop-blur-sm">
            {t('productCard.fromPrice', { price: formatTotal(startingPrice, locale) })}
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col p-5">
        <h3 className="text-lg font-bold text-ink">{product.name}</h3>
        <p className="mt-1 flex-1 text-sm leading-relaxed text-ink-muted">{tr(product.description, product.descriptionI18n)}</p>
        <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-accent transition-transform duration-500 ease-fluid group-hover:translate-x-1.5">
          {t('productCard.customizeNow')}
          <span aria-hidden="true">→</span>
        </span>
      </div>
    </Link>
  )
}
