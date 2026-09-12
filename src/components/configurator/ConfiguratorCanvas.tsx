import { useCallback, useMemo, useRef, useState } from 'react'
import type { DragEvent, PointerEvent as ReactPointerEvent, ReactElement, WheelEvent } from 'react'
import type { ProductConfig } from '../../types/product'
import type { ImageLayer } from '../../types/layers'
import type { ImageTransform } from '../../hooks/useImageTransform'
import { clampScale, normalizeRotation } from '../../hooks/useImageTransform'
import { clipAreaToCssClipPath, clipAreaToSvgPath, getClipAreaCenter, simpleClipAreaToCssClipPath } from '../../utils/clipShapes'
import UploadPrompt from './UploadPrompt'
import { playSnap } from '../../utils/sound'

interface ConfiguratorCanvasProps {
  product: ProductConfig
  baseImageEl: HTMLImageElement | null
  overlayImageEl: HTMLImageElement | null
  /** Tutti gli strati del collage, nell'ordine in cui sono stati aggiunti (l'ultimo è quello visivamente sopra). */
  layers: ImageLayer[]
  selectedLayerId: string | null
  onSelectLayer: (id: string | null) => void
  onUpdateLayerTransform: (id: string, updater: (transform: ImageTransform) => ImageTransform) => void
  showGrid: boolean
  debugCoordinates: boolean
  errorMessage: string | null
  onFileSelected: (file: File) => void
  onRequestUpload: () => void
}

const SNAP_THRESHOLD = 14 // px nativi
const HANDLE_RADIUS_RATIO = 0.022 // rispetto alla larghezza nativa del canvas
const ROTATE_HANDLE_GAP_RATIO = 0.05

function distance(a: { x: number; y: number }, b: { x: number; y: number }): number {
  return Math.hypot(b.x - a.x, b.y - a.y)
}

