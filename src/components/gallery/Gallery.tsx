import { galleryItems } from '../../data/gallery'
import Reveal from '../common/Reveal'
import { useLanguage } from '../../i18n/LanguageContext'

/**
 * Galleria di lavori realizzati, mostrata in home come prova sociale: foto
 * reali di prodotti consegnati ai clienti (non render/anteprime del
 * configuratore).
 */
export default function Gallery() {
  const { t, tr } = useLanguage()
  return (
    <section className="mt-24">
      <Reveal>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-muted">{t('gallery.eyebrow')}</h2>
        <p className="mt-2 text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">{t('gallery.title')}</p>
      </Reveal>

      <div className="mt-8 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-5">
        {galleryItems.map((item, index) => (
          <Reveal key={item.image} delayMs={index * 70}>
            <figure className="group relative aspect-[4/5] overflow-hidden rounded-2xl border border-border bg-surface">
              <img
                src={item.image}
                alt={item.alt}
                loading="lazy"
                className="h-full w-full object-cover transition-transform duration-700 ease-fluid group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-page/95 via-page/10 to-transparent opacity-70 transition-opacity duration-500 ease-fluid group-hover:opacity-90" />
              <figcaption className="absolute inset-x-0 bottom-0 translate-y-1 p-3 text-xs font-medium text-ink transition-transform duration-500 ease-fluid group-hover:translate-y-0">
                {tr(item.caption, item.captionI18n)}
              </figcaption>
            </figure>
          </Reveal>
        ))}
      </div>
    </section>
  )
}
