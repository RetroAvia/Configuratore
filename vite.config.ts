import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { defineConfig } from 'vite'
import type { Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

import { categories } from './src/data/categories'
import { allProducts } from './src/data/products'
import { formatTotal, getStartingPrice } from './src/utils/pricing'

// ---------------------------------------------------------------------------
// Percorso base del sito.
//
// Resta '/' perché il sito è pubblicato sulla radice del dominio (Vercel). Si
// può sovrascrivere a build-time con la variabile d'ambiente VITE_BASE_PATH
// se un giorno dovesse finire in una sottocartella.
const BASE_PATH = process.env.VITE_BASE_PATH ?? '/'

/** Origine pubblica: deve restare allineata a `SITE_URL` in `src/config/site.ts`. */
const SITE_URL = (process.env.VITE_SITE_URL ?? 'https://configuratore-five.vercel.app').replace(/\/+$/, '')

interface StaticRoute {
  /** Percorso della rotta, senza slash finale (la home è ''). */
  path: string
  title: string
  description: string
  /** Immagine per l'anteprima social, se la rotta ne ha una più specifica di quella del sito. */
  image?: string
  /** Dimensioni native dell'immagine: dichiararle sbagliate fa disegnare male l'anteprima ad alcune piattaforme. */
  imageWidth?: number
  imageHeight?: number
}

/** Elenca le rotte da pre-generare, leggendo gli stessi dati usati a runtime dall'app. */
function collectRoutes(): StaticRoute[] {
  const routes: StaticRoute[] = []

  for (const category of categories) {
    routes.push({
      path: `/${category.slug}`,
      title: `${category.name} — RetroAvia Lab`,
      description: category.description,
    })
  }

  for (const product of allProducts) {
    // Si riusa la stessa funzione di formattazione dell'applicazione, così la
    // descrizione statica e quella mostrata a schermo non possono divergere.
    const priceText = product.pricing ? `, a partire da ${formatTotal(getStartingPrice(product.pricing))}` : ''
    routes.push({
      path: `/${product.categorySlug}/${product.slug}`,
      title: `${product.name} — RetroAvia Lab`,
      description: `Personalizza il tuo ${product.name} con una tua immagine${priceText}. ${product.description}`,
      // Per l'anteprima social serve l'immagine grande, non la miniatura delle card.
      image: product.baseImage,
      imageWidth: product.canvas.width,
      imageHeight: product.canvas.height,
    })
  }

  return routes
}

/** Sostituisce il contenuto di un meta tag esistente, lasciando il documento invariato se non lo trova. */
function replaceMeta(html: string, attribute: 'name' | 'property', key: string, value: string): string {
  const pattern = new RegExp(`(<meta\\s+${attribute}="${key}"[^>]*\\scontent=")[^"]*(")`, 'i')
  return html.replace(pattern, `$1${escapeAttribute(value)}$2`)
}

function escapeAttribute(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

/**
 * Genera, al termine della build, una pagina HTML statica per ogni rotta del
 * sito più la sitemap.
 *
 * PERCHÉ SERVE: il sito è un'applicazione a pagina singola, e i meta tag
 * vengono aggiornati da JavaScript mentre si naviga. I bot che creano
 * l'anteprima dei link — Instagram, WhatsApp, Facebook, Telegram — leggono
 * però l'HTML statico SENZA eseguire JavaScript: qualunque link del sito
 * condiviso mostrava quindi sempre la stessa anteprima generica della home,
 * anche quello di un singolo prodotto. Per un'attività che vive sui social è
 * un problema concreto.
 *
 * COME FUNZIONA: ogni rotta riceve una copia dell'`index.html` costruito, con
 * titolo, descrizione, immagine e indirizzo canonico già scritti dentro.
 * L'applicazione parte esattamente come prima (è lo stesso identico bundle):
 * cambia solo ciò che i bot leggono prima di eseguire qualsiasi cosa.
 *
 * Il plugin non fa mai fallire la build: se qualcosa va storto stampa un
 * avviso e si limita a non generare le pagine extra, lasciando il sito
 * funzionante esattamente com'era.
 */
function seoStaticPages(): Plugin {
  /** Dominio scritto nei meta tag di `index.html`, sostituito quando ne è configurato un altro. */
  const DEFAULT_ORIGIN = 'https://configuratore-five.vercel.app'

  return {
    name: 'retroavia-seo-static-pages',
    apply: 'build',

    /**
     * Allinea il dominio scritto in `index.html` a quello configurato:
     * impostando `VITE_SITE_URL` (es. quando passerai a un dominio tuo) non
     * resta nessun riferimento all'indirizzo vecchio, senza dover modificare
     * l'HTML a mano.
     */
    transformIndexHtml(html: string) {
      if (SITE_URL === DEFAULT_ORIGIN) return html
      return html.split(DEFAULT_ORIGIN).join(SITE_URL)
    },

    async closeBundle() {
      const outDir = 'dist'
      try {
        const template = await readFile(join(outDir, 'index.html'), 'utf-8')
        const routes = collectRoutes()

        for (const route of routes) {
          const canonical = `${SITE_URL}${route.path}`
          let html = template

          html = html.replace(/<title>[^<]*<\/title>/i, `<title>${escapeAttribute(route.title)}</title>`)
          html = replaceMeta(html, 'name', 'description', route.description)
          html = replaceMeta(html, 'property', 'og:title', route.title)
          html = replaceMeta(html, 'property', 'og:description', route.description)
          html = replaceMeta(html, 'property', 'og:url', canonical)
          html = replaceMeta(html, 'name', 'twitter:title', route.title)
          html = replaceMeta(html, 'name', 'twitter:description', route.description)
          if (route.image) {
            html = replaceMeta(html, 'property', 'og:image', `${SITE_URL}${route.image}`)
            html = replaceMeta(html, 'name', 'twitter:image', `${SITE_URL}${route.image}`)
            // Le dimensioni dichiarate devono essere quelle vere: l'immagine
            // di un prodotto è verticale, non 1200×630 come quella della home.
            if (route.imageWidth && route.imageHeight) {
              html = replaceMeta(html, 'property', 'og:image:width', String(route.imageWidth))
              html = replaceMeta(html, 'property', 'og:image:height', String(route.imageHeight))
            }
          }
          html = html.replace(
            /<link rel="canonical"[^>]*>/i,
            `<link rel="canonical" href="${escapeAttribute(canonical)}" />`,
          )

          const file = join(outDir, route.path.replace(/^\//, ''), 'index.html')
          await mkdir(dirname(file), { recursive: true })
          await writeFile(file, html, 'utf-8')
        }

        // Sitemap generata dagli stessi dati: aggiungendo un prodotto non c'è
        // più un secondo file da ricordarsi di aggiornare a mano.
        const urls = ['', ...routes.map((route) => route.path)]
        const sitemap = [
          '<?xml version="1.0" encoding="UTF-8"?>',
          '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
          ...urls.map((path) => `  <url><loc>${SITE_URL}${path || '/'}</loc></url>`),
          '</urlset>',
          '',
        ].join('\n')
        await writeFile(join(outDir, 'sitemap.xml'), sitemap, 'utf-8')

        // robots.txt: l'indirizzo della sitemap deve puntare al dominio reale
        // anche quando è stato cambiato tramite VITE_SITE_URL.
        try {
          const robots = await readFile(join(outDir, 'robots.txt'), 'utf-8')
          await writeFile(
            join(outDir, 'robots.txt'),
            robots.replace(/^Sitemap:.*$/m, `Sitemap: ${SITE_URL}/sitemap.xml`),
            'utf-8',
          )
        } catch {
          // robots.txt assente: non è un problema, si prosegue.
        }

        console.log(`\n✓ SEO: generate ${routes.length} pagine statiche e la sitemap (${urls.length} URL)`)
      } catch (error) {
        console.warn('\n⚠ SEO: generazione delle pagine statiche saltata:', error)
      }
    },
  }
}

export default defineConfig({
  base: BASE_PATH,
  plugins: [react(), tailwindcss(), seoStaticPages()],
})
