import type { ClipShape, SimpleClipShape } from '../types/product'

/** Centro del rettangolo che racchiude una forma semplice, in coordinate del canvas. */
function simpleCenter(clip: SimpleClipShape): { x: number; y: number } {
  switch (clip.type) {
    case 'rect':
      return { x: clip.x + clip.width / 2, y: clip.y + clip.height / 2 }
    case 'ellipse':
      return { x: clip.cx, y: clip.cy }
    case 'polygon': {
      const xs = clip.points.map((p) => p[0])
      const ys = clip.points.map((p) => p[1])
      return {
        x: (Math.min(...xs) + Math.max(...xs)) / 2,
        y: (Math.min(...ys) + Math.max(...ys)) / 2,
      }
    }
  }
}

/** Larghezza/altezza del rettangolo che racchiude una forma semplice. */
function simpleBounds(clip: SimpleClipShape): { width: number; height: number } {
  switch (clip.type) {
    case 'rect':
      return { width: clip.width, height: clip.height }
    case 'ellipse':
      return { width: clip.rx * 2, height: clip.ry * 2 }
    case 'polygon': {
      const xs = clip.points.map((p) => p[0])
      const ys = clip.points.map((p) => p[1])
      return { width: Math.max(...xs) - Math.min(...xs), height: Math.max(...ys) - Math.min(...ys) }
    }
  }
}

/**
 * Centro del rettangolo che racchiude una clip area, in coordinate del canvas.
 * Per le forme composte si usa il contorno esterno: è quello che conta per
 * centrare/adattare l'immagine dell'utente e per le guide magnetiche.
 */
export function getClipAreaCenter(clip: ClipShape): { x: number; y: number } {
  return simpleCenter(clip.type === 'compound' ? clip.outer : clip)
}

/** Larghezza/altezza del rettangolo che racchiude una clip area (vedi sopra per le forme composte). */
export function getClipAreaBounds(clip: ClipShape): { width: number; height: number } {
  return simpleBounds(clip.type === 'compound' ? clip.outer : clip)
}

/**
 * Traduce una clip area nel valore CSS `clip-path` corrispondente, espresso
 * in PERCENTUALI rispetto alle dimensioni native del canvas del prodotto
 * (`ProductConfig.canvas`). Usare percentuali (anziché pixel assoluti) è
 * ciò che permette all'intero stage del configuratore di essere
 * perfettamente responsive con puro CSS, senza dover ricalcolare via
 * JavaScript un fattore di scala ad ogni resize: l'elemento a cui viene
 * applicato questo `clip-path` deve semplicemente mantenere le stesse
 * proporzioni (aspect-ratio) del canvas nativo, qualunque sia la sua
 * dimensione reale a schermo.
 *
 * Per le forme composte (con fori) il CSS `clip-path` a funzione non basta
 * (non esiste un modo standard di sottrarre più forme in una sola funzione):
 * in quel caso questa funzione restituisce un riferimento `url(#svgDefId)` a
 * un `<clipPath>` SVG con `clip-rule="evenodd"`, che il componente che lo usa
 * deve aver disegnato nel DOM con lo stesso id (vedi `buildCompoundPathD`).
 */
