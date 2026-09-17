# Interventi sul configuratore RetroAvia Lab

Questo documento elenca tutto ciò che è stato modificato, perché, e cosa resta
da fare. Ogni voce riporta il file interessato, così è facile ritrovare il
contesto leggendo i commenti nel codice.

---

## Prima di tutto: cosa fare adesso

```bash
npm install     # installa la nuova dipendenza di test (vitest)
npm run lint    # controlli di qualità
npm test        # 38 test automatici
npm run build   # build di produzione
npm run dev     # prova in locale
```

Un file non ha potuto essere scritto automaticamente perché si trova in una
cartella protetta: **`.github/workflows/ci.yml`**. Ti è stato consegnato a parte
nella chat: crealo a mano in `.github/workflows/` per avere lint, test e build
automatici a ogni push.

### Cose da compilare a mano (facoltative ma consigliate)

In **`src/config/site.ts`**:

- `RETROAVIA_WHATSAPP` — numero in formato internazionale senza `+`
  (es. `393331234567`). È l'unico canale che precompila davvero il testo del
  messaggio. Finché è vuoto, il pulsante WhatsApp semplicemente non compare.
- `BUSINESS_INFO` — tempi di realizzazione, spedizione, pagamento, cosa succede
  se il cliente manda la propria console. Non le ho inventate: compila solo
  quelle di cui conosci la risposta. Se restano tutte vuote, il riquadro non
  viene mostrato.

Su Vercel, quando avrai un dominio tuo, imposta la variabile d'ambiente
`VITE_SITE_URL`: aggiorna in un colpo solo meta tag, sitemap, `robots.txt`,
dati strutturati e link di configurazione.

---

## 1. Bug corretti

| Problema | File | Cosa succedeva |
| --- | --- | --- |
| **Zoom con la rotellina non funzionante** | `ConfiguratorCanvas.tsx` | React registra `onWheel` come listener "passive", dove `preventDefault()` viene ignorato: l'immagine si ingrandiva ma la pagina scorreva comunque sotto al puntatore. Ora il listener è registrato a mano con `{ passive: false }`, e la rotellina agisce solo quando c'è un'immagine selezionata (altrimenti la pagina scorre normalmente). |
| **Effetti collaterali dentro gli aggiornamenti di stato** | `ConfiguratorPage.tsx` | `URL.revokeObjectURL` veniva chiamata dentro `setLayers(...)`. Gli updater devono essere puri: React li esegue due volte in sviluppo, e lo stesso URL veniva revocato due volte. Ora la revoca avviene fuori. |
| **Il limite di 6 immagini si poteva superare** | `ConfiguratorPage.tsx` | Il conteggio usava `layers.length`, che durante una decodifica in corso è ancora indietro. Ora c'è un contatore di "prenotazioni" (`layerCountRef`) allineato anche da annulla/ripeti e dalla rimozione. |
| **Immagini perse cambiando prodotto durante un caricamento** | `ConfiguratorPage.tsx` | Un file ancora in decodifica finiva nel collage del prodotto sbagliato. Ora ogni caricamento porta un contrassegno di "generazione" e quelli vecchi vengono scartati liberando la memoria. |
| **Il trascinamento accettava una sola immagine** | `ConfiguratorCanvas.tsx` | L'input file è `multiple`, il drag&drop no: trascinandone tre ne veniva caricata una, in silenzio. |
| **Evidenziazione del trascinamento che sfarfallava** | `ConfiguratorCanvas.tsx` | `dragleave` scatta anche passando da un elemento figlio all'altro. Ora c'è un contatore entra/esce. |
| **Il totale "saltava indietro"** | `useAnimatedNumber.ts` | Cambiando opzione a metà animazione, la successiva ripartiva dall'ultimo valore *completato*. Ora riparte dal valore realmente a schermo, e l'ultimo fotogramma assegna il valore esatto (niente totali tipo `119,899999 €`). |
| **Angoli arrotondati diversi tra anteprima ed export** | `clipShapes.ts` | Una percentuale sola nel `border-radius` viene risolta sulla larghezza in orizzontale e sull'altezza in verticale: sul Casio F-91W (1114×2021) gli angoli risultavano ellittici in anteprima e circolari nel PNG. Ora si usano due valori separati. |
| **Duplicazione di uno strato senza rete di sicurezza** | `ConfiguratorPage.tsx` | Nessuna gestione degli errori: in caso di fallimento restavano un posto occupato e un URL appeso in memoria, senza alcun messaggio. |
| **Timer dei toast mai annullati** | `useToasts.ts` | Un toast mostrato appena prima di cambiare pagina lasciava un aggiornamento di stato su un componente smontato. |
| **Pulizia dei dati strutturati che poteva lanciare** | `useStructuredData.ts` | `removeChild` su un tag già rimosso fa cadere l'albero React. Ora si usa `remove()`. |
| **Backspace cancellava l'immagine** | `ConfiguratorPage.tsx` | Troppo facile perdere lavoro per sbaglio uscendo da un campo di testo. Ora cancella solo `Canc`. |
| **Slider "Dimensione" inutilizzabile** | `Toolbar.tsx`, `useImageTransform.ts` | Da 0,05 a 8 in scala lineare: tutto l'intervallo utile stava nei primi millimetri. Ora è logaritmica (ogni tacca cambia la dimensione della stessa percentuale). |
| **Chiave di lista non stabile** | `SendPanel.tsx`, `pricing.ts` | Le righe del riepilogo usavano il titolo del gruppo come chiave; ora usano l'id, che non cambia con la lingua. |
| **Testo alternativo in italiano fisso** | `ConfiguratorCanvas.tsx` | In un sito a quattro lingue. Ora è tradotto. |

