import { useRef } from 'react'
import type { ChangeEvent } from 'react'
import InstagramIcon from '../icons/InstagramIcon'
import { playClick } from '../../utils/sound'
import { buildInstagramDmHref, buildMailtoHref, RETROAVIA_INSTAGRAM_PROFILE } from '../../utils/sendLinks'

interface SendPanelProps {
  productName: string
  extraImages: File[]
  extraImageError: string | null
  onAddExtraImages: (files: FileList) => void
  onRemoveExtraImage: (index: number) => void
  onDownloadAll: () => void
}

const MAX_EXTRA_IMAGES = 4

/**
 * Pannello mostrato dopo aver generato il render: spiega come far arrivare
 * l'immagine a RetroAvia. Trattandosi di un sito 100% statico (senza alcun
 * server dietro), non è possibile allegare automaticamente un file a
 * un'email o a un messaggio Instagram: il pannello quindi scarica le
 * immagini nel browser dell'utente e apre email/Instagram già pre-compilati,
 * ricordando di allegarle manualmente — un solo passaggio in più, ma zero
 * server, zero account terzi e nessuna immagine che lascia il browser finché
 * non è l'utente stesso a inviarla.
 */
export default function SendPanel({
  productName,
  extraImages,
  extraImageError,
  onAddExtraImages,
  onRemoveExtraImage,
  onDownloadAll,
}: SendPanelProps) {
  const extraInputRef = useRef<HTMLInputElement>(null)

  const handleExtraFilesChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) onAddExtraImages(e.target.files)
    e.target.value = ''
  }

  const mailtoHref = buildMailtoHref(productName, extraImages.length)
  const instagramHref = buildInstagramDmHref()

  return (
    <div className="mt-8 flex flex-col gap-5 rounded-3xl border border-border bg-surface p-5 shadow-xl sm:p-6">
      <div>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-muted">Invia la tua idea</h2>
        <p className="mt-2 text-sm leading-relaxed text-ink-muted">
          Il render è stato scaricato nel tuo dispositivo. Per farla vedere a RetroAvia, allegalo a
          un'email o a un messaggio Instagram: qui sotto trovi tutto già pronto, manca solo l'ultimo
          passaggio — allegare il file.
        </p>
      </div>

      <div className="rounded-2xl border border-border bg-surface-2 p-4">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-medium text-ink">Vuoi aggiungere altre immagini di riferimento?</p>
          <span className="shrink-0 text-xs text-ink-muted">facoltativo</span>
        </div>
        <p className="mt-1 text-xs text-ink-muted">
          Ad esempio altre foto o idee da far vedere insieme al render (max {MAX_EXTRA_IMAGES}).
        </p>

        {extraImages.length > 0 && (
          <ul className="mt-3 flex flex-wrap gap-2">
            {extraImages.map((file, index) => (
              <li
                key={`${file.name}-${index}`}
                className="flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1.5 text-xs text-ink"
              >
                <span className="max-w-[140px] truncate">{file.name}</span>
                <button
                  type="button"
                  onClick={() => {
                    playClick()
                    onRemoveExtraImage(index)
                  }}
                  aria-label={`Rimuovi ${file.name}`}
                  className="text-ink-muted transition-colors hover:text-danger"
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
        )}

        {extraImageError && (
          <p role="alert" className="mt-2 text-xs font-medium text-danger">
            {extraImageError}
          </p>
        )}

        <input
          ref={extraInputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          multiple
          onChange={handleExtraFilesChange}
          className="hidden"
        />
        <button
          type="button"
          onClick={() => {
            playClick()
            extraInputRef.current?.click()
          }}
          disabled={extraImages.length >= MAX_EXTRA_IMAGES}
          className="mt-3 inline-flex items-center gap-2 rounded-xl border border-border bg-surface px-3 py-2 text-xs font-medium text-ink transition-colors hover:border-primary/60 disabled:pointer-events-none disabled:opacity-40"
        >
          <span aria-hidden="true">➕</span>
          Aggiungi immagine
        </button>
      </div>

      <button
        type="button"
        onClick={() => {
          playClick()
          onDownloadAll()
        }}
        className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-surface-2 px-4 py-2.5 text-sm font-semibold text-ink transition-colors hover:border-primary/60"
      >
        <span aria-hidden="true">⬇️</span>
        Scarica {extraImages.length > 0 ? 'tutte le immagini' : 'di nuovo il render'}
      </button>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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
      <p className="text-center text-xs text-ink-muted">
        Non si apre nulla?{' '}
        <a href={RETROAVIA_INSTAGRAM_PROFILE} target="_blank" rel="noreferrer" className="underline hover:text-accent">
          Scrivici dal profilo @retroavia_
        </a>
        .
      </p>
    </div>
  )
}
