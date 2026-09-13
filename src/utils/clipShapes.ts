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
 * Traduce UNA forma semplice (mai composta) nel valore CSS `clip-path`
 * corrispondente, espresso in PERCENTUALI rispetto alle dimensioni native
 * del canvas del prodotto (`ProductConfig.canvas`). Usare percentuali
 * (anziché pixel assoluti) è ciò che permette all'intero stage del
 * configuratore di essere perfettamente responsive con puro CSS, senza
 * dover ricalcolare via JavaScript un fattore di scala ad ogni resize.
 *
 * Deliberatamente NON gestisce le clip area "compound" (contorno + fori):
 * per quelle, invece di un'unica funzione `clip-path` con regola evenodd
 * (poco affidabile in pratica per forme con molti punti, come le sagome
 * fotografiche estratte pixel per pixel), il rendering usa questa stessa
 * funzione due volte — una per il contorno esterno, e una per OGNI foro —
 * componendo il risultato con layer separati. Vedi `ConfiguratorCanvas` e
 * `exportImage.ts`.
 */
export function simpleClipAreaToCssClipPath(
  clip: SimpleClipShape,
  canvasSize: { width: number; height: number },
): string {
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

/**
 * Traduce una clip area (semplice o composta) nel valore CSS `clip-path` da
 * applicare al layer dell'immagine dell'utente. Per le forme composte
 * restituisce il clip-path del solo CONTORNO ESTERNO: i fori (schermo,
 * pulsanti, ecc.) non si sottraggono qui — vengono invece "richiusi"
 * disegnando sopra, per ciascun foro, un ritaglio della foto originale del
 * prodotto (vedi `ConfiguratorCanvas`). Questo evita di dover esprimere
 * "contorno meno fori" in un'unica regola CSS/SVG con evenodd, che si è
 * rivelata inaffidabile per sagome fotografiche complesse (centinaia di
 * punti) combinate con più fori.
 */
export function clipAreaToCssClipPath(clip: ClipShape, canvasSize: { width: number; height: number }): string {
  return simpleClipAreaToCssClipPath(clip.type === 'compound' ? clip.outer : clip, canvasSize)
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
 * Ritaglia il contesto Canvas2D su UNA forma semplice (mai composta). Chi
 * chiama questa funzione deve prima aver salvato lo stato (`ctx.save()`) e
 * deve poi ripristinarlo (`ctx.restore()`) una volta finito di disegnare.
 *
 * Per le clip area "compound" si chiama questa funzione due volte: una per
 * il contorno esterno (prima di disegnare l'immagine dell'utente) e una per
 * OGNI foro (prima di ridisegnare sopra il ritaglio della foto originale) —
 * vedi `exportImage.ts`. Usare un ritaglio semplice per volta, invece di un
 * unico path con più sotto-percorsi e regola evenodd, evita completamente i
 * problemi di affidabilità di quella tecnica con sagome complesse.
 */
export function clipSimpleShape2D(ctx: CanvasRenderingContext2D, clip: SimpleClipShape) {
  ctx.beginPath()
  addSimpleShapeToPath2D(ctx, clip)
  ctx.clip()
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
 * `fill-rule` speciale per vederli correttamente entrambi — è puramente
 * decorativo, non c'entra con il ritaglio vero e proprio dell'immagine.
 */
export function clipAreaToSvgPath(clip: ClipShape): string {
  if (clip.type === 'compound') {
    return [simpleClipShapeToSvgPath(clip.outer), ...clip.holes.map(simpleClipShapeToSvgPath)].join(' ')
  }
  return simpleClipShapeToSvgPath(clip)
}