## 2. Come arriva una richiesta: il problema più grande

Il configuratore non sapeva dire *cosa* avesse configurato il cliente: il
preventivo esisteva solo dentro un PNG, non ricostruibile. Ora:

- **Link di configurazione** (`utils/shareConfig.ts`): prodotto, opzioni, note e
  contatti codificati nell'indirizzo (`?c=…`). Lo apri e il configuratore torna
  esattamente com'era: puoi correggerlo e rimandarlo indietro. L'immagine non
  viaggia nel link — la promessa "nessun upload" resta intatta.
- **Codice richiesta** (es. `RA-7F3KQ`): breve, senza caratteri ambigui,
  stampato sul biglietto preventivo e incluso nel messaggio. Serve a ritrovare
  una conversazione mesi dopo.
- **Condivisione nativa** (`utils/share.ts`): su telefono, render e riepilogo
  passano direttamente all'app scelta dal cliente. È il percorso più corto
  all'invio, ed elimina il passaggio in cui si perdevano più richieste
  ("scarica → apri Instagram → ritrova il file in galleria").
- **WhatsApp** (facoltativo): l'unico canale che precompila davvero il testo.
- **Campi di contatto** facoltativi (nome, email, Instagram): senza, una
  richiesta interrotta a metà è irrecuperabile.
- **Avviso sui link `mailto:` troppo lunghi**: con 11 gruppi di opzioni più le
  note si superano i limiti di alcuni programmi di posta, che troncano il testo.
  Ora il pannello se ne accorge e suggerisce di copiare il riepilogo.
- **Dichiarazione sui diritti dell'immagine**: una spunta obbligatoria prima
  dell'invio. I clienti caricheranno personaggi e loghi altrui, e chi realizza
  il pezzo sei tu.

## 3. Preventivi impossibili

Si potevano selezionare insieme "Solo Game Boy (senza modifiche)" e display IPS,
kit LED, audio nuovo, batteria maggiorata, colore scocca: preventivi da
rinegoziare a mano, con quello che comporta in termini di credibilità.

Ora esiste un motore di regole dichiarativo (`types/product.ts`,
`utils/pricing.ts`): l'opzione incompatibile appare disattivata **con la
spiegazione del perché**, la selezione ricade da sola su una voce valida e il
totale non conta mai una voce impossibile. Il vincolo è scritto in un solo
punto — `RICHIEDE_SCOCCA_NUOVA` in `data/pricing/consoleOptions.ts` — e si
applica con una riga.

> **Da verificare con te:** ho considerato incompatibili con "senza modifiche"
> audio, display, kit LED, batteria, colore scocca e colore pulsanti. Ho invece
> lasciato libere etichetta, box 3D e cover trasparente, perché sono esterne e
> applicabili anche a una console non aperta. Se qualcuna di queste scelte non
> corrisponde a come lavori, si cambia in una riga.

## 4. SEO e anteprime dei link

