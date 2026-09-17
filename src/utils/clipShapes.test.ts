import { describe, expect, it } from 'vitest'
import { casioF91w } from '../data/products/casio-f91w'
import { gbaColor } from '../data/products/gba-color'
import { allProducts } from '../data/products'
import {
  clipAreaToCssClipPath,
  clipAreaToSvgPath,
  getClipAreaBounds,
  getClipAreaCenter,
  simpleClipAreaToCssClipPath,
} from './clipShapes'

/**
 * L'area di ritaglio decide dove finisce l'immagine del cliente: un errore
 * qui si vede subito sul prodotto finito, quindi vale la pena bloccarlo con
 * dei test invece che con un controllo a occhio sull'anteprima.
 */

describe('conversione in clip-path CSS', () => {
  it('un rettangolo diventa un inset in percentuale', () => {
    const css = simpleClipAreaToCssClipPath(
      { type: 'rect', x: 100, y: 200, width: 400, height: 300 },
      { width: 1000, height: 1000 },
    )
    expect(css).toBe('inset(20% 50% 50% 10%)')
  })

  it('il raggio degli angoli usa valori separati per orizzontale e verticale', () => {
    // Su un prodotto molto più alto che largo, una percentuale sola darebbe
    // angoli ellittici in anteprima e circolari nell'immagine esportata.
    const shape = casioF91w.clipArea
    expect(shape.type).toBe('rect')
    if (shape.type !== 'rect') return

    const css = simpleClipAreaToCssClipPath(shape, casioF91w.canvas)
    expect(css).toContain('round')
    expect(css).toContain('/')

    const [horizontal, vertical] = css.split('round')[1].split('/').map((part) => parseFloat(part))
    // Entrambe le percentuali devono corrispondere agli stessi 10 pixel reali.
    expect((horizontal / 100) * casioF91w.canvas.width).toBeCloseTo(10, 5)
    expect((vertical / 100) * casioF91w.canvas.height).toBeCloseTo(10, 5)
  })

  it('per una forma composta ritaglia solo il contorno esterno', () => {
    // I fori vengono "richiusi" ridisegnando sopra pezzi della foto originale:
    // vedi il commento in clipShapes.ts.
    const css = clipAreaToCssClipPath(gbaColor.clipArea, gbaColor.canvas)
    expect(css.startsWith('polygon(') || css.startsWith('inset(') || css.startsWith('ellipse(')).toBe(true)
  })
})

describe('centro e dimensioni dell’area', () => {
  it('centro e dimensioni di un rettangolo', () => {
    const shape = { type: 'rect' as const, x: 100, y: 200, width: 400, height: 300 }
    expect(getClipAreaCenter(shape)).toEqual({ x: 300, y: 350 })
    expect(getClipAreaBounds(shape)).toEqual({ width: 400, height: 300 })
  })

  it('per una forma composta si considera il contorno esterno', () => {
    const center = getClipAreaCenter(gbaColor.clipArea)
    const bounds = getClipAreaBounds(gbaColor.clipArea)
    expect(bounds.width).toBeGreaterThan(0)
    expect(bounds.height).toBeGreaterThan(0)
    expect(center.x).toBeGreaterThan(0)
    expect(center.y).toBeGreaterThan(0)
  })
})

describe('coerenza dei dati di prodotto', () => {
  it('ogni prodotto produce un contorno SVG valido', () => {
    for (const product of allProducts) {
      const path = clipAreaToSvgPath(product.clipArea)
      expect(path.length).toBeGreaterThan(0)
      expect(path).toMatch(/^M/)
      expect(path).not.toContain('NaN')
    }
  })

  it('l’area di ritaglio resta dentro al canvas dichiarato', () => {
    for (const product of allProducts) {
      const bounds = getClipAreaBounds(product.clipArea)
      expect(bounds.width).toBeLessThanOrEqual(product.canvas.width)
      expect(bounds.height).toBeLessThanOrEqual(product.canvas.height)
    }
  })

  it('slug ed export sono univoci', () => {
    const slugs = allProducts.map((product) => `${product.categorySlug}/${product.slug}`)
    expect(new Set(slugs).size).toBe(slugs.length)

    for (const product of allProducts) {
      expect(product.exportFileName).toMatch(/\.png$/)
      expect(product.thumbnail).toMatch(/^\//)
      expect(product.baseImage).toMatch(/^\//)
    }
  })
})
