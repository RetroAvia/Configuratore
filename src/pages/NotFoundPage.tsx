import { Link } from 'react-router-dom'
import { usePageMeta } from '../hooks/usePageMeta'
import { useLanguage } from '../i18n/LanguageContext'

export default function NotFoundPage() {
  const { t } = useLanguage()
  usePageMeta({ title: t('notFoundPage.metaTitle') })

  return (
    <div className="mx-auto flex max-w-xl flex-col items-center px-4 py-28 text-center">
      <span aria-hidden="true" className="text-6xl">
        🔍
      </span>
      <h1 className="mt-6 text-3xl font-extrabold text-ink">{t('notFoundPage.title')}</h1>
      <p className="mt-3 text-ink-muted">{t('notFoundPage.description')}</p>
      <Link
        to="/"
        className="mt-8 inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-bold text-white shadow-lg shadow-primary/20 transition-all hover:brightness-110"
        style={{ backgroundImage: 'linear-gradient(90deg, #c1272d, #e8b04b)' }}
      >
        {t('notFoundPage.cta')}
      </Link>
    </div>
  )
}
