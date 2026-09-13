import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { LanguageProvider } from './i18n/LanguageContext'
import './index.css'

const rootElement = document.getElementById('root')
if (!rootElement) {
  throw new Error('Elemento #root non trovato nel documento.')
}

createRoot(rootElement).render(
  <StrictMode>
    {/* `basename` usa lo stesso percorso base configurato in vite.config.ts
        (import.meta.env.BASE_URL), così i link generati da React Router
        funzionano sia in locale sia una volta pubblicati su GitHub Pages
        sotto /<nome-repo>/. */}
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <LanguageProvider>
        <App />
      </LanguageProvider>
    </BrowserRouter>
  </StrictMode>,
)
