import type { Locale } from './locale'

type Vars = Record<string, string | number>
type Value = string | ((vars: Vars) => string)

/**
 * Dizionario dei testi "di interfaccia" (bottoni, etichette, messaggi
 * d'errore, meta tag...), separato dai contenuti "dati" (nomi/descrizioni
 * di prodotti, categorie, opzioni prezzo) che vivono invece come campi
 * `*I18n` accanto al valore italiano nei file di `src/data/` (vedi `tr()`
 * in `./locale.ts`). L'italiano qui sotto è la fonte di verità: se manca
 * una chiave in un'altra lingua, `t()` ricade sull'italiano.
 */
const it = {
  'header.instagramAria': 'RetroAvia su Instagram',
  'header.instagramTitle': 'Seguici su Instagram',
  'header.mute': 'Disattiva i suoni',
  'header.unmute': 'Attiva i suoni',
  'header.languageLabel': 'Cambia lingua',

  'footer.eyebrow': 'Seguici in volo',
  'footer.subtitle': 'Nuovi modelli, personalizzazioni e retroscena direttamente dal laboratorio.',
  'footer.privacyNote':
    'RetroAvia Lab è realizzato interamente lato client: nessuna immagine caricata lascia mai il tuo browser.',
  'footer.copyright': ((vars: Vars) => `© ${vars.year} RetroAvia Lab.`) as Value,

  'home.badge': '100% nel tuo browser · nessun upload su server',
  'home.heroTitlePrefix': 'Rendi unico il tuo',
  'home.heroTitleHighlight': 'gadget preferito',
  'home.heroSubtitle':
    'Carica una tua immagine, posizionala con precisione e scarica il risultato: gratis, veloce e senza installare nulla.',
  'home.chooseCategory': 'Scegli una categoria',
  'home.metaTitle': 'RetroAvia Lab — Personalizza i tuoi prodotti',
  'home.metaDescription':
    'RetroAvia Lab: personalizza orologi digitali Casio e console portatili Nintendo con una tua immagine. Carica, posiziona, ruota e scarica il risultato — tutto nel browser, gratis.',

  'howItWorks.eyebrow': 'Come funziona',
  'howItWorks.title': 'Dall’idea al pezzo unico, in 4 passi',
  'howItWorks.step': ((vars: Vars) => `Passo ${vars.n}`) as Value,

  'gallery.eyebrow': 'Lavori realizzati',
  'gallery.title': 'Qualche personalizzazione consegnata ai clienti',

  'categoryCard.explore': 'Esplora',

  'productCard.fromPrice': ((vars: Vars) => `da ${vars.price}`) as Value,
  'productCard.customizeNow': 'Personalizza ora',

  'categoryPage.back': 'Indietro',
  'categoryPage.breadcrumbHome': 'Home',
  'categoryPage.breadcrumbAria': 'Percorso di navigazione',
  'categoryPage.emptyState': 'Nessun modello disponibile ancora in questa categoria: torna presto a trovarci!',
  'categoryPage.metaTitle': ((vars: Vars) => `${vars.categoryName} — RetroAvia Lab`) as Value,
  'categoryPage.notFoundMetaTitle': 'Categoria non trovata — RetroAvia Lab',

  'notFoundPage.title': 'Pagina non trovata',
  'notFoundPage.description':
    'La pagina che cerchi non esiste, oppure il modello richiesto non è (ancora) disponibile.',
  'notFoundPage.cta': 'Torna alla home',
  'notFoundPage.metaTitle': 'Pagina non trovata — RetroAvia Lab',

  'configuratorPage.notFoundMetaTitle': 'Prodotto non trovato — RetroAvia Lab',
  'configuratorPage.metaPriceSuffix': ((vars: Vars) => `, a partire da ${vars.price}`) as Value,
  'configuratorPage.metaDescription': ((vars: Vars) =>
    `Personalizza il tuo ${vars.productName} con una tua immagine${vars.priceText}. ${vars.description}`) as Value,
  'configuratorPage.errorMaxLayers': ((vars: Vars) => `Puoi aggiungere al massimo ${vars.max} immagini.`) as Value,
  'configuratorPage.errorMaxLayersPartial': ((vars: Vars) =>
    `Puoi aggiungere al massimo ${vars.max} immagini: ho caricato solo le prime ${vars.added}.`) as Value,
  'configuratorPage.errorUnexpectedAdd': "Si è verificato un errore imprevisto durante il caricamento di un'immagine.",
  'configuratorPage.errorUnexpectedReplace':
    "Si è verificato un errore imprevisto durante il caricamento dell'immagine.",
  'configuratorPage.errorExport': "Non è stato possibile generare l'immagine finale. Riprova.",
  'configuratorPage.errorQuoteCard': 'Non è stato possibile generare il biglietto preventivo. Riprova.',

  'toolbar.imageHeading': 'Immagine',
  'toolbar.addImage': 'Aggiungi immagine',
  'toolbar.uploadImage': 'Carica immagine',
  'toolbar.replaceSelected': 'Sostituisci selezionata',
  'toolbar.collageHintSingle':
    "Aggiungine altre per comporre un collage: ogni immagine si sposta, ridimensiona e ruota in modo indipendente dalle altre.",
  'toolbar.collageHintMultiple': ((vars: Vars) =>
    `${vars.count} immagini nel collage — tocca una miniatura per selezionarla e modificarla.`) as Value,
  'toolbar.imageLabel': ((vars: Vars) => `Immagine ${vars.index}`) as Value,
  'toolbar.removeImageAria': ((vars: Vars) => `Rimuovi immagine ${vars.index}`) as Value,
  'toolbar.maxReached': ((vars: Vars) => `Hai raggiunto il massimo di ${vars.max} immagini.`) as Value,
  'toolbar.positioningHeading': 'Posizionamento',
  'toolbar.positioningHint': "Regola l'immagine selezionata (evidenziata nell'anteprima).",
  'toolbar.sizeLabel': 'Dimensione',
  'toolbar.rotationLabel': 'Rotazione',
  'toolbar.centerAndFit': 'Centra automaticamente',
  'toolbar.reset': 'Reset',
  'toolbar.precisionHeading': 'Aiuti alla precisione',
  'toolbar.showGrid': 'Mostra griglia',
  'toolbar.instructions':
    "Tocca una miniatura qui sopra per scegliere l'immagine da modificare. Trascina l'immagine selezionata per spostarla, usa le maniglie sugli angoli (o il pizzico a due dita su mobile) per ridimensionarla, e la maniglia in alto per ruotarla. Le linee guida azzurre compaiono automaticamente quando è centrata. Quando sei soddisfatto, genera e invia il render dal pannello qui sotto.",

  'pricingPanel.heading': 'Opzioni e Prezzo',
  'pricingPanel.description':
    "Scegli le modifiche che vuoi: il totale si aggiorna subito e verrà incluso nel messaggio che invii a RetroAvia, insieme al render della tua idea.",
  'pricingPanel.draftRestored': 'Abbiamo ripristinato le tue scelte precedenti per questo modello.',
  'pricingPanel.discardDraft': 'Ricomincia da zero',
  'pricingPanel.notesLabel': 'Note',
  'pricingPanel.totalLabel': 'Totale stimato',

  'sendPanel.heading': 'Invia la tua idea',
  'sendPanel.description':
    "Più che scaricarla, la personalizzazione va fatta vedere a RetroAvia: genera il render — contiene già tutte le immagini del collage, composte insieme — poi invialo via email o Instagram.",
  'sendPanel.orderSummaryHeading': 'Riepilogo ordine',
  'sendPanel.notesPrefix': 'Note: ',
  'sendPanel.totalLabel': 'Totale stimato',
  'sendPanel.step1Heading': '1. Genera il render finale',
  'sendPanel.step1Description': "Crea l'immagine ad alta risoluzione (scocca + il tuo collage) e la scarica sul tuo dispositivo.",
  'sendPanel.generating': 'Sto preparando il render…',
  'sendPanel.regenerate': 'Rigenera e riscarica',
  'sendPanel.generateAndDownload': 'Genera e scarica il render',
  'sendPanel.downloadedConfirm':
    "✓ Render scaricato. Se sposti o ridimensioni un'immagine del collage, o cambi le opzioni, rigeneralo prima di inviarlo.",
  'sendPanel.step2Heading': '2. Invia',
  'sendPanel.step2Description': 'Si apre email o Instagram già pronti: ricordati di allegare il file scaricato al passaggio 1.',
  'sendPanel.downloadAgain': 'Scarica di nuovo il render',
  'sendPanel.sendEmail': 'Invia via email',
  'sendPanel.sendInstagram': 'Invia su Instagram',
  'sendPanel.instagramRecommended': 'Consigliato per Instagram',
  'sendPanel.instagramRecommendedDescription':
    "Genera un'unica immagine con la tua foto e il riepilogo prezzi già dentro: un solo file da allegare, niente testo da copiare a parte.",
  'sendPanel.generatingQuoteCard': 'Sto preparando il biglietto…',
  'sendPanel.generateQuoteCard': 'Genera biglietto preventivo per Instagram',
  'sendPanel.generateQuoteCardHint': 'Genera prima il render al passaggio 1 qui sopra.',
  'sendPanel.copySummary': 'Copia il riepilogo (testo semplice)',
  'sendPanel.copiedSummary': 'Riepilogo copiato!',
  'sendPanel.noOpenFooter': 'Non si apre nulla?',
  'sendPanel.noOpenFooterLink': 'Scrivici dal profilo @retroavia_',

  'stickyTotalBar.totalLabel': 'Totale stimato',
  'stickyTotalBar.options': 'Opzioni',

  'infoTooltip.aria': 'Maggiori informazioni',

  'uploadPrompt.compactDrop': 'Rilascia qui',
  'uploadPrompt.compactTap': 'Tocca per caricare la tua immagine',
  'uploadPrompt.formats': 'JPG, PNG o WEBP',
  'uploadPrompt.fullDrop': 'Rilascia qui la tua immagine',
  'uploadPrompt.fullDrag': 'Trascina qui una tua immagine',
  'uploadPrompt.orTap': 'oppure tocca per selezionarne una',

  'errors.unsupportedType': ((vars: Vars) =>
    vars.fileType
      ? `Formato non supportato (${vars.fileType}). Usa un'immagine JPG, PNG o WEBP.`
      : "Formato non supportato. Usa un'immagine JPG, PNG o WEBP.") as Value,
  'errors.tooLarge': ((vars: Vars) => `Il file è troppo grande (${vars.sizeMB} MB). Il limite è ${vars.maxMB} MB.`) as Value,
  'errors.decodeError':
    "Impossibile leggere questa immagine: il file potrebbe essere danneggiato o non è realmente un'immagine.",
} satisfies Record<string, Value>

