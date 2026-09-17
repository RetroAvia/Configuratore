import type { ProductConfig } from '../types/product'
import type { OrderSummaryLine } from './pricing'
import { formatPriceDelta, formatTotal } from './pricing'
import { RETROAVIA_EMAIL, RETROAVIA_INSTAGRAM_HANDLE } from '../config/site'

/**
 * Genera un'unica immagine "biglietto preventivo": il render della
 * personalizzazione + il riepilogo delle opzioni scelte + il totale,
 * brandizzata RetroAvia — pensata per essere inviata in un solo messaggio su
 * Instagram, dove non è possibile precompilare un testo lungo come
 * nell'email (vedi `buildMailtoHref` in `sendLinks.ts`). Tutto disegnato via
 * Canvas 2D, coerente con la palette del sito (vedi `index.css`).
 */

interface QuoteCardOptions {
  product: ProductConfig
  /** Il render già generato (scocca + collage), come Blob PNG. */
  renderBlob: Blob
  summaryLines: OrderSummaryLine[]
  basePrice: number
  baseLabel: string
  total: number
  notes: string
  /** Codice breve della richiesta: stampato sul biglietto, è ciò che permette di ritrovarla in chat mesi dopo. */
  orderCode?: string
}

const CARD_WIDTH = 1080
const CARD_HEIGHT = 1350
const MARGIN_X = 56

const COLOR_PAGE = '#120e0c'
const COLOR_SURFACE = '#1c1613'
const COLOR_INK = '#f6efe4'
const COLOR_INK_MUTED = '#b9a996'
const COLOR_ACCENT = '#e8b04b'
const COLOR_PRIMARY = '#c1272d'
const COLOR_SUCCESS = '#6fae6f'

function loadImageFromBlob(blob: Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob)
    const img = new Image()
    img.onload = () => {
      URL.revokeObjectURL(url)
      resolve(img)
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Impossibile caricare il render'))
    }
    img.src = url
  })
}

function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => resolve(null)
    img.src = src
  })
}

function roundRectPath(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

/** Accorcia un testo con "…" finché non entra in `maxWidth`. */
function fitText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string {
  if (ctx.measureText(text).width <= maxWidth) return text
  let truncated = text
  while (truncated.length > 1 && ctx.measureText(`${truncated}…`).width > maxWidth) {
    truncated = truncated.slice(0, -1)
  }
  return `${truncated}…`
}

/** Spezza un testo su al massimo `maxLines` righe larghe `maxWidth`. */
function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number, maxLines: number): string[] {
  const words = text.split(' ')
  const lines: string[] = []
  let current = ''

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word
    if (ctx.measureText(candidate).width > maxWidth && current) {
      lines.push(current)
      current = word
      if (lines.length === maxLines - 1) break
    } else {
      current = candidate
    }
  }
  if (current && lines.length < maxLines) lines.push(current)
  if (lines.length === maxLines) lines[maxLines - 1] = fitText(ctx, lines[maxLines - 1], maxWidth)
  return lines
}

