import { categories } from '../data/categories'
import CategoryCard from '../components/cards/CategoryCard'
import Gallery from '../components/gallery/Gallery'
import HowItWorks from '../components/home/HowItWorks'
import Reveal from '../components/common/Reveal'
import { usePageMeta } from '../hooks/usePageMeta'
import { useLanguage } from '../i18n/LanguageContext'

export default function HomePage() {
  const { t } = useLanguage()
  usePageMeta({
    title: t('home.metaTitle'),
    description: t('home.metaDescription'),
  })

  return (
    <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
      <div className="relative overflow-hidden">
        {/* Macchie di colore morbide sullo sfondo dell'hero: solo decorative, ignorate dagli screen reader. */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
          <div
            className="animate-drift-a absolute -left-24 -top-24 h-72 w-72 rounded-full opacity-30 blur-3xl"
            style={{ backgroundImage: 'linear-gradient(135deg, #c1272d, transparent)' }}
          />
          <div
            className="animate-drift-b absolute -right-16 top-10 h-80 w-80 rounded-full opacity-25 blur-3xl"
            style={{ backgroundImage: 'linear-gradient(135deg, #e8b04b, transparent)' }}
          />
        </div>

        <div className="mx-auto max-w-2xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-accent">
            {t('home.badge')}
          </span>
          <h1 className="mt-6 text-4xl font-extrabold tracking-tight text-ink sm:text-5xl">
            {t('home.heroTitlePrefix')}{' '}
            <span
              className="bg-clip-text text-transparent"
              style={{ backgroundImage: 'linear-gradient(90deg, #c1272d, #e8b04b)' }}
            >
              {t('home.heroTitleHighlight')}
            </span>
          </h1>
          <p className="mt-5 text-lg leading-relaxed text-ink-muted">{t('home.heroSubtitle')}</p>
        </div>
      </div>

      <Reveal className="mt-16">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-muted">{t('home.chooseCategory')}</h2>
        <div className="mt-4 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((category) => (
            <CategoryCard key={category.slug} category={category} />
          ))}
        </div>
      </Reveal>

      <HowItWorks />

      <Gallery />
    </div>
  )
}
