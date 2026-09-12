import InstagramIcon from '../icons/InstagramIcon'
import { playClick } from '../../utils/sound'
import { buildInstagramDmHref, buildMailtoHref, RETROAVIA_INSTAGRAM_PROFILE } from '../../utils/sendLinks'

interface SendPanelProps {
  productName: string
  hasGenerated: boolean
  isExporting: boolean
  onGenerate: () => void
  onDownload: () => void
}

/**
 * Pannello sempre visibile non appena il collage ha almeno un'immagine:
 * spiega in 2 passaggi come far arrivare l'idea a RetroAvia (genera → invia).
 * La gestione delle immagini (quante, quali, come disposte) vive
 * interamente nel pannello "Immagine" del toolbar qui sopra: il render
 * generato al passaggio 1 contiene già l'intero collage composto insieme,
 * quindi qui basta un solo file da scaricare e allegare — nessuna gestione
 * di immagini "extra" separate.
 *
 * Trattandosi di un sito 100% statico (senza alcun server dietro), non è
 * possibile allegare automaticamente un file a un'email o a un messaggio
 * Instagram: il pannello quindi scarica il render nel browser dell'utente e
 * apre email/Instagram già pre-compilati, ricordando di allegarlo
 * manualmente — un solo passaggio in più, ma zero server, zero account
 * terzi e nessuna immagine che lascia il browser finché non è l'utente
 * stesso a inviarla.
 */
export default function SendPanel({ productName, hasGenerated, isExporting, onGenerate, onDownload }: SendPanelProps) {
  const mailtoHref = buildMailtoHref(productName)
  const instagramHref = buildInstagramDmHref()

  return (
    <div className="flex flex-col gap-5 rounded-3xl border border-border bg-surface p-5 shadow-xl sm:p-6">
      <div>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-muted">Invia la tua idea</h2>
        <p className="mt-2 text-sm leading-relaxed text-ink-muted">
          Più che scaricarla, la personalizzazione va fatta vedere a RetroAvia: genera il render — contiene
          già tutte le immagini del collage, composte insieme — poi invialo via email o Instagram.
        </p>
      </div>

      {/* Passaggio 1: genera il render */}
      <div className="rounded-2xl border border-border bg-surface-2 p-4">
        <p className="text-sm font-medium text-ink">1. Genera il render finale</p>
        <p className="mt-1 text-xs text-ink-muted">
          Crea l'immagine ad alta risoluzione (scocca + il tuo collage) e la scarica sul tuo dispositivo.
        </p>
        <button
          type="button"
          onClick={() => {
            playClick()
            onGenerate()
          }}
          disabled={isExporting}
          className="mt-3 inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-primary/20 transition-all hover:brightness-110 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-60"
          style={{ backgroundImage: 'linear-gradient(90deg, #c1272d, #e8b04b)' }}
        >
          {isExporting ? (
            'Sto preparando il render…'
          ) : (
            <>
              <span aria-hidden="true">📨</span>
              {hasGenerated ? 'Rigenera e riscarica' : 'Genera e scarica il render'}
            </>
          )}
        </button>
        {hasGenerated && !isExporting && (
          <p className="mt-2 text-xs font-medium text-success">✓ Render scaricato. Se sposti o ridimensioni un'immagine del collage, rigeneralo prima di inviarlo.</p>
        )}
      </div>

      {/* Passaggio 2: invio */}
      <div className="rounded-2xl border border-border bg-surface-2 p-4">
        <p className="text-sm font-medium text-ink">2. Invia</p>
        <p className="mt-1 text-xs text-ink-muted">
          Si apre email o Instagram già pronti: ricordati di allegare il file scaricato al passaggio 1.
        </p>

        <button
          type="button"
          onClick={() => {
            playClick()
            onDownload()
          }}
          disabled={!hasGenerated}
          className="mt-3 inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-surface px-4 py-2.5 text-sm font-semibold text-ink transition-colors hover:border-primary/60 disabled:pointer-events-none disabled:opacity-40"
        >
          <span aria-hidden="true">⬇️</span>
          Scarica di nuovo il render
        </button>

        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <a
            href={mailtoHref}
            onClick={() => playClick()}
            className="inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold text-white shadow-lg shadow-primary/20 transition-all hover:brightness-110 active:scale-[0.98]"
            style={{ backgroundImage: 'linear-gradient(90deg, #c1272d, #e8b04b)' }}
          >
            <span aria-hidden="true">✉️</span>
            Invia via email
          </a>
          <a
            href={instagramHref}
            target="_blank"
            rel="noreferrer"
            onClick={() => playClick()}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-surface-2 px-4 py-3 text-sm font-bold text-ink transition-all hover:border-primary/60 active:scale-[0.98]"
          >
            <InstagramIcon className="h-4 w-4" />
            Invia su Instagram
          </a>
        </div>
        <p className="mt-3 text-center text-xs text-ink-muted">
          Non si apre nulla?{' '}
          <a href={RETROAVIA_INSTAGRAM_PROFILE} target="_blank" rel="noreferrer" className="underline hover:text-accent">
            Scrivici dal profilo @retroavia_
          </a>
          .
        </p>
      </div>
    </div>
  )
}
