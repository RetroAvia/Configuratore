import { lazy, Suspense } from 'react'
import { Route, Routes } from 'react-router-dom'
import Layout from './components/layout/Layout'
import HomePage from './pages/HomePage'
import AppErrorBoundary from './components/common/ErrorBoundary'

/**
 * La home viene importata normalmente: è la prima pagina che quasi tutti
 * vedono, e caricarla in un secondo momento aggiungerebbe solo attesa.
 *
 * Il configuratore e l'elenco di categoria vengono invece caricati solo
 * quando servono davvero. Il configuratore è di gran lunga la parte più
 * pesante dell'applicazione (motore di editing, esportazione su canvas,
 * biglietto preventivo, motore prezzi): tenerlo fuori dal pacchetto iniziale
 * alleggerisce sensibilmente la prima apertura del sito — che è quella su cui
 * si gioca tutto, visto che la maggior parte dei visitatori arriva da un link
 * su Instagram, spesso da telefono e con una connessione mobile.
 */
const CategoryPage = lazy(() => import('./pages/CategoryPage'))
const ConfiguratorPage = lazy(() => import('./pages/ConfiguratorPage'))
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'))

/**
 * Segnaposto mostrato nei pochi istanti in cui una pagina caricata su
 * richiesta sta arrivando. Volutamente sobrio e senza testo: un messaggio
 * "caricamento…" che lampeggia per 150 ms dà più fastidio che informazione.
 */
function PageFallback() {
  return <div className="min-h-[60vh]" aria-busy="true" aria-live="polite" />
}

export default function App() {
  return (
    <AppErrorBoundary>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route
            path=":categorySlug"
            element={
              <Suspense fallback={<PageFallback />}>
                <CategoryPage />
              </Suspense>
            }
          />
          <Route
            path=":categorySlug/:modelSlug"
            element={
              <Suspense fallback={<PageFallback />}>
                <ConfiguratorPage />
              </Suspense>
            }
          />
          <Route
            path="*"
            element={
              <Suspense fallback={<PageFallback />}>
                <NotFoundPage />
              </Suspense>
            }
          />
        </Route>
      </Routes>
    </AppErrorBoundary>
  )
}
