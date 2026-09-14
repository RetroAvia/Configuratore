import { Link, useParams } from 'react-router-dom'
import { getCategory } from '../data/categories'
import { getProductsByCategory } from '../data/products'
import ProductCard from '../components/cards/ProductCard'
import NotFoundPage from './NotFoundPage'
import { playBack } from '../utils/sound'
import { usePageMeta } from '../hooks/usePageMeta'
import { useStructuredData } from '../hooks/useStructuredData'
import { useLanguage } from '../i18n/LanguageContext'
import { useMemo } from 'react'

export default function CategoryPage() {
  const { categorySlug = '' } = useParams()
  const category = getCategory(categorySlug)
  const { t, tr } = useLanguage()

  const categoryName = category ? tr(category.name, category.nameI18n) : ''

  usePageMeta({
    title: category ? t('categoryPage.metaTitle', { categoryName }) : t('categoryPage.notFoundMetaTitle'),
    description: category ? tr(category.description, category.descriptionI18n) : undefined,
  })

  // Dati strutturati Schema.org (BreadcrumbList), per aiutare Google a
  // capire la posizione di questa pagina nella gerarchia del sito.
  const structuredData = useMemo(() => {
    if (!category) return null
    return {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: 'RetroAvia Lab',
          item: 'https://configuratore-five.vercel.app/',
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: categoryName,
          item: `https://configuratore-five.vercel.app/${category.slug}`,
        },
      ],
    }
  }, [category, categoryName])
  useStructuredData(structuredData)

  if (!category) {
    return <NotFoundPage />
  }

  const products = getProductsByCategory(category.slug)

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
      <div className="mb-4 flex items-center justify-between">
        <Link
          to="/"
          onClick={() => playBack()}
          className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-3.5 py-1.5 text-sm font-medium text-ink-muted transition-colors hover:border-primary/60 hover:text-ink"
        >
          <span aria-hidden="true">←</span>
          {t('categoryPage.back')}
        </Link>
        <nav aria-label={t('categoryPage.breadcrumbAria')} className="text-sm text-ink-muted">
          <Link to="/" className="transition-colors hover:text-accent">
            {t('categoryPage.breadcrumbHome')}
          </Link>
          <span className="mx-2" aria-hidden="true">
            /
          </span>
          <span className="text-ink">{categoryName}</span>
        </nav>
      </div>

      <div className="max-w-2xl">
        <span aria-hidden="true" className="text-4xl">
          {category.icon}
        </span>
        <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">{categoryName}</h1>
        <p className="mt-3 text-ink-muted">{tr(category.description, category.descriptionI18n)}</p>
      </div>

      {products.length > 0 ? (
        <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => (
            <ProductCard key={product.slug} product={product} />
          ))}
        </div>
      ) : (
        <div className="mt-10 rounded-3xl border border-dashed border-border p-10 text-center text-ink-muted">
          {t('categoryPage.emptyState')}
        </div>
      )}
    </div>
  )
}
