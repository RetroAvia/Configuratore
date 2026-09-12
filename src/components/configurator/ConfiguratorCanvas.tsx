import { useCallback, useMemo, useRef, useState } from 'react'
import type { DragEvent, PointerEvent as ReactPointerEvent, ReactElement, WheelEvent } from 'react'
import type { ProductConfig } from '../../types/product'
import type { ImageTransform } from '../../hooks/useImageTransform'
import { clipAreaToCssClipPath, clipAreaToSvgPath, getClipAreaCenter, simpleClipAreaToCssClipPath } from '../../utils/clipShapes'
import UploadPrompt from './UploadPrompt'
import { playSnap } from '../../utils/sound'

export interface LoadedUserImage {
  /** Cambia solo quando viene caricata una nuova immagine (usato per il "reset" automatico della trasformazione). */
  key: string
  element: HTMLImageElement
  width: number
  height: number
}

interface ConfiguratorCanvasProps {
  product: ProductConfig
  baseImageEl: HTMLImageElement | null
  overlayImageEl: HTMLImageElement | null
  userImage: LoadedUserImage | null
  transform: ImageTransform
  setPosition: (x: number, y: number) => void
  setScale: (updater: number | ((scale: number) => number)) => void
  setRotation: (updater: number | ((rotation: number) => number)) => void
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
  userImage,
  transform,
  setPosition,
  setScale,
  setRotation,
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
  // CONTORNO ESTERNO all'immagine dell'utente, e per ogni foro si ridisegna
  // sopra — con il suo stesso identico ritaglio CSS, stavolta semplice — un
  // frammento della foto originale del prodotto. Il risultato visivo è
  // identico a un "contorno meno fori", ma senza le fragilità di una
  // regola evenodd su un unico path con centinaia di punti.
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

  const corners = useMemo(() => {
    if (!userImage) return []
    const hw = userImage.width / 2
    const hh = userImage.height / 2
    return [
      localToStage(-hw, -hh, transform),
      localToStage(hw, -hh, transform),
      localToStage(hw, hh, transform),
      localToStage(-hw, hh, transform),
    ]
  }, [userImage, transform])

  const rotateHandlePos = useMemo(() => {
    if (!userImage) return null
    const rad = (transform.rotation * Math.PI) / 180
    const halfH = (userImage.height / 2) * transform.scale
    const dist = halfH + rotateGap
    const upX = Math.sin(rad)
    const upY = -Math.cos(rad)
    return { x: transform.x + upX * dist, y: transform.y + upY * dist }
  }, [userImage, transform, rotateGap])

  // --- Drag & drop file --------------------------------------------------
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

  // --- Sposta / pizzica (drag a un dito, pinch a due dita) ----------------
  const handleSurfacePointerDown = (e: ReactPointerEvent<SVGRectElement>) => {
    if (!userImage) return
    e.currentTarget.setPointerCapture(e.pointerId)
    const native = toNative(e.clientX, e.clientY)
    pointersRef.current.set(e.pointerId, native)
    setIsInteracting(true)

    if (pointersRef.current.size === 1) {
      modeRef.current = 'move'
      moveStartRef.current = { pointer: native, x: transform.x, y: transform.y }
    } else if (pointersRef.current.size >= 2) {
      const pts = Array.from(pointersRef.current.values()).slice(0, 2)
      modeRef.current = 'pinch'
      pinchStartRef.current = {
        dist: distance(pts[0], pts[1]),
        angle: angleBetweenDeg(pts[0], pts[1]),
        scale: transform.scale,
        rotation: transform.rotation,
      }
    }
  }

