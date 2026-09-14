import { Outlet, useLocation } from 'react-router-dom'
import Header from './Header'
import Footer from './Footer'
import { useLanguage } from '../../i18n/LanguageContext'

export default function Layout() {
  const location = useLocation()
  const { t } = useLanguage()

  return (
    <div className="flex min-h-full flex-col">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-primary focus:px-5 focus:py-2.5 focus:text-sm focus:font-semibold focus:text-white focus:shadow-lg"
      >
        {t('layout.skipToContent')}
      </a>
      <Header />
      <main id="main-content" tabIndex={-1} className="flex-1 outline-none">
        {/* La `key` sul pathname forza il remount di questo wrapper a ogni
            cambio pagina (home → categoria → configuratore), retriggerando
            l'animazione CSS `.animate-page-in` senza bisogno di librerie di
            transizione: una dissolvenza/scivolata leggera, disattivata in
            automatico per chi preferisce meno movimento (vedi index.css). */}
        <div key={location.pathname} className="animate-page-in">
          <Outlet />
        </div>
      </main>
      <Footer />
    </div>
  )
}