export function clipAreaToCssClipPath(
  clip: ClipShape,
  canvasSize: { width: number; height: number },
  svgDefId?: string,
): string {
  if (clip.type === 'compound') {
    if (!svgDefId) {
      throw new Error(
        'clipAreaToCssClipPath: una clip area "compound" richiede un svgDefId (il riferimento a un <clipPath> disegnato nel DOM).',
      )
    }
    return `url(#${svgDefId})`
  }

  const pctX = (v: number) => `${(v / canvasSize.width) * 100}%`
  const pctY = (v: number) => `${(v / canvasSize.height) * 100}%`

  switch (clip.type) {
    case 'rect': {
      const top = pctY(clip.y)
      const left = pctX(clip.x)
      const right = pctX(canvasSize.width - (clip.x + clip.width))
      const bottom = pctY(canvasSize.height - (clip.y + clip.height))
      // Il raggio degli angoli viene espresso come percentuale della
      // larghezza: per raggi piccoli rispetto alle dimensioni del prodotto
      // (il caso comune) la differenza rispetto a un cerchio perfetto è
      // trascurabile anche se il canvas non è quadrato.
      const round = clip.radius ? ` round ${pctX(clip.radius)}` : ''
      return `inset(${top} ${right} ${bottom} ${left}${round})`
    }
    case 'ellipse':
      return `ellipse(${pctX(clip.rx)} ${pctY(clip.ry)} at ${pctX(clip.cx)} ${pctY(clip.cy)})`
    case 'polygon':
      return `polygon(${clip.points.map(([x, y]) => `${pctX(x)} ${pctY(y)}`).join(', ')})`
  }
}

