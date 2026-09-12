import { Link } from 'react-router-dom'

export default function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/80 bg-page/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link
          to="/"
          className="flex items-center gap-2 rounded-lg text-lg font-extrabold tracking-tight text-ink transition-opacity hover:opacity-80"
        >
          <span
            aria-hidden="true"
            className="grid h-9 w-9 place-items-center rounded-xl text-base font-black text-page shadow-[0_0_0_1px_rgba(255,255,255,0.06)]"
            style={{ backgroundImage: 'linear-gradient(135deg, #7c5cff, #22d3ee)' }}
          >
            C
          </span>
          <span>
            Configura<span className="text-accent">tore</span>
          </span>
        </Link>

        <a
          href="https://github.com/"
          target="_blank"
          rel="noreferrer"
          className="hidden items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-medium text-ink-muted transition-colors hover:border-accent/60 hover:text-ink sm:flex"
        >
          <span aria-hidden="true">★</span>
          Il progetto su GitHub
        </a>
      </div>
    </header>
  )
}