  const handleSurfacePointerMove = (e: ReactPointerEvent<SVGRectElement>) => {
    if (!pointersRef.current.has(e.pointerId)) return
    const native = toNative(e.clientX, e.clientY)
    pointersRef.current.set(e.pointerId, native)
    if (debugCoordinates) setDebugPos(native)

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
      setPosition(nx, ny)
    } else if (modeRef.current === 'pinch' && pinchStartRef.current && pointersRef.current.size >= 2) {
      const pts = Array.from(pointersRef.current.values()).slice(0, 2)
      const currentDist = distance(pts[0], pts[1])
      const currentAngle = angleBetweenDeg(pts[0], pts[1])
      const factor = currentDist / (pinchStartRef.current.dist || 1)
      setScale(pinchStartRef.current.scale * factor)
      setRotation(pinchStartRef.current.rotation + (currentAngle - pinchStartRef.current.angle))
    }
  }

  const handleSurfacePointerEnd = (e: ReactPointerEvent<SVGRectElement>) => {
    pointersRef.current.delete(e.pointerId)
    setSnap({ x: false, y: false })
    if (pointersRef.current.size === 0) {
      modeRef.current = 'idle'
      setIsInteracting(false)
    } else {
      const remaining = Array.from(pointersRef.current.values())[0]
      modeRef.current = 'move'
      moveStartRef.current = { pointer: remaining, x: transform.x, y: transform.y }
    }
  }

  // --- Maniglia d'angolo (scala uniforme) ---------------------------------
  const handleCornerPointerDown = (e: ReactPointerEvent<SVGCircleElement>) => {
    if (!userImage) return
    e.stopPropagation()
    e.currentTarget.setPointerCapture(e.pointerId)
    scaleDragPointerId.current = e.pointerId
    setIsInteracting(true)
  }
  const handleCornerPointerMove = (e: ReactPointerEvent<SVGCircleElement>) => {
    if (scaleDragPointerId.current !== e.pointerId || !userImage) return
    const native = toNative(e.clientX, e.clientY)
    if (debugCoordinates) setDebugPos(native)
    const dx = native.x - transform.x
    const dy = native.y - transform.y
    const dist = Math.hypot(dx, dy)
    const cornerLocalDist = Math.hypot(userImage.width / 2, userImage.height / 2) || 1
    setScale(dist / cornerLocalDist)
  }
  const handleCornerPointerEnd = (e: ReactPointerEvent<SVGCircleElement>) => {
    if (scaleDragPointerId.current === e.pointerId) scaleDragPointerId.current = null
    if (pointersRef.current.size === 0) setIsInteracting(false)
  }

  // --- Maniglia di rotazione -----------------------------------------------
  const handleRotatePointerDown = (e: ReactPointerEvent<SVGCircleElement>) => {
    if (!userImage) return
    e.stopPropagation()
    e.currentTarget.setPointerCapture(e.pointerId)
    rotateDragPointerId.current = e.pointerId
    setIsInteracting(true)
  }
  const handleRotatePointerMove = (e: ReactPointerEvent<SVGCircleElement>) => {
    if (rotateDragPointerId.current !== e.pointerId) return
    const native = toNative(e.clientX, e.clientY)
    if (debugCoordinates) setDebugPos(native)
    const dx = native.x - transform.x
    const dy = native.y - transform.y
    const angleDeg = (Math.atan2(dy, dx) * 180) / Math.PI
    setRotation(angleDeg + 90)
  }
  const handleRotatePointerEnd = (e: ReactPointerEvent<SVGCircleElement>) => {
    if (rotateDragPointerId.current === e.pointerId) rotateDragPointerId.current = null
    if (pointersRef.current.size === 0) setIsInteracting(false)
  }

  // --- Rotellina del mouse (zoom desktop) ---------------------------------
  const handleWheel = (e: WheelEvent) => {
    if (!userImage) return
    e.preventDefault()
    const factor = Math.exp(-e.deltaY * 0.0015)
    setScale((s) => s * factor)
  }

  const handleWrapperPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!debugCoordinates) return
    setDebugPos(toNative(e.clientX, e.clientY))
  }

  const handleEmptyAreaClick = () => {
    if (!userImage) onRequestUpload()
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

        {/* 2. Area ritagliata (solo contorno esterno): immagine dell'utente oppure invito al caricamento */}
        <div
          className="absolute inset-0 cursor-pointer"
          style={{
            clipPath: clipPathCss,
            backgroundColor: userImage || isCompoundClip ? undefined : product.emptyAreaColor,
            fontSize: 'clamp(10px, 2.6cqw, 22px)',
          }}
          onClick={handleEmptyAreaClick}
        >
          {userImage ? (
            <img
              src={userImage.element.src}
              alt="La tua immagine personalizzata"
              draggable={false}
              className="absolute"
              style={{
                left: `${(transform.x / nativeW) * 100}%`,
                top: `${(transform.y / nativeH) * 100}%`,
                width: `${(userImage.width / nativeW) * 100}%`,
                height: `${(userImage.height / nativeH) * 100}%`,
                transform: `translate(-50%, -50%) rotate(${transform.rotation}deg) scale(${transform.scale})`,
                transformOrigin: 'center center',
                maxWidth: 'none',
              }}
            />
          ) : (
            <UploadPrompt isDraggingFile={isDraggingFile} errorMessage={errorMessage} compact={isCompoundClip} />
          )}
        </div>

        {/* 3. Fori (schermo, D-pad, pulsanti...): ridisegnano sopra un ritaglio
            della FOTO ORIGINALE del prodotto, "richiudendo" quelle aree così
            che l'immagine dell'utente non vi compaia mai — nessuna delle due
            immagini viene mai deformata: entrambe restano alla stessa scala
            1:1 dell'intero prodotto, cambia solo quale porzione è visibile. */}
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
          {userImage && (
            <rect
              x={0}
              y={0}
              width={nativeW}
              height={nativeH}
              fill="transparent"
              style={{ pointerEvents: 'all', cursor: isInteracting ? 'grabbing' : 'grab', touchAction: 'none' }}
              onPointerDown={handleSurfacePointerDown}
              onPointerMove={handleSurfacePointerMove}
              onPointerUp={handleSurfacePointerEnd}
              onPointerCancel={handleSurfacePointerEnd}
            />
          )}

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

          {userImage && (
            <>
              {rotateHandlePos && (
                <line
                  x1={transform.x}
                  y1={transform.y}
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
