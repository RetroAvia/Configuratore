import type { ButtonHTMLAttributes, MouseEvent } from 'react'
import { MAX_SCALE, MIN_SCALE } from '../../hooks/useImageTransform'
import type { ImageTransform } from '../../hooks/useImageTransform'
import { playClick } from '../../utils/sound'

interface ToolbarProps {
  hasImage: boolean
  transform: ImageTransform
  showGrid: boolean
  isExporting: boolean
  onToggleGrid: (value: boolean) => void
  onScaleChange: (scale: number) => void
  onRotationChange: (rotation: number) => void
  onQuickRotate: (deltaDeg: number) => void
  onCenterAndFit: () => void
  onReset: () => void
  onRequestUpload: () => void
  onExport: () => void
}

function IconButton({
  children,
  onClick,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  const handleClick = (e: MouseEvent<HTMLButtonElement>) => {
    playClick()
    onClick?.(e)
  }
  return (
    <button
      type="button"
      {...props}
      onClick={handleClick}
      className={`inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-surface-2 px-3 py-2 text-sm font-medium text-ink transition-all hover:border-primary/60 hover:bg-surface-2/70 active:scale-95 disabled:pointer-events-none disabled:opacity-40 ${props.className ?? ''}`}
    >
      {children}
    </button>
  )
}

export default function Toolbar({
  hasImage,
  transform,
  showGrid,
  isExporting,
  onToggleGrid,
  onScaleChange,
  onRotationChange,
  onQuickRotate,
  onCenterAndFit,
  onReset,
  onRequestUpload,
  onExport,
}: ToolbarProps) {
  const scalePercent = Math.round(transform.scale * 100)

  return (
    <div className="flex flex-col gap-5 rounded-3xl border border-border bg-surface p-5 shadow-xl sm:p-6">
      <div>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-muted">Immagine</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          <IconButton onClick={onRequestUpload}>
            <span aria-hidden="true">{hasImage ? '🔁' : '📤'}</span>
            {hasImage ? 'Cambia immagine' : 'Carica immagine'}
          </IconButton>
        </div>
      </div>

      <div className={hasImage ? '' : 'pointer-events-none opacity-40'} aria-disabled={!hasImage}>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-muted">Posizionamento</h2>

        <div className="mt-3 space-y-4">
          <div>
            <div className="mb-1 flex items-center justify-between text-xs text-ink-muted">
              <label htmlFor="scale-range">Dimensione</label>
              <span className="font-mono text-ink">{scalePercent}%</span>
            </div>
            <input
              id="scale-range"
              type="range"
              min={MIN_SCALE}
              max={MAX_SCALE}
              step={0.01}
              value={transform.scale}
              onChange={(e) => onScaleChange(Number(e.target.value))}
              disabled={!hasImage}
            />
          </div>

          <div>
            <div className="mb-1 flex items-center justify-between text-xs text-ink-muted">
              <label htmlFor="rotation-range">Rotazione</label>
              <span className="font-mono text-ink">{Math.round(transform.rotation)}°</span>
            </div>
            <input
              id="rotation-range"
              type="range"
              min={-180}
              max={180}
              step={1}
              value={transform.rotation}
              onChange={(e) => onRotationChange(Number(e.target.value))}
              disabled={!hasImage}
            />
            <div className="mt-2 flex gap-2">
              <IconButton className="flex-1 py-1.5 text-xs" onClick={() => onQuickRotate(-90)} disabled={!hasImage}>
                ↺ -90°
              </IconButton>
              <IconButton className="flex-1 py-1.5 text-xs" onClick={() => onQuickRotate(90)} disabled={!hasImage}>
                ↻ +90°
              </IconButton>
            </div>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <IconButton onClick={onCenterAndFit} disabled={!hasImage}>
            <span aria-hidden="true">🎯</span>
            Centra automaticamente
          </IconButton>
          <IconButton onClick={onReset} disabled={!hasImage}>
            <span aria-hidden="true">↺</span>
            Reset
          </IconButton>
        </div>
      </div>

      <div>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-muted">Aiuti alla precisione</h2>
        <label className="mt-3 flex cursor-pointer items-center justify-between rounded-xl border border-border bg-surface-2 px-3 py-2 text-sm text-ink">
          <span>Mostra griglia</span>
          <input
            type="checkbox"
            checked={showGrid}
            onChange={(e) => {
              playClick()
              onToggleGrid(e.target.checked)
            }}
            className="h-4 w-4 accent-primary"
          />
        </label>
        <p className="mt-2 text-xs leading-relaxed text-ink-muted">
          Trascina l'immagine per spostarla, usa le maniglie sugli angoli (o il pizzico a due dita su
          mobile) per ridimensionarla, e la maniglia in alto per ruotarla. Le linee guida azzurre
          compaiono automaticamente quando l'immagine è centrata. Quando sei soddisfatto, genera il
          render qui sotto: potrai poi inviarlo a RetroAvia via email o Instagram.
        </p>
      </div>

      <button
        type="button"
        onClick={() => {
          playClick()
          onExport()
        }}
        disabled={!hasImage || isExporting}
        className="inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold text-white shadow-lg shadow-primary/20 transition-all hover:brightness-110 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-40"
        style={{ backgroundImage: 'linear-gradient(90deg, #c1272d, #e8b04b)' }}
      >
        {isExporting ? (
          'Sto preparando il render…'
        ) : (
          <>
            <span aria-hidden="true">📨</span>
            Genera immagine da inviare
          </>
        )}
      </button>
    </div>
  )
}
