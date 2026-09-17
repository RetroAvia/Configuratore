import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
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
import {
  buildOrderSummary,
  computeTotal,
  formatOrderSummaryText,
  formatTotal,
  getDefaultSelections,
  getMaxPrice,
  getStartingPrice,
  resolveSelections,
  sanitizeSelections,
} from '../utils/pricing'
import { clearPricingDraft, readPricingDraft, savePricingDraft } from '../utils/pricingStorage'
import type { ContactInfo } from '../types/order'
import { EMPTY_CONTACT } from '../types/order'
import { buildConfigUrl, CONFIG_PARAM, decodeConfig, makeOrderCode } from '../utils/shareConfig'
import type { SharedConfig } from '../utils/shareConfig'
import { canShareImage, shareImage } from '../utils/share'
import { absoluteUrl, SITE_NAME } from '../config/site'
import { usePageMeta } from '../hooks/usePageMeta'
import { useStructuredData } from '../hooks/useStructuredData'
import { useToasts } from '../hooks/useToasts'
import ToastStack from '../components/common/ToastStack'
import { useLanguage } from '../i18n/LanguageContext'
import type { TranslationKey } from '../i18n/translations'
import { trackEvent } from '../utils/analytics'

const MAX_LAYERS = 6

let layerIdCounter = 0
function createLayerId(): string {
  layerIdCounter += 1
  return `layer-${Date.now()}-${layerIdCounter}`
}

/**
 * Ricostruisce il messaggio d'errore di un `ImageLoadError` nella lingua
 * corrente, a partire dal codice e dai dati strutturati in `err.meta`
 * (vedi `utils/fileValidation.ts`) invece che dal suo `.message`, che resta
 * sempre in italiano (è il fallback usato quando manca il contesto per
 * tradurlo, es. se l'errore venisse loggato altrove).
 */
function getImageErrorMessage(
  err: ImageLoadError,
  t: (key: TranslationKey, vars?: Record<string, string | number>) => string,
): string {
  switch (err.code) {
    case 'unsupported-type':
      return t('errors.unsupportedType', { fileType: err.meta?.fileType ?? '' })
    case 'too-large':
      return t('errors.tooLarge', { sizeMB: err.meta?.sizeMB ?? '', maxMB: err.meta?.maxMB ?? '' })
    case 'decode-error':
    default:
      return t('errors.decodeError')
  }
}

