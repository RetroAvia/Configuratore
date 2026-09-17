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
    path: '/',
  })

  return (
    <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
      <div className="relative overflow-hidden">
        {/*
          Alone di colore ambientale dietro al testo dell'hero: solo
          decorativo, ignorato dagli screen reader. Ogni macchia è un
          gradiente radiale con dimensione `closest-side`, che per
          definizione arriva a trasparenza ESATTA (zero, non "quasi zero")
          esattamente al bordo più vicino di questo riquadro — un fatto
          matematico del gradiente, non un'approssimazione visiva. Per
          questo si fonde sempre con lo sfondo della pagina, qualunque sia
          l'altezza reale dell'hero: il tentativo precedente (cerchi sfocati
          con `blur` + `overflow-hidden`, poi una maschera) tagliava invece
          il colore di netto proprio sul bordo, lasciando uno spigolo
          visibile.
        */}
        <div
          aria-hidden="true"
          className="animate-drift-a pointer-events-none absolute inset-0 -z-10"
          style={{ backgroundImage: 'radial-gradient(ellipse closest-side at 20% 20%, rgba(193,39,45,0.32), transparent)' }}
        />
        <div
          aria-hidden="true"
          className="animate-drift-b pointer-events-none absolute inset-0 -z-10"
          style={{ backgroundImage: 'radial-gradient(ellipse closest-side at 82% 60%, rgba(232,176,75,0.26), transparent)' }}
        />

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
