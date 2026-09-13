import { Link } from 'react-router-dom'

export default function NotFoundPage() {
  return (
    <div className="mx-auto flex max-w-xl flex-col items-center px-4 py-28 text-center">
      <span aria-hidden="true" className="text-6xl">
        🔍
      </span>
      <h1 className="mt-6 text-3xl font-extrabold text-ink">Pagina non trovata</h1>
      <p className="mt-3 text-ink-muted">
        La pagina che cerchi non esiste, oppure il modello richiesto non è (ancora) disponibile.
      </p>
      <Link
        to="/"
        className="mt-8 inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-bold text-white shadow-lg shadow-primary/20 transition-all hover:brightness-110"
        style={{ backgroundImage: 'linear-gradient(90deg, #c1272d, #e8b04b)' }}
      >
        Torna alla home
      </Link>
    </div>
  )
}