- **Pagine statiche per rotta** (plugin `seoStaticPages` in `vite.config.ts`):
  i bot di Instagram, WhatsApp e Telegram non eseguono JavaScript, quindi
  qualunque link condiviso mostrava sempre l'anteprima generica della home.
  Ora ogni rotta ha la propria copia dell'HTML con titolo, descrizione e
  immagine del prodotto già dentro.
- **Sitemap e `robots.txt` generati** dagli stessi dati dei prodotti: niente più
  file da aggiornare a mano quando aggiungi un modello.
- **Indirizzo canonico** su ogni pagina: senza, ogni link di configurazione
  condiviso sarebbe stato visto da Google come una pagina duplicata.
- **Dominio in un solo punto** (`config/site.ts`, variabile `VITE_SITE_URL`):
  prima era scritto a mano in sei file.
- **`AggregateOffer`** con prezzo minimo e massimo al posto di un singolo
  prezzo di partenza che quasi nessun ordine reale rispetta.
- **`noindex`** sulle pagine "non trovato".

## 5. Prestazioni

| Intervento | Guadagno |
| --- | --- |
| Logo ridotto (`logo-128.webp`) | da 256 KB a 6 KB, su **ogni** pagina |
| Miniature dedicate dei prodotti | pagina "Orologi" da ~800 KB a ~103 KB di immagini |
| `React.lazy` sul configuratore | la home non scarica più il motore di editing |
| `memo` su pannello prezzi, canvas e barra strumenti | durante un trascinamento non si ricalcolano più 11 gruppi e 30 radio a ogni movimento del dito |
| `width`/`height` sulle immagini | niente più salti del layout mentre caricano (Google li misura) |
| Cache lunga per immagini e asset (`vercel.json`) | visite successive molto più rapide |

## 6. Accessibilità

- L'area di caricamento è ora raggiungibile da tastiera e annunciata come
  pulsante.
- Il totale cambia con `aria-live`: chi non vede lo schermo non sceglie più alla
  cieca.
- Le slider annunciano "120%" e "45°" invece del numero grezzo della tacca.
- Le opzioni disattivate spiegano il perché anche agli screen reader.

## 7. Qualità del codice

- **38 test automatici** (`npm test`) su motore prezzi, aree di ritaglio e link
  di configurazione — eseguiti sui dati reali dei prodotti, quindi intercettano
  anche le incoerenze introdotte in `src/data/`.
- **CI** con lint, test e build a ogni push (file da creare a mano, vedi sopra).
- **Codice morto rimosso**: il meccanismo di reindirizzamento per GitHub Pages
  non serviva su Vercel e rischiava solo di mandare i visitatori su indirizzi
  storpiati. `public/404.html` è ora una vera pagina di cortesia.
- **Suoni spenti di default**: un sito che fa rumore al primo tocco è il genere
  di cosa che fa chiudere la scheda, soprattutto da telefono e in pubblico.
- **`.gitignore`**: aggiunta l'esclusione degli archivi. Nella cartella c'è
  `.tmp-repro-archive.tar.gz` da 36 MB: controlla se è finito in un commit con
  `git log --all --oneline -- .tmp-repro-archive.tar.gz`; se sì, il repository
  se lo porta dietro per sempre e va ripulito.

---

## Cosa resta da fare

1. **Colore della scocca visibile sul canvas.** Oggi il cliente sceglie "Clear
   Blue" e continua a vedere la scocca grigia della foto: è la scelta più
   emozionale del preventivo ed è l'unica non visualizzata. Serve una maschera
   della scocca per prodotto (oppure una foto per colore).
2. **Rotte per lingua + `hreflang`.** Hai tradotto 140 stringhe in quattro
   lingue e Google ne indicizza una sola. Richiede `/en/orologi/...` e un
   ripasso su tutti i link interni.
3. **Backend minimo** (funzione serverless su Vercel + invio email + archivio
   immagini): eliminerebbe del tutto il passaggio manuale dell'allegato.
4. **Rimozione automatica dello sfondo** lato client: sul quadrante del Casio è
   un effetto notevole, e si fa senza server.
5. **Layer di testo** (nome, data, frase): molto richiesto sugli orologi.
6. **Condizioni commerciali**: compila `BUSINESS_INFO` e valuta una pagina di
   informativa privacy, ora che il sito raccoglie (facoltativamente) un
   contatto.
