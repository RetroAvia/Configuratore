# RetroAvia Lab — personalizza i tuoi prodotti

Web app 100% client-side per personalizzare graficamente dei prodotti — orologi
digitali (**Casio F-91W**, **Casio A158W**) e console portatili Nintendo
(**Game Boy Advance SP**, **Game Boy Color**, **Game Boy Advance**) — caricando
una propria immagine, che viene ritagliata esattamente nell'area corretta
(lo schermo per gli orologi, l'intera scocca per le console) e resa
modificabile (posizione, scala, rotazione) direttamente nel browser. Nessun
server, nessun database: tutto il lavoro avviene sul dispositivo dell'utente,
ed è pubblicabile gratuitamente su **GitHub Pages**.

## Indice

- [Avvio in locale](#avvio-in-locale)
- [Configurazione (dominio, contatti, informazioni commerciali)](#configurazione)
- [Come funziona (architettura)](#come-funziona-architettura)
- [Come arriva una richiesta a RetroAvia](#come-arriva-una-richiesta-a-retroavia)
- [Regole di compatibilità tra opzioni](#regole-di-compatibilità-tra-opzioni)
- [Aggiungere un nuovo prodotto](#aggiungere-un-nuovo-prodotto)
- [Tipi di area di ritaglio (ClipShape)](#tipi-di-area-di-ritaglio-clipshape)
- [Immagini: quali servono e di che peso](#immagini-quali-servono-e-di-che-peso)
- [SEO e anteprime dei link](#seo-e-anteprime-dei-link)
- [Test automatici](#test-automatici)
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
npm test         # test automatici (motore prezzi, aree di ritaglio, link di configurazione)
```

## Configurazione

Tutto ciò che è specifico dell'attività (dominio pubblico, contatti, numero
WhatsApp, informazioni commerciali) vive in un solo file: **`src/config/site.ts`**.

| Cosa | Dove | Note |
| --- | --- | --- |
| Dominio pubblico | variabile d'ambiente `VITE_SITE_URL`, altrimenti il valore di default in `site.ts` | Su Vercel: *Settings → Environment Variables*. Aggiorna meta tag, sitemap, `robots.txt`, dati strutturati e link di configurazione in un colpo solo. |
| Email e Instagram | `RETROAVIA_EMAIL`, `RETROAVIA_INSTAGRAM_HANDLE` | |
| Numero WhatsApp | `RETROAVIA_WHATSAPP` | Formato internazionale senza `+` (es. `393331234567`). **Se lasciato vuoto il pulsante WhatsApp non compare**: nessun link rotto. WhatsApp è l'unico canale che permette di precompilare davvero il testo del messaggio, quindi vale la pena valorizzarlo. |
| Tempi, spedizione, pagamento | `BUSINESS_INFO` | Ogni voce vuota viene omessa; se sono tutte vuote il riquadro non compare. Compila solo quelle di cui conosci la risposta. |

## Come arriva una richiesta a RetroAvia

Il sito non ha un backend: la richiesta viaggia sempre attraverso un canale
scelto dal cliente. Il pannello di invio li propone in ordine di attrito
crescente:

1. **Condivisione nativa** (telefono): render e riepilogo passano direttamente
   all'app scelta dal cliente. Nessun download, nessun allegato da ritrovare.
2. **WhatsApp** (se configurato): testo del messaggio già scritto.
3. **Email**: testo precompilato, allegato da aggiungere a mano.
4. **Instagram**: non permette di precompilare nulla, quindi si offre il
   *biglietto preventivo* — una sola immagine con render, riepilogo e totale.

In tutti i casi il messaggio contiene due cose che rendono la richiesta
ricostruibile senza chiedere di nuovo tutto al cliente:

- il **codice richiesta** (es. `RA-7F3KQ`), stampato anche sul biglietto
  preventivo: serve a ritrovare la conversazione mesi dopo;
- il **link di configurazione** (`…/console/gba-sp?c=…`), che riapre il
  configuratore esattamente su quelle scelte. Puoi aprirlo, correggerlo e
  rimandarlo indietro al cliente: il link si aggiorna da sé.

L'immagine caricata dal cliente **non viaggia mai nel link** (sarebbe enorme e
violerebbe la promessa "nessun upload" del sito): il link porta solo le scelte,
la foto continua ad arrivare come render allegato.

## Regole di compatibilità tra opzioni

Alcune lavorazioni non hanno senso insieme: un display IPS o un kit LED
richiedono di aprire la console, quindi sono impossibili con "Solo Game Boy
(senza modifiche)". Il vincolo è dichiarato **in un solo punto**, la costante
`RICHIEDE_SCOCCA_NUOVA` in `src/data/pricing/consoleOptions.ts`, e applicato
mettendo `requires: [RICHIEDE_SCOCCA_NUOVA]` sulla singola opzione o
sull'intero gruppo.

Il resto è automatico: l'opzione viene mostrata disattivata con la spiegazione
del perché, la selezione ricade sulla prima voce disponibile e il totale non
conta mai una voce impossibile (`utils/pricing.ts`). Per aggiungere una regola
nuova basta una riga nel file dei dati — nessuna modifica all'interfaccia.

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
│       ├── casio-f91w.ts      → Configurazione del Casio F-91W (clip area = schermo)
│       ├── casio-a158w.ts     → Configurazione del Casio A158W (clip area = schermo)
│       ├── gba-sp.ts          → Configurazione del Game Boy Advance SP (clip area = intera scocca)
│       ├── gba-color.ts       → Configurazione del Game Boy Color (clip area = scocca, con fori)
│       ├── gba-advance.ts     → Configurazione del Game Boy Advance (clip area = scocca, con fori)
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

## Tipi di area di ritaglio (`ClipShape`)

`src/types/product.ts` definisce due famiglie di aree di ritaglio, usate da
`clipArea` in ogni `ProductConfig`:

- **Forma semplice** (`rect` / `ellipse` / `polygon`) — un singolo contorno,
  senza fori. È il caso degli orologi: l'immagine dell'utente viene ritagliata
  esattamente nel rettangolo dello schermo LCD (`casio-f91w.ts`,
  `casio-a158w.ts`) oppure, per il Game Boy Advance SP, in un poligono che
  segue l'intero profilo della scocca frontale (`gba-sp.ts`).

- **Forma composta** (`compound`) — un contorno esterno (`outer`) più una
  lista di fori (`holes`), ciascuno a sua volta una forma semplice. Serve
  quando l'immagine dell'utente deve coprire un'intera area MA senza mai
  sovrapporsi a elementi funzionali che devono restare quelli originali —
  ad es. il Game Boy Color e il Game Boy Advance (`gba-color.ts`,
  `gba-advance.ts`): l'immagine copre tutta la scocca, ma schermo, D-pad,
  tasti A/B e Start/Select restano sempre quelli della foto reale grazie ai
  fori. Il motore di rendering (`src/utils/clipShapes.ts`) traduce
  automaticamente contorno + fori in un `clip-path` CSS (via un `<clipPath>`
  SVG con `clip-rule="evenodd"`, per restare responsive con puro CSS come le
  forme semplici) e nel corrispondente ritaglio Canvas 2D usato in fase di
  esportazione — non serve altro codice per aggiungere un prodotto con fori.

### Per gli orologi (schermo): l'overlay delle cifre

Per i modelli con display LCD (F-91W, A158W) l'immagine dell'utente finisce
SOTTO un secondo livello, `overlayImage`: un ritaglio con trasparenza delle
sole cifre/icone del display, estratto dalla foto reale del prodotto. In
questo modo l'ora "88:88" e le icone restano sempre leggibili sopra alla
foto personalizzata, invece di sparire dietro di essa.

> Per trovare le coordinate pixel esatte da usare in `clipArea` (contorni,
> fori, centri) su una nuova immagine, usa la modalità di debug descritta
> sopra in ["Trovare le coordinate dell'area di ritaglio"](#trovare-le-coordinate-dellarea-di-ritaglio).

## Immagini: quali servono e di che peso

Per ogni prodotto, in `public/products/<slug>/`:

| File | A cosa serve | Indicazioni |
| --- | --- | --- |
| `base.webp` | Sfondo del configuratore, export e anteprima social | Risoluzione nativa, **deve** corrispondere a `canvas.width × canvas.height` |
| `thumb.webp` | Card della pagina di categoria | ~480 px di lato lungo. Puntare `thumbnail` su `base.webp` funziona, ma fa scaricare centinaia di kilobyte per mostrare un francobollo |
| `overlay.webp` | Solo orologi: cifre e icone del display, con trasparenza | Stessa dimensione di `base.webp` |

Per generare una miniatura da un'immagine esistente va bene qualunque editor;
l'importante è il formato WebP e il lato lungo intorno ai 480 px.

## SEO e anteprime dei link

Il sito è un'applicazione a pagina singola, e i bot che generano l'anteprima
dei link (Instagram, WhatsApp, Telegram, Facebook) **non eseguono JavaScript**.
Per questo, al termine di ogni build, il plugin `seoStaticPages` in
`vite.config.ts` genera:

- una pagina HTML statica per ogni rotta, con titolo, descrizione, immagine e
  indirizzo canonico del prodotto già scritti dentro;
- la `sitemap.xml`, ricavata dagli stessi dati dei prodotti (aggiungendo un
  modello non c'è più un secondo file da aggiornare a mano);
- l'indirizzo della sitemap dentro `robots.txt`.

Non serve fare nulla: succede da sé a ogni `npm run build`. Se qualcosa va
storto il plugin stampa un avviso e la build prosegue comunque.

**Cosa manca ancora**: le quattro lingue condividono lo stesso indirizzo, quindi
Google indicizza solo la versione italiana. Per farle indicizzare tutte
servirebbero rotte per lingua (`/en/orologi/...`) più i tag `hreflang`.

## Test automatici

```bash
npm test
```

Coprono le parti in cui un errore costa davvero: il **motore prezzi** (totali,
sconti, regole di compatibilità, prezzo "a partire da"), le **aree di ritaglio**
(inclusa una verifica che i dati di ogni prodotto siano coerenti con il proprio
canvas) e i **link di configurazione** (codifica, decodifica, link manomessi,
codice richiesta). Girano sui dati reali dei prodotti, quindi intercettano anche
le incoerenze introdotte in `src/data/`.

Gli stessi controlli, più lint e build, girano in automatico a ogni push grazie
a `.github/workflows/ci.yml`.

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
