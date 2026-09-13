import type { ButtonHTMLAttributes, MouseEvent } from 'react'
import { MAX_SCALE, MIN_SCALE } from '../../hooks/useImageTransform'
import type { ImageTransform } from '../../hooks/useImageTransform'
import type { ImageLayer } from '../../types/layers'
import { playClick } from '../../utils/sound'
import { useLanguage } from '../../i18n/LanguageContext'

interface ToolbarProps {
  layers: ImageLayer[]
  selectedLayerId: string | null
  /** Trasformazione dello strato selezionato (per popolare gli slider), oppure null se nessuno strato è selezionato. */
  selectedTransform: ImageTransform | null
  onSelectLayer: (id: string | null) => void
  onRemoveLayer: (id: string) => void
  onScaleChange: (scale: number) => void
  onRotationChange: (rotation: number) => void
  onQuickRotate: (deltaDeg: number) => void
  onCenterAndFit: () => void
  onReset: () => void
  onRequestAddImage: () => void
  onRequestReplaceSelected: () => void
  showGrid: boolean
  onToggleGrid: (value: boolean) => void
  maxLayers: number
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
  layers,
  selectedLayerId,
  selectedTransform,
  onSelectLayer,
  onRemoveLayer,
  onScaleChange,
  onRotationChange,
  onQuickRotate,
  onCenterAndFit,
  onReset,
  onRequestAddImage,
  onRequestReplaceSelected,
  showGrid,
  onToggleGrid,
  maxLayers,
}: ToolbarProps) {
  const { t } = useLanguage()
  const hasImage = layers.length > 0
  const scalePercent = selectedTransform ? Math.round(selectedTransform.scale * 100) : 100

  return (
    <div className="flex flex-col gap-5 rounded-3xl border border-border bg-surface p-5 shadow-xl sm:p-6">
      <div>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-muted">{t('toolbar.imageHeading')}</h2>

        <div className="mt-3 flex flex-wrap gap-2">
          <IconButton onClick={onRequestAddImage} disabled={layers.length >= maxLayers}>
            <span aria-hidden="true">{hasImage ? '➕' : '📤'}</span>
            {hasImage ? t('toolbar.addImage') : t('toolbar.uploadImage')}
          </IconButton>
          {hasImage && (
            <IconButton onClick={onRequestReplaceSelected} disabled={!selectedLayerId}>
              <span aria-hidden="true">🔁</span>
              {t('toolbar.replaceSelected')}
            </IconButton>
          )}
        </div>

        {hasImage && (
          <>
            <p className="mt-3 text-xs leading-relaxed text-ink-muted">
              {layers.length === 1
                ? t('toolbar.collageHintSingle')
                : t('toolbar.collageHintMultiple', { count: layers.length })}
            </p>

            <ul className="mt-2 flex flex-wrap gap-1.5">
              {layers.map((layer, index) => (
                <li
                  key={layer.id}
                  className={`flex items-center gap-1 rounded-full border pl-1 pr-0.5 py-0.5 text-xs font-medium transition-colors ${
                    layer.id === selectedLayerId
                      ? 'border-primary bg-primary/15 text-ink'
                      : 'border-border bg-surface-2 text-ink-muted'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => {
                      playClick()
                      onSelectLayer(layer.id)
                    }}
                    className="flex items-center gap-1.5 rounded-full px-2 py-1 transition-colors hover:text-ink"
                  >
                    <span aria-hidden="true">🖼️</span>
                    {t('toolbar.imageLabel', { index: index + 1 })}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      playClick()
                      onRemoveLayer(layer.id)
                    }}
                    aria-label={t('toolbar.removeImageAria', { index: index + 1 })}
                    className="rounded-full px-1.5 py-1 text-ink-muted transition-colors hover:text-danger"
                  >
                    ✕
                  </button>
                </li>
              ))}
            </ul>

            {layers.length >= maxLayers && (
              <p className="mt-2 text-[11px] text-ink-muted">{t('toolbar.maxReached', { max: maxLayers })}</p>
            )}
          </>
        )}
      </div>

      <div className={selectedTransform ? '' : 'pointer-events-none opacity-40'} aria-disabled={!selectedTransform}>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-muted">{t('toolbar.positioningHeading')}</h2>
        {layers.length > 1 && selectedTransform && (
          <p className="mt-1 text-[11px] text-ink-muted">{t('toolbar.positioningHint')}</p>
        )}

        <div className="mt-3 space-y-4">
          <div>
            <div className="mb-1 flex items-center justify-between text-xs text-ink-muted">
              <label htmlFor="scale-range">{t('toolbar.sizeLabel')}</label>
              <span className="font-mono text-ink">{scalePercent}%</span>
            </div>
            <input
              id="scale-range"
              type="range"
              min={MIN_SCALE}
              max={MAX_SCALE}
              step={0.01}
              value={selectedTransform?.scale ?? 1}
              onChange={(e) => onScaleChange(Number(e.target.value))}
              disabled={!selectedTransform}
            />
          </div>

          <div>
            <div className="mb-1 flex items-center justify-between text-xs text-ink-muted">
              <label htmlFor="rotation-range">{t('toolbar.rotationLabel')}</label>
              <span className="font-mono text-ink">{Math.round(selectedTransform?.rotation ?? 0)}°</span>
            </div>
            <input
              id="rotation-range"
              type="range"
              min={-180}
              max={180}
              step={1}
              value={selectedTransform?.rotation ?? 0}
              onChange={(e) => onRotationChange(Number(e.target.value))}
              disabled={!selectedTransform}
            />
            <div className="mt-2 flex gap-2">
              <IconButton className="flex-1 py-1.5 text-xs" onClick={() => onQuickRotate(-90)} disabled={!selectedTransform}>
                ↺ -90°
              </IconButton>
              <IconButton className="flex-1 py-1.5 text-xs" onClick={() => onQuickRotate(90)} disabled={!selectedTransform}>
                ↻ +90°
              </IconButton>
            </div>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <IconButton onClick={onCenterAndFit} disabled={!selectedTransform}>
            <span aria-hidden="true">🎯</span>
            {t('toolbar.centerAndFit')}
          </IconButton>
          <IconButton onClick={onReset} disabled={!selectedTransform}>
            <span aria-hidden="true">↺</span>
            {t('toolbar.reset')}
          </IconButton>
        </div>
      </div>

      <div>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-muted">{t('toolbar.precisionHeading')}</h2>
        <label className="mt-3 flex cursor-pointer items-center justify-between rounded-xl border border-border bg-surface-2 px-3 py-2 text-sm text-ink">
          <span>{t('toolbar.showGrid')}</span>
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
        <p className="mt-2 text-xs leading-relaxed text-ink-muted">{t('toolbar.instructions')}</p>
      </div>
    </div>
  )
}