type TranslationKey = keyof typeof it

export type { TranslationKey }

const en: Record<TranslationKey, Value> = {
  'header.instagramAria': 'RetroAvia on Instagram',
  'header.instagramTitle': 'Follow us on Instagram',
  'header.mute': 'Mute sounds',
  'header.unmute': 'Unmute sounds',
  'header.languageLabel': 'Change language',

  'footer.eyebrow': 'Follow our flight',
  'footer.subtitle': 'New models, customizations and behind-the-scenes straight from the lab.',
  'footer.privacyNote': 'RetroAvia Lab runs entirely client-side: no uploaded image ever leaves your browser.',
  'footer.copyright': (vars) => `© ${vars.year} RetroAvia Lab.`,

  'home.badge': '100% in your browser · nothing uploaded to any server',
  'home.heroTitlePrefix': 'Make your',
  'home.heroTitleHighlight': 'favorite gadget unique',
  'home.heroSubtitle':
    'Upload your own image, position it precisely and download the result: free, fast, nothing to install.',
  'home.chooseCategory': 'Choose a category',
  'home.metaTitle': 'RetroAvia Lab — Customize your products',
  'home.metaDescription':
    'RetroAvia Lab: customize Casio digital watches and Nintendo handheld consoles with your own image. Upload, position, rotate and download the result — all in your browser, for free.',

  'howItWorks.eyebrow': 'How it works',
  'howItWorks.title': 'From idea to one-of-a-kind piece, in 4 steps',
  'howItWorks.step': (vars) => `Step ${vars.n}`,

  'gallery.eyebrow': 'Work we’ve done',
  'gallery.title': 'A few customizations delivered to customers',

  'categoryCard.explore': 'Explore',

  'productCard.fromPrice': (vars) => `from ${vars.price}`,
  'productCard.customizeNow': 'Customize now',

  'categoryPage.back': 'Back',
  'categoryPage.breadcrumbHome': 'Home',
  'categoryPage.breadcrumbAria': 'Breadcrumb',
  'categoryPage.emptyState': 'No models available yet in this category: check back soon!',
  'categoryPage.metaTitle': (vars) => `${vars.categoryName} — RetroAvia Lab`,
  'categoryPage.notFoundMetaTitle': 'Category not found — RetroAvia Lab',

  'notFoundPage.title': 'Page not found',
  'notFoundPage.description': 'The page you’re looking for doesn’t exist, or the requested model isn’t available (yet).',
  'notFoundPage.cta': 'Back to home',
  'notFoundPage.metaTitle': 'Page not found — RetroAvia Lab',

  'configuratorPage.notFoundMetaTitle': 'Product not found — RetroAvia Lab',
  'configuratorPage.metaPriceSuffix': (vars) => `, from ${vars.price}`,
  'configuratorPage.metaDescription': (vars) =>
    `Customize your ${vars.productName} with your own image${vars.priceText}. ${vars.description}`,
  'configuratorPage.errorMaxLayers': (vars) => `You can add up to ${vars.max} images.`,
  'configuratorPage.errorMaxLayersPartial': (vars) =>
    `You can add up to ${vars.max} images: only the first ${vars.added} were uploaded.`,
  'configuratorPage.errorUnexpectedAdd': 'An unexpected error occurred while uploading an image.',
  'configuratorPage.errorUnexpectedReplace': 'An unexpected error occurred while uploading the image.',
  'configuratorPage.errorExport': 'Could not generate the final image. Please try again.',
  'configuratorPage.errorQuoteCard': 'Could not generate the quote card. Please try again.',

  'toolbar.imageHeading': 'Image',
  'toolbar.addImage': 'Add image',
  'toolbar.uploadImage': 'Upload image',
  'toolbar.replaceSelected': 'Replace selected',
  'toolbar.collageHintSingle': 'Add more to build a collage: each image moves, resizes and rotates independently of the others.',
  'toolbar.collageHintMultiple': (vars) => `${vars.count} images in the collage — tap a thumbnail to select and edit it.`,
  'toolbar.imageLabel': (vars) => `Image ${vars.index}`,
  'toolbar.removeImageAria': (vars) => `Remove image ${vars.index}`,
  'toolbar.maxReached': (vars) => `You’ve reached the maximum of ${vars.max} images.`,
  'toolbar.positioningHeading': 'Positioning',
  'toolbar.positioningHint': 'Adjust the selected image (highlighted in the preview).',
  'toolbar.sizeLabel': 'Size',
  'toolbar.rotationLabel': 'Rotation',
  'toolbar.centerAndFit': 'Center automatically',
  'toolbar.reset': 'Reset',
  'toolbar.precisionHeading': 'Precision aids',
  'toolbar.showGrid': 'Show grid',
  'toolbar.instructions':
    'Tap a thumbnail above to choose which image to edit. Drag the selected image to move it, use the corner handles (or a two-finger pinch on mobile) to resize it, and the top handle to rotate it. Blue guide lines appear automatically when it’s centered. When you’re happy with it, generate and send the render from the panel below.',

  'pricingPanel.heading': 'Options & Price',
  'pricingPanel.description':
    'Choose the changes you want: the total updates instantly and will be included in the message you send to RetroAvia, along with the render of your idea.',
  'pricingPanel.draftRestored': 'We’ve restored your previous choices for this model.',
  'pricingPanel.discardDraft': 'Start over',
  'pricingPanel.notesLabel': 'Notes',
  'pricingPanel.totalLabel': 'Estimated total',

  'sendPanel.heading': 'Send us your idea',
  'sendPanel.description':
    'Rather than just downloading it, RetroAvia needs to see your customization: generate the render — it already contains every image in the collage, composed together — then send it via email or Instagram.',
  'sendPanel.orderSummaryHeading': 'Order summary',
  'sendPanel.notesPrefix': 'Notes: ',
  'sendPanel.totalLabel': 'Estimated total',
  'sendPanel.step1Heading': '1. Generate the final render',
  'sendPanel.step1Description': 'Creates the high-resolution image (shell + your collage) and downloads it to your device.',
  'sendPanel.generating': 'Preparing the render…',
  'sendPanel.regenerate': 'Regenerate and re-download',
  'sendPanel.generateAndDownload': 'Generate and download the render',
  'sendPanel.downloadedConfirm':
    '✓ Render downloaded. If you move or resize an image in the collage, or change the options, regenerate it before sending.',
  'sendPanel.step2Heading': '2. Send',
  'sendPanel.step2Description': 'Email or Instagram will open ready to go: remember to attach the file downloaded in step 1.',
  'sendPanel.downloadAgain': 'Download the render again',
  'sendPanel.sendEmail': 'Send via email',
  'sendPanel.sendInstagram': 'Send on Instagram',
  'sendPanel.instagramRecommended': 'Recommended for Instagram',
  'sendPanel.instagramRecommendedDescription':
    'Generate a single image with your photo and the price summary already built in: just one file to attach, no separate text to copy.',
  'sendPanel.generatingQuoteCard': 'Preparing the card…',
  'sendPanel.generateQuoteCard': 'Generate Instagram quote card',
  'sendPanel.generateQuoteCardHint': 'Generate the render in step 1 above first.',
  'sendPanel.copySummary': 'Copy the summary (plain text)',
  'sendPanel.copiedSummary': 'Summary copied!',
  'sendPanel.noOpenFooter': 'Nothing opening?',
  'sendPanel.noOpenFooterLink': 'Message us at @retroavia_',

  'stickyTotalBar.totalLabel': 'Estimated total',
  'stickyTotalBar.options': 'Options',

  'infoTooltip.aria': 'More information',

  'uploadPrompt.compactDrop': 'Drop here',
  'uploadPrompt.compactTap': 'Tap to upload your image',
  'uploadPrompt.formats': 'JPG, PNG or WEBP',
  'uploadPrompt.fullDrop': 'Drop your image here',
  'uploadPrompt.fullDrag': 'Drag your image here',
  'uploadPrompt.orTap': 'or tap to select one',

  'errors.unsupportedType': (vars) =>
    vars.fileType
      ? `Unsupported format (${vars.fileType}). Use a JPG, PNG or WEBP image.`
      : 'Unsupported format. Use a JPG, PNG or WEBP image.',
  'errors.tooLarge': (vars) => `The file is too large (${vars.sizeMB} MB). The limit is ${vars.maxMB} MB.`,
  'errors.decodeError': 'Couldn’t read this image: the file may be corrupted or isn’t really an image.',
}