/** Disegna (senza chiamare `beginPath`) il sotto-percorso Canvas2D di UNA forma semplice. */
function addSimpleShapeToPath2D(ctx: CanvasRenderingContext2D, clip: SimpleClipShape) {
  switch (clip.type) {
    case 'rect': {
      const { x, y, width, height, radius = 0 } = clip
      if (radius > 0 && typeof ctx.roundRect === 'function') {
        ctx.roundRect(x, y, width, height, radius)
      } else {
        ctx.rect(x, y, width, height)
      }
      break
    }
    case 'ellipse': {
      const rotationRad = ((clip.rotation ?? 0) * Math.PI) / 180
      ctx.moveTo(clip.cx + clip.rx, clip.cy)
      ctx.ellipse(clip.cx, clip.cy, clip.rx, clip.ry, rotationRad, 0, Math.PI * 2)
      break
    }
    case 'polygon': {
      clip.points.forEach(([x, y], index) => {
        if (index === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      })
      ctx.closePath()
      break
    }
  }
}

/**
 * Costruisce il path (Canvas 2D) corrispondente a una clip area, per il
 * rendering di export. Per le forme composte, il contorno esterno e tutti i
 * fori vengono aggiunti come sotto-percorsi dello STESSO path: chi chiama
 * questa funzione deve poi ritagliare con `ctx.clip('evenodd')` (funziona
 * correttamente anche per le forme semplici, quindi è sicuro usarlo sempre).
 */
export function buildClipPath2D(ctx: CanvasRenderingContext2D, clip: ClipShape) {
  ctx.beginPath()
  if (clip.type === 'compound') {
    addSimpleShapeToPath2D(ctx, clip.outer)
    clip.holes.forEach((hole) => addSimpleShapeToPath2D(ctx, hole))
  } else {
    addSimpleShapeToPath2D(ctx, clip)
  }
}

/** Costruisce l'attributo `d` SVG (path) corrispondente a UNA forma semplice, in coordinate native del canvas. */
function simpleClipShapeToSvgPath(clip: SimpleClipShape): string {
  switch (clip.type) {
    case 'rect': {
      const { x, y, width, height, radius = 0 } = clip
      const r = Math.min(radius, width / 2, height / 2)
      if (r <= 0) {
        return `M ${x} ${y} H ${x + width} V ${y + height} H ${x} Z`
      }
      return [
        `M ${x + r} ${y}`,
        `H ${x + width - r}`,
        `A ${r} ${r} 0 0 1 ${x + width} ${y + r}`,
        `V ${y + height - r}`,
        `A ${r} ${r} 0 0 1 ${x + width - r} ${y + height}`,
        `H ${x + r}`,
        `A ${r} ${r} 0 0 1 ${x} ${y + height - r}`,
        `V ${y + r}`,
        `A ${r} ${r} 0 0 1 ${x + r} ${y}`,
        'Z',
      ].join(' ')
    }
    case 'ellipse':
      return `M ${clip.cx - clip.rx} ${clip.cy} A ${clip.rx} ${clip.ry} 0 1 0 ${clip.cx + clip.rx} ${clip.cy} A ${clip.rx} ${clip.ry} 0 1 0 ${clip.cx - clip.rx} ${clip.cy} Z`
    case 'polygon':
      return `M ${clip.points.map(([x, y]) => `${x} ${y}`).join(' L ')} Z`
  }
}

/**
 * Costruisce l'attributo `d` SVG (path) corrispondente a una clip area, per
 * disegnare il contorno tratteggiato nell'overlay di editing (in coordinate
 * NATIVE del canvas — l'SVG che lo ospita usa `viewBox="0 0 W H"`). Per le
 * forme composte concatena contorno esterno e fori: dato che il contorno
 * viene disegnato senza riempimento (solo `stroke`), non serve alcuna
 * `fill-rule` speciale per vederli correttamente entrambi.
 */
export function clipAreaToSvgPath(clip: ClipShape): string {
  if (clip.type === 'compound') {
    return [simpleClipShapeToSvgPath(clip.outer), ...clip.holes.map(simpleClipShapeToSvgPath)].join(' ')
  }
  return simpleClipShapeToSvgPath(clip)
}

/** Costruisce l'attributo `d` SVG per UNA forma semplice in coordinate FRAZIONARIE (0..1 rispetto al canvas). */
function simpleClipShapeToFractionalPath(
  clip: SimpleClipShape,
  canvasSize: { width: number; height: number },
): string {
  const fx = (v: number) => v / canvasSize.width
  const fy = (v: number) => v / canvasSize.height
  switch (clip.type) {
    case 'rect': {
      const x = fx(clip.x)
      const y = fy(clip.y)
      const width = fx(clip.width)
      const height = fy(clip.height)
      const rx = fx(clip.radius ?? 0)
      const ry = fy(clip.radius ?? 0)
      if (!clip.radius) {
        return `M ${x} ${y} H ${x + width} V ${y + height} H ${x} Z`
      }
      return [
        `M ${x + rx} ${y}`,
        `H ${x + width - rx}`,
        `A ${rx} ${ry} 0 0 1 ${x + width} ${y + ry}`,
        `V ${y + height - ry}`,
        `A ${rx} ${ry} 0 0 1 ${x + width - rx} ${y + height}`,
        `H ${x + rx}`,
        `A ${rx} ${ry} 0 0 1 ${x} ${y + height - ry}`,
        `V ${y + ry}`,
        `A ${rx} ${ry} 0 0 1 ${x + rx} ${y}`,
        'Z',
      ].join(' ')
    }
    case 'ellipse': {
      const cx = fx(clip.cx)
      const cy = fy(clip.cy)
      const rx = fx(clip.rx)
      const ry = fy(clip.ry)
      return `M ${cx - rx} ${cy} A ${rx} ${ry} 0 1 0 ${cx + rx} ${cy} A ${rx} ${ry} 0 1 0 ${cx - rx} ${cy} Z`
    }
    case 'polygon':
      return `M ${clip.points.map(([x, y]) => `${fx(x)} ${fy(y)}`).join(' L ')} Z`
  }
}

/**
 * Costruisce l'attributo `d` di un unico path SVG (coordinate frazionarie
 * 0..1, adatte a un `<clipPath clipPathUnits="objectBoundingBox">") che
 * rappresenta una clip area COMPOSTA: contorno esterno + fori, da applicare
 * con `clip-rule="evenodd"` sul `<path>` che lo usa. Usare
 * `objectBoundingBox` è ciò che rende il ritaglio responsive con puro CSS,
 * esattamente come le percentuali usate per le forme semplici.
 */
export function buildCompoundPathD(
  clip: { outer: SimpleClipShape; holes: SimpleClipShape[] },
  canvasSize: { width: number; height: number },
): string {
  return [
    simpleClipShapeToFractionalPath(clip.outer, canvasSize),
    ...clip.holes.map((hole) => simpleClipShapeToFractionalPath(hole, canvasSize)),
  ].join(' ')
}
