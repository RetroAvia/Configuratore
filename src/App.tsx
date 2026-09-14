import { Route, Routes } from 'react-router-dom'
import Layout from './components/layout/Layout'
import HomePage from './pages/HomePage'
import CategoryPage from './pages/CategoryPage'
import ConfiguratorPage from './pages/ConfiguratorPage'
import NotFoundPage from './pages/NotFoundPage'
import AppErrorBoundary from './components/common/ErrorBoundary'

export default function App() {
  return (
    <AppErrorBoundary>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path=":categorySlug" element={<CategoryPage />} />
          <Route path=":categorySlug/:modelSlug" element={<ConfiguratorPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </AppErrorBoundary>
  )
}