const es: Record<TranslationKey, Value> = {
  'header.instagramAria': 'RetroAvia en Instagram',
  'header.instagramTitle': 'Síguenos en Instagram',
  'header.mute': 'Silenciar sonidos',
  'header.unmute': 'Activar sonidos',
  'header.languageLabel': 'Cambiar idioma',

  'footer.eyebrow': 'Síguenos en vuelo',
  'footer.subtitle': 'Nuevos modelos, personalizaciones y detrás de escena directamente del laboratorio.',
  'footer.privacyNote':
    'RetroAvia Lab funciona enteramente del lado del cliente: ninguna imagen cargada sale nunca de tu navegador.',
  'footer.copyright': (vars) => `© ${vars.year} RetroAvia Lab.`,

  'home.badge': '100% en tu navegador · sin subidas a ningún servidor',
  'home.heroTitlePrefix': 'Haz único tu',
  'home.heroTitleHighlight': 'gadget favorito',
  'home.heroSubtitle': 'Sube tu propia imagen, colócala con precisión y descarga el resultado: gratis, rápido y sin instalar nada.',
  'home.chooseCategory': 'Elige una categoría',
  'home.metaTitle': 'RetroAvia Lab — Personaliza tus productos',
  'home.metaDescription':
    'RetroAvia Lab: personaliza relojes digitales Casio y consolas portátiles Nintendo con tu propia imagen. Sube, coloca, gira y descarga el resultado — todo en el navegador, gratis.',

  'howItWorks.eyebrow': 'Cómo funciona',
  'howItWorks.title': 'De la idea a la pieza única, en 4 pasos',
  'howItWorks.step': (vars) => `Paso ${vars.n}`,

  'gallery.eyebrow': 'Trabajos realizados',
  'gallery.title': 'Algunas personalizaciones entregadas a clientes',

  'categoryCard.explore': 'Explorar',

  'productCard.fromPrice': (vars) => `desde ${vars.price}`,
  'productCard.customizeNow': 'Personalizar ahora',

  'categoryPage.back': 'Atrás',
  'categoryPage.breadcrumbHome': 'Inicio',
  'categoryPage.breadcrumbAria': 'Ruta de navegación',
  'categoryPage.emptyState': 'Todavía no hay modelos disponibles en esta categoría: ¡vuelve pronto!',
  'categoryPage.metaTitle': (vars) => `${vars.categoryName} — RetroAvia Lab`,
  'categoryPage.notFoundMetaTitle': 'Categoría no encontrada — RetroAvia Lab',

  'notFoundPage.title': 'Página no encontrada',
  'notFoundPage.description': 'La página que buscas no existe, o el modelo solicitado no está (todavía) disponible.',
  'notFoundPage.cta': 'Volver al inicio',
  'notFoundPage.metaTitle': 'Página no encontrada — RetroAvia Lab',

  'configuratorPage.notFoundMetaTitle': 'Producto no encontrado — RetroAvia Lab',
  'configuratorPage.metaPriceSuffix': (vars) => `, desde ${vars.price}`,
  'configuratorPage.metaDescription': (vars) =>
    `Personaliza tu ${vars.productName} con tu propia imagen${vars.priceText}. ${vars.description}`,
  'configuratorPage.errorMaxLayers': (vars) => `Puedes añadir un máximo de ${vars.max} imágenes.`,
  'configuratorPage.errorMaxLayersPartial': (vars) =>
    `Puedes añadir un máximo de ${vars.max} imágenes: solo se han cargado las primeras ${vars.added}.`,
  'configuratorPage.errorUnexpectedAdd': 'Se ha producido un error inesperado al cargar una imagen.',
  'configuratorPage.errorUnexpectedReplace': 'Se ha producido un error inesperado al cargar la imagen.',
  'configuratorPage.errorExport': 'No se ha podido generar la imagen final. Inténtalo de nuevo.',
  'configuratorPage.errorQuoteCard': 'No se ha podido generar el presupuesto. Inténtalo de nuevo.',

  'toolbar.imageHeading': 'Imagen',
  'toolbar.addImage': 'Añadir imagen',
  'toolbar.uploadImage': 'Subir imagen',
  'toolbar.replaceSelected': 'Sustituir seleccionada',
  'toolbar.collageHintSingle':
    'Añade más para componer un collage: cada imagen se mueve, redimensiona y gira de forma independiente de las demás.',
  'toolbar.collageHintMultiple': (vars) => `${vars.count} imágenes en el collage — toca una miniatura para seleccionarla y editarla.`,
  'toolbar.imageLabel': (vars) => `Imagen ${vars.index}`,
  'toolbar.removeImageAria': (vars) => `Eliminar imagen ${vars.index}`,
  'toolbar.maxReached': (vars) => `Has alcanzado el máximo de ${vars.max} imágenes.`,
  'toolbar.positioningHeading': 'Posicionamiento',
  'toolbar.positioningHint': 'Ajusta la imagen seleccionada (resaltada en la vista previa).',
  'toolbar.sizeLabel': 'Tamaño',
  'toolbar.rotationLabel': 'Rotación',
  'toolbar.centerAndFit': 'Centrar automáticamente',
  'toolbar.reset': 'Restablecer',
  'toolbar.precisionHeading': 'Ayudas de precisión',
  'toolbar.showGrid': 'Mostrar cuadrícula',
  'toolbar.instructions':
    'Toca una miniatura de arriba para elegir qué imagen editar. Arrastra la imagen seleccionada para moverla, usa los tiradores de las esquinas (o pellizca con dos dedos en el móvil) para redimensionarla, y el tirador superior para rotarla. Aparecen líneas guía azules automáticamente cuando está centrada. Cuando estés satisfecho, genera y envía el render desde el panel de abajo.',

  'pricingPanel.heading': 'Opciones y precio',
  'pricingPanel.description':
    'Elige los cambios que quieras: el total se actualiza al instante y se incluirá en el mensaje que envíes a RetroAvia, junto con el render de tu idea.',
  'pricingPanel.draftRestored': 'Hemos restaurado tus elecciones anteriores para este modelo.',
  'pricingPanel.discardDraft': 'Empezar de nuevo',
  'pricingPanel.notesLabel': 'Notas',
  'pricingPanel.totalLabel': 'Total estimado',

  'sendPanel.heading': 'Envía tu idea',
  'sendPanel.description':
    'Más que descargarla, RetroAvia tiene que ver tu personalización: genera el render — ya contiene todas las imágenes del collage, compuestas juntas — y luego envíalo por email o Instagram.',
  'sendPanel.orderSummaryHeading': 'Resumen del pedido',
  'sendPanel.notesPrefix': 'Notas: ',
  'sendPanel.totalLabel': 'Total estimado',
  'sendPanel.step1Heading': '1. Genera el render final',
  'sendPanel.step1Description': 'Crea la imagen en alta resolución (carcasa + tu collage) y la descarga en tu dispositivo.',
  'sendPanel.generating': 'Preparando el render…',
  'sendPanel.regenerate': 'Regenerar y volver a descargar',
  'sendPanel.generateAndDownload': 'Generar y descargar el render',
  'sendPanel.downloadedConfirm':
    '✓ Render descargado. Si mueves o redimensionas una imagen del collage, o cambias las opciones, vuelve a generarlo antes de enviarlo.',
  'sendPanel.step2Heading': '2. Enviar',
  'sendPanel.step2Description': 'Se abrirá el email o Instagram ya listos: recuerda adjuntar el archivo descargado en el paso 1.',
  'sendPanel.downloadAgain': 'Descargar de nuevo el render',
  'sendPanel.sendEmail': 'Enviar por email',
  'sendPanel.sendInstagram': 'Enviar por Instagram',
  'sendPanel.instagramRecommended': 'Recomendado para Instagram',
  'sendPanel.instagramRecommendedDescription':
    'Genera una sola imagen con tu foto y el resumen de precios ya incluido: un único archivo que adjuntar, sin texto aparte que copiar.',
  'sendPanel.generatingQuoteCard': 'Preparando el bono…',
  'sendPanel.generateQuoteCard': 'Generar bono de presupuesto para Instagram',
  'sendPanel.generateQuoteCardHint': 'Genera primero el render en el paso 1 de arriba.',
  'sendPanel.copySummary': 'Copiar el resumen (texto simple)',
  'sendPanel.copiedSummary': '¡Resumen copiado!',
  'sendPanel.noOpenFooter': '¿No se abre nada?',
  'sendPanel.noOpenFooterLink': 'Escríbenos desde el perfil @retroavia_',

  'stickyTotalBar.totalLabel': 'Total estimado',
  'stickyTotalBar.options': 'Opciones',

  'infoTooltip.aria': 'Más información',

  'uploadPrompt.compactDrop': 'Suelta aquí',
  'uploadPrompt.compactTap': 'Toca para subir tu imagen',
  'uploadPrompt.formats': 'JPG, PNG o WEBP',
  'uploadPrompt.fullDrop': 'Suelta aquí tu imagen',
  'uploadPrompt.fullDrag': 'Arrastra aquí tu imagen',
  'uploadPrompt.orTap': 'o toca para seleccionar una',

  'errors.unsupportedType': (vars) =>
    vars.fileType
      ? `Formato no compatible (${vars.fileType}). Usa una imagen JPG, PNG o WEBP.`
      : 'Formato no compatible. Usa una imagen JPG, PNG o WEBP.',
  'errors.tooLarge': (vars) => `El archivo es demasiado grande (${vars.sizeMB} MB). El límite es ${vars.maxMB} MB.`,
  'errors.decodeError': 'No se ha podido leer esta imagen: el archivo podría estar dañado o no ser realmente una imagen.',
}