export default function ConfiguratorPage() {
  const { categorySlug = '', modelSlug = '' } = useParams()
  const [searchParams, setSearchParams] = useSearchParams()
  const debugCoordinates = searchParams.get('debug') === '1'

  const category = getCategory(categorySlug)
  const product = category ? getProduct(categorySlug, modelSlug) : undefined
  const { t, tr, locale } = useLanguage()

  usePageMeta({
    title: product ? `${product.name} — ${SITE_NAME}` : t('configuratorPage.notFoundMetaTitle'),
    description: product
      ? t('configuratorPage.metaDescription', {
          productName: product.name,
          priceText: product.pricing
            ? t('configuratorPage.metaPriceSuffix', { price: formatTotal(getStartingPrice(product.pricing), locale) })
            : '',
          description: tr(product.description, product.descriptionI18n),
        })
      : undefined,
    // Il percorso canonico NON include la query string: un link di
    // configurazione condiviso (`?c=…`) punta allo stesso prodotto, e senza
    // questa dichiarazione ogni link condiviso risulterebbe a Google una
    // pagina diversa con lo stesso contenuto.
    path: product ? `/${product.categorySlug}/${product.slug}` : undefined,
    noindex: !product,
  })

  // Dati strutturati Schema.org (Product + intervallo di prezzo), per aiutare
  // Google a capire di cosa parla la pagina.
  //
  // Si dichiara un `AggregateOffer` con prezzo minimo E massimo invece di un
  // singolo `Offer` al prezzo di partenza: un preventivo reale quasi mai
  // costa quanto il minimo, e mostrare nei risultati di ricerca un prezzo che
  // poi il cliente non ritrova è un'informazione fuorviante (oltre che un
  // motivo di rimbalzo immediato dalla pagina).
  const structuredData = useMemo(() => {
    if (!product) return null
    return {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: product.name,
      description: product.description,
      // Immagine ad alta risoluzione: la miniatura serve alle card, non a Google.
      image: absoluteUrl(product.baseImage),
      brand: {
        '@type': 'Brand',
        name: SITE_NAME,
      },
      ...(product.pricing
        ? {
            offers: {
              '@type': 'AggregateOffer',
              priceCurrency: 'EUR',
              lowPrice: getStartingPrice(product.pricing).toFixed(2),
              highPrice: getMaxPrice(product.pricing).toFixed(2),
              offerCount: product.pricing.groups.reduce((count, group) => count + group.options.length, 0),
              availability: 'https://schema.org/InStock',
              url: absoluteUrl(`/${product.categorySlug}/${product.slug}`),
            },
          }
        : {}),
    }
  }, [product])
  useStructuredData(structuredData)

  // Dati strutturati Schema.org (BreadcrumbList): Home > Categoria > Prodotto.
  const breadcrumbData = useMemo(() => {
    if (!product || !category) return null
    const categoryName = tr(category.name, category.nameI18n)
    return {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: SITE_NAME,
          item: absoluteUrl('/'),
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: categoryName,
          item: absoluteUrl(`/${category.slug}`),
        },
        {
          '@type': 'ListItem',
          position: 3,
          name: product.name,
          item: absoluteUrl(`/${product.categorySlug}/${product.slug}`),
        },
      ],
    }
  }, [product, category, tr])
  useStructuredData(breadcrumbData)

  const baseImageEl = useHtmlImage(product?.baseImage)
  const overlayImageEl = useHtmlImage(product?.overlayImage)

  // Tutti gli strati del collage (nell'ordine in cui sono stati aggiunti) e
  // quale, tra questi, è attualmente selezionato (quello che risponde ai
  // controlli di posizionamento e alle maniglie sul canvas).
  const [layers, setLayers] = useState<ImageLayer[]>([])
  const [selectedLayerId, setSelectedLayerId] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  // `errorMessage` alimenta SOLO il messaggio contestuale dentro l'area di
  // caricamento (quando non c'è ancora nessuna immagine); i toast qui sotto
  // sono la notifica visibile per tutti gli altri casi (collage già
  // iniziato, fallimento nella generazione del render/biglietto...), dato
  // che in quei momenti l'area di caricamento non è più a schermo.
  const { toasts, pushToast, dismissToast } = useToasts()
  const [isExporting, setIsExporting] = useState(false)
  const [isGeneratingQuoteCard, setIsGeneratingQuoteCard] = useState(false)
  const [showGrid, setShowGrid] = useState(false)
  const [lastExportedBlob, setLastExportedBlob] = useState<Blob | null>(null)
  const [previewOriginal, setPreviewOriginal] = useState(false)

  // Scelte correnti nel pannello "Opzioni e Prezzo" (se il prodotto ne ha
  // uno) e note libere: alimentano sia il totale mostrato a schermo sia il
  // riepilogo testuale/il biglietto preventivo inviati a RetroAvia. Vengono
  // anche salvate in automatico (solo queste, MAI le immagini caricate) in
  // localStorage — vedi `utils/pricingStorage.ts` — così una ricarica
  // accidentale della pagina non fa perdere 11 gruppi di scelte già fatte.
  const [pricingSelections, setPricingSelections] = useState<PricingSelections>({})
  const [notes, setNotes] = useState('')
  const [draftRestored, setDraftRestored] = useState(false)
  /** True quando le scelte correnti arrivano da un link di configurazione condiviso (`?c=…`) e non da una bozza locale. */
  const [fromSharedLink, setFromSharedLink] = useState(false)

  // Contatti facoltativi e dichiarazione sui diritti dell'immagine: vivono
  // qui perché confluiscono sia nel testo inviato a RetroAvia sia nel link di
  // configurazione condivisibile.
  const [contact, setContact] = useState<ContactInfo>(EMPTY_CONTACT)
  const [rightsAccepted, setRightsAccepted] = useState(false)
  const [isSharing, setIsSharing] = useState(false)
  // `canShareImage()` interroga il browser una volta sola: il risultato non
  // cambia durante la visita e la verifica costruisce un file di prova.
  const [canShareRender] = useState(() => canShareImage())

  const addFileInputRef = useRef<HTMLInputElement>(null)
  const replaceFileInputRef = useRef<HTMLInputElement>(null)
  const replaceTargetIdRef = useRef<string | null>(null)

  // Copia sempre aggiornata di `layers`, leggibile dalla pulizia finale
  // (che deve girare una volta sola, senza ridipendere da `layers`).
  const layersRef = useRef<ImageLayer[]>([])
  useEffect(() => {
    layersRef.current = layers
  }, [layers])

  /**
   * Numero di strati già "prenotati", compresi quelli il cui file è ancora in
   * fase di decodifica.
   *
   * Serve perché il caricamento è asincrono: contando soltanto `layers.length`
   * — che si aggiorna solo a decodifica finita — due caricamenti ravvicinati
   * (o un trascinamento durante un caricamento in corso) vedevano entrambi lo
   * stesso numero di posti liberi e riuscivano a superare il limite massimo.
   * Questo contatore viene incrementato al momento della richiesta e corretto
   * se il file poi si rivela non valido.
   */
  const layerCountRef = useRef(0)

  /** Cambia a ogni cambio di prodotto: i caricamenti iniziati prima vengono riconosciuti come "vecchi" e scartati. */
  const loadGenerationRef = useRef(0)

  // --- Cronologia (undo/redo) ---------------------------------------------
  // Ogni voce di `past`/`future` è uno snapshot COMPLETO dell'array `layers`
  // a un certo momento. Non registriamo ogni singolo micro-movimento: un
  // `useEffect` "assesta" la modifica solo dopo 450ms di quiete (nessun
  // altro cambiamento a `layers`), così un intero trascinamento o pizzico
  // (fatto di decine di aggiornamenti al secondo) diventa UN solo passo di
  // annullamento, non decine.
  const [history, setHistory] = useState<{ past: ImageLayer[][]; future: ImageLayer[][] }>({ past: [], future: [] })
  const lastCommittedLayersRef = useRef<ImageLayer[]>(layers)
  const isApplyingHistoryRef = useRef(false)

  useEffect(() => {
    if (isApplyingHistoryRef.current) {
      // Questo cambiamento di `layers` è stato generato da handleUndo/handleRedo
      // stesso: è già storia, non va ri-registrato come nuovo passo.
      isApplyingHistoryRef.current = false
      return
    }
    const timer = setTimeout(() => {
      setHistory((h) => {
        if (lastCommittedLayersRef.current === layers) return h
        return { past: [...h.past, lastCommittedLayersRef.current].slice(-40), future: [] }
      })
      lastCommittedLayersRef.current = layers
    }, 450)
    return () => clearTimeout(timer)
  }, [layers])

  const handleUndo = useCallback(() => {
    if (history.past.length === 0) return
    const previous = history.past[history.past.length - 1]
    isApplyingHistoryRef.current = true
    lastCommittedLayersRef.current = previous
    layerCountRef.current = previous.length
    setHistory({ past: history.past.slice(0, -1), future: [layers, ...history.future] })
    setLayers(previous)
    setSelectedLayerId((current) => (current && previous.some((l) => l.id === current) ? current : null))
    setLastExportedBlob(null)
  }, [history, layers])

  const handleRedo = useCallback(() => {
    if (history.future.length === 0) return
    const next = history.future[0]
    isApplyingHistoryRef.current = true
    lastCommittedLayersRef.current = next
    layerCountRef.current = next.length
    setHistory({ past: [...history.past, layers], future: history.future.slice(1) })
    setLayers(next)
    setSelectedLayerId((current) => (current && next.some((l) => l.id === current) ? current : null))
    setLastExportedBlob(null)
  }, [history, layers])

  // Reimposta lo stato quando l'utente cambia prodotto (es. tramite i link "indietro/avanti" del browser),
  // rilasciando tutti gli URL oggetto degli strati del prodotto precedente e
  // ripartendo dalle opzioni di default del nuovo prodotto — oppure da una
  // bozza salvata in precedenza per QUESTO stesso prodotto, se presente.
  useEffect(() => {
    // La revoca degli URL oggetto avviene QUI, non dentro l'aggiornamento di
    // stato: gli updater passati a `setState` devono essere funzioni pure.
    // React li esegue due volte in sviluppo (StrictMode) proprio per far
    // emergere effetti collaterali come questo, che portava a revocare due
    // volte gli stessi URL.
    layersRef.current.forEach((layer) => URL.revokeObjectURL(layer.image.key))

    const emptyLayers: ImageLayer[] = []
    setLayers(emptyLayers)
    layersRef.current = emptyLayers
    layerCountRef.current = 0
    loadGenerationRef.current += 1
    setSelectedLayerId(null)
    setErrorMessage(null)
    setLastExportedBlob(null)
    setPreviewOriginal(false)
    setRightsAccepted(false)
    setHistory({ past: [], future: [] })
    lastCommittedLayersRef.current = emptyLayers

    const pricing = product?.pricing
    if (!pricing) {
      setPricingSelections({})
      setNotes('')
      setContact(EMPTY_CONTACT)
      setDraftRestored(false)
      setFromSharedLink(false)
      return
    }

    // Ordine di precedenza nel ripristino delle scelte:
    //
    //  1. LINK CONDIVISO (`?c=…`): è una richiesta esplicita di vedere una
    //     configurazione precisa — quella che un cliente ha mandato, o che
    //     RetroAvia ha rimandato indietro corretta. Vince su tutto.
    //  2. BOZZA LOCALE: le scelte fatte in una visita precedente su questo
    //     stesso dispositivo.
    //  3. VALORI DI DEFAULT.
    //
    // In tutti i casi le selezioni passano da `sanitizeSelections`, che
    // scarta gruppi e opzioni non più esistenti e risolve le combinazioni
    // diventate impossibili: né una bozza di mesi fa né un link manomesso
    // possono quindi portare il configuratore in uno stato incoerente.
    const shared = decodeConfig(searchParams.get(CONFIG_PARAM))
    const sharedMatchesProduct =
      shared !== null && shared.categorySlug === categorySlug && shared.modelSlug === modelSlug

    if (sharedMatchesProduct && shared) {
      setPricingSelections(sanitizeSelections(pricing, shared.selections))
      setNotes(shared.notes)
      setContact(shared.contact ?? EMPTY_CONTACT)
      setDraftRestored(false)
      setFromSharedLink(true)
      trackEvent('config_link_opened', { product: modelSlug, category: categorySlug })

      // Il parametro viene tolto dall'indirizzo una volta applicato (senza
      // aggiungere un passo alla cronologia, così il tasto "indietro"
      // continua a funzionare come ci si aspetta).
      //
      // Senza questo, ricaricando la pagina dopo aver modificato qualcosa si
      // tornerebbe alla configurazione del link perdendo le proprie modifiche:
      // il link ha già fatto il suo lavoro, da qui in poi valgono le scelte
      // dell'utente (salvate in automatico in locale). Per ricondividerla c'è
      // il pulsante "Copia link configurazione", che la ricostruisce sempre
      // aggiornata.
      const remainingParams = new URLSearchParams(searchParams)
      remainingParams.delete(CONFIG_PARAM)
      setSearchParams(remainingParams, { replace: true })
      return
    }

    const draft = readPricingDraft(categorySlug, modelSlug)
    if (draft) {
      setPricingSelections(sanitizeSelections(pricing, draft.selections))
      setNotes(draft.notes)
      setContact(draft.contact)
      setDraftRestored(true)
      setFromSharedLink(false)
      return
    }

    setPricingSelections(getDefaultSelections(pricing))
    setNotes('')
    setContact(EMPTY_CONTACT)
    setDraftRestored(false)
    setFromSharedLink(false)
    // `searchParams` è volutamente escluso: il ripristino da link deve
    // avvenire una sola volta all'apertura del prodotto, non ogni volta che
    // cambia la query string (altrimenti riscriverebbe le scelte mentre
    // l'utente le sta modificando).
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
      savePricingDraft(categorySlug, modelSlug, pricingSelections, notes, contact)
    }, 400)
    return () => clearTimeout(timeout)
  }, [product?.pricing, categorySlug, modelSlug, pricingSelections, notes, contact])

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
      // Il conteggio parte dal contatore delle "prenotazioni" (vedi
      // `layerCountRef`) e non da `layers.length`, che durante una decodifica
      // in corso è ancora indietro.
      const availableSlots = MAX_LAYERS - layerCountRef.current
      if (availableSlots <= 0) {
        playError()
        const message = t('configuratorPage.errorMaxLayers', { max: MAX_LAYERS })
        setErrorMessage(message)
        pushToast(message, 'error')
        return
      }
      const filesToAdd = files.slice(0, availableSlots)
      if (files.length > filesToAdd.length) {
        const message = t('configuratorPage.errorMaxLayersPartial', { max: MAX_LAYERS, added: filesToAdd.length })
        setErrorMessage(message)
        pushToast(message, 'error')
      } else {
        setErrorMessage(null)
      }

      // "Generazione" corrente: se l'utente cambia prodotto mentre un file si
      // sta ancora decodificando, il risultato che arriva dopo appartiene a un
      // prodotto che non è più a schermo e va scartato (liberandone l'URL
      // oggetto) invece di finire nel collage sbagliato.
      const generation = loadGenerationRef.current

      filesToAdd.forEach((file, offset) => {
        const startIndex = layerCountRef.current + offset
        loadImageFromFile(file)
          .then(({ element, url, width, height }) => {
            if (loadGenerationRef.current !== generation) {
              URL.revokeObjectURL(url)
              return
            }
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
            if (loadGenerationRef.current !== generation) return
            // Il posto prenotato viene restituito: un file non valido non
            // deve consumare uno degli slot disponibili.
            layerCountRef.current = Math.max(0, layerCountRef.current - 1)
            playError()
            const message = err instanceof ImageLoadError ? getImageErrorMessage(err, t) : t('configuratorPage.errorUnexpectedAdd')
            setErrorMessage(message)
            pushToast(message, 'error')
          })
      })

      layerCountRef.current += filesToAdd.length
    },
    [clipArea, t, pushToast],
  )

  /** Sostituisce solo la FOTO di uno strato esistente, mantenendone posizione e rotazione. */
  const handleReplaceLayerFile = useCallback((id: string, file: File) => {
    const generation = loadGenerationRef.current
    loadImageFromFile(file)
      .then(({ element, url, width, height }) => {
        if (loadGenerationRef.current !== generation) {
          URL.revokeObjectURL(url)
          return
        }
        setErrorMessage(null)

        // L'URL oggetto della foto sostituita viene liberato QUI, fuori
        // dall'aggiornamento di stato: gli updater devono restare puri (React
        // li esegue due volte in sviluppo, e il vecchio codice finiva così per
        // revocare due volte lo stesso URL).
        const replaced = layersRef.current.find((layer) => layer.id === id)
        if (replaced) URL.revokeObjectURL(replaced.image.key)

        setLayers((current) =>
          current.map((layer) => {
            if (layer.id !== id) return layer
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
        const message = err instanceof ImageLoadError ? getImageErrorMessage(err, t) : t('configuratorPage.errorUnexpectedReplace')
        setErrorMessage(message)
        pushToast(message, 'error')
      })
  }, [t, pushToast])

  const handleRemoveLayer = useCallback(
    (id: string) => {
      const target = layers.find((l) => l.id === id)
      if (target) URL.revokeObjectURL(target.image.key)
      const next = layers.filter((l) => l.id !== id)
      layerCountRef.current = next.length
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
      trackEvent('render_generated', { product: product.slug, category: product.categorySlug })
    } catch {
      playError()
      const message = t('configuratorPage.errorExport')
      setErrorMessage(message)
      pushToast(message, 'error')
    } finally {
      setIsExporting(false)
    }
  }, [product, baseImageEl, layers, overlayImageEl, t, pushToast])

  const handleDownload = useCallback(() => {
    if (!product || !lastExportedBlob) return
    downloadBlob(lastExportedBlob, product.exportFileName)
  }, [product, lastExportedBlob])

  const handleSelectPricingOption = useCallback(
    (groupId: string, optionId: string) => {
      const pricingConfig = product?.pricing
      setPricingSelections((current) => {
        const next = { ...current, [groupId]: optionId }
        // Le selezioni vengono rese coerenti nel momento stesso della scelta,
        // così lo stato salvato nella bozza e quello codificato nel link
        // condivisibile non contengono mai una combinazione impossibile.
        return pricingConfig ? resolveSelections(pricingConfig, next) : next
      })
    },
    [product],
  )

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

  /**
   * Duplica lo strato selezionato. Ridisegna l'immagine su un canvas
   * offscreen per ottenere un blob/URL NUOVI e indipendenti da quelli
   * dello strato originale: condividere lo stesso URL fra due strati
   * romperebbe l'altro nel momento in cui uno dei due viene rimosso o
   * sostituito (`URL.revokeObjectURL` invaliderebbe anche la copia).
   */
  const handleDuplicateLayer = useCallback(() => {
    if (!selectedLayer || layerCountRef.current >= MAX_LAYERS) return

    const { element, width, height } = selectedLayer.image
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.drawImage(element, 0, 0, width, height)

    // Il posto viene prenotato subito: la duplicazione è asincrona e senza
    // questo il pulsante potrebbe essere premuto più volte di fila e superare
    // il numero massimo di strati.
    layerCountRef.current += 1
    const generation = loadGenerationRef.current
    const releaseSlot = () => {
      if (loadGenerationRef.current === generation) layerCountRef.current = Math.max(0, layerCountRef.current - 1)
    }

    canvas.toBlob((blob) => {
      if (!blob) {
        releaseSlot()
        playError()
        pushToast(t('configuratorPage.errorDuplicate'), 'error')
        return
      }
      if (loadGenerationRef.current !== generation) {
        releaseSlot()
        return
      }

      const url = URL.createObjectURL(blob)
      const clone = new Image()
      clone.onload = () => {
        if (loadGenerationRef.current !== generation) {
          URL.revokeObjectURL(url)
          return
        }
        const offset = 28
        const newLayer: ImageLayer = {
          id: createLayerId(),
          image: { key: url, element: clone, width, height },
          transform: { ...selectedLayer.transform, x: selectedLayer.transform.x + offset, y: selectedLayer.transform.y + offset },
        }
        setLayers((current) => [...current, newLayer])
        setSelectedLayerId(newLayer.id)
        setLastExportedBlob(null)
        playUpload()
      }
      // Senza `onerror` un fallimento nella decodifica lasciava il posto
      // occupato per sempre e l'URL oggetto appeso in memoria, senza che
      // l'utente ricevesse alcun messaggio.
      clone.onerror = () => {
        URL.revokeObjectURL(url)
        releaseSlot()
        playError()
        pushToast(t('configuratorPage.errorDuplicate'), 'error')
      }
      clone.src = url
    }, 'image/png')
  }, [selectedLayer, pushToast, t])

  /**
   * Sposta uno strato avanti/indietro nell'ordine di sovrapposizione: dato
   * che l'ordine dell'array `layers` è anche l'ordine di disegno (l'ultimo
   * è quello visivamente più in alto, vedi `ConfiguratorCanvas`), riordinare
   * l'array è tutto ciò che serve — sia per l'anteprima sia per il render
   * finale esportato.
   */
  const handleMoveLayer = useCallback((id: string, direction: 'forward' | 'backward') => {
    setLayers((current) => {
      const index = current.findIndex((l) => l.id === id)
      if (index === -1) return current
      const targetIndex = direction === 'forward' ? index + 1 : index - 1
      if (targetIndex < 0 || targetIndex >= current.length) return current
      const next = [...current]
      ;[next[index], next[targetIndex]] = [next[targetIndex], next[index]]
      return next
    })
    setLastExportedBlob(null)
    playClick()
  }, [])

  // --- Scorciatoie da tastiera (solo desktop, con un'immagine selezionata) ---
  // Frecce per spostare, +/- per ridimensionare, [ e ] per ruotare, Canc per
  // rimuovere, Esc per deselezionare. Disattivate quando il focus è su un
  // campo di testo/numero (incluse le slider di Dimensione/Rotazione, che
  // hanno già il loro comportamento nativo da tastiera).
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null
      const isEditableTarget =
        target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target?.isContentEditable
      if (isEditableTarget) return

      if (e.key === 'Escape') {
        setSelectedLayerId(null)
        return
      }

      const isModifier = e.metaKey || e.ctrlKey
      if (isModifier && e.key.toLowerCase() === 'z') {
        e.preventDefault()
        if (e.shiftKey) {
          handleRedo()
        } else {
          handleUndo()
        }
        return
      }
      if (isModifier && e.key.toLowerCase() === 'y') {
        e.preventDefault()
        handleRedo()
        return
      }

      if (!selectedLayerId) return

      const nudge = e.shiftKey ? 20 : 4
      switch (e.key) {
        case 'ArrowUp':
          e.preventDefault()
          updateLayerTransform(selectedLayerId, (t) => ({ ...t, y: t.y - nudge }))
          break
        case 'ArrowDown':
          e.preventDefault()
          updateLayerTransform(selectedLayerId, (t) => ({ ...t, y: t.y + nudge }))
          break
        case 'ArrowLeft':
          e.preventDefault()
          updateLayerTransform(selectedLayerId, (t) => ({ ...t, x: t.x - nudge }))
          break
        case 'ArrowRight':
          e.preventDefault()
          updateLayerTransform(selectedLayerId, (t) => ({ ...t, x: t.x + nudge }))
          break
        case '+':
        case '=':
          e.preventDefault()
          updateLayerTransform(selectedLayerId, (t) => ({ ...t, scale: clampScale(t.scale * 1.05) }))
          break
        case '-':
        case '_':
          e.preventDefault()
          updateLayerTransform(selectedLayerId, (t) => ({ ...t, scale: clampScale(t.scale / 1.05) }))
          break
        case '[':
          e.preventDefault()
          updateLayerTransform(selectedLayerId, (t) => ({ ...t, rotation: normalizeRotation(t.rotation - 5) }))
          break
        case ']':
          e.preventDefault()
          updateLayerTransform(selectedLayerId, (t) => ({ ...t, rotation: normalizeRotation(t.rotation + 5) }))
          break
        // Solo Canc, NON Backspace: su Backspace è troppo facile cancellare
        // un'immagine per sbaglio uscendo da un campo di testo, e il ripristino
        // con Ctrl+Z non è immediato (la cronologia si consolida dopo una
        // breve pausa).
        case 'Delete':
          e.preventDefault()
          handleRemoveLayer(selectedLayerId)
          break
        default:
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedLayerId, updateLayerTransform, handleRemoveLayer, handleUndo, handleRedo])

  if (!category || !product) {
    return <NotFoundPage />
  }

  const pricing = product.pricing
  const total = pricing ? computeTotal(pricing, pricingSelections) : null

  // Configurazione condivisibile: prodotto + scelte + note + contatti. Da qui
  // nascono sia il link che riapre esattamente questo preventivo sia il
  // codice breve da citare nelle conversazioni — i due elementi che rendono
  // una richiesta ricostruibile senza doverla ricomporre a mano.
  const sharedConfig: SharedConfig | null = pricing
    ? { categorySlug, modelSlug, selections: pricingSelections, notes, contact }
    : null
  const configUrl = sharedConfig ? buildConfigUrl(sharedConfig) : null
  const orderCode = sharedConfig ? makeOrderCode(sharedConfig) : null

  // Il riepilogo mostrato a schermo (`orderSummaryLines`) è tradotto nella
  // lingua corrente per il cliente; il testo inviato via email/Instagram
  // (`orderSummaryText`, tramite `formatOrderSummaryText`) resta invece
  // sempre in italiano di proposito, perché è indirizzato a RetroAvia.
  const orderSummaryLines = pricing ? buildOrderSummary(pricing, pricingSelections, locale) : null
  const orderSummaryText = pricing
    ? formatOrderSummaryText(pricing, pricingSelections, notes, {
        orderCode: orderCode ?? undefined,
        configUrl: configUrl ?? undefined,
        contact,
      })
    : null

  /**
   * Condivisione nativa: passa il render (e il riepilogo come testo)
   * direttamente al foglio di condivisione del telefono.
   *
   * È il percorso più corto verso l'invio — niente download, niente allegato
   * da ritrovare in galleria — e per questo è anche quello in cui si perdono
   * meno richieste. Se il render non è ancora stato generato lo genera al
   * volo, così il pulsante non richiede due passaggi separati.
   */
  const handleShareRender = async () => {
    if (!product) return
    setIsSharing(true)
    setErrorMessage(null)
    try {
      let blob = lastExportedBlob
      if (!blob) {
        if (!baseImageEl || layers.length === 0) return
        blob = await renderProductComposite({
          product,
          baseImageEl,
          layers: layers.map((l) => ({ element: l.image.element, transform: l.transform })),
          overlayImageEl,
        })
        setLastExportedBlob(blob)
      }

      const shareBody = [`${product.name} — ${SITE_NAME}`, orderSummaryText ?? '']
        .filter(Boolean)
        .join('\n\n')

      const outcome = await shareImage({
        blob,
        fileName: product.exportFileName,
        title: `${product.name} — ${SITE_NAME}`,
        text: shareBody,
      })

      if (outcome === 'shared') {
        playExportSuccess()
        trackEvent('render_shared', { product: product.slug, category: product.categorySlug })
      } else if (outcome === 'error' || outcome === 'unsupported') {
        // Se la condivisione non è disponibile o fallisce, il render viene
        // comunque scaricato: l'utente resta con qualcosa in mano invece che
        // con un pulsante che non ha fatto nulla.
        downloadBlob(blob, product.exportFileName)
        pushToast(t('sendPanel.shareFallback'), 'error')
      }
      // 'cancelled' non è un errore: l'utente ha semplicemente chiuso il
      // foglio di condivisione, non serve dirgli nulla.
    } catch {
      playError()
      const message = t('configuratorPage.errorExport')
      setErrorMessage(message)
      pushToast(message, 'error')
    } finally {
      setIsSharing(false)
    }
  }

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
        orderCode: orderCode ?? undefined,
      })
      downloadBlob(blob, product.exportFileName.replace(/\.png$/, '-preventivo-instagram.png'))
      playExportSuccess()
      trackEvent('quote_card_generated', { product: product.slug, category: product.categorySlug })
    } catch {
      playError()
      const message = t('configuratorPage.errorQuoteCard')
      setErrorMessage(message)
      pushToast(message, 'error')
    } finally {
      setIsGeneratingQuoteCard(false)
    }
  }

  return (
    <div className={`mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14 ${pricing ? 'pb-28 lg:pb-14' : ''}`}>
      <ToastStack toasts={toasts} onDismiss={dismissToast} />
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
          {t('categoryPage.back')}
        </Link>
        <nav aria-label={t('categoryPage.breadcrumbAria')} className="text-sm text-ink-muted">
          <Link to="/" className="transition-colors hover:text-accent">
            {t('categoryPage.breadcrumbHome')}
          </Link>
          <span className="mx-2" aria-hidden="true">
            /
          </span>
          <Link to={`/${category.slug}`} className="transition-colors hover:text-accent">
            {tr(category.name, category.nameI18n)}
          </Link>
          <span className="mx-2" aria-hidden="true">
            /
          </span>
          <span className="text-ink">{product.name}</span>
        </nav>
      </div>

      <div className="max-w-2xl">
        <h1 className="text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">{product.name}</h1>
        <p className="mt-3 text-ink-muted">{tr(product.description, product.descriptionI18n)}</p>
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
            onFilesSelected={handleAddImageFiles}
            onRequestUpload={openAddFilePicker}
            previewOriginal={previewOriginal}
          />
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
            onDuplicateSelected={handleDuplicateLayer}
            onMoveLayerForward={() => selectedLayerId && handleMoveLayer(selectedLayerId, 'forward')}
            onMoveLayerBackward={() => selectedLayerId && handleMoveLayer(selectedLayerId, 'backward')}
            onUndo={handleUndo}
            onRedo={handleRedo}
            canUndo={history.past.length > 0}
            canRedo={history.future.length > 0}
            showGrid={showGrid}
            onToggleGrid={setShowGrid}
            previewOriginal={previewOriginal}
            onTogglePreviewOriginal={() => setPreviewOriginal((current) => !current)}
            maxLayers={MAX_LAYERS}
          />
        </div>
      </div>

      {/* Avviso quando si è arrivati da un link di configurazione: senza, chi
          apre il link non capisce perché trova già tutte le opzioni scelte. */}
      {fromSharedLink && (
        <div className="mt-8 flex flex-wrap items-center gap-x-2 gap-y-1 rounded-2xl border border-accent/30 bg-accent/10 px-4 py-3 text-sm text-ink">
          <span aria-hidden="true">🔗</span>
          {t('configuratorPage.sharedConfigNotice')}
          {orderCode && <span className="font-mono text-xs font-bold text-accent">{orderCode}</span>}
        </div>
      )}

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
            orderCode={orderCode}
            configUrl={configUrl}
            contact={contact}
            onContactChange={setContact}
            rightsAccepted={rightsAccepted}
            onRightsAcceptedChange={setRightsAccepted}
            canShareRender={canShareRender}
            onShareRender={handleShareRender}
            isSharing={isSharing}
          />
        </div>
      )}

      {pricing && total !== null && <StickyTotalBar total={total} onJumpToOptions={handleJumpToOptions} />}
    </div>
  )
}
