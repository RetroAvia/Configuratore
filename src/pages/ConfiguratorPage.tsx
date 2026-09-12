import { useCallback, useEffect, useRef, useState } from 'react'
import type { ChangeEvent } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { getCategory } from '../data/categories'
import { getProduct } from '../data/products'
import NotFoundPage from './NotFoundPage'
import ConfiguratorCanvas from '../components/configurator/ConfiguratorCanvas'
import type { LoadedUserImage } from '../components/configurator/ConfiguratorCanvas'
import Toolbar from '../components/configurator/Toolbar'
import SendPanel from '../components/configurator/SendPanel'
import { useHtmlImage } from '../hooks/useHtmlImage'
import { useImageTransform } from '../hooks/useImageTransform'
import { ImageLoadError, assertValidImageFile, loadImageFromFile } from '../utils/fileValidation'
import { downloadBlob, renderProductComposite } from '../utils/exportImage'
import { playBack, playError, playExportSuccess, playUpload } from '../utils/sound'

const MAX_EXTRA_IMAGES = 4
const DOWNLOAD_STAGGER_MS = 350

export default function ConfiguratorPage() {
  const { categorySlug = '', modelSlug = '' } = useParams()
  const [searchParams] = useSearchParams()
  const debugCoordinates = searchParams.get('debug') === '1'

  const category = getCategory(categorySlug)
  const product = category ? getProduct(categorySlug, modelSlug) : undefined

  const baseImageEl = useHtmlImage(product?.baseImage)
  const overlayImageEl = useHtmlImage(product?.overlayImage)

  const [userImage, setUserImage] = useState<LoadedUserImage | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isExporting, setIsExporting] = useState(false)
  const [showGrid, setShowGrid] = useState(false)
  const previousUrlRef = useRef<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Ultimo render generato: rimane disponibile finché l'utente non cambia
  // immagine/prodotto, così può scaricarlo di nuovo senza rigenerarlo.
  const [lastExportedBlob, setLastExportedBlob] = useState<Blob | null>(null)
  const [extraImages, setExtraImages] = useState<File[]>([])
  const [extraImageError, setExtraImageError] = useState<string | null>(null)

  // Reimposta lo stato quando l'utente cambia prodotto (es. tramite i link "indietro/avanti" del browser).
  useEffect(() => {
    setUserImage(null)
    setErrorMessage(null)
    setLastExportedBlob(null)
    setExtraImages([])
    setExtraImageError(null)
    if (previousUrlRef.current) {
      URL.revokeObjectURL(previousUrlRef.current)
      previousUrlRef.current = null
    }
  }, [categorySlug, modelSlug])

  // Rilascia l'ultimo URL oggetto creato quando il componente viene smontato.
  useEffect(() => {
    return () => {
      if (previousUrlRef.current) URL.revokeObjectURL(previousUrlRef.current)
    }
  }, [])

  const clipArea = product?.clipArea ?? { type: 'rect' as const, x: 0, y: 0, width: 1, height: 1 }
  const { transform, setPosition, setScale, setRotation, reset, centerAndFit } = useImageTransform(
    clipArea,
    userImage,
  )

  const handleFileSelected = useCallback((file: File) => {
    loadImageFromFile(file)
      .then(({ element, url, width, height }) => {
        if (previousUrlRef.current) URL.revokeObjectURL(previousUrlRef.current)
        previousUrlRef.current = url
        setErrorMessage(null)
        setUserImage({ key: url, element, width, height })
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

  const handleFileInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFileSelected(file)
    // Permette di selezionare di nuovo lo stesso file in futuro (altrimenti "onChange" non si attiverebbe).
    e.target.value = ''
  }

  const openFilePicker = useCallback(() => fileInputRef.current?.click(), [])

  const handleExport = useCallback(async () => {
    if (!product || !baseImageEl || !userImage) return
    setIsExporting(true)
    setErrorMessage(null)
    try {
      const blob = await renderProductComposite({
        product,
        baseImageEl,
        userImageEl: userImage.element,
        transform,
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
  }, [product, baseImageEl, userImage, transform, overlayImageEl])

  const handleAddExtraImages = useCallback((files: FileList) => {
    setExtraImageError(null)
    setExtraImages((current) => {
      const accepted: File[] = []
      for (const file of Array.from(files)) {
        if (current.length + accepted.length >= MAX_EXTRA_IMAGES) {
          setExtraImageError(`Puoi aggiungere al massimo ${MAX_EXTRA_IMAGES} immagini extra.`)
          break
        }
        try {
          assertValidImageFile(file)
          accepted.push(file)
        } catch (err) {
          if (err instanceof ImageLoadError) setExtraImageError(err.message)
        }
      }
      return accepted.length > 0 ? [...current, ...accepted] : current
    })
  }, [])

  const handleRemoveExtraImage = useCallback((index: number) => {
    setExtraImages((current) => current.filter((_, i) => i !== index))
  }, [])

  const handleDownloadAll = useCallback(() => {
    if (!product) return
    let delay = 0
    if (lastExportedBlob) {
      downloadBlob(lastExportedBlob, product.exportFileName)
      delay += DOWNLOAD_STAGGER_MS
    }
    extraImages.forEach((file) => {
      const runDelay = delay
      window.setTimeout(() => downloadBlob(file, file.name), runDelay)
      delay += DOWNLOAD_STAGGER_MS
    })
  }, [product, lastExportedBlob, extraImages])

  if (!category || !product) {
    return <NotFoundPage />
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        onChange={handleFileInputChange}
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
        <div className="mx-auto w-full max-w-xl lg:mx-0">
          <ConfiguratorCanvas
            product={product}
            baseImageEl={baseImageEl}
            overlayImageEl={overlayImageEl}
            userImage={userImage}
            transform={transform}
            setPosition={setPosition}
            setScale={setScale}
            setRotation={setRotation}
            showGrid={showGrid}
            debugCoordinates={debugCoordinates}
            errorMessage={errorMessage}
            onFileSelected={handleFileSelected}
            onRequestUpload={openFilePicker}
          />
          {errorMessage && userImage === null && (
            <p role="alert" className="mt-3 text-sm font-medium text-danger">
              {errorMessage}
            </p>
          )}

          {lastExportedBlob && (
            <SendPanel
              productName={product.name}
              extraImages={extraImages}
              extraImageError={extraImageError}
              onAddExtraImages={handleAddExtraImages}
              onRemoveExtraImage={handleRemoveExtraImage}
              onDownloadAll={handleDownloadAll}
            />
          )}
        </div>

        <Toolbar
          hasImage={userImage !== null}
          transform={transform}
          showGrid={showGrid}
          isExporting={isExporting}
          onToggleGrid={setShowGrid}
          onScaleChange={setScale}
          onRotationChange={setRotation}
          onQuickRotate={(delta) => setRotation((r) => r + delta)}
          onCenterAndFit={centerAndFit}
          onReset={reset}
          onRequestUpload={openFilePicker}
          onExport={handleExport}
        />
      </div>
    </div>
  )
}
