export default function Footer() {
  return (
    <footer className="border-t border-border/80 py-10">
      <div className="mx-auto max-w-6xl px-4 text-center text-sm text-ink-muted sm:px-6">
        <p>
          Configuratore realizzato interamente lato client: nessuna immagine caricata lascia mai il tuo
          browser.
        </p>
        <p className="mt-1">© {new Date().getFullYear()} — Progetto open source.</p>
      </div>
    </footer>
  )
}
