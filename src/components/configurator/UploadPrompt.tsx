interface UploadPromptProps {
  isDraggingFile: boolean
  errorMessage?: string | null
  /**
   * Quando true, mostra un badge compatto e flottante invece di un overlay a
   * tutto schermo. Serve per i prodotti con area di ritaglio "composta"
   * (es. Game Boy Color/Advance, dove l'immagine copre l'intera scocca): in
   * quei casi coprire tutta l'area con un overlay pieno nasconderebbe la
   * vera foto del prodotto prima ancora che l'utente carichi qualcosa —
   * l'invito a caricare deve restare un piccolo suggerimento sopra alla
   * scocca ben visibile, non una tinta unita che la sostituisce.
   */
  compact?: boolean
}

/**
 * Messaggio mostrato all'interno dell'area di ritaglio prima che l'utente
 * carichi un'immagine. Eredita automaticamente la forma esatta dello
 * schermo/quadrante perché viene renderizzato come figlio del contenitore
 * già ritagliato (`clip-path`) in ConfiguratorCanvas.
 */
export default function UploadPrompt({ isDraggingFile, errorMessage, compact = false }: UploadPromptProps) {
  if (compact) {
    return (
      <div className="absolute inset-0 flex items-center justify-center p-3">
        <div
          className={`flex flex-col items-center gap-1 rounded-2xl px-4 py-3 text-center shadow-xl backdrop-blur-sm transition-colors ${
            isDraggingFile ? 'bg-primary/70' : 'bg-black/55'
          }`}
        >
          <span aria-hidden="true" className="text-[1.6em] leading-none">
            🖼️
          </span>
          <p className="text-[0.8em] font-semibold leading-tight text-white">
            {isDraggingFile ? 'Rilascia qui' : 'Tocca per caricare la tua immagine'}
          </p>
          <p className="text-[0.62em] leading-tight text-white/70">JPG, PNG o WEBP</p>
          {errorMessage && (
            <p role="alert" className="mt-1 max-w-[16em] text-[0.62em] font-medium leading-tight text-danger">
              {errorMessage}
            </p>
          )}
        </div>
      </div>
    )
  }

  return (
    <div
      className={`absolute inset-0 flex flex-col items-center justify-center gap-2 p-3 text-center transition-colors ${
        isDraggingFile ? 'bg-primary/30' : 'bg-black/45'
      }`}
    >
      <span aria-hidden="true" className="text-[2em] leading-none">
        🖼️
      </span>
      <p className="text-[0.85em] font-semibold leading-tight text-white">
        {isDraggingFile ? 'Rilascia qui la tua immagine' : 'Trascina qui una tua immagine'}
      </p>
      <p className="text-[0.7em] leading-tight text-white/75">oppure tocca per selezionarne una</p>
      <p className="text-[0.6em] leading-tight text-white/55">JPG, PNG o WEBP</p>
      {errorMessage && (
        <p role="alert" className="mt-1 max-w-[90%] text-[0.65em] font-medium leading-tight text-danger">
          {errorMessage}
        </p>
      )}
    </div>
  )
}