function angleBetweenDeg(a: { x: number; y: number }, b: { x: number; y: number }): number {
  return (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI
}

/** Trasforma un punto espresso in coordinate LOCALI dell'immagine (origine al centro) in coordinate dello stage. */
function localToStage(lx: number, ly: number, t: ImageTransform): { x: number; y: number } {
  const rad = (t.rotation * Math.PI) / 180
  const sx = lx * t.scale
  const sy = ly * t.scale
  const rx = sx * Math.cos(rad) - sy * Math.sin(rad)
  const ry = sx * Math.sin(rad) + sy * Math.cos(rad)
  return { x: t.x + rx, y: t.y + ry }
}

type InteractionMode = 'idle' | 'move' | 'pinch'

export default function ConfiguratorCanvas({
  product,
  baseImageEl,
  overlayImageEl,
  layers,
  selectedLayerId,
  onSelectLayer,
  onUpdateLayerTransform,
  showGrid,
  debugCoordinates,
  errorMessage,
  onFileSelected,
  onRequestUpload,
}: ConfiguratorCanvasProps) {
  const wrapperRef = useRef<HTMLDivElement>(null)
  const [isDraggingFile, setIsDraggingFile] = useState(false)
  const [isInteracting, setIsInteracting] = useState(false)
  const [snap, setSnap] = useState({ x: false, y: false })
  const [debugPos, setDebugPos] = useState<{ x: number; y: number } | null>(null)

  const pointersRef = useRef(new Map<number, { x: number; y: number }>())
  const modeRef = useRef<InteractionMode>('idle')
  // Lo strato attualmente manipolato dal gesto in corso (trascinamento o
  // pizzico): può essere diverso dallo strato "selezionato" solo per
  // l'istante tra il pointerdown e l'aggiornamento dello stato React.
  const activeLayerIdRef = useRef<string | null>(null)
  const moveStartRef = useRef<{ pointer: { x: number; y: number }; x: number; y: number } | null>(null)
  const pinchStartRef = useRef<{ dist: number; angle: number; scale: number; rotation: number } | null>(null)
  const scaleDragPointerId = useRef<number | null>(null)
  const rotateDragPointerId = useRef<number | null>(null)

  const { width: nativeW, height: nativeH } = product.canvas

  const toNative = useCallback(
    (clientX: number, clientY: number) => {
      const el = wrapperRef.current
      if (!el) return { x: 0, y: 0 }
      const rect = el.getBoundingClientRect()
      const scale = rect.width / nativeW
      return { x: (clientX - rect.left) / scale, y: (clientY - rect.top) / scale }
    },
    [nativeW],
  )

  // Le clip area "compound" (contorno + fori, es. scocca di una console che
  // deve escludere schermo e pulsanti) NON si ritagliano con un'unica
  // regola CSS "contorno meno fori": si applica il ritaglio del solo
  // CONTORNO ESTERNO a tutti gli strati del collage, e per ogni foro si
  // ridisegna sopra — con il suo stesso identico ritaglio CSS, stavolta
  // semplice — un frammento della foto originale del prodotto.
  const isCompoundClip = product.clipArea.type === 'compound'
  const holes = product.clipArea.type === 'compound' ? product.clipArea.holes : []
  const holeClipPaths = useMemo(
    () => holes.map((hole) => simpleClipAreaToCssClipPath(hole, product.canvas)),
    [holes, product.canvas],
  )
  const clipPathCss = useMemo(() => clipAreaToCssClipPath(product.clipArea, product.canvas), [product])
  const clipOutlineD = useMemo(() => clipAreaToSvgPath(product.clipArea), [product])
  const clipCenter = useMemo(() => getClipAreaCenter(product.clipArea), [product])

  const handleRadius = nativeW * HANDLE_RADIUS_RATIO
  const rotateGap = nativeW * ROTATE_HANDLE_GAP_RATIO

  const selectedLayer = useMemo(
    () => layers.find((l) => l.id === selectedLayerId) ?? null,
    [layers, selectedLayerId],
  )

  const corners = useMemo(() => {
    if (!selectedLayer) return []
    const hw = selectedLayer.image.width / 2
    const hh = selectedLayer.image.height / 2
    return [
      localToStage(-hw, -hh, selectedLayer.transform),
      localToStage(hw, -hh, selectedLayer.transform),
      localToStage(hw, hh, selectedLayer.transform),
      localToStage(-hw, hh, selectedLayer.transform),
    ]
  }, [selectedLayer])

  const rotateHandlePos = useMemo(() => {
    if (!selectedLayer) return null
    const rad = (selectedLayer.transform.rotation * Math.PI) / 180
    const halfH = (selectedLayer.image.height / 2) * selectedLayer.transform.scale
    const dist = halfH + rotateGap
    const upX = Math.sin(rad)
    const upY = -Math.cos(rad)
    return { x: selectedLayer.transform.x + upX * dist, y: selectedLayer.transform.y + upY * dist }
  }, [selectedLayer, rotateGap])

  // --- Drag & drop file (aggiunge sempre un NUOVO strato al collage) -----
  const handleDragOver = (e: DragEvent) => {
    e.preventDefault()
    if (e.dataTransfer.types.includes('Files')) setIsDraggingFile(true)
  }
  const handleDragLeave = () => setIsDraggingFile(false)
  const handleDrop = (e: DragEvent) => {
    e.preventDefault()
    setIsDraggingFile(false)
    const file = e.dataTransfer.files?.[0]
    if (file) onFileSelected(file)
  }

  // --- Sposta / pizzica uno strato (drag a un dito, pinch a due dita) -----
  const handleLayerPointerDown = (layerId: string) => (e: ReactPointerEvent<SVGRectElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId)
    onSelectLayer(layerId)
    const native = toNative(e.clientX, e.clientY)
    pointersRef.current.set(e.pointerId, native)
    setIsInteracting(true)

    if (pointersRef.current.size === 1) {
      activeLayerIdRef.current = layerId
      modeRef.current = 'move'
      const layer = layers.find((l) => l.id === layerId)
      moveStartRef.current = layer ? { pointer: native, x: layer.transform.x, y: layer.transform.y } : null
    } else if (pointersRef.current.size >= 2) {
      // Il pizzico a due dita agisce sempre sullo strato scelto dal PRIMO
      // dito, anche se il secondo tocca (per errore) un altro strato
      // sottostante: è il comportamento naturale quando si sta già
      // manipolando un'immagine.
      const activeLayer = layers.find((l) => l.id === activeLayerIdRef.current)
      if (!activeLayer) return
      const pts = Array.from(pointersRef.current.values()).slice(0, 2)
      modeRef.current = 'pinch'
      pinchStartRef.current = {
        dist: distance(pts[0], pts[1]),
        angle: angleBetweenDeg(pts[0], pts[1]),
        scale: activeLayer.transform.scale,
        rotation: activeLayer.transform.rotation,
      }
    }
  }

  const handleSurfacePointerMove = (e: ReactPointerEvent<SVGRectElement>) => {
    if (!pointersRef.current.has(e.pointerId)) return
    const native = toNative(e.clientX, e.clientY)
    pointersRef.current.set(e.pointerId, native)
    if (debugCoordinates) setDebugPos(native)

    const activeId = activeLayerIdRef.current
    if (!activeId) return

    if (modeRef.current === 'move' && moveStartRef.current) {
      const dx = native.x - moveStartRef.current.pointer.x
      const dy = native.y - moveStartRef.current.pointer.y
      let nx = moveStartRef.current.x + dx
      let ny = moveStartRef.current.y + dy
      const snappedX = Math.abs(nx - clipCenter.x) < SNAP_THRESHOLD
      const snappedY = Math.abs(ny - clipCenter.y) < SNAP_THRESHOLD
      if (snappedX) nx = clipCenter.x
      if (snappedY) ny = clipCenter.y
      if ((snappedX && !snap.x) || (snappedY && !snap.y)) playSnap()
      setSnap({ x: snappedX, y: snappedY })
      onUpdateLayerTransform(activeId, (t) => ({ ...t, x: nx, y: ny }))
    } else if (modeRef.current === 'pinch' && pinchStartRef.current && pointersRef.current.size >= 2) {
      const pts = Array.from(pointersRef.current.values()).slice(0, 2)
      const currentDist = distance(pts[0], pts[1])
      const currentAngle = angleBetweenDeg(pts[0], pts[1])
      const factor = currentDist / (pinchStartRef.current.dist || 1)
      const nextScale = pinchStartRef.current.scale * factor
      const nextRotation = pinchStartRef.current.rotation + (currentAngle - pinchStartRef.current.angle)
      onUpdateLayerTransform(activeId, (t) => ({ ...t, scale: clampScale(nextScale), rotation: normalizeRotation(nextRotation) }))
    }
  }

  const handleSurfacePointerEnd = (e: ReactPointerEvent<SVGRectElement>) => {
    pointersRef.current.delete(e.pointerId)
    setSnap({ x: false, y: false })
    if (pointersRef.current.size === 0) {
      modeRef.current = 'idle'
      setIsInteracting(false)
      activeLayerIdRef.current = null
    } else {
      const remaining = Array.from(pointersRef.current.values())[0]
      const activeLayer = layers.find((l) => l.id === activeLayerIdRef.current)
      modeRef.current = 'move'
      moveStartRef.current = activeLayer ? { pointer: remaining, x: activeLayer.transform.x, y: activeLayer.transform.y } : null
    }
  }

  // --- Maniglia d'angolo (scala uniforme) — solo sullo strato selezionato --
  const handleCornerPointerDown = (e: ReactPointerEvent<SVGCircleElement>) => {
    if (!selectedLayer) return
    e.stopPropagation()
    e.currentTarget.setPointerCapture(e.pointerId)
    scaleDragPointerId.current = e.pointerId
    setIsInteracting(true)
  }
  const handleCornerPointerMove = (e: ReactPointerEvent<SVGCircleElement>) => {
    if (scaleDragPointerId.current !== e.pointerId || !selectedLayer) return
    const native = toNative(e.clientX, e.clientY)
    if (debugCoordinates) setDebugPos(native)
    const dx = native.x - selectedLayer.transform.x
    const dy = native.y - selectedLayer.transform.y
    const dist = Math.hypot(dx, dy)
    const cornerLocalDist = Math.hypot(selectedLayer.image.width / 2, selectedLayer.image.height / 2) || 1
    const id = selectedLayer.id
    onUpdateLayerTransform(id, (t) => ({ ...t, scale: clampScale(dist / cornerLocalDist) }))
  }
  const handleCornerPointerEnd = (e: ReactPointerEvent<SVGCircleElement>) => {
    if (scaleDragPointerId.current === e.pointerId) scaleDragPointerId.current = null
    if (pointersRef.current.size === 0) setIsInteracting(false)
  }

  // --- Maniglia di rotazione — solo sullo strato selezionato --------------
  const handleRotatePointerDown = (e: ReactPointerEvent<SVGCircleElement>) => {
    if (!selectedLayer) return
    e.stopPropagation()
    e.currentTarget.setPointerCapture(e.pointerId)
    rotateDragPointerId.current = e.pointerId
    setIsInteracting(true)
  }
  const handleRotatePointerMove = (e: ReactPointerEvent<SVGCircleElement>) => {
    if (rotateDragPointerId.current !== e.pointerId || !selectedLayer) return
    const native = toNative(e.clientX, e.clientY)
    if (debugCoordinates) setDebugPos(native)
    const dx = native.x - selectedLayer.transform.x
    const dy = native.y - selectedLayer.transform.y
    const angleDeg = (Math.atan2(dy, dx) * 180) / Math.PI
    const id = selectedLayer.id
    onUpdateLayerTransform(id, (t) => ({ ...t, rotation: normalizeRotation(angleDeg + 90) }))
  }
  const handleRotatePointerEnd = (e: ReactPointerEvent<SVGCircleElement>) => {
    if (rotateDragPointerId.current === e.pointerId) rotateDragPointerId.current = null
    if (pointersRef.current.size === 0) setIsInteracting(false)
  }

  // --- Rotellina del mouse (zoom desktop) — sullo strato selezionato ------
  const handleWheel = (e: WheelEvent) => {
    if (!selectedLayer) return
    e.preventDefault()
    const factor = Math.exp(-e.deltaY * 0.0015)
    const id = selectedLayer.id
    onUpdateLayerTransform(id, (t) => ({ ...t, scale: clampScale(t.scale * factor) }))
  }

  const handleWrapperPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!debugCoordinates) return
    setDebugPos(toNative(e.clientX, e.clientY))
  }

  const handleEmptyAreaClick = () => {
    if (layers.length === 0) {
      onRequestUpload()
    } else {
      onSelectLayer(null)
    }
  }

  const gridLines = useMemo(() => {
    if (!showGrid) return null
    const lines: ReactElement[] = []
    const steps = 10
    for (let i = 1; i < steps; i++) {
      const isCenter = i === steps / 2
      const x = (nativeW / steps) * i
      const y = (nativeH / steps) * i
      lines.push(
        <line
          key={`v${i}`}
          x1={x}
          y1={0}
          x2={x}
          y2={nativeH}
          stroke="#ffffff"
          strokeOpacity={isCenter ? 0.35 : 0.12}
          strokeWidth={isCenter ? nativeW * 0.0015 : nativeW * 0.0008}
        />,
      )
      lines.push(
        <line
          key={`h${i}`}
          x1={0}
          y1={y}
          x2={nativeW}
          y2={y}
          stroke="#ffffff"
          strokeOpacity={isCenter ? 0.35 : 0.12}
          strokeWidth={isCenter ? nativeH * 0.0015 : nativeH * 0.0008}
        />,
      )
    }
    return lines
  }, [showGrid, nativeW, nativeH])

  return (
    <div className="w-full">
      <div
        ref={wrapperRef}
        className="relative w-full touch-none select-none overflow-hidden rounded-[2rem] border border-border bg-surface shadow-2xl"
        style={{ aspectRatio: `${nativeW} / ${nativeH}`, containerType: 'inline-size' }}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onWheel={handleWheel}
        onPointerMove={handleWrapperPointerMove}
      >
        {/* 1. Immagine di base del prodotto */}
        {baseImageEl ? (
          <img
            src={baseImageEl.src}
            alt=""
            aria-hidden="true"
            draggable={false}
            className="pointer-events-none absolute inset-0 h-full w-full select-none object-cover"
          />
        ) : (
          <div className="absolute inset-0 animate-pulse bg-surface-2" />
        )}

        {/* 2. Area ritagliata (solo contorno esterno): tutti gli strati del
            collage, nell'ordine in cui sono stati aggiunti, oppure l'invito
            al caricamento se non c'è ancora nessuna immagine. */}
        <div
          className="absolute inset-0 cursor-pointer"
          style={{
            clipPath: clipPathCss,
            backgroundColor: layers.length > 0 || isCompoundClip ? undefined : product.emptyAreaColor,
            fontSize: 'clamp(10px, 2.6cqw, 22px)',
          }}
          onClick={handleEmptyAreaClick}
        >
          {layers.length > 0 ? (
            layers.map((layer) => (
              <img
                key={layer.id}
                src={layer.image.element.src}
                alt="La tua immagine personalizzata"
                draggable={false}
                className="absolute"
                style={{
                  left: `${(layer.transform.x / nativeW) * 100}%`,
                  top: `${(layer.transform.y / nativeH) * 100}%`,
                  width: `${(layer.image.width / nativeW) * 100}%`,
                  height: `${(layer.image.height / nativeH) * 100}%`,
                  transform: `translate(-50%, -50%) rotate(${layer.transform.rotation}deg) scale(${layer.transform.scale})`,
                  transformOrigin: 'center center',
                  maxWidth: 'none',
                }}
              />
            ))
          ) : (
            <UploadPrompt isDraggingFile={isDraggingFile} errorMessage={errorMessage} compact={isCompoundClip} />
          )}
        </div>

        {/* 3. Fori (schermo, D-pad, pulsanti...): ridisegnano sopra un ritaglio
            della FOTO ORIGINALE del prodotto, "richiudendo" quelle aree così
            che nessuno strato del collage vi compaia mai — nessuna immagine
            viene mai deformata: tutte restano alla stessa scala 1:1
            dell'intero prodotto, cambia solo quale porzione è visibile. */}
        {baseImageEl &&
          holeClipPaths.map((holeClip, i) => (
            <img
              key={i}
              src={baseImageEl.src}
              alt=""
              aria-hidden="true"
              draggable={false}
              className="pointer-events-none absolute inset-0 h-full w-full select-none object-cover"
              style={{ clipPath: holeClip }}
            />
          ))}

        {/* 4. Eventuale livello sopra (vetro/riflesso), non interattivo */}
        {overlayImageEl && (
          <img
            src={overlayImageEl.src}
            alt=""
            aria-hidden="true"
            draggable={false}
            className="pointer-events-none absolute inset-0 h-full w-full select-none object-cover"
          />
        )}

        {/* 5. Overlay di editing: griglia, guide, contorno e maniglie */}
        <svg
          className="absolute inset-0 h-full w-full"
          viewBox={`0 0 ${nativeW} ${nativeH}`}
          style={{ pointerEvents: 'none' }}
        >
          {/* Una superficie interattiva per OGNI strato, nello stesso ordine
              di sovrapposizione delle immagini: in SVG l'elemento disegnato
              per ultimo riceve per primo i click nelle zone di sovrapposizione,
              quindi non serve alcun hit-test manuale — clic e trascinamento
              "prendono" sempre lo strato visivamente più in alto in quel punto. */}
          {layers.map((layer) => (
            <rect
              key={layer.id}
              x={-layer.image.width / 2}
              y={-layer.image.height / 2}
              width={layer.image.width}
              height={layer.image.height}
              transform={`translate(${layer.transform.x} ${layer.transform.y}) rotate(${layer.transform.rotation}) scale(${layer.transform.scale})`}
              fill="transparent"
              style={{
                pointerEvents: 'all',
                cursor: isInteracting && layer.id === selectedLayerId ? 'grabbing' : 'grab',
                touchAction: 'none',
              }}
              onPointerDown={handleLayerPointerDown(layer.id)}
              onPointerMove={handleSurfacePointerMove}
              onPointerUp={handleSurfacePointerEnd}
              onPointerCancel={handleSurfacePointerEnd}
            />
          ))}

          {gridLines}

          {snap.x && (
            <line x1={clipCenter.x} y1={0} x2={clipCenter.x} y2={nativeH} stroke="#e8b04b" strokeWidth={nativeW * 0.0025} strokeDasharray={`${nativeW * 0.01} ${nativeW * 0.008}`} />
          )}
          {snap.y && (
            <line x1={0} y1={clipCenter.y} x2={nativeW} y2={clipCenter.y} stroke="#e8b04b" strokeWidth={nativeH * 0.0025} strokeDasharray={`${nativeH * 0.01} ${nativeH * 0.008}`} />
          )}

          <path
            d={clipOutlineD}
            fill="none"
            stroke="#ffffff"
            strokeOpacity={0.55}
            strokeWidth={Math.max(2, nativeW * 0.0018)}
            strokeDasharray={`${nativeW * 0.012} ${nativeW * 0.008}`}
          />

          {selectedLayer && corners.length === 4 && (
            <>
              {/* Contorno tratteggiato che evidenzia quale strato è selezionato: con più immagini nel collage, serve a capire subito quale si sta per spostare/ridimensionare. */}
              <polygon
                points={corners.map((c) => `${c.x},${c.y}`).join(' ')}
                fill="none"
                stroke="#e8b04b"
                strokeOpacity={0.85}
                strokeWidth={Math.max(2, nativeW * 0.0022)}
                strokeDasharray={`${nativeW * 0.01} ${nativeW * 0.007}`}
              />

              {rotateHandlePos && (
                <line
                  x1={selectedLayer.transform.x}
                  y1={selectedLayer.transform.y}
                  x2={rotateHandlePos.x}
                  y2={rotateHandlePos.y}
                  stroke="#ffffff"
                  strokeOpacity={0.6}
                  strokeWidth={nativeW * 0.0015}
                />
              )}
              {corners.map((corner, i) => (
                <circle
                  key={i}
                  cx={corner.x}
                  cy={corner.y}
                  r={handleRadius}
                  fill="#ffffff"
                  stroke="#c1272d"
                  strokeWidth={handleRadius * 0.25}
                  style={{ pointerEvents: 'all', cursor: 'nwse-resize', touchAction: 'none' }}
                  onPointerDown={handleCornerPointerDown}
                  onPointerMove={handleCornerPointerMove}
                  onPointerUp={handleCornerPointerEnd}
                  onPointerCancel={handleCornerPointerEnd}
                />
              ))}
              {rotateHandlePos && (
                <circle
                  cx={rotateHandlePos.x}
                  cy={rotateHandlePos.y}
                  r={handleRadius}
                  fill="#e8b04b"
                  stroke="#ffffff"
                  strokeWidth={handleRadius * 0.25}
                  style={{ pointerEvents: 'all', cursor: 'grab', touchAction: 'none' }}
                  onPointerDown={handleRotatePointerDown}
                  onPointerMove={handleRotatePointerMove}
                  onPointerUp={handleRotatePointerEnd}
                  onPointerCancel={handleRotatePointerEnd}
                />
              )}
            </>
          )}
        </svg>

        {debugCoordinates && debugPos && (
          <div className="pointer-events-none absolute bottom-3 left-3 rounded-lg bg-black/70 px-2 py-1 font-mono text-xs text-accent">
            x: {Math.round(debugPos.x)}, y: {Math.round(debugPos.y)}
          </div>
        )}
      </div>
    </div>
  )
}