export async function renderQuoteCard({
  product,
  renderBlob,
  summaryLines,
  basePrice,
  baseLabel,
  total,
  notes,
  orderCode,
}: QuoteCardOptions): Promise<Blob> {
  const [renderImg, logoImg] = await Promise.all([loadImageFromBlob(renderBlob), loadImage('/logo-128.webp')])

  const canvas = document.createElement('canvas')
  canvas.width = CARD_WIDTH
  canvas.height = CARD_HEIGHT
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas 2D non disponibile in questo browser')

  ctx.textBaseline = 'middle'

  // Sfondo scuro + due bagliori sfumati, come lo sfondo del sito.
  ctx.fillStyle = COLOR_PAGE
  ctx.fillRect(0, 0, CARD_WIDTH, CARD_HEIGHT)

  const glow1 = ctx.createRadialGradient(CARD_WIDTH * 0.08, 20, 0, CARD_WIDTH * 0.08, 20, 620)
  glow1.addColorStop(0, 'rgba(193,39,45,0.24)')
  glow1.addColorStop(1, 'rgba(193,39,45,0)')
  ctx.fillStyle = glow1
  ctx.fillRect(0, 0, CARD_WIDTH, CARD_HEIGHT)

  const glow2 = ctx.createRadialGradient(CARD_WIDTH * 1.02, CARD_HEIGHT * 0.12, 0, CARD_WIDTH * 1.02, CARD_HEIGHT * 0.12, 560)
  glow2.addColorStop(0, 'rgba(232,176,75,0.18)')
  glow2.addColorStop(1, 'rgba(232,176,75,0)')
  ctx.fillStyle = glow2
  ctx.fillRect(0, 0, CARD_WIDTH, CARD_HEIGHT)

  let cursorY = 56

  // Header: logo + wordmark "RetroAvia Lab"
  const logoSize = 72
  if (logoImg) {
    ctx.save()
    roundRectPath(ctx, MARGIN_X, cursorY, logoSize, logoSize, 18)
    ctx.clip()
    ctx.drawImage(logoImg, MARGIN_X, cursorY, logoSize, logoSize)
    ctx.restore()
  }
  const wordmarkX = MARGIN_X + (logoImg ? logoSize + 18 : 0)
  ctx.font = '800 36px system-ui, -apple-system, "Segoe UI", sans-serif'
  ctx.fillStyle = COLOR_INK
  ctx.fillText('RetroAvia', wordmarkX, cursorY + logoSize / 2 - 4)
  const retroaviaWidth = ctx.measureText('RetroAvia ').width
  ctx.fillStyle = COLOR_ACCENT
  ctx.fillText('Lab', wordmarkX + retroaviaWidth, cursorY + logoSize / 2 - 4)

  ctx.font = '600 22px system-ui, -apple-system, "Segoe UI", sans-serif'
  ctx.fillStyle = COLOR_INK_MUTED
  ctx.fillText('Preventivo personalizzazione', wordmarkX, cursorY + logoSize / 2 + 26)

  // Codice della richiesta, in alto a destra: è il riferimento che permette a
  // RetroAvia di ritrovare questa esatta configurazione in una conversazione
  // anche molto tempo dopo, senza dover ricostruire nulla a memoria.
  if (orderCode) {
    ctx.font = '700 24px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace'
    ctx.textAlign = 'right'
    const codeWidth = ctx.measureText(orderCode).width
    const badgeW = codeWidth + 36
    const badgeH = 44
    const badgeX = CARD_WIDTH - MARGIN_X - badgeW
    const badgeY = cursorY + logoSize / 2 - badgeH / 2
    ctx.fillStyle = 'rgba(232,176,75,0.14)'
    roundRectPath(ctx, badgeX, badgeY, badgeW, badgeH, 22)
    ctx.fill()
    ctx.strokeStyle = 'rgba(232,176,75,0.45)'
    ctx.lineWidth = 2
    roundRectPath(ctx, badgeX, badgeY, badgeW, badgeH, 22)
    ctx.stroke()
    ctx.fillStyle = COLOR_ACCENT
    ctx.fillText(orderCode, CARD_WIDTH - MARGIN_X - 18, badgeY + badgeH / 2)
    ctx.textAlign = 'left'
  }

  cursorY += logoSize + 46

  // Riquadro con il render del prodotto, adattato "contain" e centrato.
  const imageBoxW = CARD_WIDTH - MARGIN_X * 2
  const imageBoxH = 540
  ctx.fillStyle = COLOR_SURFACE
  roundRectPath(ctx, MARGIN_X, cursorY, imageBoxW, imageBoxH, 28)
  ctx.fill()

  ctx.save()
  roundRectPath(ctx, MARGIN_X, cursorY, imageBoxW, imageBoxH, 28)
  ctx.clip()
  const scale = Math.min(imageBoxW / renderImg.width, imageBoxH / renderImg.height)
  const drawW = renderImg.width * scale
  const drawH = renderImg.height * scale
  ctx.drawImage(renderImg, MARGIN_X + (imageBoxW - drawW) / 2, cursorY + (imageBoxH - drawH) / 2, drawW, drawH)
  ctx.restore()

  cursorY += imageBoxH + 50

  // Nome prodotto
  ctx.font = '800 42px system-ui, -apple-system, "Segoe UI", sans-serif'
  ctx.fillStyle = COLOR_INK
  ctx.fillText(fitText(ctx, product.name, imageBoxW), MARGIN_X, cursorY)
  cursorY += 54

  // Riepilogo: prezzo base + una riga per ogni gruppo di opzioni scelto.
  const rows: { label: string; value: string }[] = [
    { label: baseLabel, value: formatTotal(basePrice) },
    ...summaryLines.map((line) => ({
      label: `${line.groupTitle}: ${line.optionLabel}`,
      value: formatPriceDelta(line.priceDelta),
    })),
  ]

  const rowHeight = 44
  ctx.font = '500 23px system-ui, -apple-system, "Segoe UI", sans-serif'
  const valueColumnWidth = 160

  rows.forEach((row, i) => {
    const rowY = cursorY + i * rowHeight
    if (i % 2 === 0) {
      ctx.fillStyle = 'rgba(255,255,255,0.035)'
      ctx.fillRect(MARGIN_X - 16, rowY, imageBoxW + 32, rowHeight)
    }
    ctx.textAlign = 'left'
    ctx.fillStyle = COLOR_INK_MUTED
    ctx.fillText(fitText(ctx, row.label, imageBoxW - valueColumnWidth), MARGIN_X, rowY + rowHeight / 2)

    ctx.textAlign = 'right'
    ctx.fillStyle = row.value.startsWith('-') ? COLOR_ACCENT : COLOR_SUCCESS
    ctx.fillText(row.value, MARGIN_X + imageBoxW, rowY + rowHeight / 2)
  })
  ctx.textAlign = 'left'

  cursorY += rows.length * rowHeight + 16

  // Note libere del cliente, se presenti (max 2 righe).
  if (notes.trim()) {
    ctx.font = 'italic 500 22px system-ui, -apple-system, "Segoe UI", sans-serif'
    ctx.fillStyle = COLOR_INK_MUTED
    const lines = wrapText(ctx, `Note: ${notes.trim()}`, imageBoxW, 2)
    lines.forEach((line, i) => ctx.fillText(line, MARGIN_X, cursorY + i * 30))
    cursorY += lines.length * 30 + 12
  }

  // Barra totale, sempre ancorata a una posizione fissa dal fondo così il
  // footer resta allineato indipendentemente da quante righe di opzioni ci
  // sono state sopra.
  const totalBarH = 100
  const totalBarY = CARD_HEIGHT - totalBarH - 130
  const totalGradient = ctx.createLinearGradient(MARGIN_X, 0, CARD_WIDTH - MARGIN_X, 0)
  totalGradient.addColorStop(0, COLOR_PRIMARY)
  totalGradient.addColorStop(1, COLOR_ACCENT)
  ctx.fillStyle = totalGradient
  roundRectPath(ctx, MARGIN_X, totalBarY, CARD_WIDTH - MARGIN_X * 2, totalBarH, 24)
  ctx.fill()

  ctx.font = '700 22px system-ui, -apple-system, "Segoe UI", sans-serif'
  ctx.fillStyle = 'rgba(255,255,255,0.92)'
  ctx.textAlign = 'left'
  ctx.fillText('TOTALE STIMATO', MARGIN_X + 32, totalBarY + totalBarH / 2)

  ctx.font = '800 46px system-ui, -apple-system, "Segoe UI", sans-serif'
  ctx.fillStyle = '#ffffff'
  ctx.textAlign = 'right'
  ctx.fillText(formatTotal(total), CARD_WIDTH - MARGIN_X - 32, totalBarY + totalBarH / 2)

  // Footer con i contatti.
  ctx.font = '500 22px system-ui, -apple-system, "Segoe UI", sans-serif'
  ctx.fillStyle = COLOR_INK_MUTED
  ctx.textAlign = 'center'
  ctx.fillText(`@${RETROAVIA_INSTAGRAM_HANDLE}  ·  ${RETROAVIA_EMAIL}`, CARD_WIDTH / 2, CARD_HEIGHT - 54)
  ctx.textAlign = 'left'

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob)
      else reject(new Error('Impossibile generare il biglietto preventivo'))
    }, 'image/png')
  })
}
