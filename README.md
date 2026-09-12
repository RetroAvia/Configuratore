# Configuratore — personalizza i tuoi prodotti

Web app 100% client-side per personalizzare graficamente dei prodotti (si parte dal
**Casio F-91W**) caricando una propria immagine, che viene ritagliata nella forma
esatta del quadrante/schermo e resa modificabile (posizione, scala, rotazione)
direttamente nel browser. Nessun server, nessun database: tutto il lavoro avviene
sul dispositivo dell'utente, ed è pubblicabile gratuitamente su **GitHub Pages**.

## Indice

- [Avvio in locale](#avvio-in-locale)
- [Come funziona (architettura)](#come-funziona-architettura)
- [Aggiungere un nuovo prodotto](#aggiungere-un-nuovo-prodotto)
- [Sostituire l'immagine segnaposto del Casio F-91W](#sostituire-limmagine-segnaposto-del-casio-f-91w)
- [Pubblicare su GitHub Pages](#pubblicare-su-github-pages)
- [Stack tecnico](#stack-tecnico)

## Avvio in locale

Richiede [Node.js](https://nodejs.org/) 20 o superiore.

```bash
npm install
npm run dev
```

Il sito sarà disponibile su `http://localhost:5173`.

Altri comandi utili:

```bash
npm run build    # build di produzione nella cartella dist/
npm run preview  # anteprima locale della build di produzione
npm run lint     # controlli di qualità del codice (ESLint)
```

## Come funziona (architettura)

Il sito ha una navigazione "a imbuto" su tre livelli, con URL puliti gestiti da
React Router:

```
/                          → Home: elenco delle categorie
/:categorySlug             → Elenco dei modelli di una categoria (es. /orologi)
/:categorySlug/:modelSlug  → Configuratore del singolo modello (es. /orologi/casio-f91w)
```

Il "motore" di editing (`src/components/configurator/`) non conosce nulla di
specifico su un prodotto: tutto ciò che riguarda un modello (immagini, area di
ritaglio, nome, descrizione...) è centralizzato nei file di dati in
`src/data/`. Questo è il punto chiave dell'architettura: **aggiungere un nuovo
prodotto o una nuova categoria non richiede di toccare il motore di editing**.

Struttura delle cartelle:

```
src/
├── types/product.ts           → Definizione dei tipi ProductConfig / CategoryConfig / ClipShape
├── data/
│   ├── categories.ts          → Elenco delle categorie disponibili
│   └── products/
│       ├── casio-f91w.ts      → Configurazione del Casio F-91W
│       └── index.ts           → Aggregatore + funzioni di ricerca prodotti
├── hooks/
│   ├── useImageTransform.ts   → Stato di posizione/scala/rotazione dell'immagine utente
│   └── useHtmlImage.ts        → Caricamento di un'immagine come HTMLImageElement
├── utils/
│   ├── clipShapes.ts          → Conversione di una ClipShape in CSS clip-path / path Canvas2D / path SVG
│   ├── fileValidation.ts      → Validazione e caricamento del file caricato dall'utente
│   └── exportImage.ts         → Composizione dell'immagine finale ed esportazione PNG
├── components/
│   ├── layout/                → Header, Footer, Layout generale
│   ├── cards/                 → Card per categorie e prodotti
│   └── configurator/          → Canvas interattivo, toolbar, invito al caricamento
└── pages/                     → Le pagine collegate al router (Home, Categoria, Configuratore, 404)
```

### Il motore di editing, in breve

- Le coordinate dell'area di ritaglio (`clipArea`) e le dimensioni del canvas
  (`canvas.width/height`) sono sempre espresse in **pixel nativi** dell'immagine
  di base del prodotto — non normalizzate — per essere facili da ricavare da un
  editor grafico qualunque.
- A schermo, tutto lo stage è dimensionato e posizionato con **percentuali CSS**
  (incluso il `clip-path`), quindi l'intera interfaccia è responsive per
  costruzione, senza bisogno di ricalcolare fattori di scala via JavaScript ad
  ogni resize della finestra.
- Le interazioni (trascinamento, pizzico a due dita, maniglie d'angolo per la
  scala, maniglia superiore per la rotazione, rotellina del mouse) aggiornano
  uno stato `{ x, y, scale, rotation }` sempre espresso in pixel nativi.
- Al momento dell'esportazione, lo stesso stato viene applicato — con la
  stessa identica matematica — su un canvas offscreen alla risoluzione nativa
  del prodotto, garantendo che il PNG scaricato corrisponda esattamente
  all'anteprima.

## Aggiungere un nuovo prodotto

Per aggiungere un nuovo modello (un altro Casio, il Game Boy Advance SP, ecc.)
non serve modificare nessuna parte del motore di editing:

1. Crea un nuovo file in `src/data/products/`, ad es. `casio-a168.ts`, che
   esporti un oggetto `ProductConfig` — usa `casio-f91w.ts` come modello/esempio.
2. Aggiungi le immagini necessarie in `public/products/<slug-del-prodotto>/`.
3. Importa e aggiungi il nuovo oggetto all'array `allProducts` in
   `src/data/products/index.ts`.
4. Se il prodotto appartiene a una categoria non ancora esistente (es.
   "Console"), aggiungi quella categoria in `src/data/categories.ts`.

Tutto il resto (routing, pagine, motore di editing) si aggiorna automaticamente.

### Trovare le coordinate dell'area di ritaglio

Ogni configuratore supporta una **modalità di debug**: apri il configuratore
aggiungendo `?debug=1` all'URL (es. `/orologi/casio-f91w?debug=1`). Muovendo il
puntatore sul canvas vedrai in tempo reale le coordinate, in pixel nativi, utili
per individuare con precisione gli angoli dello schermo/quadrante nella tua
immagine e scrivere i valori corretti in `clipArea`.

## Sostituire l'immagine segnaposto del Casio F-91W

Il modello Casio F-91W incluso in questo repository usa **un'illustrazione
segnaposto originale** (`public/products/casio-f91w/base.svg`), non una vera
fotografia, in attesa di una foto/render reale del prodotto. Per sostituirla:

1. Procurati una foto o un render frontale del Casio F-91W, ad alta
   risoluzione, ben centrato e senza prospettiva (vista dritta, non in
   diagonale).
2. Salvala in `public/products/casio-f91w/` (es. `base.png`).
3. In `src/data/products/casio-f91w.ts`, aggiorna `baseImage` (e `thumbnail`,
   se vuoi una miniatura dedicata) con il nuovo percorso.
4. Aggiorna `canvas.width` e `canvas.height` con le dimensioni **esatte**, in
   pixel, della nuova immagine.
5. Ricalcola le coordinate di `clipArea` in modo che corrispondano esattamente
   al riquadro dello schermo LCD nella nuova immagine, usando la modalità di
   debug descritta sopra.

Il resto del configuratore (interazioni, esportazione, responsive) funziona
automaticamente con qualunque immagine e qualunque area di ritaglio.

## Pubblicare su GitHub Pages

### 1. Crea il repository e carica il codice

```bash
git init
git add .
git commit -m "Versione iniziale del configuratore"
git branch -M main
git remote add origin https://github.com/<tuo-utente>/<nome-repo>.git
git push -u origin main
```

### 2. Imposta il percorso base corretto

GitHub Pages pubblica un repository di progetto sotto
`https://<tuo-utente>.github.io/<nome-repo>/`: il sito deve conoscere questo
prefisso già in fase di build. Apri `vite.config.ts` e imposta `BASE_PATH` con
il nome esatto del tuo repository:

```ts
const BASE_PATH = process.env.VITE_BASE_PATH || '/<nome-repo>/'
```

Se pubblichi invece come "user/organization page" (repository chiamato
`<tuo-utente>.github.io`), usa `'/'`.

Nel file `public/404.html`, la variabile `segmentCount` deve corrispondere al
numero di segmenti di quel percorso base (`1` per un repository di progetto,
`0` per una user/organization page).

> Il workflow di deploy incluso (punto 3) imposta automaticamente questo
> valore in base al nome reale del repository, quindi in pratica non devi
> preoccupartene se usi GitHub Actions — ma è comunque utile impostarlo
> correttamente anche in `vite.config.ts` per fare build/preview locali
> realistiche.

### 3. Attiva la pubblicazione automatica (consigliato)

Questo repository include già un workflow di GitHub Actions
(`.github/workflows/deploy.yml`) che builda e pubblica automaticamente il
sito ad ogni push sul branch `main`. Per attivarlo:

1. Vai su **Impostazioni del repository → Pages**.
2. In "Build and deployment" → "Source", scegli **GitHub Actions**.
3. Fai un push su `main`: il sito sarà pubblicato in pochi minuti su
   `https://<tuo-utente>.github.io/<nome-repo>/`.

### In alternativa: pubblicazione manuale

```bash
npm run build
npx gh-pages -d dist
```

(richiede il pacchetto `gh-pages`: `npm install --save-dev gh-pages`)

## Stack tecnico

- [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- [Vite](https://vite.dev/) come build tool
- [React Router](https://reactrouter.com/) per la navigazione client-side
- [Tailwind CSS 4](https://tailwindcss.com/) per lo stile
- Nessuna libreria di terze parti per il canvas: l'editing usa CSS
  (`clip-path`, `transform`) per l'anteprima interattiva e l'API Canvas 2D
  nativa del browser per l'esportazione finale ad alta risoluzione.
