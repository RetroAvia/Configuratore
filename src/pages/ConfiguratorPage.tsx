import { useCallback, useEffect, useRef, useState } from 'react'
import type { ChangeEvent } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { getCategory } from '../data/categories'
import { getProduct } from '../data/products'
import NotFoundPage from './NotFoundPage'
import ConfiguratorCanvas from '../components/configurator/ConfiguratorCanvas'
import Toolbar from '../components/configurator/Toolbar'
import PricingPanel from '../components/configurator/PricingPanel'
import SendPanel from '../components/configurator/SendPanel'
import StickyTotalBar from '../components/configurator/StickyTotalBar'
import type { ImageLayer } from '../types/layers'
import { useHtmlImage } from '../hooks/useHtmlImage'
import {
  clampScale,
  computeAdditionalLayerTransform,
  computeCoverTransform,
  normalizeRotation,
} from '../hooks/useImageTransform'
import { ImageLoadError, loadImageFromFile } from '../utils/fileValidation'
import { downloadBlob, renderProductComposite } from '../utils/exportImage'
import { renderQuoteCard } from '../utils/exportQuoteCard'
import { playBack, playClick, playError, playExportSuccess, playUpload } from '../utils/sound'
import type { PricingSelections } from '../utils/pricing'
import { buildOrderSummary, computeTotal, formatOrderSummaryText, getDefaultSelections } from '../utils/pricing'
import { clearPricingDraft, readPricingDraft, savePricingDraft } from '../utils/pricingStorage'

const MAX_LAYERS = 6

let layerIdCounter = 0
function createLayerId(): string {
  layerIdCounter += 1
  return `layer-${Date.now()}-${layerIdCounter}`
}

