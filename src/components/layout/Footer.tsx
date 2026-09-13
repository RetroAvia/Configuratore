import InstagramIcon from '../icons/InstagramIcon'
import { playClick } from '../../utils/sound'

const INSTAGRAM_URL = 'https://www.instagram.com/retroavia_/'

export default function Footer() {
  return (
    <footer className="border-t border-border/80 py-14">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div
          className="relative overflow-hidden rounded-3xl border border-border p-8 sm:p-10"
          style={{ backgroundImage: 'linear-gradient(135deg, rgba(193,39,45,0.14), rgba(232,176,75,0.08))' }}
        >
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-10 -top-16 h-48 w-48 rounded-full opacity-40 blur-3xl"
            style={{ backgroundImage: 'linear-gradient(135deg, rgba(193,39,45,0.5), rgba(232,176,75,0.4))' }}
          />
          <div className="relative flex flex-col items-center gap-5 text-center sm:flex-row sm:justify-between sm:text-left">
            <div className="flex items-center gap-4">
              <img
                src="/logo.png"
                alt="RetroAvia"
                className="h-16 w-16 rounded-2xl shadow-[0_0_0_1px_rgba(255,255,255,0.08)]"
              />
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-accent">Seguici in volo</p>
                <h2 className="text-xl font-extrabold tracking-tight text-ink">RetroAvia</h2>
                <p className="mt-1 text-sm text-ink-muted">
                  Nuovi modelli, personalizzazioni e retroscena direttamente dal laboratorio.
                </p>
              </div>
            </div>
            <a
              href={INSTAGRAM_URL}
              target="_blank"
              rel="noreferrer"
              onClick={() => playClick()}
              className="inline-flex shrink-0 items-center gap-2 rounded-full px-5 py-3 text-sm font-bold text-white shadow-lg shadow-primary/20 transition-all hover:brightness-110 active:scale-[0.98]"
              style={{ backgroundImage: 'linear-gradient(90deg, #c1272d, #e8b04b)' }}
            >
              <InstagramIcon className="h-4 w-4" />
              @retroavia_
            </a>
          </div>
        </div>

        <div className="mt-8 text-center text-sm text-ink-muted">
          <p>
            RetroAvia Lab è realizzato interamente lato client: nessuna immagine caricata lascia mai il tuo
            browser.
          </p>
          <p className="mt-1">© {new Date().getFullYear()} RetroAvia Lab.</p>
        </div>
      </div>
    </footer>
  )
}
