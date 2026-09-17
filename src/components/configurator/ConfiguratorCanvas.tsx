import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type {
  DragEvent,
  KeyboardEvent as ReactKeyboardEvent,
  PointerEvent as ReactPointerEvent,
  ReactElement,
} from 'react'
import type { ProductConfig } from '../../types/product'
import type { ImageLayer } from '../../types/layers'
import type { ImageTransform } from '../../hooks/useImageTransform'
import { clampScale, normalizeRotation } from '../../hooks/useImageTransform'
import { clipAreaToCssClipPath, clipAreaToSvgPath, getClipAreaCenter, simpleClipAreaToCssClipPath } from '../../utils/clipShapes'
import UploadPrompt from './UploadPrompt'
import { playSnap } from '../../utils/sound'
import { useLanguage } from '../../i18n/LanguageContext'

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
  /** Immagini trascinate sul configuratore: ne vengono accettate più di una alla volta, come dall'input file. */
  onFilesSelected: (files: File[]) => void
  onRequestUpload: () => void
  /** Quando true, nasconde temporaneamente il collage e la griglia di editing per mostrare la foto originale del prodotto (confronto prima/dopo). */
  previewOriginal: boolean
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

function ConfiguratorCanvas({
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
  onFilesSelected,
  onRequestUpload,
  previewOriginal,
}: ConfiguratorCanvasProps) {
  const { t } = useLanguage()
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
  // I ritagli dei fori dipendono solo dal prodotto: memorizzarli su
  // `product.clipArea` (e non su un array ricreato a ogni render, come
  // avveniva prima) fa sì che la memoizzazione serva davvero — su Game Boy
  // Color e Advance sono percorsi da centinaia di punti, ricalcolati fino a
  // sessanta volte al secondo durante un trascinamento.
  const holeClipPaths = useMemo(() => {
    const holes = product.clipArea.type === 'compound' ? product.clipArea.holes : []
    return holes.map((hole) => simpleClipAreaToCssClipPath(hole, product.canvas))
  }, [product.clipArea, product.canvas])
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

  // --- Drag & drop file (aggiunge sempre NUOVI strati al collage) --------
  //
  // `dragenter`/`dragleave` scattano anche passando da un elemento figlio
  // all'altro dentro lo stesso riquadro: contando quante volte si entra e si
  // esce, l'evidenziazione si spegne solo quando il puntatore lascia davvero
  // l'area (prima sfarfallava a ogni passaggio sopra un'immagine o una
  // maniglia).
  const dragDepthRef = useRef(0)

  const handleDragEnter = (e: DragEvent) => {
    if (!e.dataTransfer.types.includes('Files')) return
    dragDepthRef.current += 1
    setIsDraggingFile(true)
  }
  const handleDragOver = (e: DragEvent) => {
    // Necessario perché il browser consideri quest'area una destinazione valida.
    e.preventDefault()
  }
  const handleDragLeave = () => {
    dragDepthRef.current = Math.max(0, dragDepthRef.current - 1)
    if (dragDepthRef.current === 0) setIsDraggingFile(false)
  }
  const handleDrop = (e: DragEvent) => {
    e.preventDefault()
    dragDepthRef.current = 0
    setIsDraggingFile(false)
    // Si accettano tutte le immagini trascinate insieme, esattamente come
    // dall'input file (che è `multiple`): prima ne veniva presa solo la prima
    // e le altre sparivano senza alcun messaggio. La validazione di formato e
    // dimensione resta a chi le riceve, così un file non valido produce il
    // solito messaggio d'errore tradotto invece di sparire in silenzio.
    const files = Array.from(e.dataTransfer.files ?? [])
    if (files.length > 0) onFilesSelected(files)
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
  //
  // Il listener va registrato a mano, e NON con la prop `onWheel` di React:
  // React registra gli eventi `wheel` in modalità "passive", nella quale il
  // browser ignora `preventDefault()`. Il risultato era che girando la
  // rotellina l'immagine veniva ingrandita ma la pagina scorreva comunque
  // sotto al puntatore, con un avviso in console.
  //
  // Con `{ passive: false }` il comportamento è quello atteso: quando c'è
  // un'immagine selezionata la rotellina ingrandisce e la pagina resta ferma;
  // quando non c'è nulla di selezionato (o si sta confrontando con
  // l'originale) la pagina scorre normalmente, come su qualunque altro sito.
  const wheelStateRef = useRef({ selectedLayerId, previewOriginal })
  wheelStateRef.current = { selectedLayerId, previewOriginal }

  useEffect(() => {
    const element = wrapperRef.current
    if (!element) return

    const handleWheel = (event: globalThis.WheelEvent) => {
      const { selectedLayerId: activeId, previewOriginal: isPreviewing } = wheelStateRef.current
      if (!activeId || isPreviewing) return
      event.preventDefault()
      const factor = Math.exp(-event.deltaY * 0.0015)
      onUpdateLayerTransform(activeId, (transform) => ({ ...transform, scale: clampScale(transform.scale * factor) }))
    }

    element.addEventListener('wheel', handleWheel, { passive: false })
    return () => element.removeEventListener('wheel', handleWheel)
  }, [onUpdateLayerTransform])

  const handleWrapperPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!debugCoordinates) return
    setDebugPos(toNative(e.clientX, e.clientY))
  }

  const handleEmptyAreaClick = () => {
    if (previewOriginal) return
    if (layers.length === 0) {
      onRequestUpload()
    } else {
      onSelectLayer(null)
    }
  }

  const showCollage = layers.length > 0 && !previewOriginal
  /** L'area di ritaglio si comporta da pulsante di caricamento solo finché il collage è vuoto. */
  const isUploadArea = layers.length === 0 && !previewOriginal

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
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onPointerMove={handleWrapperPointerMove}
      >
        {/* 1. Immagine di base del prodotto */}
        {baseImageEl ? (
          <img
            src={baseImageEl.src}
            alt=""
            aria-hidden="true"
            draggable={false}
            width={nativeW}
            height={nativeH}
            className="pointer-events-none absolute inset-0 h-full w-full select-none object-cover"
          />
        ) : (
          <div className="absolute inset-0 animate-pulse bg-surface-2" />
        )}

        {/* 2. Area ritagliata (solo contorno esterno): tutti gli strati del
            collage, nell'ordine in cui sono stati aggiunti, oppure l'invito
            al caricamento se non c'è ancora nessuna immagine. */}
        {/* Quando non c'è ancora nessuna immagine quest'area È il pulsante di
            caricamento: va quindi resa raggiungibile da tastiera (Tab, poi
            Invio o Barra spaziatrice) e annunciata come tale. Con il collage
            già avviato il clic serve solo a deselezionare — azione che da
            tastiera è già coperta dal tasto Esc — quindi resta un semplice
            contenitore, senza intercettare il percorso di navigazione. */}
        <div
          className={previewOriginal ? 'absolute inset-0' : 'absolute inset-0 cursor-pointer'}
          style={{
            clipPath: clipPathCss,
            backgroundColor: previewOriginal || showCollage || isCompoundClip ? undefined : product.emptyAreaColor,
            fontSize: 'clamp(10px, 2.6cqw, 22px)',
          }}
          onClick={handleEmptyAreaClick}
          {...(isUploadArea
            ? {
                role: 'button',
                tabIndex: 0,
                'aria-label': t('configuratorCanvas.uploadAria'),
                onKeyDown: (event: ReactKeyboardEvent<HTMLDivElement>) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault()
                    onRequestUpload()
                  }
                },
              }
            : {})}
        >
          {showCollage ? (
            layers.map((layer, index) => (
              <img
                key={layer.id}
                src={layer.image.element.src}
                alt={t('configuratorCanvas.layerAlt', { index: index + 1 })}
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
          ) : previewOriginal ? null : (
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

        {/* 5. Overlay di editing: griglia, guide, contorno e maniglie (nascosto durante il confronto con l'originale) */}
        {!previewOriginal && (
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
        )}

        {debugCoordinates && debugPos && !previewOriginal && (
          <div className="pointer-events-none absolute bottom-3 left-3 rounded-lg bg-black/70 px-2 py-1 font-mono text-xs text-accent">
            x: {Math.round(debugPos.x)}, y: {Math.round(debugPos.y)}
          </div>
        )}

        {previewOriginal && (
          <div
            aria-hidden="true"
            className="glass-surface pointer-events-none absolute left-3 top-3 rounded-full border border-border/60 px-3 py-1 text-xs font-semibold text-ink"
          >
            👁️
          </div>
        )}
      </div>
    </div>
  )
}

/**
 * `memo`: il componente padre aggiorna lo stato a ogni movimento del dito
 * durante un trascinamento. Senza memoizzazione anche i pannelli vicini
 * verrebbero ricalcolati insieme a questo; con `memo` il canvas si ridisegna
 * solo quando cambia davvero qualcosa che lo riguarda.
 */
export default memo(ConfiguratorCanvas)