export default function ConfiguratorPage() {
  const { categorySlug = '', modelSlug = '' } = useParams()
  const [searchParams] = useSearchParams()
  const debugCoordinates = searchParams.get('debug') === '1'

  const category = getCategory(categorySlug)
  const product = category ? getProduct(categorySlug, modelSlug) : undefined

  const baseImageEl = useHtmlImage(product?.baseImage)
  const overlayImageEl = useHtmlImage(product?.overlayImage)

  // Tutti gli strati del collage (nell'ordine in cui sono stati aggiunti) e
  // quale, tra questi, è attualmente selezionato (quello che risponde ai
  // controlli di posizionamento e alle maniglie sul canvas).
  const [layers, setLayers] = useState<ImageLayer[]>([])
  const [selectedLayerId, setSelectedLayerId] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isExporting, setIsExporting] = useState(false)
  const [isGeneratingQuoteCard, setIsGeneratingQuoteCard] = useState(false)
  const [showGrid, setShowGrid] = useState(false)
  const [lastExportedBlob, setLastExportedBlob] = useState<Blob | null>(null)

  // Scelte correnti nel pannello "Opzioni e Prezzo" (se il prodotto ne ha
  // uno) e note libere: alimentano sia il totale mostrato a schermo sia il
  // riepilogo testuale/il biglietto preventivo inviati a RetroAvia. Vengono
  // anche salvate in automatico (solo queste, MAI le immagini caricate) in
  // localStorage — vedi `utils/pricingStorage.ts` — così una ricarica
  // accidentale della pagina non fa perdere 11 gruppi di scelte già fatte.
  const [pricingSelections, setPricingSelections] = useState<PricingSelections>({})
  const [notes, setNotes] = useState('')
  const [draftRestored, setDraftRestored] = useState(false)

  const addFileInputRef = useRef<HTMLInputElement>(null)
  const replaceFileInputRef = useRef<HTMLInputElement>(null)
  const replaceTargetIdRef = useRef<string | null>(null)

  // Copia sempre aggiornata di `layers`, leggibile dalla pulizia finale
  // (che deve girare una volta sola, senza ridipendere da `layers`).
  const layersRef = useRef<ImageLayer[]>([])
  useEffect(() => {
    layersRef.current = layers
  }, [layers])

  // Reimposta lo stato quando l'utente cambia prodotto (es. tramite i link "indietro/avanti" del browser),
  // rilasciando tutti gli URL oggetto degli strati del prodotto precedente e
  // ripartendo dalle opzioni di default del nuovo prodotto — oppure da una
  // bozza salvata in precedenza per QUESTO stesso prodotto, se presente.
  useEffect(() => {
    setLayers((current) => {
      current.forEach((layer) => URL.revokeObjectURL(layer.image.key))
      return []
    })
    setSelectedLayerId(null)
    setErrorMessage(null)
    setLastExportedBlob(null)

    const pricing = product?.pricing
    if (pricing) {
      const draft = readPricingDraft(categorySlug, modelSlug)
      if (draft) {
        // Tiene solo le chiavi che esistono ancora nella configurazione
        // attuale (nel caso i gruppi di opzioni fossero cambiati nel
        // frattempo), così una bozza vecchia non manda mai in uno stato
        // incoerente.
        const validSelections: PricingSelections = {}
        pricing.groups.forEach((g) => {
          const saved = draft.selections[g.id]
          validSelections[g.id] = g.options.some((o) => o.id === saved) ? saved : g.options[0].id
        })
        setPricingSelections(validSelections)
        setNotes(draft.notes)
        setDraftRestored(true)
      } else {
        setPricingSelections(getDefaultSelections(pricing))
        setNotes('')
        setDraftRestored(false)
      }
    } else {
      setPricingSelections({})
      setNotes('')
      setDraftRestored(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categorySlug, modelSlug])

  // Rilascia tutti gli URL oggetto rimasti quando il componente viene smontato.
  useEffect(() => {
    return () => {
      layersRef.current.forEach((layer) => URL.revokeObjectURL(layer.image.key))
    }
  }, [])

  // Salvataggio automatico (con un piccolo debounce per non scrivere a ogni
  // singolo carattere digitato nelle note) di sole opzioni/colori/note.
  useEffect(() => {
    if (!product?.pricing) return
    const timeout = setTimeout(() => {
      savePricingDraft(categorySlug, modelSlug, pricingSelections, notes)
    }, 400)
    return () => clearTimeout(timeout)
  }, [product?.pricing, categorySlug, modelSlug, pricingSelections, notes])

  const clipArea = product?.clipArea ?? { type: 'rect' as const, x: 0, y: 0, width: 1, height: 1 }

  const selectedLayer = layers.find((l) => l.id === selectedLayerId) ?? null

  /**
   * Aggiunge uno o più nuovi strati al collage a partire da file caricati
   * dall'utente (upload, trascinamento, o selezione multipla dall'input).
   * Il PRIMO strato in assoluto riempie tutta l'area ("cover fit", come
   * un'unica immagine); ogni strato successivo parte più piccolo e sfalsato
   * dal centro, per restare subito visibile e libero da trascinare.
   */
  const handleAddImageFiles = useCallback(
    (files: File[]) => {
      const availableSlots = MAX_LAYERS - layers.length
      if (availableSlots <= 0) {
        playError()
        setErrorMessage(`Puoi aggiungere al massimo ${MAX_LAYERS} immagini.`)
        return
      }
      const filesToAdd = files.slice(0, availableSlots)
      if (files.length > filesToAdd.length) {
        setErrorMessage(`Puoi aggiungere al massimo ${MAX_LAYERS} immagini: ho caricato solo le prime ${filesToAdd.length}.`)
      } else {
        setErrorMessage(null)
      }

      filesToAdd.forEach((file, offset) => {
        const startIndex = layers.length + offset
        loadImageFromFile(file)
          .then(({ element, url, width, height }) => {
            const transform =
              startIndex === 0
                ? computeCoverTransform(clipArea, width, height)
                : computeAdditionalLayerTransform(clipArea, width, height, startIndex)
            const newLayer: ImageLayer = {
              id: createLayerId(),
              image: { key: url, element, width, height },
              transform,
            }
            setLayers((current) => [...current, newLayer])
            setSelectedLayerId(newLayer.id)
            setLastExportedBlob(null)
            playUpload()
          })
          .catch((err: unknown) => {
            playError()
            if (err instanceof ImageLoadError) {
              setErrorMessage(err.message)
            } else {
              setErrorMessage("Si è verificato un errore imprevisto durante il caricamento di un'immagine.")
            }
          })
      })
    },
    [layers, clipArea],
  )

  /** Sostituisce solo la FOTO di uno strato esistente, mantenendone posizione e rotazione. */
  const handleReplaceLayerFile = useCallback((id: string, file: File) => {
    loadImageFromFile(file)
      .then(({ element, url, width, height }) => {
        setErrorMessage(null)
        setLayers((current) =>
          current.map((layer) => {
            if (layer.id !== id) return layer
            URL.revokeObjectURL(layer.image.key)
            // Mantiene la stessa dimensione a schermo di prima (altrimenti
            // una foto con proporzioni molto diverse potrebbe apparire di
            // colpo enorme o minuscola).
            const previousFootprint = Math.max(layer.image.width, layer.image.height) * layer.transform.scale
            const nextScale = clampScale(previousFootprint / Math.max(width, height))
            return {
              ...layer,
              image: { key: url, element, width, height },
              transform: { ...layer.transform, scale: nextScale },
            }
          }),
        )
        setLastExportedBlob(null)
        playUpload()
      })
      .catch((err: unknown) => {
        playError()
        if (err instanceof ImageLoadError) {
          setErrorMessage(err.message)
        } else {
          setErrorMessage("Si è verificato un errore imprevisto durante il caricamento dell'immagine.")
        }
      })
  }, [])

  const handleRemoveLayer = useCallback(
    (id: string) => {
      const target = layers.find((l) => l.id === id)
      if (target) URL.revokeObjectURL(target.image.key)
      const next = layers.filter((l) => l.id !== id)
      setLayers(next)
      setSelectedLayerId((current) => (current === id ? (next.length > 0 ? next[next.length - 1].id : null) : current))
      setLastExportedBlob(null)
    },
    [layers],
  )

  /** Applica un aggiornamento funzionale alla trasformazione di UNO specifico strato (usato dal canvas durante drag/pinch). */
  const updateLayerTransform = useCallback((id: string, updater: (t: ImageLayer['transform']) => ImageLayer['transform']) => {
    setLayers((current) => current.map((l) => (l.id === id ? { ...l, transform: updater(l.transform) } : l)))
  }, [])

  const handleScaleChange = useCallback(
    (scale: number) => {
      if (!selectedLayerId) return
      updateLayerTransform(selectedLayerId, (t) => ({ ...t, scale: clampScale(scale) }))
    },
    [selectedLayerId, updateLayerTransform],
  )

  const handleRotationChange = useCallback(
    (rotation: number) => {
      if (!selectedLayerId) return
      updateLayerTransform(selectedLayerId, (t) => ({ ...t, rotation: normalizeRotation(rotation) }))
    },
    [selectedLayerId, updateLayerTransform],
  )

  const handleQuickRotate = useCallback(
    (delta: number) => {
      if (!selectedLayerId) return
      updateLayerTransform(selectedLayerId, (t) => ({ ...t, rotation: normalizeRotation(t.rotation + delta) }))
    },
    [selectedLayerId, updateLayerTransform],
  )

  const handleCenterAndFit = useCallback(() => {
    if (!selectedLayer) return
    const t = computeCoverTransform(clipArea, selectedLayer.image.width, selectedLayer.image.height, selectedLayer.transform.rotation)
    updateLayerTransform(selectedLayer.id, () => t)
  }, [selectedLayer, clipArea, updateLayerTransform])

  const handleResetLayer = useCallback(() => {
    if (!selectedLayer) return
    const t = computeCoverTransform(clipArea, selectedLayer.image.width, selectedLayer.image.height, 0)
    updateLayerTransform(selectedLayer.id, () => t)
  }, [selectedLayer, clipArea, updateLayerTransform])

  const openAddFilePicker = useCallback(() => addFileInputRef.current?.click(), [])
  const openReplacePicker = useCallback(() => {
    if (!selectedLayerId) return
    replaceTargetIdRef.current = selectedLayerId
    replaceFileInputRef.current?.click()
  }, [selectedLayerId])

  const handleAddFileInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) handleAddImageFiles(Array.from(files))
    e.target.value = ''
  }

  const handleReplaceFileInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    const targetId = replaceTargetIdRef.current
    if (file && targetId) handleReplaceLayerFile(targetId, file)
    replaceTargetIdRef.current = null
    e.target.value = ''
  }

  const handleExport = useCallback(async () => {
    if (!product || !baseImageEl || layers.length === 0) return
    setIsExporting(true)
    setErrorMessage(null)
    try {
      const blob = await renderProductComposite({
        product,
        baseImageEl,
        layers: layers.map((l) => ({ element: l.image.element, transform: l.transform })),
        overlayImageEl,
      })
      downloadBlob(blob, product.exportFileName)
      setLastExportedBlob(blob)
      playExportSuccess()
    } catch {
      playError()
      setErrorMessage("Non è stato possibile generare l'immagine finale. Riprova.")
    } finally {
      setIsExporting(false)
    }
  }, [product, baseImageEl, layers, overlayImageEl])

  const handleDownload = useCallback(() => {
    if (!product || !lastExportedBlob) return
    downloadBlob(lastExportedBlob, product.exportFileName)
  }, [product, lastExportedBlob])

  const handleSelectPricingOption = useCallback((groupId: string, optionId: string) => {
    setPricingSelections((current) => ({ ...current, [groupId]: optionId }))
  }, [])

  const handleDiscardDraft = useCallback(() => {
    if (!product?.pricing) return
    clearPricingDraft(categorySlug, modelSlug)
    setPricingSelections(getDefaultSelections(product.pricing))
    setNotes('')
    setDraftRestored(false)
    playClick()
  }, [product, categorySlug, modelSlug])

  const handleJumpToOptions = useCallback(() => {
    document.getElementById('opzioni-e-prezzo')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [])

  if (!category || !product) {
    return <NotFoundPage />
  }

  const pricing = product.pricing
  const total = pricing ? computeTotal(pricing, pricingSelections) : null
  const orderSummaryLines = pricing ? buildOrderSummary(pricing, pricingSelections) : null
  const orderSummaryText = pricing ? formatOrderSummaryText(pricing, pricingSelections, notes) : null

  const handleGenerateQuoteCard = async () => {
    if (!product || !pricing || !lastExportedBlob) return
    setIsGeneratingQuoteCard(true)
    setErrorMessage(null)
    try {
      const blob = await renderQuoteCard({
        product,
        renderBlob: lastExportedBlob,
        summaryLines: orderSummaryLines ?? [],
        basePrice: pricing.basePrice,
        baseLabel: pricing.baseLabel,
        total: total ?? pricing.basePrice,
        notes,
      })
      downloadBlob(blob, product.exportFileName.replace(/\.png$/, '-preventivo-instagram.png'))
      playExportSuccess()
    } catch {
      playError()
      setErrorMessage('Non è stato possibile generare il biglietto preventivo. Riprova.')
    } finally {
      setIsGeneratingQuoteCard(false)
    }
  }

  return (
    <div className={`mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14 ${pricing ? 'pb-28 lg:pb-14' : ''}`}>
      <input
        ref={addFileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        multiple
        onChange={handleAddFileInputChange}
        className="hidden"
      />
      <input
        ref={replaceFileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        onChange={handleReplaceFileInputChange}
        className="hidden"
      />

      <div className="mb-4 flex items-center justify-between">
        <Link
          to={`/${category.slug}`}
          onClick={() => playBack()}
          className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-3.5 py-1.5 text-sm font-medium text-ink-muted transition-colors hover:border-primary/60 hover:text-ink"
        >
          <span aria-hidden="true">←</span>
          Indietro
        </Link>
        <nav aria-label="Percorso di navigazione" className="text-sm text-ink-muted">
          <Link to="/" className="transition-colors hover:text-accent">
            Home
          </Link>
          <span className="mx-2" aria-hidden="true">
            /
          </span>
          <Link to={`/${category.slug}`} className="transition-colors hover:text-accent">
            {category.name}
          </Link>
          <span className="mx-2" aria-hidden="true">
            /
          </span>
          <span className="text-ink">{product.name}</span>
        </nav>
      </div>

      <div className="max-w-2xl">
        <h1 className="text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">{product.name}</h1>
        <p className="mt-3 text-ink-muted">{product.description}</p>
      </div>

      <div className="mt-10 grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="mx-auto w-full max-w-xl lg:mx-0 lg:max-w-none">
          <ConfiguratorCanvas
            product={product}
            baseImageEl={baseImageEl}
            overlayImageEl={overlayImageEl}
            layers={layers}
            selectedLayerId={selectedLayerId}
            onSelectLayer={setSelectedLayerId}
            onUpdateLayerTransform={updateLayerTransform}
            showGrid={showGrid}
            debugCoordinates={debugCoordinates}
            errorMessage={errorMessage}
            onFileSelected={(file) => handleAddImageFiles([file])}
            onRequestUpload={openAddFilePicker}
          />
          {errorMessage && layers.length > 0 && (
            <p role="alert" className="mt-3 text-sm font-medium text-danger">
              {errorMessage}
            </p>
          )}
        </div>

        {/* Colonna di destra dedicata alla gestione dell'immagine/collage: le
            opzioni di prezzo e l'invio, che ora possono contenere molti più
            contenuti (fino a 11 gruppi di opzioni per le console), vivono in
            sezioni a piena larghezza subito sotto, per restare leggibili sia
            da telefono che da computer. */}
        <div className="flex flex-col gap-8">
          <Toolbar
            layers={layers}
            selectedLayerId={selectedLayerId}
            selectedTransform={selectedLayer?.transform ?? null}
            onSelectLayer={setSelectedLayerId}
            onRemoveLayer={handleRemoveLayer}
            onScaleChange={handleScaleChange}
            onRotationChange={handleRotationChange}
            onQuickRotate={handleQuickRotate}
            onCenterAndFit={handleCenterAndFit}
            onReset={handleResetLayer}
            onRequestAddImage={openAddFilePicker}
            onRequestReplaceSelected={openReplacePicker}
            showGrid={showGrid}
            onToggleGrid={setShowGrid}
            maxLayers={MAX_LAYERS}
          />
        </div>
      </div>

      {pricing && (
        <div className="mt-8">
          <PricingPanel
            pricing={pricing}
            selections={pricingSelections}
            onSelect={handleSelectPricingOption}
            notes={notes}
            onNotesChange={setNotes}
            draftRestored={draftRestored}
            onDiscardDraft={handleDiscardDraft}
          />
        </div>
      )}

      {layers.length > 0 && (
        <div className="mx-auto mt-8 max-w-2xl">
          <SendPanel
            productName={product.name}
            hasGenerated={lastExportedBlob !== null}
            isExporting={isExporting}
            onGenerate={handleExport}
            onDownload={handleDownload}
            orderSummaryLines={orderSummaryLines}
            total={total}
            notes={notes}
            orderSummaryText={orderSummaryText}
            onGenerateQuoteCard={handleGenerateQuoteCard}
            isGeneratingQuoteCard={isGeneratingQuoteCard}
          />
        </div>
      )}

      {pricing && total !== null && <StickyTotalBar total={total} onJumpToOptions={handleJumpToOptions} />}
    </div>
  )
}