const fr: Record<TranslationKey, Value> = {
  'header.instagramAria': 'RetroAvia sur Instagram',
  'header.instagramTitle': 'Suivez-nous sur Instagram',
  'header.mute': 'Couper le son',
  'header.unmute': 'Activer le son',
  'header.languageLabel': 'Changer de langue',

  'footer.eyebrow': 'Suivez notre vol',
  'footer.subtitle': 'Nouveaux modèles, personnalisations et coulisses directement du laboratoire.',
  'footer.privacyNote':
    'RetroAvia Lab fonctionne entièrement côté client : aucune image importée ne quitte jamais votre navigateur.',
  'footer.copyright': (vars) => `© ${vars.year} RetroAvia Lab.`,

  'home.badge': '100 % dans votre navigateur · aucun envoi sur un serveur',
  'home.heroTitlePrefix': 'Rendez unique votre',
  'home.heroTitleHighlight': 'gadget préféré',
  'home.heroSubtitle':
    'Importez votre propre image, positionnez-la avec précision et téléchargez le résultat : gratuit, rapide et sans rien installer.',
  'home.chooseCategory': 'Choisissez une catégorie',
  'home.metaTitle': 'RetroAvia Lab — Personnalisez vos produits',
  'home.metaDescription':
    'RetroAvia Lab : personnalisez des montres numériques Casio et des consoles portables Nintendo avec votre propre image. Importez, positionnez, faites pivoter et téléchargez le résultat — tout dans le navigateur, gratuitement.',

  'howItWorks.eyebrow': 'Comment ça marche',
  'howItWorks.title': 'De l’idée à la pièce unique, en 4 étapes',
  'howItWorks.step': (vars) => `Étape ${vars.n}`,

  'gallery.eyebrow': 'Réalisations',
  'gallery.title': 'Quelques personnalisations livrées à des clients',

  'categoryCard.explore': 'Explorer',

  'productCard.fromPrice': (vars) => `à partir de ${vars.price}`,
  'productCard.customizeNow': 'Personnaliser maintenant',

  'categoryPage.back': 'Retour',
  'categoryPage.breadcrumbHome': 'Accueil',
  'categoryPage.breadcrumbAria': 'Fil d’Ariane',
  'categoryPage.emptyState': 'Aucun modèle disponible pour l’instant dans cette catégorie : revenez bientôt !',
  'categoryPage.metaTitle': (vars) => `${vars.categoryName} — RetroAvia Lab`,
  'categoryPage.notFoundMetaTitle': 'Catégorie introuvable — RetroAvia Lab',

  'notFoundPage.title': 'Page introuvable',
  'notFoundPage.description': 'La page que vous cherchez n’existe pas, ou le modèle demandé n’est pas (encore) disponible.',
  'notFoundPage.cta': 'Retour à l’accueil',
  'notFoundPage.metaTitle': 'Page introuvable — RetroAvia Lab',

  'configuratorPage.notFoundMetaTitle': 'Produit introuvable — RetroAvia Lab',
  'configuratorPage.metaPriceSuffix': (vars) => `, à partir de ${vars.price}`,
  'configuratorPage.metaDescription': (vars) =>
    `Personnalisez votre ${vars.productName} avec votre propre image${vars.priceText}. ${vars.description}`,
  'configuratorPage.errorMaxLayers': (vars) => `Vous pouvez ajouter jusqu’à ${vars.max} images.`,
  'configuratorPage.errorMaxLayersPartial': (vars) =>
    `Vous pouvez ajouter jusqu’à ${vars.max} images : seules les ${vars.added} premières ont été importées.`,
  'configuratorPage.errorUnexpectedAdd': 'Une erreur inattendue s’est produite lors de l’import d’une image.',
  'configuratorPage.errorUnexpectedReplace': 'Une erreur inattendue s’est produite lors de l’import de l’image.',
  'configuratorPage.errorExport': 'Impossible de générer l’image finale. Réessayez.',
  'configuratorPage.errorQuoteCard': 'Impossible de générer le devis. Réessayez.',

  'toolbar.imageHeading': 'Image',
  'toolbar.addImage': 'Ajouter une image',
  'toolbar.uploadImage': 'Importer une image',
  'toolbar.replaceSelected': 'Remplacer la sélection',
  'toolbar.collageHintSingle':
    'Ajoutez-en d’autres pour composer un collage : chaque image se déplace, se redimensionne et pivote indépendamment des autres.',
  'toolbar.collageHintMultiple': (vars) => `${vars.count} images dans le collage — touchez une miniature pour la sélectionner et la modifier.`,
  'toolbar.imageLabel': (vars) => `Image ${vars.index}`,
  'toolbar.removeImageAria': (vars) => `Supprimer l’image ${vars.index}`,
  'toolbar.maxReached': (vars) => `Vous avez atteint le maximum de ${vars.max} images.`,
  'toolbar.positioningHeading': 'Positionnement',
  'toolbar.positioningHint': 'Ajustez l’image sélectionnée (mise en évidence dans l’aperçu).',
  'toolbar.sizeLabel': 'Taille',
  'toolbar.rotationLabel': 'Rotation',
  'toolbar.centerAndFit': 'Centrer automatiquement',
  'toolbar.reset': 'Réinitialiser',
  'toolbar.precisionHeading': 'Aides à la précision',
  'toolbar.showGrid': 'Afficher la grille',
  'toolbar.instructions':
    'Touchez une miniature ci-dessus pour choisir l’image à modifier. Faites glisser l’image sélectionnée pour la déplacer, utilisez les poignées d’angle (ou le pincement à deux doigts sur mobile) pour la redimensionner, et la poignée du haut pour la faire pivoter. Des lignes de guidage bleues apparaissent automatiquement quand elle est centrée. Une fois satisfait, générez et envoyez le rendu depuis le panneau ci-dessous.',

  'pricingPanel.heading': 'Options et prix',
  'pricingPanel.description':
    'Choisissez les modifications que vous voulez : le total se met à jour immédiatement et sera inclus dans le message que vous envoyez à RetroAvia, avec le rendu de votre idée.',
  'pricingPanel.draftRestored': 'Nous avons restauré vos choix précédents pour ce modèle.',
  'pricingPanel.discardDraft': 'Recommencer',
  'pricingPanel.notesLabel': 'Notes',
  'pricingPanel.totalLabel': 'Total estimé',

  'sendPanel.heading': 'Envoyez votre idée',
  'sendPanel.description':
    'Plutôt que de la télécharger, votre personnalisation doit être vue par RetroAvia : générez le rendu — il contient déjà toutes les images du collage, assemblées ensemble — puis envoyez-le par e-mail ou Instagram.',
  'sendPanel.orderSummaryHeading': 'Récapitulatif de la commande',
  'sendPanel.notesPrefix': 'Notes : ',
  'sendPanel.totalLabel': 'Total estimé',
  'sendPanel.step1Heading': '1. Générer le rendu final',
  'sendPanel.step1Description': 'Crée l’image haute résolution (coque + votre collage) et la télécharge sur votre appareil.',
  'sendPanel.generating': 'Préparation du rendu…',
  'sendPanel.regenerate': 'Régénérer et retélécharger',
  'sendPanel.generateAndDownload': 'Générer et télécharger le rendu',
  'sendPanel.downloadedConfirm':
    '✓ Rendu téléchargé. Si vous déplacez ou redimensionnez une image du collage, ou changez les options, régénérez-le avant de l’envoyer.',
  'sendPanel.step2Heading': '2. Envoyer',
  'sendPanel.step2Description': 'L’e-mail ou Instagram s’ouvrira déjà prêt : pensez à joindre le fichier téléchargé à l’étape 1.',
  'sendPanel.downloadAgain': 'Retélécharger le rendu',
  'sendPanel.sendEmail': 'Envoyer par e-mail',
  'sendPanel.sendInstagram': 'Envoyer sur Instagram',
  'sendPanel.instagramRecommended': 'Recommandé pour Instagram',
  'sendPanel.instagramRecommendedDescription':
    'Génère une seule image avec votre photo et le récapitulatif des prix déjà intégré : un seul fichier à joindre, aucun texte séparé à copier.',
  'sendPanel.generatingQuoteCard': 'Préparation de la carte…',
  'sendPanel.generateQuoteCard': 'Générer la carte de devis pour Instagram',
  'sendPanel.generateQuoteCardHint': 'Générez d’abord le rendu à l’étape 1 ci-dessus.',
  'sendPanel.copySummary': 'Copier le récapitulatif (texte brut)',
  'sendPanel.copiedSummary': 'Récapitulatif copié !',
  'sendPanel.noOpenFooter': 'Rien ne s’ouvre ?',
  'sendPanel.noOpenFooterLink': 'Écrivez-nous depuis le profil @retroavia_',

  'stickyTotalBar.totalLabel': 'Total estimé',
  'stickyTotalBar.options': 'Options',

  'infoTooltip.aria': 'Plus d’informations',

  'uploadPrompt.compactDrop': 'Déposez ici',
  'uploadPrompt.compactTap': 'Touchez pour importer votre image',
  'uploadPrompt.formats': 'JPG, PNG ou WEBP',
  'uploadPrompt.fullDrop': 'Déposez votre image ici',
  'uploadPrompt.fullDrag': 'Glissez votre image ici',
  'uploadPrompt.orTap': 'ou touchez pour en sélectionner une',

  'errors.unsupportedType': (vars) =>
    vars.fileType
      ? `Format non pris en charge (${vars.fileType}). Utilisez une image JPG, PNG ou WEBP.`
      : 'Format non pris en charge. Utilisez une image JPG, PNG ou WEBP.',
  'errors.tooLarge': (vars) => `Le fichier est trop volumineux (${vars.sizeMB} Mo). La limite est de ${vars.maxMB} Mo.`,
  'errors.decodeError': 'Impossible de lire cette image : le fichier est peut-être corrompu ou n’est pas vraiment une image.',
}

const dictionaries: Record<Locale, Record<TranslationKey, Value>> = { it, en, es, fr }

/** Traduce una chiave dell'interfaccia nella lingua corrente, con fallback automatico all'italiano. */
export function t(locale: Locale, key: TranslationKey, vars?: Vars): string {
  const value = dictionaries[locale]?.[key] ?? dictionaries.it[key]
  return typeof value === 'function' ? value(vars ?? {}) : value
}
