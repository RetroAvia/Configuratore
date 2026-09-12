interface UploadPromptProps {
  isDraggingFile: boolean
  errorMessage?: string | null
}

/**
 * Messaggio mostrato all'interno dell'area di ritaglio prima che l'utente
 * carichi un'immagine. Eredita automaticamente la forma esatta dello
 * schermo/quadrante perché viene renderizzato come figlio del contenitore
 * già ritagliato (`clip-path`) in ConfiguratorCanvas.
 */
export default function UploadPrompt({ isDraggingFile, errorMessage }: UploadPromptProps) {
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
