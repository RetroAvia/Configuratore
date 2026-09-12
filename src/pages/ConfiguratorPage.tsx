import { useCallback, useEffect, useRef, useState } from 'react'
import type { ChangeEvent } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { getCategory } from '../data/categories'
import { getProduct } from '../data/products'
import NotFoundPage from './NotFoundPage'
import ConfiguratorCanvas from '../components/configurator/ConfiguratorCanvas'
import type { LoadedUserImage } from '../components/configurator/ConfiguratorCanvas'
import Toolbar from '../components/configurator/Toolbar'
import { useHtmlImage } from '../hooks/useHtmlImage'
import { useImageTransform } from '../hooks/useImageTransform'
import { ImageLoadError, loadImageFromFile } from '../utils/fileValidation'
import { downloadBlob, renderProductComposite } from '../utils/exportImage'

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

  // Reimposta lo stato quando l'utente cambia prodotto (es. tramite i link "indietro/avanti" del browser).
  useEffect(() => {
    setUserImage(null)
    setErrorMessage(null)
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
      })
      .catch((err: unknown) => {
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
    } catch {
      setErrorMessage("Non è stato possibile generare l'immagine finale. Riprova.")
    } finally {
      setIsExporting(false)
    }
  }, [product, baseImageEl, userImage, transform, overlayImageEl])

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

      <nav aria-label="Percorso di navigazione" className="mb-8 text-sm text-ink-muted">
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
