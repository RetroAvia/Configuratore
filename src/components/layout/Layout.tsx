import { Outlet, useLocation } from 'react-router-dom'
import Header from './Header'
import Footer from './Footer'

export default function Layout() {
  const location = useLocation()

  return (
    <div className="flex min-h-full flex-col">
      <Header />
      <main className="flex-1">
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
