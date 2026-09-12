import type { ClipShape } from '../types/product'

/** Centro del rettangolo che racchiude una clip area, in coordinate del canvas. */
export function getClipAreaCenter(clip: ClipShape): { x: number; y: number } {
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

/** Larghezza/altezza del rettangolo che racchiude una clip area. */
export function getClipAreaBounds(clip: ClipShape): { width: number; height: number } {
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
 * Traduce una clip area nel valore CSS `clip-path` corrispondente, espresso
 * in PERCENTUALI rispetto alle dimensioni native del canvas del prodotto
 * (`ProductConfig.canvas`). Usare percentuali (anziché pixel assoluti) è
 * ciò che permette all'intero stage del configuratore di essere
 * perfettamente responsive con puro CSS, senza dover ricalcolare via
 * JavaScript un fattore di scala ad ogni resize: l'elemento a cui viene
 * applicato questo `clip-path` deve semplicemente mantenere le stesse
 * proporzioni (aspect-ratio) del canvas nativo, qualunque sia la sua
 * dimensione reale a schermo.
 */
export function clipAreaToCssClipPath(clip: ClipShape, canvasSize: { width: number; height: number }): string {
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

/** Costruisce il path (Canvas 2D) corrispondente a una clip area, per il rendering di export. */
export function buildClipPath2D(ctx: CanvasRenderingContext2D, clip: ClipShape) {
  ctx.beginPath()
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

/** Costruisce l'attributo `d` SVG (path) corrispondente a una clip area, per disegnare il contorno nell'overlay. */
export function clipAreaToSvgPath(clip: ClipShape): string {
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
